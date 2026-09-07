import { submitInboundRfq } from "./tms-client.js";

export async function handleTmsSubmit(body) {
  return submitInboundRfq(body || {});
}

export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  try {
    const json = await handleTmsSubmit(body);
    return Response.json(json);
  } catch (error) {
    console.error("tms-submit", error?.message || error);
    return Response.json({ error: error?.message || "TMS submit failed" }, { status: 400 });
  }
}
