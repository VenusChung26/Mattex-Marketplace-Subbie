import { Children, cloneElement, isValidElement } from "react";
import { useLanguage } from "../i18n";

export function passwordChecks(password, confirmPassword) {
  const value = String(password || "");
  const confirm = String(confirmPassword || "");
  return {
    length: value.length >= 8,
    letter: /[A-Za-z]/.test(value),
    number: /\d/.test(value),
    match: confirm.length > 0 && value === confirm,
  };
}

export function RequiredMark() {
  return (
    <span className="text-brand-600" aria-hidden>
      *
    </span>
  );
}

function decorateControl(child, { error, locked }) {
  if (!isValidElement(child) || child.type === "datalist") return child;
  const extra = [
    child.props.className || "field-input",
    error ? "!border-red-500 ring-2 ring-red-200 bg-red-50" : "",
    locked ? "cursor-not-allowed border-[#c5ccc8] bg-[#e6eae7] text-mute opacity-100" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return cloneElement(child, {
    className: extra,
    "aria-invalid": error ? true : undefined,
    disabled: locked || child.props.disabled,
    readOnly: locked || child.props.readOnly,
  });
}

export function AccountField({
  label,
  required,
  hint,
  error,
  locked = false,
  lockedHint,
  className = "",
  children,
}) {
  const content = Children.map(children, (child) => decorateControl(child, { error, locked }));
  return (
    <label className={`block min-w-0 ${className}`.trim()}>
      <span className="mb-1.5 flex items-center justify-between gap-2">
        <span className={`text-sm font-medium ${locked ? "text-mute" : "text-ink"}`}>
          {label}
          {required ? (
            <>
              {" "}
              <RequiredMark />
            </>
          ) : null}
        </span>
        {locked && lockedHint ? (
          <span className="rounded bg-[#d8ddd9] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#4a534e]">
            {lockedHint}
          </span>
        ) : null}
      </span>
      {content}
      {error ? <span className="mt-1.5 block text-xs font-medium text-red-700">{error}</span> : null}
      {!error && hint ? <span className="mt-1.5 block text-xs text-mute leading-relaxed">{hint}</span> : null}
    </label>
  );
}

export function AccountSection({ title, description, children }) {
  return (
    <section className="rounded-xl border border-line bg-paper/40 p-4 sm:p-5">
      <header className="mb-4 border-b border-line pb-3">
        <h2 className="text-base font-semibold text-brand-800">{title}</h2>
        {description ? <p className="mt-1 text-xs text-mute leading-relaxed">{description}</p> : null}
      </header>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function CheckItem({ ok, label, metLabel, unmetLabel }) {
  return (
    <li
      className={`flex items-start gap-2.5 text-sm leading-snug pointer-events-none select-none ${
        ok ? "text-brand-800" : "text-mute"
      }`}
    >
      <span
        className={`mt-0.5 inline-flex h-[1.05rem] w-[1.05rem] shrink-0 items-center justify-center rounded-[3px] border ${
          ok ? "border-brand-700 bg-brand-700 text-white" : "border-[#b7c0bb] bg-white"
        }`}
        aria-hidden
      >
        {ok ? (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M2.2 6.2 L4.8 8.7 L9.8 3.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      <span>
        <span className="sr-only">{ok ? metLabel : unmetLabel}: </span>
        {label}
      </span>
    </li>
  );
}

export function PasswordChecklist({ password, confirmPassword, hasError, id }) {
  const { t } = useLanguage();
  const pwd = passwordChecks(password, confirmPassword);
  const lengthLabel =
    password && !pwd.length ? `${t("passwordReqLength")} · ${String(password).length}/8` : t("passwordReqLength");

  return (
    <div
      id={id}
      className={`sm:col-span-2 rounded-lg border px-3.5 py-3 ${
        hasError ? "border-red-300 bg-red-50" : "border-line bg-white"
      }`}
      role="status"
      aria-live="polite"
    >
      <p className="text-xs font-semibold text-ink">{t("passwordRequirements")}</p>
      <p className="mt-0.5 text-[11px] text-mute">{t("passwordLiveHint")}</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        <CheckItem ok={pwd.length} label={lengthLabel} metLabel={t("passwordReqMet")} unmetLabel={t("passwordReqUnmet")} />
        <CheckItem ok={pwd.letter} label={t("passwordReqLetter")} metLabel={t("passwordReqMet")} unmetLabel={t("passwordReqUnmet")} />
        <CheckItem ok={pwd.number} label={t("passwordReqNumber")} metLabel={t("passwordReqMet")} unmetLabel={t("passwordReqUnmet")} />
        <CheckItem ok={pwd.match} label={t("passwordReqMatch")} metLabel={t("passwordReqMet")} unmetLabel={t("passwordReqUnmet")} />
      </ul>
    </div>
  );
}

export function AccountFormCard({ children }) {
  return (
    <div className="bg-white border border-line rounded-2xl p-5 sm:p-8 shadow-[0_12px_40px_rgba(16,21,19,0.06)]">
      {children}
    </div>
  );
}

export function AccountFormHeader({ eyebrow, title, hint, showRequired }) {
  const { t } = useLanguage();
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600 mb-2">{eyebrow}</p>
          ) : null}
          <h1 className="reveal text-2xl sm:text-3xl font-bold text-brand-800 leading-tight">{title}</h1>
        </div>
        {showRequired ? (
          <p className="shrink-0 text-xs text-mute pt-1">
            <RequiredMark /> {t("requiredLegend")}
          </p>
        ) : null}
      </div>
      {hint ? <p className="mt-2 text-sm text-mute leading-relaxed">{hint}</p> : null}
    </div>
  );
}
