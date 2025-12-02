export function GET() {
  return new Response("Logout", {
    status: 200,
    headers: {
      "Set-Cookie": "user_id=; Path=/; Max-Age=0;",
    },
  });
}
