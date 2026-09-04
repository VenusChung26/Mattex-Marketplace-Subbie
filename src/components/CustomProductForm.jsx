import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../i18n";
import { extractSpecItems, fileToAttachment } from "../lib/extractSpec";
import AttachmentLinks from "./AttachmentLinks";
import { QtyStepper } from "./ProductCard";
import { getCategoryDefs } from "../lib/store";

const emptyForm = { name: "", description: "", qty: 1, image: "", category: "", attachments: [] };
const IMAGE_MAX_BYTES = 800 * 1024;
const IMAGE_MAX_SIDE = 1200;
export const SHOW_CUSTOM_FILE_UPLOADS = true;
export const SHOW_CUSTOM_IMAGE_UPLOAD = true;
export const SPEC_FILE_ACCEPT = ".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx";
export const SPEC_FILE_EXT = /\.(jpe?g|png|pdf|docx?|xlsx?)$/i;

export function isAllowedSpecFile(file) {
  return SPEC_FILE_EXT.test(String(file?.name || ""));
}

function dataUrlBytes(dataUrl) {
  const base64 = String(dataUrl || "").split(",")[1] || "";
  return Math.floor((base64.length * 3) / 4);
}

function compressImageFile(file, maxBytes = IMAGE_MAX_BYTES) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, IMAGE_MAX_SIDE / Math.max(img.width, img.height, 1));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("bad_image"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      let quality = 0.86;
      let dataUrl = canvas.toDataURL("image/jpeg", quality);
      while (dataUrlBytes(dataUrl) > maxBytes && quality > 0.4) {
        quality -= 0.08;
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      }
      if (dataUrlBytes(dataUrl) > maxBytes) reject(new Error("too_large"));
      else resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("bad_image"));
    };
    img.src = objectUrl;
  });
}

function detailsFromExtracted(items) {
  const rows = (items || []).filter((item) => item.name || item.spec || item.category);
  return rows
    .map((item) => {
      const bits = [item.category, item.spec].filter(Boolean);
      if (rows.length > 1 && item.name) {
        return bits.length ? `${item.name}: ${bits.join(" · ")}` : item.name;
      }
      return bits.join(" · ") || item.name || "";
    })
    .filter(Boolean)
    .join("\n");
}

export default function CustomProductForm({
  mode = "add",
  initial = emptyForm,
  onSubmit,
  onCancel,
  compact = false,
}) {
  const { t } = useLanguage();
  const categories = useMemo(() => getCategoryDefs(), []);
  const extractTokenRef = useRef(0);
  const imageInputRef = useRef(null);
  const [name, setName] = useState(initial.name || "");
  const [description, setDescription] = useState(initial.description || "");
  const [qty, setQty] = useState(initial.qty || 1);
  const [image, setImage] = useState(initial.image || "");
  const [category, setCategory] = useState(initial.category || "");
  const [attachments, setAttachments] = useState(initial.attachments || []);
  const [extracting, setExtracting] = useState(false);
  const [filledFrom, setFilledFrom] = useState("");
  const [error, setError] = useState("");
  const [imageOver, setImageOver] = useState(false);

  useEffect(() => {
    extractTokenRef.current += 1;
    setName(initial.name || "");
    setDescription(initial.description || "");
    setQty(initial.qty || 1);
    setImage(initial.image || "");
    setCategory(initial.category || "");
    setAttachments(Array.isArray(initial.attachments) ? initial.attachments : []);
    setExtracting(false);
    setFilledFrom("");
    setError("");
  }, [initial.name, initial.description, initial.qty, initial.image, initial.category, mode]);

  async function handleImage(file) {
    if (!file) return;
    if (!String(file.type || "").startsWith("image/")) return;
    try {
      const dataUrl = await compressImageFile(file);
      setImage(dataUrl);
      setError("");
    } catch {
      setError(t("imageTooLarge"));
    }
  }

  async function handleSpecFiles(list) {
    const picked = Array.from(list || []).slice(0, 8);
    const files = picked.filter(isAllowedSpecFile);
    setFilledFrom("");
    if (!files.length) {
      setError(t("specFileTypeError"));
      return;
    }

    const token = ++extractTokenRef.current;
    setExtracting(true);
    setError("");
    try {
      const next = [];
      for (const file of files) {
        next.push(await fileToAttachment(file));
      }
      if (token !== extractTokenRef.current) return;
      setAttachments(next);
    } catch (err) {
      if (token !== extractTokenRef.current) return;
      setError(err?.code === "too_large" ? t("specFileTooLarge") : t("extractFailed"));
      setExtracting(false);
      return;
    }
    try {
      const extracted = await extractSpecItems({ files, categories });
      if (token !== extractTokenRef.current) return;
      const usable = extracted.filter((item) => item.name || item.spec || item.category);
      const first = usable[0] || extracted[0];
      if (first?.name) {
        setName((prev) => (prev.trim() ? prev : first.name));
      }
      const detail = detailsFromExtracted(usable.length ? usable : extracted);
      if (detail) setDescription(detail);
      if (first?.category) setCategory(first.category);
      setFilledFrom(files[0]?.name || "");
    } catch {
      if (token !== extractTokenRef.current) return;
      setError(t("extractFailed"));
    } finally {
      if (token === extractTokenRef.current) setExtracting(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (extracting) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("customNameRequired"));
      return;
    }
    const nextQty = Math.floor(Number(qty));
    if (!Number.isFinite(nextQty) || nextQty < 1) {
      setError(t("customQtyInvalid"));
      return;
    }
    setError("");
    onSubmit({
      name: trimmed,
      description: description.trim(),
      qty: nextQty,
      image,
      category,
      attachments,
    });
    if (mode === "add") {
      setName("");
      setDescription("");
      setQty(1);
      setImage("");
      setCategory("");
      setAttachments([]);
      setFilledFrom("");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        compact
          ? "space-y-3"
          : "bg-white border border-line rounded-xl p-4 sm:p-5 space-y-3"
      }
    >
      {!compact ? (
        <div>
          <p className="text-sm font-semibold text-brand-800">
            {mode === "edit" ? t("editCustomProduct") : t("addCustomProduct")}
          </p>
          <p className="mt-0.5 text-xs text-mute">{t("customProductHint")}</p>
        </div>
      ) : null}

      {SHOW_CUSTOM_FILE_UPLOADS ? (
      <div className="rounded-lg border border-dashed border-brand-200 bg-brand-50/50 p-3 space-y-2">
        <label className="block">
          <span className="block text-sm font-semibold text-ink mb-1">
            {t("uploadSpecForItem")}{" "}
            <span className="font-normal text-mute">({t("optional")})</span>
          </span>
          <input
            type="file"
            multiple
            accept={SPEC_FILE_ACCEPT}
            disabled={extracting}
            onChange={(e) => {
              handleSpecFiles(e.target.files);
              e.target.value = "";
            }}
            className="block w-full text-sm text-ink file:mr-3 file:border file:border-line file:bg-white file:px-3 file:py-1.5 file:text-sm"
          />
        </label>
        <AttachmentLinks files={attachments} className="text-xs text-brand-700" />
        <p className="text-xs text-brand-800">
            {extracting
              ? t("extracting")
              : filledFrom
                ? t("filledFromSpec", { name: filledFrom })
                : t("specAiHint")}
            {extracting || filledFrom ? null : (
              <span className="mt-0.5 block text-mute">{t("specFileTypes")}</span>
            )}
        </p>
      </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_6.5rem] gap-3">
        <label className="block min-w-0">
          <span className="block text-sm font-semibold text-ink mb-1">
            {t("customProductName")} <span className="text-brand-600">*</span>
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("customProductNamePlaceholder")}
            className="field-input"
            autoComplete="off"
            required
          />
        </label>
        <div className="block">
          <QtyStepper
            value={Math.max(1, Number(qty) || 1)}
            min={1}
            onChange={setQty}
            size="card"
            t={t}
          />
        </div>
      </div>

      <label className="block">
        <span className="block text-sm font-medium text-ink mb-1">
          {t("customProductDesc")}{" "}
          <span className="font-normal text-mute">({t("optional")})</span>
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("customProductDescPlaceholder")}
          rows={2}
          className="field-input resize-y"
        />
        <span className="mt-1 block text-xs text-mute">{t("customSpecHint")}</span>
      </label>

      {SHOW_CUSTOM_IMAGE_UPLOAD ? (
      <div>
        <p className="text-sm font-medium text-ink">
          {t("uploadCustomImage")}{" "}
          <span className="font-normal text-mute">({t("optional")})</span>
        </p>
        <div
          className={`mt-1 flex items-center gap-3 rounded-lg border border-dashed ${
            compact ? "p-2.5" : "p-3"
          } ${imageOver ? "border-brand-600 bg-brand-50" : "border-line bg-paper/60"}`}
          onDragOver={(e) => {
            e.preventDefault();
            setImageOver(true);
          }}
          onDragLeave={() => setImageOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setImageOver(false);
            handleImage(e.dataTransfer.files?.[0]);
          }}
        >
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className={`relative shrink-0 overflow-hidden border border-line bg-white ${
              compact ? "h-14 w-14" : "h-20 w-20"
            }`}
            aria-label={image ? t("replaceProductImage") : t("chooseProductImage")}
          >
            {image ? (
              <img src={image} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-light text-mute">
                +
              </span>
            )}
          </button>
          <div className="min-w-0">
            <button
              type="button"
              className="text-sm font-semibold text-brand-700 hover:text-brand-800"
              onClick={() => imageInputRef.current?.click()}
            >
              {image ? t("replaceProductImage") : t("chooseProductImage")}
            </button>
            <p className="mt-0.5 text-xs text-mute">{t("dropImageHere")}</p>
            {image ? (
              <button
                type="button"
                className="mt-1 text-xs font-semibold text-mute hover:text-brand-700"
                onClick={() => setImage("")}
              >
                {t("remove")}
              </button>
            ) : (
              <p className="mt-1 text-xs text-mute">{t("imageOptional")}</p>
            )}
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              handleImage(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      </div>
      ) : null}

      {error ? <p className="text-sm text-red-700 font-medium">{error}</p> : null}
      <div className="flex flex-wrap gap-2 pt-1">
        <button type="submit" className="btn-primary !px-4 !py-2.5" disabled={extracting}>
          {extracting ? t("extracting") : mode === "edit" ? t("saveChanges") : t("addToCart")}
        </button>
        {onCancel ? (
          <button type="button" className="btn-soft !px-4 !py-2.5" onClick={onCancel}>
            {t("cancel")}
          </button>
        ) : null}
      </div>
    </form>
  );
}
