import { pool } from "../../db/db.js";
import sanitizeHtml from "sanitize-html";
import nodemailer from "nodemailer";

// Sanitizar inputs
const clean = (str) =>
  sanitizeHtml(String(str || ""), { allowedTags: [], allowedAttributes: {} }).trim();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Configurar transporter de nodemailer usando Brevo SMTP
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
  port: Number(process.env.BREVO_SMTP_PORT) || 587,
  secure: false, // false para STARTTLS en puerto 587
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false // opcional: solo si tienes problemas de certificados; preferible true en producción
  }
});

// Función para enviar correo (returns info or throws)
async function sendMail({ to, subject, text, html }) {
  const from = process.env.FROM_EMAIL || "Refugio <noreply@tudominio.com>";
  const mailOptions = {
    from,
    to,
    subject,
    text,
    html
  };
  return transporter.sendMail(mailOptions);
}

// ---------------------
// POST: crear solicitud
// ---------------------
export async function POST({ request }) {
  const client = await pool.connect();

  try {
    const formData = await request.formData();

    // Sanitizar y parsear
    const mascota_id = Number(clean(formData.get("mascota_id")));
    const nombre = clean(formData.get("nombre_solicitante"));
    const email = clean(formData.get("email_solicitante"));
    const telefono = clean(formData.get("telefono_solicitante") || "");
    const mensaje = clean(formData.get("mensaje") || "");

    // Validaciones
    if (!mascota_id || !nombre || !email) {
      return new Response(JSON.stringify({
        success: false,
        error: "Datos incompletos: mascota_id, nombre_solicitante y email_solicitante son requeridos"
      }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({
        success: false,
        error: "Correo electrónico no válido"
      }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    if (nombre.length > 120) {
      return new Response(JSON.stringify({
        success: false,
        error: "El nombre es demasiado largo"
      }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    if (mensaje.length > 1000) {
      return new Response(JSON.stringify({
        success: false,
        error: "El mensaje excede el límite permitido"
      }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    // Verificar mascota disponible
    const mascotaResult = await client.query(
      "SELECT id, nombre, disponible FROM mascotas WHERE id = $1",
      [mascota_id]
    );

    if (mascotaResult.rows.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Mascota no encontrada" }), { status: 404, headers: { "Content-Type": "application/json" }});
    }

    const mascota = mascotaResult.rows[0];
    if (!mascota.disponible) {
      return new Response(JSON.stringify({ success: false, error: "La mascota no está disponible para adopción" }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    // Insertar solicitud
    const insertRes = await client.query(
      `INSERT INTO solicitudes_adopcion 
       (mascota_id, nombre_solicitante, email_solicitante, telefono_solicitante, mensaje, estado)
       VALUES ($1, $2, $3, $4, $5, 'pendiente')
       RETURNING id, fecha_creacion`,
      [mascota_id, nombre, email, telefono, mensaje]
    );

    const solicitudId = insertRes.rows[0].id;
    const fechaCreacion = insertRes.rows[0].fecha_creacion || new Date().toISOString();

    // Preparar contenido de correo (ADMIN)
    const adminSubject = `Nueva solicitud de adopción - ${mascota.nombre}`;
    const adminText = `
Nueva solicitud de adopción
ID solicitud: ${solicitudId}
Mascota: ${mascota.nombre} (ID ${mascota_id})
Nombre solicitante: ${nombre}
Email: ${email}
Teléfono: ${telefono || "No proporcionado"}
Mensaje: ${mensaje || "No proporcionado"}
Fecha: ${fechaCreacion}
    `;
    const adminHtml = `
      <h2>Nueva solicitud de adopción</h2>
      <p><strong>ID solicitud:</strong> ${solicitudId}</p>
      <p><strong>Mascota:</strong> ${mascota.nombre} (ID ${mascota_id})</p>
      <p><strong>Nombre solicitante:</strong> ${nombre}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Teléfono:</strong> ${telefono || "No proporcionado"}</p>
      <p><strong>Mensaje:</strong><br/> ${mensaje || "No proporcionado"}</p>
      <p><em>Fecha: ${fechaCreacion}</em></p>
    `;

    // Preparar correo para solicitante (CONFIRMACIÓN)
    const userSubject = `Recibimos tu solicitud de adopción para ${mascota.nombre}`;
    const userText = `
Hola ${nombre},

Hemos recibido tu solicitud de adopción para ${mascota.nombre}.
ID solicitud: ${solicitudId}

Nos pondremos en contacto pronto.

Gracias por apoyar la adopción.
    `;
    const userHtml = `
      <p>Hola ${nombre},</p>
      <p>Hemos recibido tu solicitud de adopción para <strong>${mascota.nombre}</strong>.</p>
      <p><strong>ID solicitud:</strong> ${solicitudId}</p>
      <p>Nos pondremos en contacto pronto para continuar con el proceso.</p>
      <p>Gracias por apoyar la adopción.</p>
    `;

    // ENVIAR CORREOS (no hacemos que falle la petición si el email falla; guardamos y notificamos)
    try {
      // Enviar al admin
      if (process.env.ADMIN_EMAIL) {
        await sendMail({
          to: process.env.ADMIN_EMAIL,
          subject: adminSubject,
          text: adminText,
          html: adminHtml
        });
      } else {
        console.warn("ADMIN_EMAIL no configurado en variables de entorno; no se envió notificación al admin.");
      }

      // Enviar al solicitante
      await sendMail({
        to: email,
        subject: userSubject,
        text: userText,
        html: userHtml
      });
    } catch (mailErr) {
      // Loguear error de envío pero no abortar el proceso
      console.error("Error enviando correos (no fallo la inserción):", mailErr);
    }

    // Responder al cliente
    return new Response(JSON.stringify({
      success: true,
      message: "Solicitud de adopción enviada correctamente",
      solicitud_id: solicitudId
    }), { status: 200, headers: { "Content-Type": "application/json" }});

  } catch (err) {
    console.error("❌ Error POST /api/adopciones:", err);
    return new Response(JSON.stringify({
      success: false,
      error: "Error interno del servidor"
    }), { status: 500, headers: { "Content-Type": "application/json" }});
  } finally {
    client.release();
  }
}

// GET, PATCH y ALL pueden quedar igual que ya tenías (sanitiza inputs allí también)
export async function GET({ url }) {
  const client = await pool.connect();
  try {
    const estado = clean(url.searchParams.get("estado"));
    let query = `
      SELECT 
        s.id,
        s.mascota_id,
        m.nombre AS mascota_nombre,
        s.nombre_solicitante,
        s.email_solicitante,
        s.telefono_solicitante,
        s.mensaje,
        s.estado,
        s.fecha_creacion
      FROM solicitudes_adopcion s
      JOIN mascotas m ON m.id = s.mascota_id
    `;
    const params = [];
    if (estado && estado !== "todas") {
      query += " WHERE s.estado = $1";
      params.push(estado);
    }
    query += " ORDER BY s.fecha_creacion DESC";
    const result = await client.query(query, params);
    return new Response(JSON.stringify({ success: true, solicitudes: result.rows, total: result.rows.length }), { status: 200, headers: { "Content-Type": "application/json" }});
  } catch (err) {
    console.error("❌ Error GET /api/adopciones:", err);
    return new Response(JSON.stringify({ success: false, error: "Error al obtener solicitudes" }), { status: 500, headers: { "Content-Type": "application/json" }});
  } finally {
    client.release();
  }
}

export async function PATCH({ request }) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const solicitud_id = Number(clean(body.solicitud_id));
    const mascota_id = body.mascota_id ? Number(clean(body.mascota_id)) : null;
    const accion = clean(body.accion);
    if (!solicitud_id || !accion) {
      return new Response(JSON.stringify({ success: false, error: "solicitud_id y accion son obligatorios" }), { status: 400, headers: { "Content-Type": "application/json" }});
    }
    if (!["aprobar", "rechazar"].includes(accion)) {
      return new Response(JSON.stringify({ success: false, error: "Acción inválida. Use 'aprobar' o 'rechazar'" }), { status: 400, headers: { "Content-Type": "application/json" }});
    }
    const solicitudRes = await client.query("SELECT id, estado, mascota_id FROM solicitudes_adopcion WHERE id = $1", [solicitud_id]);
    if (solicitudRes.rows.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Solicitud no encontrada" }), { status: 404, headers: { "Content-Type": "application/json" }});
    }
    const solicitud = solicitudRes.rows[0];
    if (solicitud.estado !== "pendiente") {
      return new Response(JSON.stringify({ success: false, error: `La solicitud ya fue ${solicitud.estado}` }), { status: 400, headers: { "Content-Type": "application/json" }});
    }
    const mascotaIdFinal = mascota_id || solicitud.mascota_id;
    if (accion === "aprobar") {
      await client.query("BEGIN");
      try {
        await client.query("UPDATE mascotas SET disponible = false WHERE id = $1", [mascotaIdFinal]);
        await client.query("UPDATE solicitudes_adopcion SET estado = 'aprobada' WHERE id = $1", [solicitud_id]);
        await client.query("COMMIT");
        return new Response(JSON.stringify({ success: true, message: "Solicitud aprobada y mascota marcada como adoptada" }), { status: 200, headers: { "Content-Type": "application/json" }});
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }
    if (accion === "rechazar") {
      await client.query("UPDATE solicitudes_adopcion SET estado = 'rechazada' WHERE id = $1", [solicitud_id]);
      return new Response(JSON.stringify({ success: true, message: "Solicitud rechazada" }), { status: 200, headers: { "Content-Type": "application/json" }});
    }
  } catch (err) {
    console.error("❌ Error PATCH /api/adopciones:", err);
    return new Response(JSON.stringify({ success: false, error: "Error interno del servidor" }), { status: 500, headers: { "Content-Type": "application/json" }});
  } finally {
    client.release();
  }
}

export async function ALL() {
  return new Response(JSON.stringify({ success: false, error: "Método no permitido" }), { status: 405, headers: { "Content-Type": "application/json" }});
}
