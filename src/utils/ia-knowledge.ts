export type IaSeason = "invierno" | "verano" | "";

export type IaZoneKnowledge = {
  canonical: string;
  aliases: string[];
  group: "urbano" | "lagos" | "cordillera" | "alrededores";
  note: string;
  seasonalFocus: Array<"invierno" | "verano">;
};

const normalizeText = (value: unknown) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const IA_SEASON_KEYWORDS: Record<IaSeason, string[]> = {
  invierno: [
    "invierno",
    "invernal",
    "nieve",
    "esqui",
    "ski",
    "temporada de invierno",
    "vacaciones de invierno",
    "julio",
    "agosto"
  ],
  verano: [
    "verano",
    "estival",
    "playa",
    "lago",
    "lagos",
    "temporada de verano",
    "vacaciones de verano",
    "enero",
    "febrero"
  ],
  "": []
};

export const IA_ZONE_KNOWLEDGE: IaZoneKnowledge[] = [
  {
    canonical: "Centro",
    aliases: ["centro", "casco centrico", "casco central", "downtown", "zona centro", "av san martin", "san martin"],
    group: "urbano",
    note: "El eje comercial y administrativo de la ciudad.",
    seasonalFocus: ["invierno", "verano"]
  },
  {
    canonical: "La Vega",
    aliases: ["vega", "la vega", "vega maipu", "vega maipu", "valle de la vega", "maipu", "vega san martin", "villa vega san martin"],
    group: "urbano",
    note: "Sector histórico asociado al valle y a usos residenciales.",
    seasonalFocus: ["invierno", "verano"]
  },
  {
    canonical: "El Oasis",
    aliases: ["el oasis", "oasis", "barrio el oasis"],
    group: "urbano",
    note: "Barrio frecuente en búsquedas residenciales y alquileres.",
    seasonalFocus: ["invierno", "verano"]
  },
  {
    canonical: "Chapelco",
    aliases: [
      "chapelco",
      "cerro chapelco",
      "aeropuerto chapelco",
      "chapelco golf",
      "cota 1500",
      "base chapelco",
      "barrio chapelco",
      "faldeos del chapelco",
      "cordones del chapelco"
    ],
    group: "cordillera",
    note: "Zona de montaña, muy útil para invierno y también para vistas/entorno.",
    seasonalFocus: ["invierno", "verano"]
  },
  {
    canonical: "Lago Lolog",
    aliases: ["lolog", "lago lolog", "villa lolog", "area lolog", "zona lolog", "peñon del lolog", "penon del lolog", "barrio lolog"],
    group: "lagos",
    note: "Área muy buscada por playas, naturaleza y alquileres de temporada.",
    seasonalFocus: ["verano", "invierno"]
  },
  {
    canonical: "Lago Lácar / Costanera",
    aliases: [
      "lacar",
      "lago lacar",
      "costanera",
      "costanera lacar",
      "muelle",
      "area lacar",
      "playa lacar",
      "barrio lacar"
    ],
    group: "lagos",
    note: "Referencia central para propiedades cercanas al lago y al paseo costero.",
    seasonalFocus: ["verano", "invierno"]
  },
  {
    canonical: "Villa Quila Quina",
    aliases: ["quila quina", "villa quila quina", "villa la quila quina"],
    group: "lagos",
    note: "Destino lacustre muy asociado a verano, excursiones y turismo.",
    seasonalFocus: ["verano"]
  },
  {
    canonical: "Hua Hum",
    aliases: ["hua hum", "huahum", "paso hua hum"],
    group: "alrededores",
    note: "Corredor natural y turístico sobre el lago y la ruta de acceso a Chile.",
    seasonalFocus: ["verano"]
  },
  {
    canonical: "Lago Hermoso",
    aliases: ["lago hermoso", "lago hermoso ski resort", "ski resort", "lago hermoso centro", "ski resort lago hermoso"],
    group: "cordillera",
    note: "Muy asociado a nieve, esquí y temporada de invierno.",
    seasonalFocus: ["invierno"]
  },
  {
    canonical: "Meliquina / 7 Lagos",
    aliases: ["meliquina", "villa meliquina", "7 lagos", "siete lagos", "corredor de los 7 lagos", "area lolog y curruhue", "curruhue"],
    group: "alrededores",
    note: "Corredor turístico de lagos y naturaleza, útil para búsquedas de verano.",
    seasonalFocus: ["verano"]
  },
  {
    canonical: "Traful / 7 Lagos",
    aliases: ["traful", "villa traful", "lago traful", "corredor 7 lagos"],
    group: "alrededores",
    note: "Destino de ruta panorámica y naturaleza en el corredor de los 7 lagos.",
    seasonalFocus: ["verano"]
  },
  {
    canonical: "Villa La Angostura",
    aliases: ["villa la angostura", "angostura"],
    group: "alrededores",
    note: "Localidad vecina dentro del corredor turístico de los 7 lagos.",
    seasonalFocus: ["verano", "invierno"]
  },
  {
    canonical: "Junín de los Andes",
    aliases: ["junin", "junin de los andes", "junin de los andes", "junin de los andes", "junin de los andes neuquen"],
    group: "alrededores",
    note: "Localidad cercana y muy consultada en búsquedas de la zona.",
    seasonalFocus: ["verano", "invierno"]
  },
  {
    canonical: "Kaleuche",
    aliases: ["kaleuche", "barrio kaleuche"],
    group: "urbano",
    note: "Barrio residencial muy usado en búsquedas de servicios y alquiler.",
    seasonalFocus: ["invierno", "verano"]
  },
  {
    canonical: "Villa Paur",
    aliases: ["villa paur", "barrio paur", "paur"],
    group: "urbano",
    note: "Zona residencial frecuente en búsquedas de casas y lotes.",
    seasonalFocus: ["invierno", "verano"]
  },
  {
    canonical: "Alihuen",
    aliases: ["alihuen", "alihuen alto", "alihuen bajo"],
    group: "urbano",
    note: "Sector residencial consolidado, útil para vivienda permanente.",
    seasonalFocus: ["invierno", "verano"]
  },
  {
    canonical: "Los Radales",
    aliases: ["los radales", "radales"],
    group: "urbano",
    note: "Barrio residencial consultado en búsquedas de casas familiares.",
    seasonalFocus: ["invierno", "verano"]
  },
  {
    canonical: "El Molino",
    aliases: ["el molino", "molino"],
    group: "urbano",
    note: "Barrio conocido dentro del ejido urbano con demanda residencial.",
    seasonalFocus: ["invierno", "verano"]
  },
  {
    canonical: "El Arenal",
    aliases: ["el arenal", "arenal"],
    group: "urbano",
    note: "Área urbana y de acceso utilizada como referencia local.",
    seasonalFocus: ["invierno", "verano"]
  },
  {
    canonical: "Loteo Amancay",
    aliases: ["amancay", "loteo amancay"],
    group: "alrededores",
    note: "Loteo cercano con búsquedas puntuales de casas y terrenos.",
    seasonalFocus: ["invierno", "verano"]
  },
  {
    canonical: "El Portal",
    aliases: ["el portal", "barrio el portal"],
    group: "urbano",
    note: "Barrio residencial que aparece en publicaciones de casas familiares.",
    seasonalFocus: ["invierno", "verano"]
  },
  {
    canonical: "Peñón del Lolog",
    aliases: ["penon del lolog", "peñon del lolog", "lolog privado"],
    group: "lagos",
    note: "Barrio privado sobre el corredor de Lolog, con peso en verano y escapadas.",
    seasonalFocus: ["verano", "invierno"]
  },
  {
    canonical: "La Cascada",
    aliases: ["la cascada", "cascada chica"],
    group: "alrededores",
    note: "Zona residencial y de naturaleza usada como referencia en el entorno.",
    seasonalFocus: ["verano", "invierno"]
  }
];

export function normalizeIaKnowledgeText(value: unknown) {
  return normalizeText(value);
}

export function detectIaSeason(query: string): IaSeason {
  const normalized = normalizeText(query);

  if (IA_SEASON_KEYWORDS.invierno.some((keyword) => normalized.includes(keyword))) {
    return "invierno";
  }

  if (IA_SEASON_KEYWORDS.verano.some((keyword) => normalized.includes(keyword))) {
    return "verano";
  }

  return "";
}

export function seasonLabel(season: IaSeason) {
  if (season === "invierno") return "temporada de invierno";
  if (season === "verano") return "temporada de verano";
  return "";
}

export function detectIaZone(query: string) {
  const normalized = normalizeText(query);
  const zones = IA_ZONE_KNOWLEDGE.flatMap((zone) =>
    zone.aliases.map((alias) => ({
      canonical: zone.canonical,
      alias: normalizeText(alias),
      group: zone.group,
      note: zone.note,
      seasonalFocus: zone.seasonalFocus
    }))
  ).sort((first, second) => second.alias.length - first.alias.length);

  const match = zones.find((zone) => zone.alias && normalized.includes(zone.alias));
  return match ? { ...match } : null;
}

export function zoneSearchHints() {
  return IA_ZONE_KNOWLEDGE.flatMap((zone) => [zone.canonical, ...zone.aliases]).filter(Boolean);
}
