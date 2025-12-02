import { pool } from "./db.js";

export async function getUserFromSession(cookies) {
  const id = cookies.get("user_id")?.value;

  if (!id) return null;

  const result = await pool.query(
    "SELECT id, nombre, email FROM usuarios WHERE id = $1",
    [id]
  );

  return result.rows.length ? result.rows[0] : null;
}
