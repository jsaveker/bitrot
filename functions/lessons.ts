import lessons from "../src/generated/lessons.json";
// Compatibility endpoint. Both browser experiences use the same build-generated content.
export const onRequestGet: PagesFunction = () =>
  new Response(
    JSON.stringify(lessons.map(({ id, title }) => ({ id, title }))),
    { headers: { "Content-Type": "application/json" } },
  );
export const onRequestPost: PagesFunction = () =>
  new Response(JSON.stringify({ error: "Method Not Allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
