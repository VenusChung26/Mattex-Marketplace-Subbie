import { buildQuotePdf } from "./quotePdf.js";
import { enrichCartLine, formatPrice } from "./store.js";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || "");
      const comma = value.indexOf(",");
      resolve(comma >= 0 ? value.slice(comma + 1) : value);
    };
    reader.onerror = () => reject(new Error("Failed to read quotation PDF"));
    reader.readAsDataURL(file);
  });
}

function pdfItems(rows) {
  return rows.map((line, i) => ({
    index: i + 1,
    name: String(line.name || (line.custom ? "自訂產品" : line.productId) || "-").trim(),
    sku: line.productNo || (line.custom ? "自訂" : line.productId) || "-",
    qty: `${line.qty}${line.unit ? ` ${line.unit}` : ""}`,
    price: line.unitPrice != null ? formatPrice(line.unitPrice) : "待報價",
    spec: line.custom ? String(line.description || "").trim() : String(line.description || ""),
    attachments: "",
    image: line.image || "",
  }));
}

function tmsLines(rows) {
  return rows.map((line) => ({
    name: line.name,
    productNo: line.productNo || "",
    qty: line.qty,
    unit: line.unit || "",
    description: line.description || "",
    requestedUnitPrice: line.requestedUnitPrice != null ? line.requestedUnitPrice : null,
    remark: line.remark || "",
    custom: Boolean(line.custom),
  }));
}

export async function submitRfqToTms({ kind, rfq, lines }) {
  const rows = (Array.isArray(lines) ? lines : [])
    .map((line) => {
      const enriched = enrichCartLine(line);
      if (!enriched) return null;
      return {
        ...enriched,
        requestedUnitPrice: line.requestedUnitPrice != null ? line.requestedUnitPrice : null,
        remark: line.remark || "",
      };
    })
    .filter(Boolean);
  if (!rows.length) throw new Error("No lines selected");
  const pdf = await buildQuotePdf({ kind, items: pdfItems(rows), refNo: rfq?.id });
  const pdfBase64 = await fileToBase64(pdf.file);
  const res = await fetch("/api/tms-submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: kind === "buy" ? "buy" : "quote",
      rfq: {
        id: rfq?.id || "",
        project: rfq?.project || "",
        note: rfq?.note || "",
        responseDate: rfq?.responseDate || "",
        deliveryDate: rfq?.deliveryDate || "",
        address: rfq?.address || "",
      },
      lines: tmsLines(rows),
      pdfBase64,
      pdfFilename: pdf.filename,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || "TMS submit failed");
  }
  return data;
}
