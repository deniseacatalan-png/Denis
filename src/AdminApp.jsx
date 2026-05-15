import { useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

const emptyForm = {
  title: "",
  latitude: "",
  longitude: "",
  altitude_m: "",
  description_html: ""
};

export default function AdminApp() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sessionData) => {
      setSession(sessionData);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const canUse = isSupabaseConfigured && supabase;

  async function sendMagicLink(e) {
    e.preventDefault();
    if (!canUse) return;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + "/admin" } });
    setMessage(error ? error.message : "Te enviamos un magic link al correo.");
  }

  async function loadProperties() {
    if (!canUse || !session) return;
    setLoading(true);
    const { data, error } = await supabase.from("properties").select("id,title,latitude,longitude,altitude_m,description_html,updated_at").order("id");
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setItems(data || []);
  }

  useEffect(() => {
    loadProperties();
  }, [session]);

  async function saveProperty(e) {
    e.preventDefault();
    if (!canUse || !session) return;
    setSaving(true);
    const payload = {
      title: form.title,
      description_html: form.description_html,
      description_text: form.description_html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      altitude_m: form.altitude_m ? Number(form.altitude_m) : null
    };
    const { error } = await supabase.from("properties").insert(payload);
    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setForm(emptyForm);
    setMessage("Propiedad creada correctamente.");
    loadProperties();
  }

  const list = useMemo(() => items.slice(0, 50), [items]);

  if (!canUse) {
    return <main style={{ padding: 24 }}><h1>Administrador</h1><p>Faltan variables: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.</p></main>;
  }

  if (!session) {
    return (
      <main style={{ padding: 24, maxWidth: 460 }}>
        <h1>Administrador de propiedades</h1>
        <p>Ingresá tu correo para recibir el enlace de acceso.</p>
        <form onSubmit={sendMagicLink}>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" style={{ width: "100%", padding: 8, marginBottom: 8 }} />
          <button type="submit">Enviar magic link</button>
        </form>
        {message && <p>{message}</p>}
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Administrador de propiedades</h1>
      <button onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
      <button onClick={loadProperties} style={{ marginLeft: 8 }}>{loading ? "Cargando..." : "Recargar"}</button>
      <h2>Nueva propiedad</h2>
      <form onSubmit={saveProperty} style={{ display: "grid", gap: 8, maxWidth: 620 }}>
        <input required placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input placeholder="Latitud" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
        <input placeholder="Longitud" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
        <input placeholder="Altura (m)" value={form.altitude_m} onChange={(e) => setForm({ ...form, altitude_m: e.target.value })} />
        <textarea rows={6} placeholder="Descripción HTML" value={form.description_html} onChange={(e) => setForm({ ...form, description_html: e.target.value })} />
        <button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
      </form>
      {message && <p>{message}</p>}
      <h2>Propiedades ({items.length})</h2>
      <ul>
        {list.map((item) => (
          <li key={item.id}><strong>{item.title}</strong> — {item.latitude}, {item.longitude}</li>
        ))}
      </ul>
    </main>
  );
}
