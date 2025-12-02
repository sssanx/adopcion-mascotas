import { pool } from "../../../db/db";

export async function POST({ request }) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Faltan datos" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const result = await pool.query(
      "SELECT * FROM usuarios WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({ error: "Correo no registrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const user = result.rows[0];

    if (user.password !== password) {
      return new Response(JSON.stringify({ error: "Contraseña incorrecta" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `user_id=${user.id}; Path=/; HttpOnly; SameSite=Strict;`
      }
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Error en servidor" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
