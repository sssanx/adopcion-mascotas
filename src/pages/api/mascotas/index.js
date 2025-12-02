import { pool } from '../../../db/db';

// =====================================================
// PUT - Actualizar mascota (para marcar no disponible)
// =====================================================
export async function PUT({ request }) {
  try {
    const body = await request.json();

    if (!body.id) {
      return new Response(JSON.stringify({
        error: "Falta el ID de la mascota"
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const mascotaId = parseInt(body.id);
    const disponible = body.disponible;

    const result = await pool.query(
      'UPDATE mascotas SET disponible = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [disponible, mascotaId]
    );

    return new Response(JSON.stringify({
      success: true,
      message: disponible ? "Mascota marcada como disponible" : "Mascota marcada como no disponible",
      mascota: result.rows[0]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error en PUT:", error);

    return new Response(JSON.stringify({
      error: "Error actualizando mascota"
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
