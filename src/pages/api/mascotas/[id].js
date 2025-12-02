import { pool } from '../../../db/db';

// =====================================================
// DELETE - Eliminar mascota específica
// =====================================================
export async function DELETE({ params }) {
  try {
    const { id } = params;

    if (!id || isNaN(id)) {
      return new Response(JSON.stringify({
        error: 'ID de mascota inválido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const mascotaId = parseInt(id);

    // Verificar que exista
    const mascota = await pool.query(
      'SELECT * FROM mascotas WHERE id = $1',
      [mascotaId]
    );

    if (mascota.rows.length === 0) {
      return new Response(JSON.stringify({
        error: 'Mascota no encontrada'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verificar si tiene adopciones
    const adopciones = await pool.query(
      'SELECT id FROM adopciones WHERE mascota_id = $1',
      [mascotaId]
    );

    if (adopciones.rows.length > 0) {
      return new Response(JSON.stringify({
        error: 'No se puede eliminar la mascota porque tiene adopciones registradas'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Eliminar mascota
    const result = await pool.query(
      'DELETE FROM mascotas WHERE id = $1 RETURNING *',
      [mascotaId]
    );

    return new Response(JSON.stringify({
      success: true,
      message: 'Mascota eliminada correctamente',
      mascota_eliminada: result.rows[0]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Error eliminando mascota:', err);

    return new Response(JSON.stringify({
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// =====================================================
// GET - Obtener mascota por ID
// =====================================================
export async function GET({ params }) {
  try {
    const { id } = params;

    if (!id || isNaN(id)) {
      return new Response(JSON.stringify({
        error: 'ID de mascota inválido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await pool.query(
      'SELECT * FROM mascotas WHERE id = $1',
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({
        error: 'Mascota no encontrada'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      mascota: result.rows[0]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Error obteniendo mascota:', err);

    return new Response(JSON.stringify({
      error: 'Error al obtener la mascota'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
