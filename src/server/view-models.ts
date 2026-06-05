import { CATEGORY_META } from "../utils/properties.js";

type DateLike = Date | string | null | undefined;

const legacyCategoryMarkerColors: Record<string, string> = {
  "#a86f7a": "venta",
  "#8a6a4f": "alquiler_turistico",
  "#7b8061": "alquiler_permanente",
  "#2f4f3e": "vendido",
  "#d8bf8f": "proceso"
};

function isoDate(value: DateLike) {
  if (!value) return "";
  return value instanceof Date ? value.toISOString() : String(value);
}

function categoryMarkerColor(category: string) {
  return CATEGORY_META[category as keyof typeof CATEGORY_META]?.mapColor || CATEGORY_META.venta.mapColor;
}

function normalizeMarkerColor(value: unknown, category: string) {
  const markerColor = String(value || "").trim();
  if (!markerColor) return categoryMarkerColor(category);

  const legacyCategory = legacyCategoryMarkerColors[markerColor.toLowerCase()];
  return legacyCategory === category ? categoryMarkerColor(category) : markerColor;
}

export type PropertyViewModel = {
  id: string;
  databaseId: string;
  kmlId: string;
  title: string;
  slug: string;
  location: string;
  price: string;
  area: string;
  category: string;
  markerColor: string;
  coords: [number, number];
  latitude: number;
  longitude: number;
  descriptionHtml: string;
  summary: string;
  rawDescription: string;
  isPublished: boolean;
  displayOrder: number;
  images: string[];
};

export type ClientViewModel = {
  id: string;
  createdBy: string;
  updatedBy: string;
  fullName: string;
  phone: string;
  email: string;
  isOwner: boolean;
  operation: string;
  zone: string;
  budget: string;
  rooms: string;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type SellerProfileViewModel = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ActivityNoteViewModel = {
  id: string;
  entityId: string;
  body: string;
  createdBy: string;
  authorRole: string;
  authorName: string;
  createdAt: string;
};

export type ActivityDocumentViewModel = {
  id: string;
  entityId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  isImage: boolean;
  createdBy: string;
  authorRole: string;
  authorName: string;
  createdAt: string;
};

export type InternalProfile =
  | {
      role: "admin";
      profile: {
        id: string;
        username: string;
        email: string;
        fullName: string;
        isActive: boolean;
      };
    }
  | {
      role: "seller";
      profile: SellerProfileViewModel;
    };

export function propertyToViewModel(row: any): PropertyViewModel {
  const category = row.category || "venta";
  const images = [...(row.propertyImages || row.property_images || [])]
    .sort((first, second) => (first.sortOrder ?? first.sort_order ?? 0) - (second.sortOrder ?? second.sort_order ?? 0))
    .map((image) => image.url)
    .filter(Boolean);
  const latitude = Number(row.latitude);
  const longitude = Number(row.longitude);

  return {
    id: row.id,
    databaseId: row.id,
    kmlId: row.kmlId || row.kml_id || "",
    title: row.title || "",
    slug: row.slug || "",
    location: row.location || "",
    price: row.price || "Consultar",
    area: row.area || "Superficie a confirmar",
    category,
    markerColor: normalizeMarkerColor(row.markerColor ?? row.marker_color, category),
    coords: [latitude, longitude],
    latitude,
    longitude,
    descriptionHtml: row.descriptionHtml || row.description_html || "",
    summary: row.summary || "",
    rawDescription: row.rawDescription || row.raw_description || "",
    isPublished: Boolean(row.isPublished ?? row.is_published),
    displayOrder: Number(row.displayOrder ?? row.display_order ?? 0),
    images
  };
}

export function clientToViewModel(row: any): ClientViewModel {
  return {
    id: row.id,
    createdBy: row.createdBy || row.created_by || "",
    updatedBy: row.updatedBy || row.updated_by || "",
    fullName: row.fullName || row.full_name || "",
    phone: row.phone || "",
    email: row.email || "",
    isOwner: Boolean(row.isOwner ?? row.is_owner),
    operation: row.operation || "alquilar",
    zone: row.zone || "",
    budget: row.budget || "",
    rooms: row.rooms || "",
    status: row.status || "nuevo",
    notes: row.notes || "",
    createdAt: isoDate(row.createdAt || row.created_at),
    updatedAt: isoDate(row.updatedAt || row.updated_at)
  };
}

export function sellerProfileToViewModel(row: any): SellerProfileViewModel {
  return {
    id: row.id,
    username: row.username || "",
    email: row.email || "",
    fullName: row.fullName || row.full_name || "",
    isActive: Boolean(row.isActive ?? row.is_active),
    createdBy: row.createdBy || row.created_by || "",
    createdAt: isoDate(row.createdAt || row.created_at),
    updatedAt: isoDate(row.updatedAt || row.updated_at)
  };
}

export function activityNoteToViewModel(row: any): ActivityNoteViewModel {
  return {
    id: row.id,
    entityId: row.propertyId || row.property_id || row.clientId || row.client_id || "",
    body: row.body || "",
    createdBy: row.createdBy || row.created_by || "",
    authorRole: row.authorRole || row.author_role || "admin",
    authorName: row.authorName || row.author_name || "",
    createdAt: isoDate(row.createdAt || row.created_at)
  };
}

export function activityDocumentToViewModel(row: any): ActivityDocumentViewModel {
  const fileType = row.fileType || row.file_type || "";

  return {
    id: row.id,
    entityId: row.propertyId || row.property_id || row.clientId || row.client_id || "",
    fileName: row.fileName || row.file_name || "",
    fileUrl: row.fileUrl || row.file_url || "",
    fileType,
    fileSize: Number(row.fileSize ?? row.file_size ?? 0),
    isImage: fileType.startsWith("image/"),
    createdBy: row.createdBy || row.created_by || "",
    authorRole: row.authorRole || row.author_role || "admin",
    authorName: row.authorName || row.author_name || "",
    createdAt: isoDate(row.createdAt || row.created_at)
  };
}
