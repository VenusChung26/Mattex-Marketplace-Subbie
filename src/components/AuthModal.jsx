import { Link } from "react-router-dom";
import { useLanguage } from "../i18n";
import { withLocale } from "../lib/locale";
import MattexChainInvite from "./MattexChainInvite";

export default function AuthModal({ open, onClose }) {
  const { t, lang } = useLanguage();
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
        <MattexChainInvite className="mt-6" />
        <p className="mt-5 text-sm text-mute">
          {t("alreadyAccount")}{" "}
          <Link to={withLocale(lang, "/login")} className="font-semibold text-brand-600 hover:underline">
            {t("login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
