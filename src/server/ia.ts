import { CATEGORY_META, propertyPublicPath } from "../utils/properties.js";
import type { PropertyViewModel } from "./view-models";

export type IaChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type IaPropertySuggestion = {
  id: string;
  title: string;
  url: string;
  category: string;
  categoryLabel: string;
  location: string;
  price: string;
  area: string;
  summary: string;
  imageUrl: string;
  score: number;
  matchReasons: string[];
};

const OPERATION_KEYWORDS: Record<string, string[]> = {
  venta: ["venta", "comprar", "compra", "invertir", "inversion", "oportunidad"],
  alquiler_turistico: ["turistico", "turistica", "temporada", "vacaciones", "escapada", "airbnb"],
  alquiler_permanente: ["alquiler", "alquilar", "renta", "mensual", "permanente", "locacion"]
};

function textValue(value: unknown) {
  return String(value || "").trim();
}

export function normalizeChatText(value: unknown) {
  return textValue(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateText(value: unknown, maxLength = 180) {
  const text = textValue(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function tokenize(value: unknown) {
  return normalizeChatText(value).split(" ").filter(Boolean);
}

function buildPropertyHaystack(property: PropertyViewModel) {
  const categoryLabel = CATEGORY_META[property.category as keyof typeof CATEGORY_META]?.label || "";
  return normalizeChatText(
    [
      property.title,
      property.slug,
      property.location,
      property.price,
      property.area,
      property.summary,
      property.rawDescription,
      property.category,
      categoryLabel
    ].join(" ")
  );
}

function collectMatchReasons(property: PropertyViewModel, queryTokens: string[]) {
  const reasons = new Set<string>();
  const categoryLabel = CATEGORY_META[property.category as keyof typeof CATEGORY_META]?.label || property.category;
  const haystack = buildPropertyHaystack(property);

  queryTokens.forEach((token) => {
    if (!token) return;

    if (normalizeChatText(property.title).includes(token)) {
      reasons.add(`Coincide con el titulo por "${token}"`);
    }

    if (normalizeChatText(property.location).includes(token)) {
      reasons.add(`Coincide con la zona por "${token}"`);
    }

    if (normalizeChatText(property.summary).includes(token) || normalizeChatText(property.rawDescription).includes(token)) {
      reasons.add(`Coincide con la descripcion por "${token}"`);
    }

    if (normalizeChatText(property.price).includes(token) || normalizeChatText(property.area).includes(token)) {
      reasons.add(`Coincide con los datos principales por "${token}"`);
    }

    if (haystack.includes(token) && !reasons.size) {
      reasons.add(`Relacionada con "${token}"`);
    }
  });

  const categoryKeywords = OPERATION_KEYWORDS[property.category] || [];
  if (queryTokens.some((token) => categoryKeywords.includes(token))) {
    reasons.add(`Encaja con ${categoryLabel.toLowerCase()}`);
  }

  if (!reasons.size) {
    reasons.add(`Propiedad publicada de ${categoryLabel.toLowerCase()}`);
  }

  return Array.from(reasons).slice(0, 3);
}

function scoreProperty(property: PropertyViewModel, queryTokens: string[]) {
  const categoryLabel = CATEGORY_META[property.category as keyof typeof CATEGORY_META]?.label || property.category;
  const categoryText = normalizeChatText(categoryLabel);
  const haystack = buildPropertyHaystack(property);
  const titleText = normalizeChatText(property.title);
  const locationText = normalizeChatText(property.location);
  const summaryText = normalizeChatText(property.summary);
  const descriptionText = normalizeChatText(property.rawDescription);
  const priceText = normalizeChatText(property.price);
  const areaText = normalizeChatText(property.area);

  let score = 1;

  if (!queryTokens.length) {
    return { score, reasons: [`Propiedad publicada de ${categoryLabel.toLowerCase()}`] };
  }

  queryTokens.forEach((token) => {
    if (!token) return;

    if (titleText.includes(token)) score += 6;
    if (locationText.includes(token)) score += 5;
    if (summaryText.includes(token)) score += 3;
    if (descriptionText.includes(token)) score += 2;
    if (priceText.includes(token)) score += 2;
    if (areaText.includes(token)) score += 2;
    if (haystack.includes(token)) score += 1;

    if (categoryText.includes(token)) score += 5;
    if ((OPERATION_KEYWORDS[property.category] || []).includes(token)) score += 4;
  });

  if (queryTokens.some((token) => /centro|central|downtown/.test(token)) && locationText.includes("centro")) {
    score += 5;
  }

  if (queryTokens.some((token) => /familia|familiar|casa/.test(token)) && titleText.includes("casa")) {
    score += 4;
  }

  return { score, reasons: collectMatchReasons(property, queryTokens) };
}

export function buildIaPropertySuggestions(
  properties: PropertyViewModel[],
  query: string,
  limit = 4
): IaPropertySuggestion[] {
  const queryTokens = tokenize(query);

  return properties
    .map((property) => {
      const { score, reasons } = scoreProperty(property, queryTokens);

      return {
        id: property.id,
        title: property.title,
        url: propertyPublicPath(property),
        category: property.category,
        categoryLabel: CATEGORY_META[property.category as keyof typeof CATEGORY_META]?.label || property.category,
        location: property.location,
        price: property.price,
        area: property.area,
        summary: truncateText(property.summary || property.rawDescription || property.location || "Propiedad publicada", 160),
        imageUrl: property.images?.[0] || "",
        score,
        matchReasons: reasons
      };
    })
    .filter((property) => property.score > 0)
    .sort((first, second) => {
      if (second.score !== first.score) return second.score - first.score;
      if ((first.category || "") !== (second.category || "")) return first.category.localeCompare(second.category);
      return first.title.localeCompare(second.title);
    })
    .slice(0, Math.max(1, limit));
}

export function buildIaContextBlock(properties: IaPropertySuggestion[]) {
  if (!properties.length) {
    return "No hay propiedades publicadas disponibles en este momento.";
  }

  return properties
    .map(
      (property, index) => `
[${index + 1}]
Titulo: ${property.title}
Operacion: ${property.categoryLabel}
Zona: ${property.location || "Sin zona informada"}
Precio: ${property.price || "Consultar"}
Superficie: ${property.area || "Sin superficie informada"}
Resumen: ${property.summary || "Sin resumen informado"}
URL: ${property.url}`
    )
    .join("\n");
}

export function buildIaSystemPrompt() {
  return [
    "Eres el asistente inmobiliario de Denise Catalan Bienes Raices.",
    "Responde siempre en espanol rioplatense, con tono claro, amable y profesional.",
    "Usa solo las propiedades entregadas en el contexto. No inventes propiedades, precios, superficies ni estados de disponibilidad.",
    "Si el usuario pregunta por algo que no esta en el contexto, dilo con honestidad y propone refinar la busqueda.",
    "No prometas disponibilidad futura. Habla de propiedades publicadas, visibles o sugeridas.",
    "Si falta informacion para recomendar bien, haz una sola pregunta de aclaracion concreta.",
    "Si encaja, sugiere escribir por WhatsApp o continuar refinando la busqueda.",
    "Cuando menciones propiedades, prioriza titulo, zona, precio, superficie y tipo de operacion.",
    "Mantente breve pero util. Si hay varias coincidencias, lista las mejores y cierra con un proximo paso."
  ].join(" ");
}

export function buildIaFallbackReply(query: string, suggestions: IaPropertySuggestion[]) {
  const intro = query
    ? `No pude consultar el motor de IA en este momento, pero revisé las propiedades publicadas para "${truncateText(query, 80)}".`
    : "No pude consultar el motor de IA en este momento, pero revisé las propiedades publicadas disponibles.";

  if (!suggestions.length) {
    return `${intro} Ahora mismo no tengo coincidencias claras. Si queres, afiname zona, presupuesto o tipo de operacion y te ayudo a buscar mejor.`;
  }

  const summary = suggestions
    .slice(0, 3)
    .map((property) => `${property.title} en ${property.location || "sin zona"} (${property.price || "Consultar"})`)
    .join("; ");

  return `${intro} Estas son algunas opciones publicadas que podrían servirte: ${summary}. Si queres, te las detallo una por una o te ayudo a filtrar por zona y presupuesto.`;
}

