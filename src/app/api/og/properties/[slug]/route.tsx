import { ImageResponse } from "next/og.js";

import { getPublishedPropertyBySlug } from "@/server/properties";
import { CATEGORY_META } from "@/utils/properties";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WIDTH = 1200;
const HEIGHT = 630;

function truncate(text: string, maxLength: number) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).replace(/\s+\S*$/, "").trim()}…`;
}

function propertyDescription(property: Awaited<ReturnType<typeof getPublishedPropertyBySlug>>) {
  if (!property) return "Consultá propiedades publicadas de Denise Catalán Bienes Raíces.";
  return truncate(
    property.summary ||
      property.rawDescription ||
      `${property.title} en ${property.location}. Consultá detalles con Denise Catalán Bienes Raíces.`,
    180
  );
}

function propertyLabel(property: NonNullable<Awaited<ReturnType<typeof getPublishedPropertyBySlug>>>) {
  return CATEGORY_META[property.category]?.label || "Propiedad";
}

function fallbackImage(title: string, description: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          alignItems: "stretch",
          justifyContent: "stretch",
          background:
            "linear-gradient(135deg, #0f172a 0%, #111827 44%, #3b82f6 100%)",
          color: "#ffffff",
          fontFamily: "Arial, sans-serif"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at top right, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 42%), radial-gradient(circle at bottom left, rgba(250,204,21,0.18) 0%, rgba(250,204,21,0) 38%)"
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            width: "100%",
            height: "100%",
            padding: "60px",
            boxSizing: "border-box",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              maxWidth: 820
            }}
          >
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                padding: "12px 18px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.14)",
                border: "1px solid rgba(255,255,255,0.18)",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase"
              }}
            >
              Denise Catalán Bienes Raíces
            </div>
            <div
              style={{
                fontSize: 68,
                lineHeight: 1.04,
                fontWeight: 800,
                letterSpacing: "-0.05em"
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 30,
                lineHeight: 1.3,
                color: "rgba(255,255,255,0.86)",
                maxWidth: 760
              }}
            >
              {description}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "end",
              fontSize: 22,
              color: "rgba(255,255,255,0.84)"
            }}
          >
            <span>San Martín de los Andes</span>
            <span>Preview optimizada</span>
          </div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT }
  );
}

function propertyImage(property: NonNullable<Awaited<ReturnType<typeof getPublishedPropertyBySlug>>>) {
  const imageUrl = property.images[0];
  const title = truncate(property.title, 48);
  const description = propertyDescription(property);
  const label = propertyLabel(property);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#0f172a",
          color: "#ffffff",
          fontFamily: "Arial, sans-serif"
        }}
      >
        {imageUrl ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url("${imageUrl}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat"
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(2,6,23,0.88) 0%, rgba(2,6,23,0.60) 46%, rgba(2,6,23,0.82) 100%), linear-gradient(180deg, rgba(15,23,42,0.05) 0%, rgba(15,23,42,0.30) 100%)"
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: "1px solid rgba(255,255,255,0.10)"
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            width: "100%",
            height: "100%",
            padding: "56px 60px",
            boxSizing: "border-box",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.18)",
                backdropFilter: "blur(8px)",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.04em"
              }}
            >
              Denise Catalán Bienes Raíces
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 16px",
                borderRadius: 999,
                background: "rgba(250,204,21,0.18)",
                border: "1px solid rgba(250,204,21,0.35)",
                color: "#fef08a",
                fontSize: 18,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em"
              }}
            >
              {label}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              maxWidth: 760
            }}
          >
            <div
              style={{
                fontSize: 70,
                lineHeight: 1.02,
                fontWeight: 800,
                letterSpacing: "-0.06em"
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 30,
                lineHeight: 1.25,
                color: "rgba(255,255,255,0.9)"
              }}
            >
              {property.location}
            </div>
            <div
              style={{
                fontSize: 24,
                lineHeight: 1.45,
                color: "rgba(255,255,255,0.78)",
                maxWidth: 720
              }}
            >
              {description}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "end",
              fontSize: 20,
              color: "rgba(255,255,255,0.82)"
            }}
          >
            <span>{property.price || "Consultar"}</span>
            <span>{property.area || "Superficie a confirmar"}</span>
          </div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT }
  );
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const property = await getPublishedPropertyBySlug(slug).catch(() => null);
  const title = property ? property.title : "Propiedad";
  const description = propertyDescription(property);

  try {
    return property ? propertyImage(property) : fallbackImage(title, description);
  } catch {
    return fallbackImage(title, description);
  }
}
