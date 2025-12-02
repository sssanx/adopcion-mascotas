// src/pages/api/mascotas.js (COMPLETO CON DELETE)
import { pool } from '../../db/db';

export async function POST({ request }) {
  try {
    const data = await request.json();
    const { 
      nombre, especie, raza, edad, edad_unidad, sexo, tamano,
      descripcion, imagen_url, caracteristicas = [], disponible = true 
    } = data;

    // Validaciones
    if (!nombre || nombre.trim() === '') {
      return new Response(JSON.stringify({ error: 'El nombre es requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!especie) {
      return new Response(JSON.stringify({ error: 'La especie es requerida' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validar longitud del nombre
    if (nombre.length > 50) {
      return new Response(JSON.stringify({ error: 'El nombre no puede tener más de 50 caracteres' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validar longitud de la raza
    if (raza && raza.length > 50) {
      return new Response(JSON.stringify({ error: 'La raza no puede tener más de 50 caracteres' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validar que edad sea un número positivo si se proporciona
    if (edad && (isNaN(edad) || edad < 0 || edad > 30)) {
      return new Response(JSON.stringify({ error: 'La edad debe ser un número entre 0 y 30 años' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validar longitud de la URL de imagen
    if (imagen_url && imagen_url.length > 255) {
      return new Response(JSON.stringify({ error: 'La URL de la imagen no puede tener más de 255 caracteres' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Insertar en la base de datos con TODOS los campos
    const result = await pool.query(
      `INSERT INTO mascotas(
        nombre, especie, raza, edad, edad_unidad, sexo, tamano,
        descripcion, imagen_url, caracteristicas, disponible
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        nombre.trim(),
        especie,
        raza ? raza.trim() : null,
        edad ? parseInt(edad) : null,
        edad_unidad || 'años',
        sexo || null,
        tamano || null,
        descripcion ? descripcion.trim() : null,
        imagen_url ? imagen_url.trim() : null,
        JSON.stringify(caracteristicas),
        Boolean(disponible)
      ]
    );

    // Verificar que se insertó correctamente
    if (result.rows.length === 0) {
      throw new Error('No se pudo insertar la mascota en la base de datos');
    }

    return new Response(JSON.stringify({
      success: true,
      mascota: result.rows[0],
      message: 'Mascota agregada correctamente'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Error en API mascotas:', err);
    
    // Manejar errores específicos de la base de datos
    let errorMessage = 'Error interno del servidor';
    let statusCode = 500;

    if (err.code === '23505') { // Violación de unique constraint
      errorMessage = 'Ya existe una mascota con ese nombre';
      statusCode = 400;
    } else if (err.code === '23502') { // Violación de not null constraint
      errorMessage = 'Datos requeridos faltantes';
      statusCode = 400;
    } else if (err.code === '22001') { // Violación de longitud de string
      errorMessage = 'Uno de los campos excede la longitud permitida';
      statusCode = 400;
    } else if (err.message.includes('JSON')) {
      errorMessage = 'Formato JSON inválido';
      statusCode = 400;
    } else {
      errorMessage = err.message;
    }

    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Método GET para obtener mascotas
export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const soloDisponibles = url.searchParams.get('disponibles');
    const disponible = url.searchParams.get('disponible');
    
    let query = `
      SELECT id, nombre, especie, raza, edad, edad_unidad, sexo, tamano,
             descripcion, imagen_url, caracteristicas, disponible,
             created_at, updated_at
      FROM mascotas
    `;
    
    const params = [];
    
    if (soloDisponibles === 'true' || disponible === 'true') {
      query += ' WHERE disponible = true';
    } else if (disponible === 'false') {
      query += ' WHERE disponible = false';
    }
    
    query += ' ORDER BY id DESC';

    const result = await pool.query(query, params);
    
    return new Response(JSON.stringify({
      success: true,
      count: result.rows.length,
      mascotas: result.rows
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error obteniendo mascotas:', err);
    
    return new Response(JSON.stringify({ 
      error: 'Error al obtener las mascotas',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Método PUT para actualizar mascotas
export async function PUT({ request }) {
  try {
    const data = await request.json();
    const { 
      id, nombre, especie, raza, edad, edad_unidad, sexo, tamano,
      descripcion, imagen_url, caracteristicas, disponible 
    } = data;

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID de mascota requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await pool.query(
      `UPDATE mascotas SET 
        nombre = COALESCE($1, nombre),
        especie = COALESCE($2, especie),
        raza = COALESCE($3, raza),
        edad = COALESCE($4, edad),
        edad_unidad = COALESCE($5, edad_unidad),
        sexo = COALESCE($6, sexo),
        tamano = COALESCE($7, tamano),
        descripcion = COALESCE($8, descripcion),
        imagen_url = COALESCE($9, imagen_url),
        caracteristicas = COALESCE($10, caracteristicas),
        disponible = COALESCE($11, disponible),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12 RETURNING *`,
      [
        nombre ? nombre.trim() : null,
        especie,
        raza ? raza.trim() : null,
        edad ? parseInt(edad) : null,
        edad_unidad,
        sexo,
        tamano,
        descripcion ? descripcion.trim() : null,
        imagen_url ? imagen_url.trim() : null,
        caracteristicas ? JSON.stringify(caracteristicas) : null,
        disponible !== undefined ? disponible : null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Mascota no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      mascota: result.rows[0],
      message: 'Mascota actualizada correctamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Error actualizando mascota:', err);
    
    return new Response(JSON.stringify({ 
      error: 'Error al actualizar la mascota',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// MÉTODO DELETE PARA ELIMINAR MASCOTAS
export async function DELETE({ request }) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    console.log(' Recibiendo solicitud DELETE para mascota ID:', id);

    if (!id) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'ID de mascota requerido' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verificar que la mascota existe
    const mascotaCheck = await pool.query(
      'SELECT id, nombre FROM mascotas WHERE id = $1',
      [id]
    );

    if (mascotaCheck.rows.length === 0) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Mascota no encontrada' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const mascotaNombre = mascotaCheck.rows[0].nombre;

    // Primero eliminar solicitudes de adopción asociadas (si existen)
    try {
      await pool.query(
        'DELETE FROM solicitudes_adopcion WHERE mascota_id = $1',
        [id]
      );
      console.log(' Solicitudes de adopción eliminadas para mascota ID:', id);
    } catch (error) {
      console.log('ℹ No se encontraron solicitudes de adopción para eliminar');
      // Continuar aunque no haya solicitudes para eliminar
    }

    // Luego eliminar la mascota
    const result = await pool.query(
      'DELETE FROM mascotas WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('No se pudo eliminar la mascota');
    }

    console.log(' Mascota eliminada exitosamente ID:', id);

    return new Response(JSON.stringify({
      success: true,
      message: `Mascota "${mascotaNombre}" eliminada correctamente`,
      id: parseInt(id)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error(' Error eliminando mascota:', err);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Error al eliminar la mascota: ' + err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Método OPTIONS para CORS (opcional)
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}