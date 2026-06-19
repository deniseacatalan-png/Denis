import { CATEGORY_META, propertyPublicPath } from "./properties.js";
import { detectIaSeason, detectIaZone, seasonLabel, type IaSeason } from "./ia-knowledge";
import type { PropertyViewModel } from "@/server/view-models";
import type { IaPropertySuggestion } from "@/server/ia";

export type IaIntent = "general" | "alquiler_permanente" | "alquiler_turistico" | "comprar" | "vender";

export type IaRuleSession = {
  turnCount: number;
  intent: IaIntent;
  lastQuery: string;
  lastSuggestionIds: string[];
  lastZone: string;
  lastBudget: string;
  lastRooms: string;
  lastSeason: IaSeason;
};

export type IaRuleReply = {
  reply: string;
  quickReplies: string[];
  suggestions: IaPropertySuggestion[];
  session: IaRuleSession;
  provider: "rules";
  stage: 1 | 2 | 3;
};

type ExtractedSignals = {
  intent: IaIntent;
  zone: string;
  budget: string;
  rooms: string;
  preferences: string[];
  season: IaSeason;
  followUpOnly: boolean;
  changedTopic: boolean;
};

const FOLLOW_UP_WORDS = new Set([
  "si",
  "sí",
  "ok",
  "dale",
  "claro",
  "bien",
  "ajustar",
  "seguimos",
  "seguí",
  "continua",
  "continuamos"
]);

const INTENT_KEYWORDS: Record<"comprar" | "vender" | "alquiler_permanente" | "alquiler_turistico", string[]> = {
  comprar: ["comprar", "compra", "inversion", "invertir", "adquirir", "buscar compra"],
  vender: ["vender", "venta", "publicar", "tasar", "tasacion", "propietario", "soy propietario"],
  alquiler_permanente: [
    "alquilar",
    "alquiler",
    "permanente",
    "mensual",
    "contrato",
    "locacion",
    "renta",
    "largo plazo"
  ],
  alquiler_turistico: [
    "temporada",
    "temporario",
    "temporaria",
    "turistico",
    "turistica",
    "vacaciones",
    "escapada",
    "por dia",
    "por semana"
  ]
};

const STAGE_OPENERS: Record<1 | 2 | 3, string[]> = {
  1: ["Perfecto", "Dale", "Entiendo", "Buenísimo"],
  2: ["Ya tengo una mejor lectura", "Bien, con eso cierro un poco más", "Listo, ahora sí", "Va tomando forma"],
  3: ["Para cerrarlo rápido", "Con esto ya te puedo afinar la búsqueda", "Si querés, te dejo la shortlist", "Ya queda bastante claro"]
};

const STAGE_CLOSERS: Record<1 | 2 | 3, string[]> = {
  1: [
    "Si me decís zona o presupuesto, te devuelvo opciones mucho más precisas.",
    "Decime zona, presupuesto o ambientes y te afino la búsqueda."
  ],
  2: [
    "Si querés, te comparo las mejores dos o tres opciones.",
    "Podés pasarme un detalle más y te dejo una shortlist más limpia."
  ],
  3: [
    "Si te sirve, te lo dejo listo para mandar por WhatsApp.",
    "Si querés, seguimos con una comparación corta entre las mejores opciones."
  ]
};

const QUICK_REPLIES: Record<1 | 2 | 3, Record<IaIntent, string[]>> = {
  1: {
    general: ["Mostrame casas en venta", "Quiero alquilar por temporada", "Busco alquiler permanente"],
    comprar: ["Mostrame oportunidades para comprar", "Quiero ver casas en venta", "Tengo presupuesto"],
    vender: ["Quiero vender una propiedad", "Necesito tasación", "Hablemos de publicación"],
    alquiler_permanente: ["Busco alquiler permanente", "Quiero ver casas en alquiler", "Tengo zona definida"],
    alquiler_turistico: [
      "Busco alquiler de invierno",
      "Busco alquiler de verano",
      "Quiero ver opciones de temporada"
    ]
  },
  2: {
    general: ["Mostrame 3 opciones reales", "Compará por zona", "Quiero ajustar el presupuesto"],
    comprar: ["Comparame estas propiedades", "Busco algo más barato", "Mostrame mejores opciones"],
    vender: ["Quiero una respuesta más comercial", "Mostrame pasos para vender", "Necesito una evaluación"],
    alquiler_permanente: ["Mostrame opciones similares", "Ajustá por zona", "Ajustá por presupuesto"],
    alquiler_turistico: ["Quiero ver otras opciones", "Ajustá por invierno/verano", "Compará por ubicación"]
  },
  3: {
    general: ["Cerrame una shortlist", "Comparame las 3 mejores", "Enviar a WhatsApp"],
    comprar: ["Comparame las 3 mejores", "Mostrame solo las top", "Enviar a WhatsApp"],
    vender: ["Quiero hablar con un asesor", "Enviar a WhatsApp", "Necesito una guía corta"],
    alquiler_permanente: ["Cerrame la shortlist", "Compará las dos mejores", "Enviar a WhatsApp"],
    alquiler_turistico: ["Cerrame la shortlist", "Compará por temporada", "Enviar a WhatsApp"]
  }
};

function textValue(value: unknown) {
  return String(value || "").trim();
}

export function normalizeIaText(value: unknown) {
  return textValue(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9$.\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: unknown) {
  return normalizeIaText(value).split(" ").filter(Boolean);
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

function pickVariant(options: string[], seed: string) {
  if (!options.length) return "";
  return options[hashString(seed) % options.length];
}

function buildKnownLocationHints(properties: PropertyViewModel[]) {
  const hints = new Set<string>();
  properties.forEach((property) => {
    const location = normalizeIaText(property.location);
    if (location) hints.add(location);
    const title = normalizeIaText(property.title);
    if (title) hints.add(title);
  });
  return Array.from(hints).filter((hint) => hint.length >= 3).sort((a, b) => b.length - a.length);
}

function detectIntentFromQuery(query: string): IaIntent {
  const normalized = normalizeIaText(query);
  const tokens = tokenize(query);

  if (!normalized) return "general";

  if (INTENT_KEYWORDS.alquiler_turistico.some((keyword) => normalized.includes(keyword))) {
    return "alquiler_turistico";
  }

  if (INTENT_KEYWORDS.vender.some((keyword) => normalized.includes(keyword))) {
    return "vender";
  }

  if (INTENT_KEYWORDS.comprar.some((keyword) => normalized.includes(keyword))) {
    return "comprar";
  }

  if (INTENT_KEYWORDS.alquiler_permanente.some((keyword) => normalized.includes(keyword))) {
    return "alquiler_permanente";
  }

  if (tokens.includes("alquiler") || tokens.includes("alquilar")) {
    return "alquiler_permanente";
  }

  return "general";
}

function detectZoneFromQuery(query: string, properties: PropertyViewModel[]) {
  const explicitMatch = detectIaZone(query);
  if (explicitMatch) return explicitMatch.canonical;

  const normalized = normalizeIaText(query);
  const propertyMatch = properties
    .map((property) => normalizeIaText(property.location))
    .find((location) => location && normalized.includes(location));

  return propertyMatch || "";
}

function isFollowUpOnly(query: string) {
  const normalized = normalizeIaText(query);
  if (!normalized) return true;

  if (FOLLOW_UP_WORDS.has(normalized)) return true;
  if (normalized.length <= 3) return true;

  const tokens = tokenize(query);
  return tokens.length <= 2 && tokens.every((token) => FOLLOW_UP_WORDS.has(token));
}

function extractBudget(query: string) {
  const normalized = normalizeIaText(query);
  const match = normalized.match(/\b(?:usd|u\$s|ars|\$)?\s?(\d[\d.,]*)\b/);
  if (!match) return "";
  return match[0].replace(/\s+/g, " ").trim();
}

function extractRooms(query: string) {
  const normalized = normalizeIaText(query);
  const roomMatch = normalized.match(/\b(?:monoambiente|mono|estudio|\d+\s*(?:amb|ambientes|dorm|dormitorios?))\b/);
  return roomMatch ? roomMatch[0].replace(/\s+/g, " ").trim() : "";
}

function extractZone(query: string, properties: PropertyViewModel[]) {
  const normalized = normalizeIaText(query);
  const hints = buildKnownLocationHints(properties);
  const direct = hints.find((hint) => hint && normalized.includes(hint));
  if (direct) return direct;

  const zonePhrases = [
    /(?:en|zona|por|cerca de|cerca del|cerca de la|cerca de los)\s+([a-z0-9\s]+)/,
    /(?:busco|quiero|necesito)\s+(?:en|por)\s+([a-z0-9\s]+)/
  ];

  for (const pattern of zonePhrases) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      const candidate = match[1].trim().split(" ").slice(0, 3).join(" ");
      if (candidate && candidate.length >= 3) {
        return candidate;
      }
    }
  }

  return "";
}

function extractPreferences(query: string) {
  const normalized = normalizeIaText(query);
  return [
    "patio",
    "cochera",
    "balcon",
    "jardin",
    "amoblado",
    "mascotas",
    "vista",
    "centro",
    "lago",
    "invierno",
    "verano",
    "calefaccion",
    "internet"
  ].filter((term) => normalized.includes(term));
}

function summarizeIntent(intent: IaIntent) {
  switch (intent) {
    case "comprar":
      return "comprar";
    case "vender":
      return "vender";
    case "alquiler_turistico":
      return "alquiler temporario";
    case "alquiler_permanente":
      return "alquiler permanente";
    default:
      return "propiedades";
  }
}

function extractSignals(query: string, properties: PropertyViewModel[], previousIntent: IaIntent): ExtractedSignals {
  const directIntent = detectIntentFromQuery(query);
  const followUpOnly = isFollowUpOnly(query);
  const normalizedQuery = normalizeIaText(query);
  let intent = directIntent === "general" ? previousIntent : directIntent;
  const changedTopic = Boolean(previousIntent && directIntent !== "general" && intent !== previousIntent);
  const season = detectIaSeason(query);

  if (
    season &&
    intent === "alquiler_permanente" &&
    !normalizedQuery.includes("permanente") &&
    !normalizedQuery.includes("mensual") &&
    !normalizedQuery.includes("largo plazo")
  ) {
    intent = "alquiler_turistico";
  }

  return {
    intent,
    zone: detectZoneFromQuery(query, properties) || extractZone(query, properties),
    budget: extractBudget(query),
    rooms: extractRooms(query),
    preferences: extractPreferences(query),
    season,
    followUpOnly,
    changedTopic
  };
}

function intentCategory(intent: IaIntent) {
  if (intent === "alquiler_turistico") return "alquiler_turistico";
  if (intent === "alquiler_permanente") return "alquiler_permanente";
  if (intent === "comprar") return "venta";
  if (intent === "vender") return "venta";
  return "general";
}

function scoreProperty(property: PropertyViewModel, query: string, intent: IaIntent) {
  const normalizedQuery = normalizeIaText(query);
  const queryTokens = tokenize(query);
  const season = detectIaSeason(query);
  const propertyZone = detectIaZone(property.location);
  const haystack = normalizeIaText(
    [
      property.title,
      property.slug,
      property.location,
      property.price,
      property.area,
      property.summary,
      property.rawDescription,
      property.category,
      CATEGORY_META[property.category as keyof typeof CATEGORY_META]?.label || ""
    ].join(" ")
  );

  let score = 0;

  if (intent !== "general" && property.category === intentCategory(intent)) {
    score += 40;
  }

  if (queryTokens.length === 0) {
    score += 10;
  }

  queryTokens.forEach((token) => {
    if (!token) return;
    if (normalizeIaText(property.title).includes(token)) score += 10;
    if (normalizeIaText(property.location).includes(token)) score += 8;
    if (normalizeIaText(property.summary).includes(token)) score += 4;
    if (normalizeIaText(property.rawDescription).includes(token)) score += 3;
    if (normalizeIaText(property.price).includes(token)) score += 3;
    if (normalizeIaText(property.area).includes(token)) score += 2;
    if (haystack.includes(token)) score += 1;
  });

  if (normalizedQuery.includes("centro") && normalizeIaText(property.location).includes("centro")) {
    score += 5;
  }

  if (normalizedQuery.includes("patio") && normalizeIaText(property.summary).includes("patio")) {
    score += 4;
  }

  if (normalizedQuery.includes("cochera") && normalizeIaText(property.summary).includes("cochera")) {
    score += 4;
  }

  if (normalizedQuery.includes("lago") && normalizeIaText(property.summary).includes("lago")) {
    score += 3;
  }

  if (season && propertyZone?.seasonalFocus?.includes(season)) {
    score += 6;
  }

  if (season === "invierno" && /chapelco|cota 1500|esqui|nieve/.test(normalizeIaText(property.location + " " + property.summary))) {
    score += 4;
  }

  if (season === "verano" && /lolog|lacar|quila quina|meliquina|traful|hua hum/.test(normalizeIaText(property.location + " " + property.summary))) {
    score += 4;
  }

  return score;
}

function buildMatchReasons(property: PropertyViewModel, query: string, intent: IaIntent) {
  const reasons: string[] = [];
  const normalizedQuery = normalizeIaText(query);
  const title = normalizeIaText(property.title);
  const location = normalizeIaText(property.location);
  const summary = normalizeIaText(property.summary);
  const price = normalizeIaText(property.price);
  const area = normalizeIaText(property.area);
  const propertyZone = detectIaZone(property.location);

  if (intent !== "general" && property.category === intentCategory(intent)) {
    reasons.push(`Encaja con ${summarizeIntent(intent)}`);
  }
  if (title && normalizedQuery.includes(title.split(" ").slice(0, 2).join(" "))) {
    reasons.push("Coincide con el titulo");
  }
  if (location && normalizedQuery.includes(location)) {
    reasons.push("Coincide con la zona");
  }
  if (summary && normalizedQuery.split(" ").some((token) => token && summary.includes(token))) {
    reasons.push("Coincide con la descripcion");
  }
  if (price && normalizedQuery.split(" ").some((token) => token && price.includes(token))) {
    reasons.push("Coincide con el precio");
  }
  if (area && normalizedQuery.split(" ").some((token) => token && area.includes(token))) {
    reasons.push("Coincide con la superficie");
  }
  if (propertyZone?.canonical && normalizedQuery.includes(normalizeIaText(propertyZone.canonical))) {
    reasons.push(`Coincide con la zona ${propertyZone.canonical}`);
  }

  if (!reasons.length) {
    reasons.push(`Propiedad publicada de ${summarizeIntent(intent)}`);
  }

  return reasons.slice(0, 3);
}

export function createRuleSession(): IaRuleSession {
  return {
    turnCount: 0,
    intent: "general",
    lastQuery: "",
    lastSuggestionIds: [],
    lastZone: "",
    lastBudget: "",
    lastRooms: "",
    lastSeason: ""
  };
}

export function normalizeRuleSession(value: unknown): IaRuleSession {
  const candidate = value && typeof value === "object" ? (value as Partial<IaRuleSession>) : {};
  return {
    turnCount: Number(candidate.turnCount) || 0,
    intent:
      candidate.intent === "general" ||
      candidate.intent === "alquiler_permanente" ||
      candidate.intent === "alquiler_turistico" ||
      candidate.intent === "comprar" ||
      candidate.intent === "vender"
        ? candidate.intent
        : "general",
    lastQuery: textValue(candidate.lastQuery),
    lastSuggestionIds: Array.isArray(candidate.lastSuggestionIds)
      ? candidate.lastSuggestionIds.map((value) => textValue(value)).filter(Boolean).slice(0, 8)
      : [],
    lastZone: textValue(candidate.lastZone),
    lastBudget: textValue(candidate.lastBudget),
    lastRooms: textValue(candidate.lastRooms),
    lastSeason: candidate.lastSeason === "invierno" || candidate.lastSeason === "verano" ? candidate.lastSeason : ""
  };
}

function buildSuggestions(properties: PropertyViewModel[], query: string, intent: IaIntent) {
  const sorted = [...properties]
    .map((property, index) => ({
      property,
      score: scoreProperty(property, query, intent),
      index
    }))
    .sort((first, second) => {
      if (second.score !== first.score) return second.score - first.score;
      return first.index - second.index;
    });

  const filtered = sorted.filter((item) => item.score > 0).map((item) => item.property);
  const fallback =
    intent === "general"
      ? [...properties]
      : properties.filter((property) => property.category === intentCategory(intent));
  const source = filtered.length ? filtered : fallback.length ? fallback : [...properties];

  return source.slice(0, 4).map((property) => ({
    id: property.id,
    title: property.title,
    url: propertyPublicPath(property),
    category: property.category,
    categoryLabel: CATEGORY_META[property.category as keyof typeof CATEGORY_META]?.label || property.category,
    location: property.location,
    price: property.price,
    area: property.area,
    summary: property.summary || property.rawDescription || property.location || "Propiedad publicada",
    imageUrl: property.images?.[0] || "",
    score: scoreProperty(property, query, intent),
    matchReasons: buildMatchReasons(property, query, intent)
  }));
}

function describeMissingSignals(signals: ExtractedSignals) {
  const missing: string[] = [];
  if (!signals.zone) missing.push("zona");
  if (!signals.budget) missing.push("presupuesto");
  if (!signals.rooms && (signals.intent === "alquiler_permanente" || signals.intent === "alquiler_turistico")) {
    missing.push("ambientes");
  }
  if (signals.intent === "alquiler_turistico" && !signals.season) {
    missing.push("temporada de invierno o verano");
  }
  return missing;
}

function formatPropertyLine(property: IaPropertySuggestion, index: number, stage: 1 | 2 | 3) {
  const detail =
    stage === 1
      ? `${property.location || "Sin zona"} · ${property.price || "Consultar"}`
      : stage === 2
        ? `${property.price || "Consultar"} · ${property.area || "Superficie a confirmar"}`
        : `${property.location || "Sin zona"} · ${property.area || "Superficie a confirmar"} · ${property.price || "Consultar"}`;

  return `${index + 1}. ${property.title} - ${detail}`;
}

function buildReplyBody({
  query,
  signals,
  stage,
  suggestions,
  previousSession
}: {
  query: string;
  signals: ExtractedSignals;
  stage: 1 | 2 | 3;
  suggestions: IaPropertySuggestion[];
  previousSession: IaRuleSession;
}) {
  const opener = pickVariant(STAGE_OPENERS[stage], `${query}:${signals.intent}:${previousSession.turnCount}`);
  const intentLabel = summarizeIntent(signals.intent);
  const seasonText = seasonLabel(signals.season);
  const missing = describeMissingSignals(signals);
  const topSuggestions = suggestions.slice(0, stage === 1 ? 2 : stage === 2 ? 3 : 3);

  const pieces: string[] = [];

  if (signals.changedTopic && previousSession.turnCount > 0) {
    pieces.push(`${opener}. Cambio el foco a ${intentLabel}.`);
  } else if (stage === 1) {
    pieces.push(`${opener}, entendí que buscás ${intentLabel}.`);
  } else if (stage === 2) {
    pieces.push(`${opener}. Ya tengo un perfil más claro de tu búsqueda de ${intentLabel}.`);
  } else {
    pieces.push(`${opener}. Te dejo una síntesis corta para ${intentLabel}.`);
  }

  if (signals.zone) {
    pieces.push(`Zona detectada: ${signals.zone}.`);
  }

  if (signals.budget) {
    pieces.push(`Presupuesto detectado: ${signals.budget}.`);
  }

  if (signals.rooms) {
    pieces.push(`Ambientes/metros detectados: ${signals.rooms}.`);
  }

  if (signals.preferences.length) {
    pieces.push(`Preferencias detectadas: ${signals.preferences.slice(0, 3).join(", ")}.`);
  }

  if (seasonText) {
    pieces.push(`Temporada detectada: ${seasonText}.`);
    if (signals.intent === "alquiler_turistico") {
      pieces.push(
        signals.season === "invierno"
          ? "Para invierno suelen pesar mucho Chapelco, el centro y los accesos rápidos a nieve."
          : "Para verano suelen pesar mucho Lolog, Quila Quina, el Lago Lácar y los circuitos lacustres."
      );
    }
  }

  if (topSuggestions.length) {
    pieces.push(
      stage === 1
        ? `Mientras afino, estas son las mejores coincidencias reales que encontré:`
        : stage === 2
          ? `Las opciones que mejor encajan ahora mismo son:`
          : `Mis opciones más fuertes para cerrar son:`
    );
    pieces.push(topSuggestions.map((property, index) => formatPropertyLine(property, index, stage)).join("\n"));
  } else {
    pieces.push(
      stage === 1
        ? "No encontré coincidencias fuertes con ese texto, pero puedo afinarlo enseguida si me pasás un dato más."
        : stage === 2
          ? "Aún no encuentro una coincidencia fuerte, así que conviene ajustar una variable más."
          : "Con lo que me pasaste todavía no aparece un match claro en el inventario."
    );
  }

  if (missing.length) {
    const missingText =
      missing.length === 1
        ? missing[0]
        : missing.length === 2
          ? `${missing[0]} y ${missing[1]}`
          : `${missing.slice(0, 2).join(", ")} y ${missing[2]}`;
    pieces.push(
      stage === 1
        ? `Para seguir, decime ${missingText}.`
        : stage === 2
          ? `Si me agregás ${missingText}, te la dejo mucho más precisa.`
          : `Con ${missingText} extra ya te cierro una shortlist más fina.`
    );
  } else {
    pieces.push(
      stage === 1
        ? "Si querés, te sigo con una búsqueda más precisa."
        : stage === 2
          ? "Si querés, ahora te comparo solo las dos o tres mejores."
          : "Si querés, te lo dejo listo para enviar por WhatsApp o seguimos ajustando."
    );
  }

  pieces.push(pickVariant(STAGE_CLOSERS[stage], `${query}:${signals.intent}:${topSuggestions.map((item) => item.id).join(",")}`));

  return pieces.filter(Boolean).join("\n\n");
}

function buildQuickRepliesForStage(stage: 1 | 2 | 3, intent: IaIntent) {
  return QUICK_REPLIES[stage][intent].slice(0, 3);
}

export function generateRuleReply({
  query,
  properties,
  session
}: {
  query: string;
  properties: PropertyViewModel[];
  session: IaRuleSession;
}): IaRuleReply {
  const previousSession = normalizeRuleSession(session);
  const signals = extractSignals(query, properties, previousSession.intent);
  const nextIntent = signals.intent;
  const topicChanged = signals.changedTopic && !signals.followUpOnly;
  const nextTurnCount = topicChanged ? 1 : previousSession.turnCount + 1;
  const stage = (nextTurnCount <= 1 ? 1 : nextTurnCount === 2 ? 2 : 3) as 1 | 2 | 3;
  const suggestions = buildSuggestions(properties, query, nextIntent);
  const reply = buildReplyBody({
    query,
    signals,
    stage,
    suggestions,
    previousSession
  });

  return {
    reply,
    quickReplies: buildQuickRepliesForStage(stage, nextIntent),
    suggestions,
    stage,
    provider: "rules",
    session: {
      turnCount: nextTurnCount,
      intent: nextIntent,
      lastQuery: query,
      lastSuggestionIds: suggestions.map((item) => item.id).slice(0, 6),
      lastZone: signals.zone,
      lastBudget: signals.budget,
      lastRooms: signals.rooms,
      lastSeason: signals.season
    }
  };
}

export function getRuleModeLabel(hasOpenAIKey: boolean) {
  return hasOpenAIKey ? "Conectado a IA" : "Modo programático";
}
