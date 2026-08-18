/**
 * PROTOTYPE — custom-product composer placements on /rfq?variant=
 * Question: Where should adding a custom product live so the quote list and submit bar stay usable?
 * A Inline in list · B Modal overlay · C Right drawer
 */
import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { draftTotals, formatPrice, getCategoryDefs, SAMPLE_PROJECTS } from "../../lib/store";
import CustomProductForm from "../../components/CustomProductForm";
import AiSpecExtractModal from "../../components/AiSpecExtractModal";
import AttachmentLinks from "../../components/AttachmentLinks";
import { useLanguage } from "../../i18n";

export const RFQ_PROTOTYPE_VARIANTS = [
  { key: "A", name: "Inline in list" },
  { key: "B", name: "Modal overlay" },
  { key: "C", name: "Right drawer" },
];

export const CUSTOM_PLACEMENT = {
  A: "inline",
  B: "modal",
  C: "drawer",
};

function GreenProductTag({ t, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 bg-[#1f8a45] text-white text-[10px] font-bold uppercase tracking-[0.08em] px-1.5 py-0.5 shrink-0 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3 w-3 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
      {t("greenBadge")}
    </span>
  );
}

function IntentBadge({ intent, t }) {
  if (!intent) return null;
  const buy = intent === "buy";
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 ${
        buy ? "text-brand-800 bg-brand-100" : "text-brand-700 bg-brand-50"
      }`}
    >
      {buy ? t("intentBuy") : t("intentQuote")}
    </span>
  );
}

function isBuyLine(line) {
  return line.intent === "buy";
}

function splitDraftLines(lines) {
  const buyLines = [];
  const quoteLines = [];
  for (const line of lines || []) {
    if (isBuyLine(line)) buyLines.push(line);
    else quoteLines.push(line);
  }
  return { buyLines, quoteLines };
}

function selectedFor(lines, selectedIds) {
  const set = new Set((lines || []).map((l) => String(l.productId)));
  return (selectedIds || []).filter((id) => set.has(String(id)));
}

function hasLowerAsk(line) {
  return (
    line?.unitPrice != null &&
    line?.requestedUnitPrice != null &&
    Number(line.requestedUnitPrice) > 0 &&
    Number(line.requestedUnitPrice) < Number(line.unitPrice)
  );
}

function LineMoney({ line, t, compact = false }) {
  if (line.unitPrice == null) return compact ? "—" : <span className="text-mute">—</span>;
  if (hasLowerAsk(line)) {
    return (
      <span className={compact ? "text-right" : "block text-right"}>
        <span className={`${compact ? "block text-xs" : "block text-xs"} font-medium text-mute line-through`}>
          {formatPrice(line.unitPrice * line.qty)}
        </span>
        <span className="font-semibold text-brand-700">{formatPrice(line.requestedUnitPrice * line.qty)}</span>
        {!compact ? <span className="block text-[10px] font-medium text-mute">{t("requestedTotal")}</span> : null}
      </span>
    );
  }
  return compact ? formatPrice(line.unitPrice * line.qty) : formatPrice(line.unitPrice * line.qty);
}

function IntentDraftSections(props) {
  const {
    lines,
    selectedIds,
    toggleId,
    toggleSection,
    setLineQty,
    removeLine,
    onContinueKind,
    formError,
    formErrorKind,
    showActions = true,
  } = props;
  const { t } = useLanguage();
  const { buyLines } = splitDraftLines(lines);
  const buySelected = selectedFor(buyLines, selectedIds);
  const buyTotals = draftTotals({ lines: buyLines }, buySelected);
  const buyAll = buyLines.length > 0 && buySelected.length === buyLines.length;

  return (
    <section className="relative bg-white border border-line rounded-xl overflow-hidden flex flex-col min-h-[14rem]">
      <LinesList
        toggleId={toggleId}
        setLineQty={setLineQty}
        removeLine={removeLine}
        embedded
        showIntent={false}
        lines={buyLines}
        selectedIds={buySelected}
        allSelected={buyAll}
        toggleAll={() => toggleSection(buyLines.map((l) => String(l.productId)))}
        title={t("sectionBuy")}
        subtitle={t("sectionBuyHint")}
        selectAllLabel={t("selectAllBuy")}
        allowCustom={false}
        tone="buy"
        emptyMessage={t("emptyBuySection")}
      />
      {showActions && buyLines.length ? (
        <div className="mt-auto px-4 sm:px-5 py-4 border-t border-line bg-brand-50/40 shrink-0">
          <SubmitBar
            bare
            selectedIds={buySelected}
            selectedTotals={buyTotals}
            formError={formErrorKind === "buy" ? formError : ""}
            onSubmit={() => onContinueKind("buy")}
            submitLabel={t("createOrder")}
          />
        </div>
      ) : null}
    </section>
  );
}

export function ConfirmRfqView(props) {
  const { confirmKind, lines, selectedIds, onSubmitKind, setConfirmKind, formError } = props;
  const { t } = useLanguage();
  const group = (lines || []).filter((line) =>
    confirmKind === "buy" ? line.intent === "buy" : line.intent !== "buy"
  ).filter((line) => selectedIds.includes(String(line.productId)));
  const groupTotals = draftTotals({ lines: group }, group.map((l) => String(l.productId)));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10 pb-28">
      <button
        type="button"
        onClick={() => setConfirmKind(null)}
        className="text-sm font-semibold text-brand-700 hover:text-brand-800"
      >
        ← {t("confirmPageBack")}
      </button>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-brand-600">{t("rfqDraft")}</p>
      <h1 className="reveal mt-1 text-2xl sm:text-3xl font-bold text-brand-800">{t("confirmPageTitle")}</h1>
      <p className="mt-2 text-sm text-mute">
        {confirmKind === "buy" ? t("confirmPageHintBuy") : t("confirmPageHintQuote")}
      </p>

      <section className="mt-6 bg-white border border-line rounded-xl overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-line bg-brand-50/80">
          <h2 className="text-base sm:text-lg font-bold text-brand-800">
            {confirmKind === "buy" ? t("sectionBuy") : t("sectionQuote")}
          </h2>
          <p className="mt-0.5 text-xs text-mute">{t("selectedProducts")}</p>
        </div>
        <ul className="divide-y divide-line">
          {group.map((l) => (
            <li key={l.productId} className="px-4 sm:px-5 py-3 flex justify-between gap-3 text-sm">
              <span>
                <span className="font-semibold text-ink">{l.name}</span>
                <span className="text-mute"> × {l.qty}</span>
                {l.green ? (
                  <span className="ml-1.5 align-middle">
                    <GreenProductTag t={t} />
                  </span>
                ) : null}
                {l.custom ? <span className="text-mute"> · {t("customItem")}</span> : null}
                {hasLowerAsk(l) ? (
                  <span className="block text-xs font-normal text-mute mt-0.5">
                    {t("listedPrice")} {formatPrice(l.unitPrice)} · {t("requestedPrice")} {formatPrice(l.requestedUnitPrice)}
                  </span>
                ) : null}
                <AttachmentLinks files={l.attachments} />
              </span>
              <span className="font-semibold shrink-0 text-right">
                <LineMoney line={l} t={t} compact />
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 bg-white border border-line rounded-xl p-4 sm:p-5 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-brand-800">{t("confirmDetails")}</h2>
        <MetaForm {...props} compact />
        <SubmitBar
          bare
          selectedIds={group.map((l) => String(l.productId))}
          selectedTotals={groupTotals}
          formError={formError}
          onSubmit={() => onSubmitKind(confirmKind)}
          submitLabel={confirmKind === "buy" ? t("confirmBuyCreateRfq") : t("submitQuoteRfq")}
        />
      </section>
    </div>
  );
}

export function VariantA(props) {
  const { t } = useLanguage();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10 pb-28">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{t("rfqDraft")}</p>
      <h1 className="reveal mt-1 text-2xl sm:text-3xl font-bold text-brand-800">{t("reviewQuote")}</h1>
      <p className="mt-2 text-sm text-mute">{t("reviewQuoteHint")}</p>
      <div className="mt-6">
        <IntentDraftSections {...props} />
      </div>
    </div>
  );
}

export function VariantB(props) {
  const {
    lines,
    selectedIds,
    selectedTotals,
    formError,
    formErrorKind,
    onContinueKind,
  } = props;
  const { t } = useLanguage();
  const { buyLines } = splitDraftLines(lines);
  const buySelected = selectedFor(buyLines, selectedIds);
  const buyTotals = draftTotals({ lines: buyLines }, buySelected);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10 pb-28">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">RFQ workspace</p>
          <h1 className="reveal mt-1 text-2xl sm:text-3xl font-bold text-brand-800">Build this quote</h1>
        </div>
        <p className="text-sm text-mute">
          {selectedIds.length}/{lines.length} selected · {formatPrice(selectedTotals.pricedSubtotal)}
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.9fr)] gap-5 items-start">
        <IntentDraftSections {...props} showActions={false} />

        <aside className="bg-white border border-line rounded-xl p-5 lg:sticky lg:top-20 space-y-4">
          <h2 className="font-display text-xl font-semibold text-brand-800">{t("confirmPageTitle")}</h2>
          <p className="text-sm text-mute">{t("reviewQuoteHint")}</p>
          <div className="pt-3 border-t border-line space-y-4">
            <div>
              <p className="text-xs text-mute uppercase tracking-wide">{t("sectionBuy")}</p>
              <p className="text-xl font-bold text-brand-600 mt-1">{formatPrice(buyTotals.pricedSubtotal)}</p>
              {formErrorKind === "buy" && formError ? (
                <p className="mt-2 text-sm text-red-700 font-medium">{formError}</p>
              ) : null}
              <button
                type="button"
                onClick={() => onContinueKind("buy")}
                disabled={buySelected.length === 0}
                className="btn-primary w-full !py-3 mt-3 disabled:opacity-45"
              >
                {t("createOrder")}
              </button>
            </div>
            <Link to="/#products" className="btn-soft w-full !py-2.5">
              {t("keepShopping")}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function VariantC(props) {
  const {
    lines,
    selectedIds,
    selectedTotals,
    responseDate,
    deliveryDate,
    deliveryMode,
    deliveryLots,
    project,
    address,
    canonicalCategory,
    acceptSubstitutes,
    note,
    formError,
    onSubmitKind,
    setFormError,
    wizardStep,
    setWizardStep,
  } = props;
  const { t } = useLanguage();

  const steps = [
    { id: 1, label: "Select" },
    { id: 2, label: "Details" },
    { id: 3, label: "Submit" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10 pb-28">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">RFQ Draft</p>
      <h1 className="reveal mt-1 text-2xl sm:text-3xl font-bold text-brand-800">Create RFQ</h1>

      <ol className="mt-6 flex gap-2">
        {steps.map((s) => (
          <li key={s.id} className="flex-1">
            <button
              type="button"
              onClick={() => setWizardStep(s.id)}
              className={`w-full text-left px-3 py-2.5 border text-sm font-semibold transition-colors ${
                wizardStep === s.id
                  ? "bg-brand-600 text-white border-brand-600"
                  : wizardStep > s.id
                    ? "bg-brand-50 text-brand-800 border-brand-200"
                    : "bg-white text-mute border-line"
              }`}
            >
              <span className="text-[10px] uppercase tracking-wide opacity-80">Step {s.id}</span>
              <span className="block">{s.label}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className={wizardStep === 1 ? "mt-5" : "mt-5 bg-white border border-line rounded-xl p-5 sm:p-6"}>
        {wizardStep === 1 ? (
          <>
            <p className="text-sm text-mute mb-4">{t("reviewQuoteHint")}</p>
            <IntentDraftSections {...props} showActions={false} />
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className="btn-primary !px-5"
                disabled={selectedIds.length === 0}
                onClick={() => setWizardStep(2)}
              >
                Continue · {selectedIds.length} selected
              </button>
            </div>
          </>
        ) : null}

        {wizardStep === 2 ? (
          <>
            <p className="text-sm text-mute mb-4">{t("reviewQuoteHint")}</p>
            <MetaForm {...props} />
            <div className="mt-5 flex justify-between gap-2">
              <button type="button" className="btn-soft !px-5" onClick={() => setWizardStep(1)}>
                Back
              </button>
              <button type="button" className="btn-primary !px-5" onClick={() => setWizardStep(3)}>
                Review
              </button>
            </div>
          </>
        ) : null}

        {wizardStep === 3 ? (
          <>
            <p className="text-sm text-mute mb-4">Confirm before sending.</p>
            <ul className="divide-y divide-line border-y border-line text-sm">
              {lines
                .filter((l) => selectedIds.includes(String(l.productId)))
                .map((l) => (
                  <li key={l.productId} className="py-3 flex justify-between gap-3">
                    <span>
                      {l.name} × {l.qty}
                      {l.intent === "buy" ? " · buy" : " · quote"}
                      {l.custom ? " · custom" : ""}
                    </span>
                    <span className="text-mute">
                      <LineMoney line={l} t={t} compact />
                    </span>
                  </li>
                ))}
            </ul>
            <dl className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-mute">{t("quotationDeadline")}</dt>
                <dd className="font-medium">{responseDate || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-mute">{t("requestDeliveryDate")}</dt>
                <dd className="font-medium">{deliveryDate || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-mute">{t("deliveryMode")}</dt>
                <dd className="font-medium">
                  {deliveryMode === "partial" ? t("deliveryModePartial") : t("deliveryModeOneTime")}
                </dd>
              </div>
              {deliveryMode === "partial" && (deliveryLots || []).length ? (
                <div className="sm:col-span-2 space-y-1.5">
                  {(deliveryLots || []).map((lot, index) => (
                    <div key={`review-lot-${index}`}>
                      <dt className="text-xs uppercase tracking-wide text-mute">
                        {t("deliveryLotLabel", { n: index + 1 })}
                      </dt>
                      <dd className="font-medium">
                        {lot.date || "—"}
                        {lot.note ? ` · ${lot.note}` : ""}
                      </dd>
                    </div>
                  ))}
                </div>
              ) : null}
              <div>
                <dt className="text-xs uppercase tracking-wide text-mute">{t("projectName")}</dt>
                <dd className="font-medium">{project || t("filterProjectUnassigned")}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-mute">{t("canonicalCategory")}</dt>
                <dd className="font-medium">{canonicalCategory || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-mute">{t("siteAddress")}</dt>
                <dd className="font-medium">{address || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-mute">{t("substitutesLabel")}</dt>
                <dd className="font-medium">
                  {acceptSubstitutes ? t("substitutesAccepted") : t("substitutesNotAccepted")}
                </dd>
              </div>
              {note ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-mute">{t("noteLabel")}</dt>
                  <dd className="font-medium">{note}</dd>
                </div>
              ) : null}
            </dl>
            <p className="mt-4 text-lg font-bold text-brand-700">
              Subtotal {formatPrice(selectedTotals.pricedSubtotal)}
            </p>
            {formError ? <p className="mt-2 text-sm text-red-700 font-medium">{formError}</p> : null}
            <div className="mt-5 flex justify-between gap-2">
              <button type="button" className="btn-soft !px-5" onClick={() => setWizardStep(2)}>
                Back
              </button>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  className="btn-primary !px-5"
                  disabled={!lines.some((l) => l.intent === "buy" && selectedIds.includes(String(l.productId)))}
                  onClick={() => onSubmitKind("buy")}
                >
                  {t("confirmBuyCreateRfq")}
                </button>
                <button
                  type="button"
                  className="btn-primary !px-5"
                  disabled={!lines.some((l) => l.intent !== "buy" && selectedIds.includes(String(l.productId)))}
                  onClick={() => onSubmitKind("quote")}
                >
                  {t("submitQuoteRfq")}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function QtyField({ productId, qty, minQty, onChange, t }) {
  const [draft, setDraft] = useState(null);
  const [warn, setWarn] = useState(false);
  const shown = draft ?? String(qty ?? "");
  const min = Math.max(1, Number(minQty) || 1);

  function commit(raw) {
    const next = Math.floor(Number(raw));
    if (!Number.isFinite(next) || next < 1) {
      setDraft(null);
      return;
    }
    if (next < min) {
      setWarn(true);
      onChange(productId, min);
      setDraft(null);
      return;
    }
    setWarn(false);
    onChange(productId, next);
    setDraft(null);
  }

  return (
    <span className="inline-flex flex-col items-end max-w-[11rem]">
      <span className="inline-flex items-center">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={shown}
          aria-label="Quantity"
          aria-invalid={warn}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onFocus={() => {
            setWarn(false);
            setDraft(String(qty ?? ""));
          }}
          onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
          onBlur={() => commit(draft ?? shown)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className={`ml-1 w-16 bg-white border px-1.5 py-1 text-xs text-ink tabular-nums ${
            warn ? "border-amber-600" : "border-line"
          }`}
        />
      </span>
      {warn ? (
        <span className="mt-1 text-[10px] leading-snug text-amber-800 text-right">
          {t("qtyBelowMoq", { n: min })}
        </span>
      ) : null}
    </span>
  );
}

function DragGrip({ hint, onPointerDown }) {
  return (
    <button
      type="button"
      title={hint}
      aria-label={hint}
      onPointerDown={onPointerDown}
      className="shrink-0 group inline-flex items-center justify-center h-11 w-6 bg-transparent border-0 p-0 text-mute/60 hover:text-brand-700 cursor-grab active:cursor-grabbing select-none touch-none"
    >
      <span className="grid grid-cols-2 gap-y-[3px] gap-x-[4px] pointer-events-none" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="h-[3.5px] w-[3.5px] rounded-full bg-current" />
        ))}
      </span>
    </button>
  );
}

function LinesList({
  lines,
  selectedIds,
  allSelected,
  toggleId,
  toggleAll,
  setLineQty,
  removeLine,
  embedded = false,
  editingId,
  setEditingId,
  showAddCustom,
  setShowAddCustom,
  onAddCustom,
  onUpdateCustom,
  title,
  subtitle,
  selectAllLabel,
  allowCustom = true,
  showIntent = true,
  tone = "default",
  emptyMessage,
  dropIntent,
  dragging,
  onDragLineStart,
  customPlacement = "inline",
}) {
  const { t } = useLanguage();
  const specFileInputRef = useRef(null);
  const bodyRef = useRef(null);
  const [extractOpen, setExtractOpen] = useState(false);
  const [extractFiles, setExtractFiles] = useState([]);
  const categories = useMemo(() => getCategoryDefs(), []);

  useEffect(() => {
    if (showAddCustom) bodyRef.current?.scrollTo({ top: 0 });
  }, [showAddCustom]);
  const headerBg =
    tone === "buy" ? "bg-brand-50" : tone === "quote" ? "bg-[#f3f4f3]" : "bg-brand-50/50";

  return (
    <>
    <div className={embedded ? "flex flex-col flex-1 min-h-0" : "bg-white border border-line rounded-xl overflow-hidden"}>
      <div className={`px-4 sm:px-5 py-3.5 border-b border-line shrink-0 ${headerBg}`}>
        {title ? (
          <div className="mb-2.5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-brand-800">{title}</h2>
                <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full bg-white border border-line text-[11px] font-semibold text-ink tabular-nums">
                  {lines.length}
                </span>
              </div>
              {subtitle ? <p className="mt-1 text-xs text-mute leading-snug">{subtitle}</p> : null}
              {onDragLineStart ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-mute cursor-default pointer-events-none select-none">
                  <span className="inline-flex h-5 w-4 items-center justify-center text-mute/60" aria-hidden>
                    <span className="grid grid-cols-2 gap-y-[2px] gap-x-[3px]">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <span key={i} className="h-[3px] w-[3px] rounded-full bg-current" />
                      ))}
                    </span>
                  </span>
                  {t("dragToMove")}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              disabled={!lines.length}
              className="h-4 w-4 accent-brand-600"
            />
            {selectAllLabel || t("selectAll")}
          </label>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {allowCustom ? (
              <>
                <input
                  ref={specFileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.txt,.csv,.doc,.docx,image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const next = Array.from(e.target.files || []).slice(0, 8);
                    e.target.value = "";
                    if (!next.length) return;
                    setExtractFiles(next);
                    setExtractOpen(true);
                  }}
                />
                <button
                  type="button"
                  onClick={() => specFileInputRef.current?.click()}
                  className="btn-soft !px-3 !py-2 !text-sm"
                >
                  {t("uploadSpec")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId?.(null);
                    setShowAddCustom?.((v) => !v);
                  }}
                  className={
                    showAddCustom
                      ? "btn-soft !px-3 !py-2 !text-sm"
                      : "btn-primary !px-3 !py-2 !text-sm"
                  }
                >
                  {showAddCustom ? t("cancel") : `+ ${t("addCustomProduct")}`}
                </button>
              </>
            ) : null}
            <p className="text-xs text-mute tabular-nums">
              {t("selectedCountShort", { selected: selectedIds.length, total: lines.length })}
            </p>
          </div>
        </div>
      </div>

      <div ref={bodyRef} className="overflow-y-auto flex-1 min-h-0">
        {allowCustom && showAddCustom && customPlacement === "inline" ? (
          <div className="px-4 sm:px-5 py-4 border-b border-line bg-paper/50">
            <CustomProductForm
              compact
              onSubmit={onAddCustom}
              onCancel={() => setShowAddCustom(false)}
            />
          </div>
        ) : null}

        {lines.length ? (
          <div className="divide-y divide-line">
          {lines.map((l) => {
            const id = String(l.productId);
            const checked = selectedIds.includes(id);
            const isEditing = editingId === id;
            const meta = [l.productNo, l.category, l.supplier].filter(Boolean).join(" · ");
            const unpriced = l.unitPrice == null && !l.custom;
            return (
              <div
                key={l.productId}
                className={`px-3 py-3 flex gap-2 sm:gap-2.5 items-center ${
                  checked ? "bg-white" : "bg-paper/50"
                } ${dragging?.productId === id ? "opacity-45" : ""}`}
              >
                <label className="shrink-0 cursor-pointer">
                  <input type="checkbox" checked={checked} onChange={() => toggleId(id)} className="h-4 w-4 accent-brand-600" />
                </label>
                {!isEditing && onDragLineStart ? (
                  <DragGrip
                    hint={unpriced ? t("dropInvalidStock") : t("dragGripHint")}
                    onPointerDown={(e) => {
                      onDragLineStart(l, dropIntent || (isBuyLine(l) ? "buy" : "quote"), e);
                    }}
                  />
                ) : null}
                {isEditing && l.custom ? (
                  <div className="flex-1 min-w-0">
                    <CustomProductForm
                      mode="edit"
                      compact
                      initial={{
                        name: l.name,
                        description: l.description || "",
                        qty: l.qty,
                        image: l.image || "",
                        category: l.category || "",
                        attachments: l.attachments || [],
                      }}
                      onSubmit={(payload) => onUpdateCustom(l.productId, payload)}
                      onCancel={() => setEditingId(null)}
                    />
                  </div>
                ) : (
                  <>
                    <div className="w-11 h-11 shrink-0 border border-line bg-brand-50 overflow-hidden flex items-center justify-center text-[9px] font-bold uppercase text-brand-700 text-center px-0.5">
                      {l.image ? (
                        <img src={l.image} alt="" draggable={false} className="w-full h-full object-cover pointer-events-none" />
                      ) : l.custom ? (
                        t("customItem")
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-semibold text-ink text-sm truncate">{l.name}</p>
                        {l.green ? <GreenProductTag t={t} /> : null}
                        {showIntent ? <IntentBadge intent={l.intent} t={t} /> : null}
                        {l.custom ? (
                          <span className="text-[10px] font-bold uppercase tracking-wide text-brand-700 bg-brand-50 px-1.5 py-0.5 shrink-0">
                            {t("customItem")}
                          </span>
                        ) : null}
                      </div>
                      {meta ? <p className="mt-0.5 text-[11px] text-mute truncate">{meta}</p> : null}
                      {unpriced ? (
                        <p className="mt-1 inline-flex text-[10px] font-semibold uppercase tracking-wide text-amber-800 bg-amber-50 px-1.5 py-0.5">
                          {t("noListedPrice")}
                        </p>
                      ) : null}
                      <AttachmentLinks files={l.attachments} />
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1 min-w-[5.5rem]">
                      <p className="text-sm font-semibold text-right">
                        <LineMoney line={l} t={t} compact />
                      </p>
                      <label className="text-[11px] text-mute inline-flex items-center">
                        {t("qty")}
                        <QtyField
                          productId={l.productId}
                          qty={l.qty}
                          minQty={l.moq || 1}
                          onChange={setLineQty}
                          t={t}
                        />
                      </label>
                      <div className="flex items-center gap-2">
                        {l.custom ? (
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddCustom?.(false);
                              setEditingId?.(id);
                            }}
                            className="text-[11px] font-semibold text-mute hover:text-brand-600"
                          >
                            {t("edit")}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => removeLine(l.productId)}
                          className="text-[11px] font-semibold text-mute/80 hover:text-[#8a2b2b]"
                        >
                          {t("remove")}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
          </div>
        ) : emptyMessage && !(showAddCustom && customPlacement === "inline") ? (
          <p className="m-4 flex items-center justify-center border border-dashed border-line bg-paper/40 px-4 py-10 text-sm text-mute text-center leading-relaxed">
            {emptyMessage}
          </p>
        ) : null}
      </div>
    </div>
    {allowCustom ? (
      <AiSpecExtractModal
        open={extractOpen}
        onClose={() => {
          setExtractOpen(false);
          setExtractFiles([]);
        }}
        categories={categories}
        initialFiles={extractFiles}
        confirmLabel={t("addExtractedToDraft")}
        reviewHint={t("reviewExtractedDraftHint")}
        onSearch={({ items, attachments }) => {
          for (const item of items) {
            onAddCustom?.({
              name: item.name,
              description: [item.category, item.spec].filter(Boolean).join(" · "),
              category: item.category,
              qty: 1,
              attachments,
            });
          }
        }}
      />
    ) : null}
    </>
  );
}

function ensureDeliveryLots(lots, deliveryDate) {
  const next = (Array.isArray(lots) ? lots : []).map((lot) => ({
    date: lot?.date || "",
    note: lot?.note || "",
  }));
  if (!next.length) next.push({ date: deliveryDate || "", note: "" });
  while (next.length < 2) next.push({ date: "", note: "" });
  return next;
}

function MetaForm({
  note,
  responseDate,
  deliveryDate,
  deliveryMode,
  deliveryLots,
  project,
  address,
  acceptSubstitutes,
  setNote,
  setResponseDate,
  setDeliveryDate,
  setDeliveryMode,
  setDeliveryLots,
  setProject,
  setAddress,
  setAcceptSubstitutes,
  setDraftNote,
  setDraftResponseDate,
  setDraftDeliveryDate,
  setDraftDeliveryMode,
  setDraftDeliveryLots,
  setDraftProject,
  setDraftAddress,
  setDraftAcceptSubstitutes,
  setFormError,
  compact = false,
}) {
  const { t } = useLanguage();
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className={compact ? "space-y-3" : "bg-white border border-line rounded-xl p-4 sm:p-5 space-y-4"}>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-medium mb-1">
            {t("quotationDeadline")} <span className="text-brand-600">*</span>
          </span>
          <input
            type="date"
            value={responseDate || ""}
            min={today}
            onChange={(e) => {
              setResponseDate(e.target.value);
              setDraftResponseDate(e.target.value);
              setFormError("");
            }}
            className="field-input"
          />
          <span className="mt-1 block text-xs text-mute">{t("quotationDeadlineHint")}</span>
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1">
            {t("requestDeliveryDate")} <span className="text-brand-600">*</span>
          </span>
          <input
            type="date"
            value={deliveryDate || ""}
            min={today}
            onChange={(e) => {
              setDeliveryDate(e.target.value);
              setDraftDeliveryDate(e.target.value);
              setFormError("");
            }}
            className="field-input"
          />
          <span className="mt-1 block text-xs text-mute">{t("requestDeliveryDateHint")}</span>
        </label>
      </div>
      <fieldset className="block">
        <legend className="block text-sm font-medium mb-2">
          {t("deliveryMode")} <span className="text-brand-600">*</span>
        </legend>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { value: "one_time", label: t("deliveryModeOneTime"), hint: t("deliveryModeOneTimeHint") },
            { value: "partial", label: t("deliveryModePartial"), hint: t("deliveryModePartialHint") },
          ].map((opt) => {
            const checked = (deliveryMode || "one_time") === opt.value;
            return (
              <label
                key={opt.value}
                className={`flex items-start gap-3 cursor-pointer rounded-lg border px-3 py-3 ${
                  checked ? "border-brand-600 bg-brand-50" : "border-line bg-paper/60"
                }`}
              >
                <input
                  type="radio"
                  name="delivery-mode"
                  value={opt.value}
                  checked={checked}
                  onChange={() => {
                    setDeliveryMode(opt.value);
                    setDraftDeliveryMode(opt.value);
                    if (opt.value === "partial") {
                      const next = ensureDeliveryLots(deliveryLots, deliveryDate);
                      setDeliveryLots?.(next);
                      setDraftDeliveryLots?.(next);
                    }
                    setFormError("");
                  }}
                  className="mt-1 h-4 w-4 shrink-0 accent-brand-600"
                />
                <span>
                  <span className="block text-sm font-medium text-ink">{opt.label}</span>
                  <span className="mt-1 block text-xs text-mute">{opt.hint}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      {deliveryMode === "partial" ? (
        <div className="space-y-3 rounded-lg border border-line bg-paper/40 px-3 py-3">
          <div>
            <p className="text-sm font-medium text-ink">{t("deliveryLotNote")}</p>
            <p className="mt-0.5 text-xs text-mute">{t("deliveryLotsHint")}</p>
          </div>
          {(deliveryLots || []).map((lot, index) => (
            <div key={`lot-${index}`} className="rounded-lg border border-line bg-white p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                  {t("deliveryLotLabel", { n: index + 1 })}
                </p>
                {(deliveryLots || []).length > 2 ? (
                  <button
                    type="button"
                    className="text-xs font-semibold text-mute hover:text-[#8a2b2b]"
                    onClick={() => {
                      const next = (deliveryLots || []).filter((_, i) => i !== index);
                      setDeliveryLots(next);
                      setDraftDeliveryLots(next);
                      if (index === 0 && next[0]?.date) {
                        setDeliveryDate(next[0].date);
                        setDraftDeliveryDate(next[0].date);
                      }
                      setFormError("");
                    }}
                  >
                    {t("removeDeliveryLot")}
                  </button>
                ) : null}
              </div>
              <label className="block">
                <span className="block text-sm font-medium mb-1">
                  {t("deliveryLotDate")} <span className="text-brand-600">*</span>
                </span>
                <input
                  type="date"
                  value={lot.date || ""}
                  min={today}
                  onChange={(e) => {
                    const next = (deliveryLots || []).map((row, i) =>
                      i === index ? { ...row, date: e.target.value } : row
                    );
                    setDeliveryLots(next);
                    setDraftDeliveryLots(next);
                    if (index === 0) {
                      setDeliveryDate(e.target.value);
                      setDraftDeliveryDate(e.target.value);
                    }
                    setFormError("");
                  }}
                  className="field-input"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium mb-1">{t("deliveryLotNote")}</span>
                <textarea
                  value={lot.note || ""}
                  rows={compact ? 2 : 3}
                  placeholder={t("deliveryLotNotePlaceholder")}
                  onChange={(e) => {
                    const next = (deliveryLots || []).map((row, i) =>
                      i === index ? { ...row, note: e.target.value } : row
                    );
                    setDeliveryLots(next);
                    setDraftDeliveryLots(next);
                  }}
                  className="field-input resize-y"
                />
              </label>
            </div>
          ))}
          <button
            type="button"
            className="btn-soft !px-3 !py-2 !text-sm"
            onClick={() => {
              const next = [...ensureDeliveryLots(deliveryLots, deliveryDate), { date: "", note: "" }];
              setDeliveryLots(next);
              setDraftDeliveryLots(next);
            }}
          >
            + {t("addDeliveryLot")}
          </button>
        </div>
      ) : null}
      <label className="block">
        <span className="block text-sm font-medium mb-1">{t("projectName")}</span>
        <input
          type="text"
          list="rfq-project-suggestions"
          value={project || ""}
          onChange={(e) => {
            setProject(e.target.value);
            setDraftProject(e.target.value);
            setFormError("");
          }}
          placeholder={t("projectPlaceholder")}
          className="field-input w-full"
        />
        <datalist id="rfq-project-suggestions">
          {SAMPLE_PROJECTS.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <span className="mt-1 block text-xs text-mute">{t("projectHint")}</span>
      </label>
      <label className="block">
        <span className="block text-sm font-medium mb-1">
          {t("siteAddress")} <span className="text-brand-600">*</span>
        </span>
        <input
          type="text"
          value={address || ""}
          onChange={(e) => {
            setAddress(e.target.value);
            setDraftAddress(e.target.value);
            setFormError("");
          }}
          placeholder={t("addressPlaceholder")}
          className="field-input w-full"
        />
      </label>
      <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-line bg-paper/60 px-3 py-3">
        <input
          type="checkbox"
          checked={Boolean(acceptSubstitutes)}
          onChange={(e) => {
            setAcceptSubstitutes(e.target.checked);
            setDraftAcceptSubstitutes(e.target.checked);
          }}
          className="mt-1 h-4 w-4 shrink-0 accent-brand-600"
        />
        <span>
          <span className="block text-sm font-medium text-ink">{t("acceptSubstitutes")}</span>
          <span className="mt-1 block text-xs text-mute">{t("acceptSubstitutesHint")}</span>
        </span>
      </label>
      <label className="block">
        <span className="block text-sm font-medium mb-1">{t("orderNote")}</span>
        <textarea
          value={note || ""}
          onChange={(e) => {
            setNote(e.target.value);
            setDraftNote(e.target.value);
          }}
          rows={compact ? 3 : 4}
          placeholder={t("orderNotePlaceholder")}
          className="field-input resize-y"
        />
      </label>
    </div>
  );
}

function SubmitBar({
  selectedIds,
  selectedTotals,
  formError,
  onSubmit,
  submitLabel,
  bare = false,
  showKeepShopping = true,
}) {
  const { t } = useLanguage();
  return (
    <div className={bare ? "" : "bg-white border border-line rounded-xl p-4 sm:p-5"}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-mute">
            {selectedIds.length === 1
              ? t("selectedSubtotalOne")
              : t("selectedSubtotal", { n: selectedIds.length })}
          </p>
          <p className="text-xl font-bold text-brand-600 mt-0.5">
            {formatPrice(selectedTotals.pricedSubtotal)}
          </p>
          {selectedTotals.unpricedCount ? (
            <p className="text-xs text-mute mt-1">
              {selectedTotals.unpricedCount} line(s) priced on request
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {showKeepShopping && !bare ? (
            <Link to="/#products" className="btn-soft !px-4 !py-2.5">
              {t("keepShopping")}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={onSubmit}
            disabled={selectedIds.length === 0}
            className="btn-primary !px-5 !py-2.5 disabled:opacity-45"
          >
            {submitLabel || t("submitRfq")}
          </button>
        </div>
      </div>
      {formError ? <p className="mt-3 text-sm text-red-700 font-medium">{formError}</p> : null}
    </div>
  );
}
