import type { Metadata } from "next";

import type { PropertyViewModel } from "./view-models";
import { propertyPublicPath } from "../utils/properties.js";

export const DEFAULT_SITE_URL = "https://www.denisecatalanbienesraices.com.ar";
export const HOME_TITLE = "Denise Catalán Bienes Raíces | Inmobiliaria en San Martín de los Andes";
export const HOME_DESCRIPTION =
  "Inmobiliaria local en San Martín de los Andes: compra y venta de casas, departamentos, lotes y terrenos, alquileres permanentes y turísticos.";
export const HOME_IMAGE_PATH = "/ISO%20DC.png";
export const OFFICE_WHATSAPP = "+5492944688613";

export function absoluteUrl(pathname: string) {
  return new URL(pathname, `${DEFAULT_SITE_URL}/`).href;
}

export function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["RealEstateAgent", "LocalBusiness"],
    "@id": `${DEFAULT_SITE_URL}/#real-estate-agent`,
    name: "Denise Catalán Bienes Raíces",
    url: `${DEFAULT_SITE_URL}/`,
    telephone: OFFICE_WHATSAPP,
    image: absoluteUrl(HOME_IMAGE_PATH),
    address: {
      "@type": "PostalAddress",
      addressLocality: "San Martín de los Andes",
      addressRegion: "Neuquén",
      addressCountry: "AR"
    },
    areaServed: [
      { "@type": "City", name: "San Martín de los Andes" },
      { "@type": "AdministrativeArea", name: "Neuquén" }
    ]
  };
}

export function homeMetadata(): Metadata {
  return {
    metadataBase: new URL(DEFAULT_SITE_URL),
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    alternates: {
      canonical: "/"
    },
    verification: {
      other: {
        "msvalidate.01": "6118C32A03A52B21126726471B922963"
      }
    },
    openGraph: {
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      url: DEFAULT_SITE_URL,
      siteName: "Denise Catalán Bienes Raíces",
      locale: "es_AR",
      type: "website",
      images: [HOME_IMAGE_PATH]
    }
  };
}

export function iaMetadata(): Metadata {
  const title = "Asistente IA | Denise Catalán Bienes Raíces";
  const description =
    "Asistente de consulta inmobiliaria para comprar, alquilar y descubrir propiedades publicadas de Denise Catalán Bienes Raíces.";

  return {
    metadataBase: new URL(DEFAULT_SITE_URL),
    title,
    description,
    alternates: {
      canonical: "/IA"
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl("/IA"),
      siteName: "Denise Catalán Bienes Raíces",
      locale: "es_AR",
      type: "website",
      images: [HOME_IMAGE_PATH]
    }
  };
}

export function propertyMetadata(property: PropertyViewModel | null): Metadata {
  if (!property) {
    return {
      title: HOME_TITLE,
      description: HOME_DESCRIPTION
    };
  }

  const pathname = propertyPublicPath(property);
  const title = `${property.title} | Denise Catalán Bienes Raíces`;
  const description =
    property.summary ||
    property.rawDescription ||
    `${property.title} en ${property.location}. Consultá detalles con Denise Catalán Bienes Raíces.`;

  return {
    title,
    description,
    alternates: {
      canonical: pathname
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(pathname),
      siteName: "Denise Catalán Bienes Raíces",
      locale: "es_AR",
      type: "article",
      images: property.images[0] ? [property.images[0]] : [HOME_IMAGE_PATH]
    }
  };
}

export function propertyJsonLd(property: PropertyViewModel) {
  const pathname = propertyPublicPath(property);

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    url: absoluteUrl(pathname),
    image: property.images,
    video: property.videos.length ? property.videos : undefined,
    description: property.summary || property.rawDescription || property.location,
    address: {
      "@type": "PostalAddress",
      addressLocality: property.location || "San Martín de los Andes",
      addressRegion: "Neuquén",
      addressCountry: "AR"
    },
    geo: Number.isFinite(property.latitude) && Number.isFinite(property.longitude)
      ? {
          "@type": "GeoCoordinates",
          latitude: property.latitude,
          longitude: property.longitude
        }
      : undefined
  };
}
