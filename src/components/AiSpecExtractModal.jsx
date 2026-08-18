import { useEffect, useState } from "react";
import { useLanguage } from "../i18n";
import { attachmentsFromFiles, extractSpecItems } from "../lib/extractSpec";

const emptyItem = () => ({
  id: `ex-new-${Date.now().toString(36)}`,
  name: "",
  category: "",
  spec: "",
});

export default function AiSpecExtractModal({
  open,
  onClose,
  categories,
  onSearch,
  initialFiles = [],
  confirmLabel,
  reviewHint,
}) {
  const { t } = useLanguage();
  const [step, setStep] = useState("source");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [files, setFiles] = useState([]);
  const [items, setItems] = useState([]);

  const fileKey = (initialFiles || []).map((file) => `${file.name}:${file.size}:${file.lastModified}`).join("|");

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    const picked = Array.from(initialFiles || []).slice(0, 8);
    setFiles(picked);
    setPasteText("");
    setError("");
    setItems([]);
    if (!picked.length) {
      setStep("source");
      setBusy(false);
      return undefined;
    }
    setStep("review");
    setBusy(true);
    extractSpecItems({ files: picked, text: "", categories })
      .then((extracted) => {
        if (cancelled) return;
        setItems(extracted);
        setBusy(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(t("extractFailed"));
        setBusy(false);
      });
    return () => {
      cancelled = true;
    };
    // Extract once per open + selected files, not on every t/categories identity change.
  }, [open, fileKey]);

  if (!open) return null;

  function onPickFiles(list) {
    const next = Array.from(list || []).slice(0, 8);
    setFiles(next);
    setError("");
  }

  async function runExtract() {
    if (!files.length && !pasteText.trim()) {
      setError(t("extractNeedSource"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const extracted = await extractSpecItems({ files, text: pasteText, categories });
      setItems(extracted);
      setStep("review");
    } catch {
      setError(t("extractFailed"));
    } finally {
      setBusy(false);
    }
  }

  function updateItem(id, patch) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function searchReviewed() {
    const ready = items.filter((item) => String(item.name || "").trim());
    if (!ready.length) {
      setError(t("extractNeedName"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const attachments = await attachmentsFromFiles(files, pasteText);
      onSearch({
        items: ready.map((item) => ({
          name: item.name.trim(),
          category: item.category || "",
          spec: String(item.spec || "").trim(),
        })),
        attachments,
      });
      onClose();
    } catch (err) {
      setError(err?.code === "too_large" ? t("specFileTooLarge") : t("extractFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="presentation">
      <div className="absolute inset-0 bg-charcoal/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="modal-panel relative bg-white border border-line max-w-2xl w-full max-h-[min(36rem,90vh)] overflow-y-auto p-6 sm:p-7 shadow-[0_24px_60px_rgba(16,21,19,0.25)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-extract-title"
      >
        <button
          type="button"
          className="absolute top-3.5 right-3.5 h-8 w-8 inline-flex items-center justify-center text-mute hover:text-ink hover:bg-paper"
          onClick={onClose}
          aria-label={t("cancel")}
        >
          ×
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 mb-2">
          {t("uploadSpec")}
        </p>
        <h3 id="ai-extract-title" className="font-display text-2xl font-semibold text-brand-800 leading-tight">
          {step === "review" ? t("reviewExtracted") : t("aiExtractTitle")}
        </h3>
        <p className="mt-2 text-sm text-mute leading-relaxed">
          {step === "review" ? reviewHint || t("reviewExtractedHint") : t("aiExtractHint")}
        </p>

        {step === "source" ? (
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="block text-sm font-semibold text-ink mb-1">{t("chooseFiles")}</span>
              <input
                type="file"
                multiple
                accept=".pdf,.txt,.csv,.doc,.docx,image/*"
                onChange={(e) => onPickFiles(e.target.files)}
                className="block w-full text-sm text-ink file:mr-3 file:border file:border-line file:bg-paper file:px-3 file:py-1.5 file:text-sm"
              />
              {files.length ? (
                <span className="mt-1 block text-xs text-mute">
                  {t("filesSelected", { n: files.length })} · {files.map((f) => f.name).join(", ")}
                </span>
              ) : (
                <span className="mt-1 block text-xs text-mute">{t("dropOrBrowse")}</span>
              )}
            </label>
            <label className="block">
              <span className="block text-sm font-semibold text-ink mb-1">{t("pasteSpec")}</span>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={t("pasteSpecPlaceholder")}
                rows={5}
                className="field-input resize-y"
              />
            </label>
            {error ? <p className="text-sm text-red-700 font-medium">{error}</p> : null}
            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" className="btn-primary !px-5" disabled={busy} onClick={runExtract}>
                {busy ? t("extracting") : t("extractWithAi")}
              </button>
              <button type="button" className="btn-soft !px-5" onClick={onClose}>
                {t("cancel")}
              </button>
            </div>
          </div>
        ) : busy ? (
          <p className="mt-5 text-sm text-mute">{t("extracting")}</p>
        ) : (
          <div className="mt-5 space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="border border-line p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-mute">
                    {t("extractedItem")} {index + 1}
                  </p>
                  <button
                    type="button"
                    className="text-xs font-semibold text-mute hover:text-brand-700"
                    onClick={() => setItems((prev) => prev.filter((row) => row.id !== item.id))}
                  >
                    {t("removeExtractedLine")}
                  </button>
                </div>
                <label className="block">
                  <span className="block text-xs font-semibold text-ink mb-1">{t("extractName")}</span>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                    className="field-input"
                  />
                </label>
                <div className="grid sm:grid-cols-2 gap-2">
                  <label className="block">
                    <span className="block text-xs font-semibold text-ink mb-1">{t("extractCategory")}</span>
                    <select
                      value={item.category}
                      onChange={(e) => updateItem(item.id, { category: e.target.value })}
                      className="field-input"
                    >
                      <option value="">{t("allCategories")}</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="block text-xs font-semibold text-ink mb-1">{t("extractSpec")}</span>
                    <input
                      type="text"
                      value={item.spec}
                      onChange={(e) => updateItem(item.id, { spec: e.target.value })}
                      className="field-input"
                    />
                  </label>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="text-sm font-semibold text-brand-700"
              onClick={() => setItems((prev) => [...prev, emptyItem()])}
            >
              + {t("addExtractedLine")}
            </button>
            {error ? <p className="text-sm text-red-700 font-medium">{error}</p> : null}
            <div className="flex flex-wrap gap-2 pt-2">
              <button type="button" className="btn-primary !px-5" onClick={searchReviewed}>
                {confirmLabel || t("searchExtracted")}
              </button>
              <button type="button" className="btn-soft !px-5" onClick={() => setStep("source")}>
                {t("back")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
