import CustomProductForm from "./CustomProductForm";
import { useLanguage } from "../i18n";

export default function CustomProductModal({ open, onClose, onSubmit }) {
  const { t } = useLanguage();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="presentation">
      <div className="absolute inset-0 bg-charcoal/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="modal-panel relative bg-white border border-line max-w-2xl w-full max-h-[min(92vh,46rem)] overflow-y-auto p-6 sm:p-7 shadow-[0_24px_60px_rgba(16,21,19,0.25)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-product-title"
      >
        <button
          type="button"
          className="absolute top-3.5 right-3.5 h-8 w-8 inline-flex items-center justify-center text-mute hover:text-ink hover:bg-paper transition-colors"
          onClick={onClose}
          aria-label={t("cancel")}
        >
          ×
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 mb-2">
          {t("customItem")}
        </p>
        <h3 id="custom-product-title" className="font-display text-2xl font-semibold text-brand-800 leading-tight">
          {t("addCustomProduct")}
        </h3>
        <p className="mt-2 text-sm text-mute leading-relaxed">{t("customProductHint")}</p>
        <div className="mt-5">
          <CustomProductForm
            compact
            onSubmit={(payload) => {
              onSubmit(payload);
              onClose();
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
