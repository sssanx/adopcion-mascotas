import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const POST = async ({ request }) => {
  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({
      error: 'JSON inválido en el cuerpo de la solicitud'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const message = body.mensaje || body.message;
  if (!message || typeof message !== 'string') {
    return new Response(JSON.stringify({
      error: 'El mensaje es requerido y debe ser un texto.'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Llamada a OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [{ role: 'user', content: message }]
    });

    const reply = completion.choices[0].message.content;

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (err) {
    console.error('Error de OpenAI:', err);
    
    return new Response(JSON.stringify({
      reply: `Recibí tu mensaje pero ocurrió un error al procesarlo. Dijiste: "${message}"`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
