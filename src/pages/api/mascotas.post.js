import { pool } from '../../db/db';

export async function post({ request }) {
  try {
    const data = await request.json();
    const { nombre, raza, edad, descripcion, imagen_url } = data;

    const result = await pool.query(
      'INSERT INTO mascotas(nombre, raza, edad, descripcion, imagen_url) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [nombre, raza, edad, descripcion, imagen_url]
    );

    return new Response(JSON.stringify(result.rows[0]), {
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
