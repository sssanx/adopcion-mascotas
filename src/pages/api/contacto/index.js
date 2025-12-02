import { pool } from '../../../db/db';

// GET - evitar 404 y permitir pruebas
export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      mensaje: "GET en /api/contacto funcionando."
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}

// POST - guardar mensaje en la base de datos
export async function POST({ request }) {
  try {
    const body = await request.json();
    const { nombre, email, telefono, asunto, mensaje } = body;

    if (!nombre || !email || !mensaje) {
      return new Response(JSON.stringify({
        success: false,
        error: "Faltan campos obligatorios"
      }), { status: 400 });
    }

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
