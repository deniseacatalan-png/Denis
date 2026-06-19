export const clientPropertyRelationshipLabels = {
  propietario: "Propietario",
  comprador: "Comprador",
  interesado: "Interesado",
  inquilino: "Inquilino"
};

export const emptyClientPropertyAssignmentForm = {
  propertyId: "",
  relationship: "interesado",
  notes: ""
};

function propertyOptionLabel(property) {
  return [property.title || "Sin titulo", property.location || "", property.price || ""].filter(Boolean).join(" · ");
}

function sortPropertiesForAssignment(properties = []) {
  return [...properties].sort((first, second) => {
    const orderDifference = Number(first.displayOrder || 0) - Number(second.displayOrder || 0);
    if (orderDifference !== 0) return orderDifference;

    return String(first.title || "").localeCompare(String(second.title || ""), "es", { sensitivity: "base" });
  });
}

export default function ClientPropertyAssignmentsPanel({
  assignments = [],
  properties = [],
  form = emptyClientPropertyAssignmentForm,
  isSaving = false,
  isLoadingProperties = false,
  onAssign,
  onDelete,
  onFormChange,
  showAssignments = true,
  showForm = true
}) {
  const sortedProperties = sortPropertiesForAssignment(properties);

  return (
    <section className="activity-panel" aria-label="Propiedades asignadas al cliente">
      <div className="activity-panel-header">
        <div>
          <p>Propiedades</p>
          <h3>{showAssignments ? "Asignadas al cliente" : "Nueva asignacion"}</h3>
        </div>
      </div>

      {showForm ? (
        <form className="activity-form" onSubmit={onAssign}>
          <label>
            Propiedad
            <select
              value={form.propertyId}
              onChange={(event) => onFormChange?.("propertyId", event.target.value)}
              required
              disabled={isLoadingProperties || !sortedProperties.length}
            >
              <option value="">
                {isLoadingProperties ? "Cargando propiedades..." : "Seleccionar propiedad"}
              </option>
              {sortedProperties.map((property) => (
                <option value={property.databaseId || property.id} key={property.databaseId || property.id}>
                  {propertyOptionLabel(property)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Vinculo
            <select
              value={form.relationship}
              onChange={(event) => onFormChange?.("relationship", event.target.value)}
            >
              {Object.entries(clientPropertyRelationshipLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Nota
            <input
              value={form.notes}
              onChange={(event) => onFormChange?.("notes", event.target.value)}
              placeholder="Opcional"
            />
          </label>
          <button type="submit" className="wa-btn" disabled={isSaving || !sortedProperties.length}>
            {isSaving ? "Asignando..." : "Asignar"}
          </button>
        </form>
      ) : null}

      {showAssignments ? (
        <div className="activity-list">
          {assignments.map((assignment) => (
            <article className="activity-item" key={assignment.id}>
              <div>
                <strong>{assignment.property?.title || "Propiedad sin titulo"}</strong>
                <small>
                  {clientPropertyRelationshipLabels[assignment.relationship] || assignment.relationship}
                  {assignment.property?.location ? ` · ${assignment.property.location}` : ""}
                  {assignment.property?.price ? ` · ${assignment.property.price}` : ""}
                </small>
              </div>
              {assignment.notes ? <p>{assignment.notes}</p> : null}
              <button type="button" className="map-btn" onClick={() => onDelete?.(assignment.id)} disabled={isSaving}>
                Quitar
              </button>
            </article>
          ))}
          {!assignments.length ? (
            <p className="seller-empty-state">Todavia no hay propiedades asignadas a este cliente.</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
