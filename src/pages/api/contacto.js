import { pool } from '../../db/db';
import sanitizeHtml from "sanitize-html";

// Función para limpiar texto
const clean = (str) =>
  sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {}
  }).trim();

export async function POST({ request }) {
  try {
    const body = await request.json();
    let { nombre, email, telefono, asunto, mensaje } = body;

    // --- SANITIZACIÓN ---
    nombre   = clean(nombre);
    email    = clean(email);
    telefono = telefono ? clean(telefono) : "";
    asunto   = clean(asunto);
    mensaje  = clean(mensaje);

    // --- VALIDACIONES ---
    if (!nombre || !email || !mensaje) {
      return new Response(JSON.stringify({
        success: false,
        error: "Faltan campos obligatorios"
      }), { status: 400 });
    }

    // Validación email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({
        success: false,
        error: "Correo inválido"
      }), { status: 400 });
    }

    // Limitar tamaño para evitar ataques
    if (mensaje.length > 1000) {
      return new Response(JSON.stringify({
        success: false,
        error: "Mensaje demasiado largo"
      }), { status: 400 });
    }

    // --- ENCRIPTAR TELÉFONO (opcional) ---
    // const encrypted = crypto.createHash("sha256").update(telefono).digest("hex");
    // telefono = encrypted; 

    // --- INSERT SEGURO ---
    const result = await pool.query(
      `INSERT INTO contacto (nombre, email, telefono, asunto, mensaje)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nombre, email, telefono, asunto, mensaje]
    );

    return new Response(JSON.stringify({
      success: true,
      message: "Mensaje enviado correctamente",
      data: result.rows[0]
    }), { status: 200 });

  } catch (error) {
    console.error("ERROR contacto:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Error interno del servidor"
    }), { status: 500 });
  }
}
