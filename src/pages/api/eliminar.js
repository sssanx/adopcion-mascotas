// src/pages/api/mascotas/eliminar.js
import { pool } from '../../db/db';

export async function POST({ request }) {
  try {
    const data = await request.json();
    const { id } = data;

    // Validaciones
    if (!id || isNaN(id)) {
      return new Response(JSON.stringify({ 
        error: 'ID de mascota inválido' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verificar si la mascota existe
    const mascotaExistente = await pool.query(
      'SELECT * FROM mascotas WHERE id = $1',
      [id]
    );

    if (mascotaExistente.rows.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Mascota no encontrada' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const mascota = mascotaExistente.rows[0];

    // Verificar si la mascota tiene adopciones relacionadas
    const adopciones = await pool.query(
      'SELECT * FROM adopciones WHERE mascota_id = $1',
      [id]
    );

    if (adopciones.rows.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'No se puede eliminar la mascota porque tiene adopciones registradas',
        adopciones_count: adopciones.rows.length,
        sugerencia: 'Puedes marcar la mascota como no disponible en lugar de eliminarla'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Eliminar la mascota
    const result = await pool.query(
      'DELETE FROM mascotas WHERE id = $1 RETURNING *',
      [id]
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
    
    // Manejar errores específicos de la base de datos
    let errorMessage = 'Error interno del servidor';
    let statusCode = 500;

    if (err.code === '23503') { // Violación de foreign key
      errorMessage = 'No se puede eliminar la mascota porque tiene registros relacionados';
    } else if (err.message.includes('JSON')) {
      errorMessage = 'Formato JSON inválido';
      statusCode = 400;
    }

    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// También puedes agregar DELETE method si prefieres
export async function DELETE({ request }) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    // Validaciones
    if (!id || isNaN(id)) {
      return new Response(JSON.stringify({ 
        error: 'ID de mascota inválido' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verificar si la mascota existe
    const mascotaExistente = await pool.query(
      'SELECT * FROM mascotas WHERE id = $1',
      [parseInt(id)]
    );

    if (mascotaExistente.rows.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Mascota no encontrada' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Eliminar la mascota
    const result = await pool.query(
      'DELETE FROM mascotas WHERE id = $1 RETURNING *',
      [parseInt(id)]
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
      error: 'Error al eliminar la mascota',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}