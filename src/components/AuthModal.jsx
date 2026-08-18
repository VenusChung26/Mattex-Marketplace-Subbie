import { Link } from "react-router-dom";
import { useLanguage } from "../i18n";

export default function AuthModal({ open, onClose }) {
  const { t } = useLanguage();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <div className="absolute inset-0 bg-charcoal/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="modal-panel relative bg-white border border-line max-w-md w-full p-7 shadow-[0_24px_60px_rgba(16,21,19,0.25)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          type="button"
          className="absolute top-3.5 right-3.5 h-8 w-8 inline-flex items-center justify-center text-mute hover:text-ink hover:bg-paper transition-colors"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 mb-2">{t("almostThere")}</p>
        <h3 id="auth-modal-title" className="font-display text-2xl font-semibold text-brand-800 leading-tight">
          {t("signInToBuild")}
        </h3>
        <p className="mt-3 text-sm text-mute leading-relaxed">{t("authModalBody")}</p>
        <div className="mt-7 grid grid-cols-1 gap-2.5">
          <Link to="/signup" className="btn-primary !py-3">
            {t("createAccount")}
          </Link>
          <Link to="/login" className="btn-soft !py-3 !border-brand-600 !text-brand-700">
            {t("login")}
          </Link>
        </div>
      </div>
    </div>
  );
}
