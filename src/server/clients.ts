import { getPrisma } from "./prisma";
import {
  clientPropertyAssignmentToViewModel,
  clientToViewModel,
  type ClientPropertyAssignmentViewModel,
  type ClientViewModel
} from "./view-models";

export const CLIENT_OPERATIONS = ["comprador", "vendedor", "locador", "inquilino"];
export const DEFAULT_CLIENT_OPERATION = "comprador";
export const CLIENT_STATUSES = ["nuevo", "contactado", "visitando", "cerrado", "pausado"];
export const CLIENT_PROPERTY_RELATIONSHIPS = ["propietario", "comprador", "interesado", "inquilino"];

const clientInclude = {
  propertyAssignments: {
    include: {
      property: true
    },
    orderBy: {
      updatedAt: "desc" as const
    }
  }
};

function textValue(value: unknown) {
  return String(value || "").trim();
}

function isOwnerClientOperation(operation: string) {
  return operation === "vendedor" || operation === "locador";
}

function normalizeClientOperation(value: unknown, isOwner = false) {
  const operation = String(value || "");
  if (CLIENT_OPERATIONS.includes(operation)) return operation;
  if (operation === "comprar") return isOwner ? "vendedor" : "comprador";
  if (operation === "alquilar" || operation === "temporada") return isOwner ? "locador" : "inquilino";

  return isOwner ? "vendedor" : DEFAULT_CLIENT_OPERATION;
}

function clientDataFromValues(values: any, userId: string) {
  const fullName = textValue(values.fullName);

  if (!fullName) {
    throw new Error("El nombre del cliente es obligatorio.");
  }

  const operation = normalizeClientOperation(values.operation, Boolean(values.isOwner));
  const status = CLIENT_STATUSES.includes(values.status) ? values.status : "nuevo";

  return {
    fullName,
    phone: textValue(values.phone),
    email: textValue(values.email).toLowerCase(),
    isOwner: isOwnerClientOperation(operation),
    operation,
    zone: textValue(values.zone),
    budget: textValue(values.budget),
    rooms: textValue(values.rooms),
    status,
    notes: textValue(values.notes),
    updatedBy: userId
  };
}

export async function listClients(filters: any = {}): Promise<ClientViewModel[]> {
  const where: any = {};

  if (CLIENT_OPERATIONS.includes(filters.operation)) {
    where.operation = filters.operation;
  }

  if (CLIENT_STATUSES.includes(filters.status)) {
    where.status = filters.status;
  }

  if (filters.createdBy) {
    where.createdBy = filters.createdBy;
  }

  const rows = await getPrisma().client.findMany({
    where,
    include: clientInclude,
    orderBy: [
      { updatedAt: "desc" },
      { createdAt: "desc" }
    ]
  });

  return rows.map(clientToViewModel);
}

export async function saveClient(values: any, userId: string): Promise<ClientViewModel> {
  const data = clientDataFromValues(values, userId);
  const id = textValue(values.id);

  const row = id
    ? await getPrisma().client.update({
        where: { id },
        data,
        include: clientInclude
      })
    : await getPrisma().client.create({
        data: {
          ...data,
          createdBy: userId
        },
        include: clientInclude
      });

  return clientToViewModel(row);
}

export async function saveClientPropertyAssignment(values: any, userId: string): Promise<ClientPropertyAssignmentViewModel> {
  const id = textValue(values.id);
  const clientId = textValue(values.clientId);
  const propertyId = textValue(values.propertyId);
  const relationship = CLIENT_PROPERTY_RELATIONSHIPS.includes(values.relationship)
    ? values.relationship
    : "interesado";

  if (!clientId) {
    throw new Error("Falta el cliente para asignar la propiedad.");
  }

  if (!propertyId) {
    throw new Error("Selecciona una propiedad para asignar.");
  }

  const data = {
    clientId,
    propertyId,
    relationship,
    notes: textValue(values.notes),
    updatedBy: userId
  };

  const row = id
    ? await getPrisma().clientPropertyAssignment.update({
        where: { id },
        data,
        include: { property: true }
      })
    : await getPrisma().clientPropertyAssignment.create({
        data: {
          ...data,
          createdBy: userId
        },
        include: { property: true }
      });

  return clientPropertyAssignmentToViewModel(row);
}

export async function deleteClientPropertyAssignment(assignmentId: string) {
  const id = textValue(assignmentId);

  if (!id) {
    throw new Error("Falta la asignacion a eliminar.");
  }

  await getPrisma().clientPropertyAssignment.delete({
    where: {
      id
    }
  });
}
