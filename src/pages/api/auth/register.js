import { pool } from "../../../db/db";

export async function POST({ request }) {
  try {
    const { nombre, email, password } = await request.json();

    if (!nombre || !email || !password) {
      return new Response(JSON.stringify({ error: "Todos los campos son obligatorios" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const existe = await pool.query(
      "SELECT id FROM usuarios WHERE email = $1",
      [email]
    );

    if (existe.rows.length > 0) {
      return new Response(JSON.stringify({ error: "El correo ya está registrado" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const nuevo = await pool.query(
      "INSERT INTO usuarios(nombre, email, password) VALUES($1, $2, $3) RETURNING id, nombre, email",
      [nombre, email, password]
    );

    return new Response(JSON.stringify({ success: true, user: nuevo.rows[0] }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Error en el servidor" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
