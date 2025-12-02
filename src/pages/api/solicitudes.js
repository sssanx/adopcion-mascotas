import db from "../../db/db";

export async function GET() {
  try {
    const solicitudes = await db`
      SELECT s.*, m.nombre AS mascota_nombre, m.imagen_url
      FROM solicitudes_adopcion s
      JOIN mascotas m ON m.id = s.mascota_id
      ORDER BY s.fecha_solicitud DESC;
    `;

    return new Response(
      JSON.stringify({ success: true, solicitudes }),
      { status: 200 }
    );

  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: "Error obteniendo solicitudes" }),
      { status: 500 }
    );
  }
}
