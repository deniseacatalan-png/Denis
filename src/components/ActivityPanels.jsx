import { upload } from "@vercel/blob/client";
import { useEffect, useMemo, useState } from "react";
import { slugify } from "../utils/properties";

const imageContentTypes = ["image/avif", "image/jpeg", "image/png", "image/webp"];
const documentContentTypes = [
  "application/msword",
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];
const allowedAttachmentContentTypes = [...imageContentTypes, ...documentContentTypes];
const attachmentAccept = [
  ".avif",
  ".doc",
  ".docx",
  ".jpg",
  ".jpeg",
  ".pdf",
  ".png",
  ".webp",
  ".xls",
  ".xlsx"
].join(",");
const maxAttachmentSizeInBytes = 25 * 1024 * 1024;

const fallbackExtensions = {
  "application/msword": ".doc",
  "application/pdf": ".pdf",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "image/avif": ".avif",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

function formatActivityDate(value) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatFileSize(size) {
  const bytes = Number(size || 0);

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${bytes} B`;
}

function authorLabel(item) {
  const role = item.authorRole === "seller" ? "Vendedor" : "Admin";
  return `${item.authorName || "Usuario interno"} · ${role}`;
}

function attachmentPathForFile(entityType, entityId, file) {
  const extension = file.name.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() || fallbackExtensions[file.type] || "";
  const baseName = extension ? file.name.slice(0, -extension.length) : file.name;
  const safeBaseName = slugify(baseName, 72) || "archivo";
  const folder = entityType === "property" ? "property-documents" : "client-documents";

  return `${folder}/${entityId}/${Date.now()}-${safeBaseName}${extension}`;
}

function uploadPayloadForEntity(entityType, entityId, accessToken) {
  const uploadType = entityType === "property" ? "property-document" : "client-document";

  return {
    accessToken,
    uploadType,
    propertyId: entityType === "property" ? entityId : undefined,
    clientId: entityType === "client" ? entityId : undefined
  };
}

export function NotesPanel({ entityId, author, fetchNotes, createNote }) {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canCreate = Boolean(entityId && author);

  const loadNotes = async () => {
    if (!entityId) {
      setNotes([]);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      setNotes(await fetchNotes(entityId));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [entityId, fetchNotes]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      await createNote(entityId, body, author);
      setBody("");
      setIsAdding(false);
      setMessage("Nota guardada.");
      await loadNotes();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="activity-panel" aria-labelledby={`notes-${entityId || "new"}`}>
      <div className="activity-panel-header">
        <div>
          <p>Historial interno</p>
          <h3 id={`notes-${entityId || "new"}`}>Notas</h3>
        </div>
        <button type="button" className="map-btn" onClick={() => setIsAdding((current) => !current)} disabled={!canCreate}>
          {isAdding ? "Cerrar" : "Agregar nota"}
        </button>
      </div>

      {message ? <p className="admin-success">{message}</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}
      {isLoading ? <p className="admin-sidebar-note">Cargando notas...</p> : null}

      {isAdding ? (
        <div className="activity-form">
          <label>
            Nota
            <textarea rows="4" value={body} onChange={(event) => setBody(event.target.value)} />
          </label>
          <button type="button" className="wa-btn" onClick={handleSave} disabled={isSaving || !body.trim()}>
            {isSaving ? "Guardando..." : "Guardar nota"}
          </button>
        </div>
      ) : null}

      <div className="activity-list">
        {notes.map((note) => (
          <article className="activity-item" key={note.id}>
            <p>{note.body}</p>
            <small>
              {authorLabel(note)} · {formatActivityDate(note.createdAt)}
            </small>
          </article>
        ))}
        {!isLoading && !notes.length ? <p className="seller-empty-state">No hay notas cargadas.</p> : null}
      </div>
    </section>
  );
}

export function DocumentsPanel({ entityType, entityId, accessToken, author, fetchDocuments, createDocument }) {
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const canCreate = Boolean(entityId && accessToken && author);

  const inputId = useMemo(() => `document-input-${entityType}-${entityId || "new"}`, [entityId, entityType]);

  const loadDocuments = async () => {
    if (!entityId) {
      setDocuments([]);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      setDocuments(await fetchDocuments(entityId));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSelectedFile(null);
    loadDocuments();
  }, [entityId, fetchDocuments]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setMessage("");
    setError("");

    try {
      if (!allowedAttachmentContentTypes.includes(selectedFile.type)) {
        throw new Error(`Formato no permitido: ${selectedFile.name}. Usa imagen, PDF, DOC, DOCX, XLS o XLSX.`);
      }

      if (selectedFile.size > maxAttachmentSizeInBytes) {
        throw new Error(`${selectedFile.name} supera el limite de 25 MB.`);
      }

      const blob = await upload(attachmentPathForFile(entityType, entityId, selectedFile), selectedFile, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
        contentType: selectedFile.type,
        multipart: selectedFile.size > 4 * 1024 * 1024,
        clientPayload: JSON.stringify(uploadPayloadForEntity(entityType, entityId, accessToken))
      });

      try {
        await createDocument(
          entityId,
          {
            fileName: selectedFile.name,
            fileUrl: blob.url,
            fileType: selectedFile.type,
            fileSize: selectedFile.size
          },
          author
        );
      } catch (saveError) {
        throw new Error(`El archivo subio, pero no pude guardar el registro: ${saveError.message}`);
      }

      setSelectedFile(null);
      setIsAdding(false);
      setMessage("Documento guardado.");
      await loadDocuments();
    } catch (uploadError) {
      setError(
        uploadError.message.includes("Failed to fetch")
          ? "No pude contactar la ruta de subida. En local, usa Vercel Dev o desplega en Vercel para probar Blob."
          : uploadError.message
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="activity-panel" aria-labelledby={`documents-${entityId || "new"}`}>
      <div className="activity-panel-header">
        <div>
          <p>Archivos internos</p>
          <h3 id={`documents-${entityId || "new"}`}>Documentos e imagenes</h3>
        </div>
        <button type="button" className="map-btn" onClick={() => setIsAdding((current) => !current)} disabled={!canCreate}>
          {isAdding ? "Cerrar" : "Agregar documento o imagen"}
        </button>
      </div>

      {message ? <p className="admin-success">{message}</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}
      {isLoading ? <p className="admin-sidebar-note">Cargando documentos...</p> : null}

      {isAdding ? (
        <div className="activity-form">
          <label htmlFor={inputId}>
            Archivo
            <input
              id={inputId}
              type="file"
              accept={attachmentAccept}
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            />
          </label>
          <button type="button" className="wa-btn" onClick={handleUpload} disabled={isUploading || !selectedFile}>
            {isUploading ? "Subiendo..." : "Guardar documento"}
          </button>
        </div>
      ) : null}

      <div className="activity-document-list">
        {documents.map((document) => (
          <article className="activity-document-item" key={document.id}>
            {document.isImage ? <img src={document.fileUrl} alt={document.fileName} /> : <span className="activity-file-icon">DOC</span>}
            <div>
              <a href={document.fileUrl} target="_blank" rel="noreferrer">
                {document.fileName || "Archivo"}
              </a>
              <small>
                {document.isImage ? "Imagen" : "Documento"} · {formatFileSize(document.fileSize)}
              </small>
              <small>
                {authorLabel(document)} · {formatActivityDate(document.createdAt)}
              </small>
            </div>
          </article>
        ))}
        {!isLoading && !documents.length ? <p className="seller-empty-state">No hay documentos cargados.</p> : null}
      </div>
    </section>
  );
}
