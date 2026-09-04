import { handleUpload } from "@vercel/blob/client";

export async function handleRfqBlobUpload(body, request) {
  return handleUpload({
    body,
    request,
    onBeforeGenerateToken: async (pathname) => {
      if (!String(pathname || "").startsWith("rfq/")) {
        throw new Error("Invalid upload path");
      }
      return {
        allowedContentTypes: [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
        ],
        addRandomSuffix: true,
        maximumSizeInBytes: 20 * 1024 * 1024,
      };
    },
  });
}

export async function POST(request) {
  const body = await request.json();
  try {
    const json = await handleRfqBlobUpload(body, request);
    return Response.json(json);
  } catch (error) {
    console.error("blob-upload", error);
    return Response.json({ error: error?.message || "upload failed" }, { status: 400 });
  }
}
