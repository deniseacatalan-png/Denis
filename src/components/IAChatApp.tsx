"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import type { PropertyViewModel } from "@/server/view-models";
import { publicNavbarItems } from "./AppNavbarConfig";
import AppNavbar from "./AppNavbar";
import { CATEGORY_META, propertyPublicPath } from "@/utils/properties";
import {
  createRuleSession,
  generateRuleReply,
  normalizeRuleSession,
  type IaRuleSession
} from "@/utils/ia-rules";
import type { IaPropertySuggestion } from "@/server/ia";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  provider?: "rules" | "openai";
};

type IAChatAppProps = {
  initialProperties: PropertyViewModel[];
  hasOpenAIKey: boolean;
};

type StoredIaSession = {
  version: 1;
  messages: ChatMessage[];
  session: IaRuleSession;
  suggestions: IaPropertySuggestion[];
};

const STORAGE_KEY = "denise-ia-session-v1";

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hola, soy el asistente de Denise Catalan Bienes Raices. Contame zona, presupuesto y tipo de operacion, y te muestro propiedades publicadas reales."
};

const quickPrompts = [
  "Busco alquiler de invierno en Chapelco",
  "Busco alquiler de verano en Lolog",
  "Quiero comprar en Centro o Vega",
  "Tengo un presupuesto acotado"
];

function propertyToSuggestion(property: PropertyViewModel): IaPropertySuggestion {
  return {
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
    score: 0,
    matchReasons: ["Propiedad publicada"]
  };
}

function sanitizeMessages(messages: ChatMessage[]) {
  return messages.slice(-12);
}

function readStoredSession(): StoredIaSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredIaSession>;
    if (parsed.version !== 1 || !Array.isArray(parsed.messages)) return null;

    return {
      version: 1,
      messages: parsed.messages
        .filter((message): message is ChatMessage => Boolean(message?.role === "assistant" || message?.role === "user"))
        .map((message) => ({
          id: String(message.id || crypto.randomUUID()),
          role: message.role,
          content: String(message.content || ""),
          provider: message.provider === "rules" || message.provider === "openai" ? message.provider : undefined
        })),
      session: normalizeRuleSession(parsed.session),
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 4) : []
    };
  } catch {
    return null;
  }
}

function persistStoredSession(payload: StoredIaSession) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage issues and keep the chat usable.
  }
}

function MessageBubble({ message }: { message: ChatMessage }) {
  return (
    <article className={`ia-message ia-message--${message.role}`}>
      <div className="ia-message-badge" aria-hidden="true">
        {message.role === "assistant" ? "DC" : "YO"}
      </div>
      <div className="ia-message-body">
        <div className="ia-message-meta">
          <strong>{message.role === "assistant" ? "Asistente" : "Vos"}</strong>
          {message.provider === "openai" ? <span>IA conectada</span> : message.provider === "rules" ? <span>Reglas activas</span> : null}
        </div>
        <p>{message.content}</p>
      </div>
    </article>
  );
}

function PropertyCard({ property }: { property: IaPropertySuggestion }) {
  return (
    <a className="ia-property-card" href={property.url}>
      {property.imageUrl ? <img src={property.imageUrl} alt={property.title} loading="lazy" /> : null}
      <div className="ia-property-card-content">
        <span className="ia-property-chip">{property.categoryLabel}</span>
        <strong>{property.title}</strong>
        <p>{property.location}</p>
        <p>{property.price}</p>
        <small>{property.summary}</small>
      </div>
    </a>
  );
}

export function IAChatApp({ initialProperties, hasOpenAIKey }: IAChatAppProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState<IaRuleSession>(() => createRuleSession());
  const [suggestions, setSuggestions] = useState<IaPropertySuggestion[]>(
    () => initialProperties.slice(0, 4).map(propertyToSuggestion)
  );
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, suggestions, isSending]);

  useEffect(() => {
    const stored = readStoredSession();

    if (!stored) return;

    setMessages(stored.messages.length ? sanitizeMessages(stored.messages) : [welcomeMessage]);
    setSession(stored.session);
    setSuggestions(stored.suggestions.length ? stored.suggestions : initialProperties.slice(0, 4).map(propertyToSuggestion));
  }, [initialProperties]);

  useEffect(() => {
    persistStoredSession({
      version: 1,
      messages: sanitizeMessages(messages),
      session,
      suggestions: suggestions.slice(0, 4)
    });
  }, [messages, session, suggestions]);

  const updateSuggestions = (nextSuggestions: IaPropertySuggestion[]) => {
    if (!nextSuggestions.length) return;
    setSuggestions(nextSuggestions.slice(0, 4));
  };

  const submitMessage = async (messageText: string) => {
    const text = String(messageText || "").trim();
    if (!text || isSending) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text
    };
    const nextMessages = [...messages, userMessage];
    const localReply = generateRuleReply({
      query: text,
      properties: initialProperties,
      session
    });

    setMessages(nextMessages);
    setIsSending(true);
    setError("");
    setInput("");

    if (!hasOpenAIKey) {
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: localReply.reply,
        provider: "rules"
      };

      setMessages((current) => [...current, assistantMessage]);
      setSession(localReply.session);
      updateSuggestions(localReply.suggestions);
      setIsSending(false);
      return;
    }

    try {
      const response = await fetch("/api/ia/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content
          }))
        })
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "No pudimos responder en este momento.");
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: String(payload.reply || "No tengo una respuesta en este momento."),
        provider: payload.provider === "rules" ? "rules" : "openai"
      };

      setMessages((current) => [...current, assistantMessage]);
      setSession(localReply.session);
      updateSuggestions(Array.isArray(payload.suggestions) && payload.suggestions.length ? payload.suggestions : localReply.suggestions);
    } catch (submitError) {
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: localReply.reply,
        provider: "rules"
      };

      setMessages((current) => [...current, assistantMessage]);
      setSession(localReply.session);
      updateSuggestions(localReply.suggestions);
      console.error("IA chat fallback activated:", submitError);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitMessage(input);
  };

  const handleQuickPrompt = async (prompt: string) => {
    setInput(prompt);
    await submitMessage(prompt);
  };

  return (
    <div className="page-shell ia-page">
      <AppNavbar
        logoUrl="/isonegro.jpg"
        brandHref="/"
        onBrandClick={undefined}
        onItemSelect={undefined}
        items={publicNavbarItems({ currentPathname: "/IA" })}
      />

      <main className="ia-main">
        <section className="ia-hero">
          <div className="ia-hero-copy">
            <p className="ia-overline">Asistente inmobiliario</p>
            <h1>Consultas sobre alquiler y venta con propiedades reales</h1>
            <p>
              Escribi lo que buscás y el asistente te responde usando el inventario publicado de Denise Catalán Bienes Raices.
              Si hace falta, te pide un dato mas concreto en lugar de inventar resultados.
            </p>
          </div>

        </section>

        <div className="ia-layout">
          <section className="ia-chat-panel" aria-label="Conversacion con el asistente IA">
            <div className="ia-thread" role="log" aria-live="polite" aria-relevant="additions text">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isSending ? (
                <article className="ia-message ia-message--assistant ia-message--typing" aria-label="Asistente escribiendo">
                  <div className="ia-message-badge" aria-hidden="true">
                    DC
                  </div>
                  <div className="ia-message-body">
                    <div className="ia-message-meta">
                      <strong>Asistente</strong>
                      <span>escribiendo</span>
                    </div>
                    <div className="ia-typing-indicator" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </article>
              ) : null}
              <div ref={threadEndRef} />
            </div>

            {error ? <p className="ia-error" role="alert">{error}</p> : null}

            <form className="ia-composer" onSubmit={handleSubmit}>
              <label className="ia-composer-label" htmlFor="ia-message">
                Contale al asistente que buscás
              </label>
              <textarea
                id="ia-message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submitMessage(input);
                  }
                }}
                placeholder="Ej: Busco una casa en alquiler permanente cerca del centro, con patio y presupuesto medio."
                rows={4}
                maxLength={2000}
              />
              <div className="ia-composer-actions">
                <span className="ia-composer-hint">Enter para enviar, Shift+Enter para saltar linea</span>
                <button type="submit" className="ia-send-button" disabled={isSending || !input.trim()}>
                  {isSending ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </form>

            <div className="ia-quick-prompts" aria-label="Consultas sugeridas">
              {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="ia-quick-prompt"
                onClick={() => void handleQuickPrompt(prompt)}
                disabled={isSending}
              >
                {prompt}
              </button>
              ))}
            </div>
          </section>

          <aside className="ia-sidebar" aria-label="Sugerencias de propiedades">
            <section className="ia-sidebar-card">
              <p className="ia-sidebar-kicker">Propiedades sugeridas</p>
              <h2>Coincidencias actuales</h2>
              <span>
                El asistente actualiza esta lista con propiedades reales segun tu consulta.
              </span>
              <div className="ia-property-list">
                {suggestions.length ? (
                  suggestions.map((property) => <PropertyCard key={property.id} property={property} />)
                ) : (
                  <div className="ia-empty-state">
                    <strong>No hay coincidencias todavia</strong>
                    <p>Probá agregar zona, presupuesto o tipo de operacion para afinar la busqueda.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="ia-sidebar-card ia-sidebar-card--muted">
              <p className="ia-sidebar-kicker">Como responder mejor</p>
              <ul className="ia-guidance">
                <li>Decime si buscás venta, alquiler permanente o turístico.</li>
                <li>Si es turístico, aclarame invierno o verano.</li>
                <li>Agregá zona, rango de precio y ambientes si los tenés.</li>
                <li>Si querés, también puedo ayudarte a comparar opciones similares.</li>
              </ul>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default IAChatApp;
