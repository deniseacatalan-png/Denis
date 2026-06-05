import { getPrisma } from "./prisma";
import { clientToViewModel, type ClientViewModel } from "./view-models";

export const CLIENT_OPERATIONS = ["comprar", "alquilar", "temporada"];
export const CLIENT_STATUSES = ["nuevo", "contactado", "visitando", "cerrado", "pausado"];

function textValue(value: unknown) {
  return String(value || "").trim();
}

function clientDataFromValues(values: any, userId: string) {
  const fullName = textValue(values.fullName);

  if (!fullName) {
    throw new Error("El nombre del cliente es obligatorio.");
  }

  const operation = CLIENT_OPERATIONS.includes(values.operation) ? values.operation : "alquilar";
  const status = CLIENT_STATUSES.includes(values.status) ? values.status : "nuevo";

  return {
    fullName,
    phone: textValue(values.phone),
    email: textValue(values.email).toLowerCase(),
    isOwner: Boolean(values.isOwner),
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
        data
      })
    : await getPrisma().client.create({
        data: {
          ...data,
          createdBy: userId
        }
      });

  return clientToViewModel(row);
}
