// src/pages/api/apadrinamiento.js
import { pool } from '../../db/db.js';

export async function get() {
  try {
    // Obtenemos solo los que son para apadrinar
    const result = await pool.query(
      'SELECT * FROM mascotas WHERE tipo = $1',
      ['apadrinar']
    );

    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('❌ Error al obtener apadrinamientos:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
