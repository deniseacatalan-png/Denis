import { getPrisma } from "./prisma";
import { propertyToViewModel, type PropertyViewModel } from "./view-models";
import { CATEGORY_META } from "../utils/properties.js";
import { slugify } from "../utils/properties.js";

const publicPropertyInclude = {
  propertyImages: {
    orderBy: {
      sortOrder: "asc" as const
    }
  },
  propertyVideos: {
    orderBy: {
      sortOrder: "asc" as const
    }
  }
};

const adminPropertyInclude = {
  ...publicPropertyInclude,
  clientAssignments: {
    include: {
      client: true
    },
    orderBy: {
      updatedAt: "desc" as const
    }
  },
};

function textValue(value: unknown) {
  return String(value || "").trim();
}

function propertyIdFromValues(values: any) {
  return textValue(values?.databaseId || values?.id);
}

function propertyDataFromValues(values: any) {
  const title = textValue(values.title);
  const lat = Number(values.latitude);
  const lng = Number(values.longitude);
  const category = textValue(values.category) || "venta";

  if (!title) {
    throw new Error("El titulo es obligatorio.");
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("La latitud y longitud son obligatorias.");
  }

  return {
    title,
    slug: textValue(values.slug) || slugify(title),
    location: textValue(values.location),
    price: textValue(values.price) || "Consultar",
    priceAmount: values.priceAmount != null && values.priceAmount !== "" ? Number(values.priceAmount) : null,
    currency: textValue(values.currency) || "USD",
    area: textValue(values.area) || "Superficie a confirmar",
    category,
    latitude: lat,
    longitude: lng,
    markerColor: CATEGORY_META[category]?.mapColor || CATEGORY_META.venta.mapColor,
    summary: textValue(values.summary),
    descriptionHtml: textValue(values.descriptionHtml),
    rawDescription: textValue(values.rawDescription),
    isPublished: Boolean(values.isPublished),
    displayOrder: Number(values.displayOrder) || 0
  };
}

function imageRowsFromValues(propertyId: string, values: any) {
  return (values.images || [])
    .map((url: unknown) => textValue(url))
    .filter(Boolean)
    .map((url: string, index: number) => ({
      propertyId,
      url,
      alt: textValue(values.title),
      sortOrder: index
    }));
}

function normalizeVideoUrl(value: unknown) {
  const rawUrl = textValue(value);
  if (!rawUrl) return "";

  const candidate = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(candidate);
  } catch {
    throw new Error(`Link de video invalido: ${rawUrl}.`);
  }

  const hostname = parsedUrl.hostname.replace(/^www\./i, "").toLowerCase();
  const isYoutube =
    hostname === "youtube.com" || hostname.endsWith(".youtube.com") || hostname === "youtu.be";
  const isInstagram = hostname === "instagram.com" || hostname.endsWith(".instagram.com");

  if (!isYoutube && !isInstagram) {
    throw new Error("Los videos deben ser links de YouTube o Instagram.");
  }

  return parsedUrl.href;
}

function videoRowsFromValues(propertyId: string, values: any) {
  return (values.videos || [])
    .map((url: unknown) => normalizeVideoUrl(url))
    .filter(Boolean)
    .map((url: string, index: number) => ({
      propertyId,
      url,
      sortOrder: index
    }));
}

export async function listPublishedProperties(): Promise<PropertyViewModel[]> {
  const rows = await getPrisma().property.findMany({
    where: {
      isPublished: true
    },
    include: publicPropertyInclude,
    orderBy: [
      { displayOrder: "asc" },
      { title: "asc" }
    ]
  });

  return rows.map((row) => propertyToViewModel(row));
}

export async function listAdminProperties(): Promise<PropertyViewModel[]> {
  const rows = await getPrisma().property.findMany({
    include: adminPropertyInclude,
    orderBy: [
      { displayOrder: "asc" },
      { title: "asc" }
    ]
  });

  return rows.map((row) => propertyToViewModel(row, { includeClientAssignments: true }));
}

export async function getPublishedPropertyBySlug(slug: string): Promise<PropertyViewModel | null> {
  const row = await getPrisma().property.findFirst({
    where: {
      slug,
      isPublished: true
    },
    include: publicPropertyInclude
  });

  return row ? propertyToViewModel(row) : null;
}

export async function saveAdminProperty(values: any) {
  const data = propertyDataFromValues(values);
  const propertyId = propertyIdFromValues(values);
  const prisma = getPrisma();

  const savedId = await prisma.$transaction(async (tx: any) => {
    const property = propertyId
      ? await tx.property.update({
          where: { id: propertyId },
          data,
          select: { id: true }
        })
      : await tx.property.create({
          data,
          select: { id: true }
        });

    await tx.propertyImage.deleteMany({
      where: {
        propertyId: property.id
      }
    });
    await tx.propertyVideo.deleteMany({
      where: {
        propertyId: property.id
      }
    });

    const imageRows = imageRowsFromValues(property.id, values);
    const nextVideoRows = videoRowsFromValues(property.id, values);

    if (imageRows.length) {
      await tx.propertyImage.createMany({
        data: imageRows
      });
    }

    if (nextVideoRows.length) {
      await tx.propertyVideo.createMany({
        data: nextVideoRows
      });
    }

    return property.id;
  });

  return savedId;
}

export async function updateAdminPropertyOrder(orderedProperties: Array<{ id: string }>) {
  const prisma = getPrisma();
  await prisma.$transaction(
    orderedProperties.map((property, index) =>
      prisma.property.update({
        where: { id: property.id },
        data: { displayOrder: index }
      })
    )
  );
}

export async function deleteAdminProperty(propertyId: string) {
  if (!propertyId) {
    throw new Error("Falta la propiedad a eliminar.");
  }

  await getPrisma().property.delete({
    where: {
      id: propertyId
    }
  });
}
