import { getPrisma } from "./prisma";
import { propertyToViewModel, type PropertyViewModel } from "./view-models";
import { slugify } from "../utils/properties.js";

const propertyInclude = {
  propertyImages: {
    orderBy: {
      sortOrder: "asc" as const
    }
  }
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
    category: textValue(values.category) || "venta",
    latitude: lat,
    longitude: lng,
    markerColor: textValue(values.markerColor) || "#b0528c",
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

export async function listPublishedProperties(): Promise<PropertyViewModel[]> {
  const rows = await getPrisma().property.findMany({
    where: {
      isPublished: true
    },
    include: propertyInclude,
    orderBy: [
      { displayOrder: "asc" },
      { title: "asc" }
    ]
  });

  return rows.map(propertyToViewModel);
}

export async function listAdminProperties(): Promise<PropertyViewModel[]> {
  const rows = await getPrisma().property.findMany({
    include: propertyInclude,
    orderBy: [
      { displayOrder: "asc" },
      { title: "asc" }
    ]
  });

  return rows.map(propertyToViewModel);
}

export async function getPublishedPropertyBySlug(slug: string): Promise<PropertyViewModel | null> {
  const row = await getPrisma().property.findFirst({
    where: {
      slug,
      isPublished: true
    },
    include: propertyInclude
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

    const imageRows = imageRowsFromValues(property.id, values);

    if (imageRows.length) {
      await tx.propertyImage.createMany({
        data: imageRows
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
