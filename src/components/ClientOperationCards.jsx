import {
  CLIENT_OPERATION_LABELS,
  CLIENT_OPERATIONS
} from "../utils/supabase/clients";

function svgDataUri(svg) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const operationCards = {
  comprador: {
    description: "Busca comprar una propiedad.",
    imageAlt: "Persona mirando una casa con una lupa.",
    imageSrc: svgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 140">
        <rect width="220" height="140" rx="20" fill="#f7efe5"/>
        <path d="M38 79 94 36l56 43v38H38z" fill="#d9a8ad"/>
        <path d="M54 75 94 45l40 30" fill="none" stroke="#4d3661" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="80" y="82" width="28" height="35" rx="4" fill="#fffaf4"/>
        <circle cx="150" cy="64" r="22" fill="none" stroke="#2f4f3e" stroke-width="8"/>
        <path d="m166 80 24 24" stroke="#2f4f3e" stroke-width="9" stroke-linecap="round"/>
        <circle cx="60" cy="39" r="13" fill="#c6a769"/>
      </svg>
    `)
  },
  vendedor: {
    description: "Quiere vender su propiedad.",
    imageAlt: "Casa con cartel de venta.",
    imageSrc: svgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 140">
        <rect width="220" height="140" rx="20" fill="#fffaf4"/>
        <path d="M33 80 88 37l55 43v36H33z" fill="#c0a0cf"/>
        <path d="M50 77 88 48l38 29" fill="none" stroke="#4d3661" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="76" y="85" width="26" height="31" rx="4" fill="#f7efe5"/>
        <rect x="144" y="43" width="52" height="33" rx="7" fill="#2f4f3e"/>
        <path d="M153 60h34" stroke="#fffaf4" stroke-width="6" stroke-linecap="round"/>
        <path d="M170 76v39" stroke="#2f4f3e" stroke-width="7" stroke-linecap="round"/>
        <circle cx="48" cy="42" r="12" fill="#d9a8ad"/>
      </svg>
    `)
  },
  locador: {
    description: "Tiene una propiedad para alquilar.",
    imageAlt: "Contrato de alquiler con llaves.",
    imageSrc: svgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 140">
        <rect width="220" height="140" rx="20" fill="#f7efe5"/>
        <rect x="50" y="24" width="76" height="92" rx="10" fill="#fffaf4" stroke="#6e4f82" stroke-width="6"/>
        <path d="M68 49h40M68 68h35M68 87h28" stroke="#6e4f82" stroke-width="6" stroke-linecap="round"/>
        <circle cx="151" cy="75" r="17" fill="none" stroke="#c6a769" stroke-width="8"/>
        <path d="m164 88 29 29M180 103l-10 10M190 113l-8 8" stroke="#c6a769" stroke-width="8" stroke-linecap="round"/>
        <path d="M145 35h31l12 17" fill="none" stroke="#2f4f3e" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `)
  },
  inquilino: {
    description: "Busca alquilar una propiedad.",
    imageAlt: "Llaves junto a cajas de mudanza.",
    imageSrc: svgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 140">
        <rect width="220" height="140" rx="20" fill="#fffaf4"/>
        <rect x="40" y="69" width="48" height="48" rx="7" fill="#d9a8ad"/>
        <rect x="83" y="52" width="52" height="65" rx="7" fill="#c0a0cf"/>
        <path d="M50 86h28M95 72h29" stroke="#4d3661" stroke-width="6" stroke-linecap="round"/>
        <circle cx="154" cy="62" r="15" fill="none" stroke="#2f4f3e" stroke-width="8"/>
        <path d="m166 74 27 27M181 89l-10 10M192 101l-8 8" stroke="#2f4f3e" stroke-width="8" stroke-linecap="round"/>
        <path d="M62 52 94 28l33 24" fill="none" stroke="#c6a769" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `)
  }
};

export default function ClientOperationCards({ value, onChange }) {
  return (
    <fieldset className="client-operation-cards admin-field-wide">
      <legend>Tipo de operacion</legend>
      <div className="client-operation-card-grid">
        {CLIENT_OPERATIONS.map((operation) => {
          const card = operationCards[operation];
          const isSelected = operation === value;

          return (
            <button
              type="button"
              className={`client-operation-card ${isSelected ? "is-selected" : ""}`}
              aria-pressed={isSelected}
              key={operation}
              onClick={() => onChange?.(operation)}
            >
              <img src={card.imageSrc} alt={card.imageAlt} />
              <span>{CLIENT_OPERATION_LABELS[operation]}</span>
              <small>{card.description}</small>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
