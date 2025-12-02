// GET - para pruebas
export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      mensaje: "GET /api/contacto/datos_adop funcionando"
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}

// POST - guardar datos
export async function POST({ request }) {
  try {
    const data = await request.json();
    const { nombre, email, mensaje } = data;

    if (!nombre || !email || !mensaje) {
      return new Response(
        JSON.stringify({ error: "Todos los campos son obligatorios" }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        mensaje: "Datos recibidos correctamente",
        datos: data
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Error al procesar POST",
        detalle: err.message
      }),
      { status: 500 }
    );
  }
}
