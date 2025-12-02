import { pool } from "../../../db/db";

export async function POST({ request }) {
  try {
    const { id } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: "ID requerido"
      }), { status: 400 });
    }

    await pool.query("DELETE FROM contacto WHERE id = $1", [id]);

    return new Response(JSON.stringify({
      success: true,
      message: "Mensaje eliminado"
    }), { status: 200 });

  } catch (error) {
    console.error("Error eliminando mensaje:", error);

    return new Response(JSON.stringify({
      success: false,
      error: "Error interno del servidor"
    }), { status: 500 });
  }
}
