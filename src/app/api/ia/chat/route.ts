import { jsonError, readJsonBody } from "@/server/api-response";
import { listPublishedProperties } from "@/server/properties";
import {
  buildIaContextBlock,
  buildIaFallbackReply,
  buildIaPropertySuggestions,
  buildIaSystemPrompt,
  truncateText,
  type IaChatMessage
} from "@/server/ia";

export const dynamic = "force-dynamic";

type IaChatRequestBody = {
  messages?: Array<Partial<IaChatMessage> | { role?: string; content?: unknown }>;
};

function normalizeMessages(messages: IaChatRequestBody["messages"] = []): IaChatMessage[] {
  return messages
    .filter((message): message is IaChatMessage => {
      const role = String(message?.role || "");
      return role === "user" || role === "assistant";
    })
    .map((message) => ({
      role: message.role,
      content: truncateText(message.content, 2000)
    }))
    .filter((message) => Boolean(message.content.trim()))
    .slice(-10);
}

function lastUserMessage(messages: IaChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === "user")?.content.trim() || "";
}

function buildQuickReplies(query: string, suggestionsLength: number) {
  if (!query) {
    return [
      "Mostrame casas en venta",
      "Quiero alquilar por temporada",
      "Busco alquiler permanente",
      "Tengo un presupuesto definido"
    ];
  }

  if (suggestionsLength > 0) {
    return [
      "Quiero ver mas detalles",
      "Mostrame otras opciones similares",
      "Busco algo en otra zona",
      "Tengo otro presupuesto"
    ];
  }

  return [
    "Ajustar zona",
    "Ajustar presupuesto",
    "Cambiar tipo de operacion",
    "Buscar otra alternativa"
  ];
}

async function callOpenAI(messages: IaChatMessage[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      max_tokens: 650,
      messages
    })
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const errorMessage =
      payload?.error?.message || payload?.message || `OpenAI respondio con estado ${response.status}.`;
    throw new Error(errorMessage);
  }

  const payload = await response.json();
  return String(payload?.choices?.[0]?.message?.content || "").trim();
}

export async function POST(request: Request) {
  try {
    const body = (await readJsonBody<IaChatRequestBody>(request)) || {};
    const messages = normalizeMessages(body.messages);
    const query = lastUserMessage(messages);

    if (!query) {
      return jsonError(new Error("Escribi un mensaje para consultar propiedades."), "Escribi un mensaje para consultar propiedades.");
    }

    const properties = await listPublishedProperties().catch(() => []);
    const suggestions = buildIaPropertySuggestions(properties, query, 6);
    const topContext = suggestions.slice(0, 4);
    const contextBlock = buildIaContextBlock(topContext);

    const conversation = messages.slice(-8).map((message) => ({
      role: message.role,
      content: truncateText(message.content, 1200)
    }));

    const assistantMessages: IaChatMessage[] = [
      { role: "system", content: buildIaSystemPrompt() },
      ...conversation,
      {
        role: "user",
        content: [
          "Consulta del usuario:",
          query,
          "",
          "Contexto de propiedades publicadas:",
          contextBlock,
          "",
          "Instrucciones de salida:",
          "- Responde en espanol.",
          "- Si hay coincidencias, mencioná las mejores opciones primero.",
          "- Si no hay coincidencias claras, decilo y pedí un ajuste concreto.",
          "- No inventes datos que no esten en el contexto."
        ].join("\n")
      }
    ];

    let reply = "";
    let provider = "fallback";

    try {
      reply = (await callOpenAI(assistantMessages)) || "";
      provider = reply ? "openai" : "fallback";
    } catch (error) {
      console.error("OpenAI chat error:", error);
    }

    if (!reply) {
      reply = buildIaFallbackReply(query, suggestions);
    }

    return Response.json({
      reply,
      provider,
      suggestions,
      quickReplies: buildQuickReplies(query, suggestions.length)
    });
  } catch (error) {
    return jsonError(error, "No se pudo responder desde el asistente IA.");
  }
}

