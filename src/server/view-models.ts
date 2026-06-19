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

function normalizeClientOperation(value: unknown, isOwner = false) {
  const operation = String(value || "");
  if (["comprador", "vendedor", "locador", "inquilino"].includes(operation)) return operation;
  if (operation === "comprar") return isOwner ? "vendedor" : "comprador";
  if (operation === "alquilar" || operation === "temporada") return isOwner ? "locador" : "inquilino";

  return isOwner ? "vendedor" : "comprador";
}

function categoryMarkerColor(category: string) {
  return CATEGORY_META[category as keyof typeof CATEGORY_META]?.mapColor || CATEGORY_META.venta.mapColor;
}

function normalizeMarkerColor(value: unknown, category: string) {
  const markerColor = String(value || "").trim();
  const legacyCategory = legacyCategoryMarkerColors[markerColor.toLowerCase()];

  if (legacyCategory && legacyCategory !== category) {
    return categoryMarkerColor(category);
  }

  return categoryMarkerColor(category);
}

function normalizePropertyClientOperation(value: unknown, isOwner = false) {
  const operation = String(value || "");
  if (["comprador", "vendedor", "locador", "inquilino"].includes(operation)) return operation;
  if (operation === "comprar") return isOwner ? "vendedor" : "comprador";
  if (operation === "alquilar" || operation === "temporada") return isOwner ? "locador" : "inquilino";

  return isOwner ? "vendedor" : "comprador";
}

export type PropertyViewModel = {
  id: string;
  databaseId: string;
  kmlId: string;
  title: string;
  slug: string;
  location: string;
  price: string;
  priceAmount: number | null;
  currency: string;
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
  createdAt: string;
  updatedAt: string;
  images: string[];
  videos: string[];
  videoThumbnails: Record<string, string>;
  clientAssignments: PropertyClientAssignmentViewModel[];
};

export type PropertyClientAssignmentViewModel = {
  id: string;
  clientId: string;
  propertyId: string;
  relationship: string;
  notes: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    fullName: string;
    phone: string;
    email: string;
    operation: string;
    isOwner: boolean;
    status: string;
  } | null;
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
  propertyAssignments: ClientPropertyAssignmentViewModel[];
};

export type ClientPropertyAssignmentViewModel = {
  id: string;
  clientId: string;
  propertyId: string;
  relationship: string;
  notes: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    title: string;
    slug: string;
    location: string;
    price: string;
    category: string;
    isPublished: boolean;
  } | null;
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

export type ClientPortalProfileViewModel = {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ClientPropertySubmissionViewModel = {
  id: string;
  userId: string;
  title: string;
  operation: string;
  status: string;
  propertyType: string;
  location: string;
  zone: string;
  price: string;
  area: string;
  rooms: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  adminMessage: string;
  convertedPropertyId: string;
  createdAt: string;
  updatedAt: string;
};

export type ClientPortalFileViewModel = {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  bucket: string;
  storagePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  kind: string;
  status: string;
  isImage: boolean;
  signedUrl: string;
  createdAt: string;
  updatedAt: string;
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

export function propertyToViewModel(row: any, options: { includeClientAssignments?: boolean } = {}): PropertyViewModel {
  const category = row.category || "venta";
  const images = [...(row.propertyImages || row.property_images || [])]
    .sort((first, second) => (first.sortOrder ?? first.sort_order ?? 0) - (second.sortOrder ?? second.sort_order ?? 0))
    .map((image) => image.url)
    .filter(Boolean);
  const videos = [...(row.propertyVideos || row.property_videos || [])]
    .sort((first, second) => (first.sortOrder ?? first.sort_order ?? 0) - (second.sortOrder ?? second.sort_order ?? 0))
    .map((video) => video.url)
    .filter(Boolean);
  const clientAssignments = options.includeClientAssignments
    ? [...(row.clientAssignments || row.client_assignments || [])]
        .map((assignment) => propertyClientAssignmentToViewModel(assignment))
        .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt))
    : [];
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
    priceAmount: row.priceAmount != null ? Number(row.priceAmount) : (row.price_amount != null ? Number(row.price_amount) : null),
    currency: row.currency || "USD",
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
    createdAt: isoDate(row.createdAt || row.created_at),
    updatedAt: isoDate(row.updatedAt || row.updated_at),
    images,
    videos,
    videoThumbnails: {},
    clientAssignments
  };
}

export function propertyClientAssignmentToViewModel(row: any): PropertyClientAssignmentViewModel {
  const client = row.client || null;
  const isOwner = Boolean(client?.isOwner ?? client?.is_owner);
  const operation = normalizePropertyClientOperation(client?.operation, isOwner);

  return {
    id: row.id || "",
    clientId: row.clientId || row.client_id || "",
    propertyId: row.propertyId || row.property_id || "",
    relationship: row.relationship || "interesado",
    notes: row.notes || "",
    createdBy: row.createdBy || row.created_by || "",
    updatedBy: row.updatedBy || row.updated_by || "",
    createdAt: isoDate(row.createdAt || row.created_at),
    updatedAt: isoDate(row.updatedAt || row.updated_at),
    client: client
      ? {
          id: client.id || "",
          fullName: client.fullName || client.full_name || "",
          phone: client.phone || "",
          email: client.email || "",
          operation,
          isOwner,
          status: client.status || "nuevo"
        }
      : null
  };
}

export function clientToViewModel(row: any): ClientViewModel {
  const propertyAssignments = [...(row.propertyAssignments || row.client_property_assignments || [])]
    .map(clientPropertyAssignmentToViewModel)
    .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
  const rowIsOwner = Boolean(row.isOwner ?? row.is_owner);
  const operation = normalizeClientOperation(row.operation, rowIsOwner);
  const isOwner = operation === "vendedor" || operation === "locador";

  return {
    id: row.id,
    createdBy: row.createdBy || row.created_by || "",
    updatedBy: row.updatedBy || row.updated_by || "",
    fullName: row.fullName || row.full_name || "",
    phone: row.phone || "",
    email: row.email || "",
    isOwner: Boolean(isOwner),
    operation,
    zone: row.zone || "",
    budget: row.budget || "",
    rooms: row.rooms || "",
    status: row.status || "nuevo",
    notes: row.notes || "",
    createdAt: isoDate(row.createdAt || row.created_at),
    updatedAt: isoDate(row.updatedAt || row.updated_at),
    propertyAssignments
  };
}

export function clientPropertyAssignmentToViewModel(row: any): ClientPropertyAssignmentViewModel {
  const property = row.property || null;

  return {
    id: row.id || "",
    clientId: row.clientId || row.client_id || "",
    propertyId: row.propertyId || row.property_id || "",
    relationship: row.relationship || "interesado",
    notes: row.notes || "",
    createdBy: row.createdBy || row.created_by || "",
    updatedBy: row.updatedBy || row.updated_by || "",
    createdAt: isoDate(row.createdAt || row.created_at),
    updatedAt: isoDate(row.updatedAt || row.updated_at),
    property: property
      ? {
          id: property.id || "",
          title: property.title || "",
          slug: property.slug || "",
          location: property.location || "",
          price: property.price || "Consultar",
          category: property.category || "venta",
          isPublished: Boolean(property.isPublished ?? property.is_published)
        }
      : null
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

export function clientPortalProfileToViewModel(row: any = {}, user: any = {}): ClientPortalProfileViewModel {
  const metadata = user.user_metadata || {};
  const fullName = row.fullName || row.full_name || metadata.full_name || metadata.name || "";
  const avatarUrl = row.avatarUrl || row.avatar_url || metadata.avatar_url || metadata.picture || "";

  return {
    userId: row.userId || row.user_id || user.id || "",
    email: row.email || user.email || "",
    fullName,
    avatarUrl,
    phone: row.phone || "",
    isActive: row.isActive ?? row.is_active ?? true,
    createdAt: isoDate(row.createdAt || row.created_at),
    updatedAt: isoDate(row.updatedAt || row.updated_at)
  };
}

export function clientPropertySubmissionToViewModel(row: any): ClientPropertySubmissionViewModel {
  const latitude = Number(row.latitude);
  const longitude = Number(row.longitude);

  return {
    id: row.id || "",
    userId: row.userId || row.user_id || "",
    title: row.title || "",
    operation: row.operation || "venta",
    status: row.status || "borrador",
    propertyType: row.propertyType || row.property_type || "",
    location: row.address || row.location || row.zone || "",
    zone: row.zone || "",
    price: row.price || "",
    area: row.area || "",
    rooms: row.rooms || "",
    description: row.description || "",
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    adminMessage: row.adminMessage || row.admin_message || "",
    convertedPropertyId: row.convertedPropertyId || row.converted_property_id || "",
    createdAt: isoDate(row.createdAt || row.created_at),
    updatedAt: isoDate(row.updatedAt || row.updated_at)
  };
}

export function clientPortalFileToViewModel(row: any, signedUrl = ""): ClientPortalFileViewModel {
  const fileType = row.fileType || row.file_type || "";

  return {
    id: row.id || "",
    userId: row.userId || row.user_id || "",
    entityType: row.entityType || row.entity_type || "",
    entityId: row.entityId || row.entity_id || "",
    bucket: row.bucket || "client-portal-files",
    storagePath: row.storagePath || row.storage_path || "",
    fileName: row.fileName || row.file_name || "",
    fileType,
    fileSize: Number(row.fileSize ?? row.file_size ?? 0),
    kind: row.kind || "document",
    status: row.status || "active",
    isImage: fileType.startsWith("image/"),
    signedUrl,
    createdAt: isoDate(row.createdAt || row.created_at),
    updatedAt: isoDate(row.updatedAt || row.updated_at)
  };
}
