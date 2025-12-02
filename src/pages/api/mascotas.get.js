import { pool } from '../../../db.js';

export async function get() {
  try {
    const result = await pool.query('SELECT * FROM mascotas WHERE disponible = true');
    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
