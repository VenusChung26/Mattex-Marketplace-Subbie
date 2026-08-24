/**
 * My RFQs — quote compare, accept, payment, and delivery.
 */
import { Link, useSearchParams } from "react-router-dom";
import { useStore } from "../hooks/useStore";
import { buildSupplierBankInfo, formatPrice, getRfq, rfqProjectName } from "../lib/store";
import { useEffect, useMemo, useRef, useState } from "react";
import SiteHeader from "../components/SiteHeader";
import { useLanguage } from "../i18n";
import AttachmentLinks from "../components/AttachmentLinks";
import { DEMO_QUOTED_RFQ, buildPrototypeQuotes } from "./rfqs-prototype/quoteMocks";
import QuoteVariant from "./rfqs-prototype/QuoteCompareVariantA";
import RfqStepBar, { RFQ_LIFECYCLE_STEPS } from "./rfqs-prototype/RfqStepBar";

function isCodPaymentTerm(value) {
  const raw = String(value || "").toLowerCase();
  return /\bcod\b/.test(raw) || raw.includes("貨到付款") || raw.includes("cash on delivery");
}

function acceptedQuotesAreCod(acceptance, quotes) {
  const names = acceptance?.supplierNames;
  if (!names?.length || !quotes?.length) return false;
  return names.every((name) => {
    const q = quotes.find((x) => x.supplierName === name);
    return isCodPaymentTerm(q?.paymentTerms);
  });
}

function canOpenDelivery(payment, acceptance, quotes, po) {
  if (!po?.supplierAccepted) return false;
  return Boolean(
    payment?.supplierAccepted || payment?.method === "cod" || acceptedQuotesAreCod(acceptance, quotes)
  );
}

function downloadRfq(rfq) {
  if (!rfq) return;
  const lines = [
    `Subbie Storefront — RFQ`,
    `ID: ${rfq.id}`,
    `Status: ${rfq.status}`,
    `Submitted: ${new Date(rfq.submittedAt).toLocaleString()}`,
    rfq.responseDate ? `Quotation deadline: ${rfq.responseDate}` : null,
    rfq.deliveryDate ? `Requested delivery: ${rfq.deliveryDate}` : null,
    `Delivery: ${rfq.deliveryMode === "partial" ? "partial" : "one-time"}`,
    ...(rfq.deliveryMode === "partial" && Array.isArray(rfq.deliveryLots)
      ? rfq.deliveryLots.map(
          (lot, i) => `Lot ${i + 1}: ${lot.date || "—"}${lot.note ? ` — ${lot.note}` : ""}`
        )
      : []),
    rfq.canonicalCategory ? `Canonical category: ${rfq.canonicalCategory}` : null,
    rfqProjectName(rfq) ? `Project: ${rfqProjectName(rfq)}` : null,
    rfq.address ? `Address: ${rfq.address}` : null,
    `Substitutes: ${rfq.acceptSubstitutes ? "accepted (buyer must still confirm)" : "not accepted"}`,
    rfq.note ? `Note: ${rfq.note}` : null,
    "",
    "Line items",
    "---------",
    ...rfq.lines.map((l) => {
      const price = l.unitPrice == null ? "Price Upon Request" : formatPrice(l.unitPrice);
      const asked =
        l.requestedUnitPrice != null && l.unitPrice != null && Number(l.requestedUnitPrice) < Number(l.unitPrice)
          ? formatPrice(l.requestedUnitPrice)
          : null;
      const lineTotal =
        l.unitPrice == null
          ? "—"
          : asked
            ? `${formatPrice(l.requestedUnitPrice * l.qty)} (listed ${formatPrice(l.unitPrice * l.qty)})`
            : formatPrice(l.unitPrice * l.qty);
      const tag = l.custom ? " [Custom]" : "";
      const intent = l.intent === "buy" ? " [Direct buy]" : " [Quote request]";
      const desc = l.description ? ` | Spec: ${l.description}` : "";
      return `${l.name}${tag}${intent} × ${l.qty}${l.supplier ? ` (${l.supplier})` : ""}${desc} | Unit: ${price}${asked ? ` | Asked: ${asked}` : ""} | Line: ${lineTotal}`;
    }),
    "",
    `Priced subtotal: ${formatPrice(rfq.pricedSubtotal)}`,
    rfq.unpricedCount ? `Unpriced lines: ${rfq.unpricedCount}` : "All lines priced",
  ]
    .filter((row) => row != null)
    .join("\n");

  const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${rfq.id}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function rfqDocStatus(rfq, acceptedByRfq) {
  if (!rfq) return "";
  if (acceptedByRfq?.[rfq.id]) return "accepted";
  return buildPrototypeQuotes(rfq).length ? "quoted" : rfq.status || "";
}

function rfqLineSummary(rfq, t) {
  const first = rfq?.lines?.[0]?.name;
  if (!first) {
    return rfq?.lines?.length === 1 ? t("rfqLineCountOne") : t("rfqLineCount", { n: rfq?.lines?.length || 0 });
  }
  if ((rfq.lines || []).length <= 1) return first;
  return `${first} +${rfq.lines.length - 1}`;
}

const RECENT_RFQ_LIMIT = 8;
const SEARCH_RESULT_LIMIT = 8;

function sortRfqsNewestFirst(rfqs) {
  return [...(rfqs || [])].sort((a, b) => {
    const tb = new Date(b.submittedAt || 0).getTime();
    const ta = new Date(a.submittedAt || 0).getTime();
    if (tb !== ta) return tb - ta;
    const nb = Number(String(b.id || "").replace(/\D/g, "")) || 0;
    const na = Number(String(a.id || "").replace(/\D/g, "")) || 0;
    return nb - na;
  });
}

function rfqMatchesQuery(rfq, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  const names = (rfq.lines || []).map((line) => line.name).join(" ");
  const project = rfqProjectName(rfq);
  return `${rfq.id} ${rfq.canonicalCategory || ""} ${project} ${names}`.toLowerCase().includes(q);
}

const UNASSIGNED_PROJECT = "__unassigned__";

function RfqDocSwitcher({ list, selectedId, onSelect, acceptedByRfq, t }) {
  const rootRef = useRef(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");

  const selected = list.find((rfq) => rfq.id === selectedId) || list[0] || null;
  const selectedStatus = rfqDocStatus(selected, acceptedByRfq);
  const selectedProject = rfqProjectName(selected);

  useEffect(() => {
    if (!open) return undefined;
    function onPointer(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const counts = useMemo(() => {
    const next = { all: list.length, quoted: 0, submitted: 0, accepted: 0 };
    for (const rfq of list) {
      const status = rfqDocStatus(rfq, acceptedByRfq);
      if (status === "accepted") next.accepted += 1;
      else if (status === "quoted") next.quoted += 1;
      else next.submitted += 1;
    }
    return next;
  }, [list, acceptedByRfq]);

  const projects = useMemo(() => {
    const names = new Set();
    let unassigned = false;
    for (const rfq of list) {
      const name = rfqProjectName(rfq);
      if (name) names.add(name);
      else unassigned = true;
    }
    return { names: [...names].sort((a, b) => a.localeCompare(b)), unassigned };
  }, [list]);

  const filtered = useMemo(
    () =>
      list.filter((rfq) => {
        const status = rfqDocStatus(rfq, acceptedByRfq) || "submitted";
        if (statusFilter !== "all" && status !== statusFilter) return false;
        const project = rfqProjectName(rfq);
        if (projectFilter === UNASSIGNED_PROJECT) {
          if (project) return false;
        } else if (projectFilter !== "all" && project !== projectFilter) {
          return false;
        }
        return rfqMatchesQuery(rfq, query);
      }),
    [list, acceptedByRfq, statusFilter, projectFilter, query]
  );

  const results = filtered.slice(0, SEARCH_RESULT_LIMIT);
  const recent = useMemo(() => {
    const scoped =
      projectFilter === "all"
        ? list
        : list.filter((rfq) => {
            const name = rfqProjectName(rfq);
            return projectFilter === UNASSIGNED_PROJECT ? !name : name === projectFilter;
          });
    return scoped.slice(0, RECENT_RFQ_LIMIT);
  }, [list, projectFilter]);

  function pick(id) {
    onSelect(id);
    setQuery("");
    setOpen(false);
  }

  if (!list.length || !selected) return null;

  const filters = [
    { id: "all", label: t("docFilterAll"), count: counts.all },
    { id: "quoted", label: t("docFilterQuoted"), count: counts.quoted },
    { id: "submitted", label: t("docFilterSubmitted"), count: counts.submitted },
    { id: "accepted", label: t("docFilterAccepted"), count: counts.accepted },
  ];
  return (
    <div ref={rootRef} className="relative mb-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mute mb-2">
        {t("documents")} · {list.length}
      </p>

      <div className="bg-white border border-line rounded-xl px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <p className="font-semibold text-brand-800">{selected.id}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-brand-600">{selectedStatus}</p>
            </div>
            <p className="mt-0.5 text-xs text-mute truncate">{rfqLineSummary(selected, t)}</p>
            <p className="mt-0.5 text-xs text-mute">
              {selectedProject || t("filterProjectUnassigned")}
              {" · "}
              {new Date(selected.submittedAt).toLocaleDateString()}
              {" · "}
              {selected.lines.length === 1
                ? t("rfqLineCountOne")
                : t("rfqLineCount", { n: selected.lines.length })}
              {" · "}
              {formatPrice(selected.pricedSubtotal)}
            </p>
          </div>

          <div className="w-full sm:w-80 shrink-0">
            <label className="sr-only" htmlFor="rfq-doc-search">
              {t("searchRfqs")}
            </label>
            <input
              id="rfq-doc-search"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder={t("searchRfqs")}
              className="w-full border border-line bg-paper/60 px-3 py-2 text-sm text-ink"
              aria-expanded={open}
              aria-controls="rfq-doc-results"
              autoComplete="off"
            />
          </div>
        </div>

        {list.length > 1 ? (
          <div className="mt-2.5 pt-2.5 border-t border-line">
            <div className="flex items-center gap-2 min-w-0">
              <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">
                {t("recentRfqs")}
              </p>
              <label className="sr-only" htmlFor="rfq-project-filter">
                {t("filterProject")}
              </label>
              <select
                id="rfq-project-filter"
                value={projectFilter}
                onChange={(e) => {
                  const next = e.target.value;
                  setProjectFilter(next);
                  const scoped =
                    next === "all"
                      ? list
                      : list.filter((rfq) => {
                          const name = rfqProjectName(rfq);
                          return next === UNASSIGNED_PROJECT ? !name : name === next;
                        });
                  if (scoped.length && !scoped.some((rfq) => rfq.id === selectedId)) {
                    onSelect(scoped[0].id);
                  }
                }}
                className="shrink-0 max-w-[11rem] border border-line bg-paper/60 px-2 py-1 text-[11px] font-semibold text-ink"
              >
                <option value="all">{t("filterProjectAll")}</option>
                {projects.names.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                {projects.unassigned ? (
                  <option value={UNASSIGNED_PROJECT}>{t("filterProjectUnassigned")}</option>
                ) : null}
              </select>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 min-w-0">
                {recent.map((rfq) => {
                  const active = rfq.id === selectedId;
                  const itemStatus = rfqDocStatus(rfq, acceptedByRfq);
                  const project = rfqProjectName(rfq);
                  return (
                    <button
                      key={rfq.id}
                      type="button"
                      title={`${rfq.id} · ${itemStatus} · ${project || t("filterProjectUnassigned")} · ${rfqLineSummary(rfq, t)}`}
                      onClick={() => pick(rfq.id)}
                      className={`shrink-0 inline-flex items-center gap-1.5 border px-2.5 py-1 text-left ${
                        active
                          ? "border-brand-600 bg-brand-50 text-brand-800"
                          : "border-line bg-white text-ink hover:border-brand-300"
                      }`}
                    >
                      <span className="text-xs font-semibold">{rfq.id}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-brand-600">
                        {itemStatus}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {open ? (
        <div
          id="rfq-doc-results"
          role="listbox"
          className="absolute z-30 mt-1 w-full bg-white border border-line rounded-xl shadow-lg overflow-hidden"
        >
          <div className="px-3 py-2 border-b border-line flex flex-wrap gap-1.5">
            {filters.map((filter) => {
              const active = statusFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setStatusFilter(filter.id)}
                  className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide border rounded-full ${
                    active
                      ? "border-brand-600 bg-brand-50 text-brand-800"
                      : "border-line bg-white text-mute hover:border-brand-300"
                  }`}
                >
                  {filter.label} {filter.count}
                </button>
              );
            })}
          </div>

          {query.trim() ? (
            results.length ? (
              <div>
                {results.map((rfq) => {
                  const active = rfq.id === selectedId;
                  return (
                    <button
                      key={rfq.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => pick(rfq.id)}
                      className={`w-full text-left px-4 py-2.5 flex items-start justify-between gap-3 ${
                        active ? "bg-brand-50" : "hover:bg-paper"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-brand-800">{rfq.id}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wide text-brand-600">
                            {rfqDocStatus(rfq, acceptedByRfq)}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-xs text-mute truncate">{rfqLineSummary(rfq, t)}</span>
                        <span className="mt-0.5 block text-[11px] text-mute truncate">
                          {rfqProjectName(rfq) || t("filterProjectUnassigned")}
                        </span>
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-ink shrink-0">
                        {formatPrice(rfq.pricedSubtotal)}
                      </span>
                    </button>
                  );
                })}
                <p className="px-4 py-2 text-[11px] text-mute border-t border-line">
                  {t("showingRfqsOf", { shown: results.length, total: filtered.length })}
                </p>
              </div>
            ) : (
              <p className="px-4 py-6 text-sm text-mute">{t("noMatchingRfqs")}</p>
            )
          ) : (
            <p className="px-4 py-6 text-sm text-mute">{t("typeToFindRfqs", { n: list.length })}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function RfqsPage() {
  const { user, rfqs } = useStore();
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const storedList = rfqs || [];
  const usingDemo = storedList.length === 0;
  const list = sortRfqsNewestFirst(usingDemo ? [DEMO_QUOTED_RFQ] : storedList);

  const initial = params.get("id") || (list[0] && list[0].id) || null;
  const [selectedId, setSelectedId] = useState(initial);
  const [acceptedByRfq, setAcceptedByRfq] = useState({});
  const [stepByRfq, setStepByRfq] = useState({});
  const [poByRfq, setPoByRfq] = useState({});
  const [paymentByRfq, setPaymentByRfq] = useState({});
  const [deliveryByRfq, setDeliveryByRfq] = useState({});

  const selected = useMemo(() => {
    if (!selectedId) return null;
    if (selectedId === DEMO_QUOTED_RFQ.id) return DEMO_QUOTED_RFQ;
    return getRfq(selectedId);
  }, [selectedId, storedList]);

  const quotes = useMemo(
    () => (selected ? buildPrototypeQuotes(selected) : []),
    [selected]
  );

  const acceptance = selected ? acceptedByRfq[selected.id] || null : null;
  const hasAccepted = Boolean(acceptance);
  const quoteSupplierAccepted = Boolean(acceptance?.quoteSupplierAccepted);
  const payment = selected ? paymentByRfq[selected.id] || null : null;
  const delivery = selected ? deliveryByRfq[selected.id] || null : null;
  const po = selected ? poByRfq[selected.id] || null : null;
  const poAccepted = Boolean(po?.supplierAccepted);
  const paymentDone = Boolean(payment?.supplierAccepted);
  const deliveryUnlocked = canOpenDelivery(payment, acceptance, quotes, po);
  const deliveryDone = Boolean(delivery?.buyerAccepted);

  const progressId = deliveryDone
    ? "delivery"
    : deliveryUnlocked
      ? "delivery"
      : poAccepted
        ? "payment"
        : quoteSupplierAccepted
          ? "purchaseOrder"
          : quotes.length
            ? "quotes"
            : "submitted";

  const activeStep = (selected && stepByRfq[selected.id]) || "quotes";

  const displayStatus = deliveryDone
    ? "delivered"
    : paymentDone
      ? "paid"
      : poAccepted
        ? "purchase order"
        : quoteSupplierAccepted
          ? "po pending"
          : hasAccepted
            ? "awaiting supplier"
            : quotes.length
              ? "quoted"
              : selected?.status === "whatsapp_sent"
                ? t("waSavedInSubbie")
                : selected?.status || "";

  function setActiveStep(stepId) {
    if (!selected) return;
    setStepByRfq((prev) => ({ ...prev, [selected.id]: stepId }));
  }

  useEffect(() => {
    if (!selectedId && list[0]) setSelectedId(list[0].id);
  }, [list, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setStepByRfq((prev) => {
      if (prev[selected.id]) return prev;
      return { ...prev, [selected.id]: "quotes" };
    });
  }, [selected?.id]);

  if (!user) {
    return (
      <Shell>
        <div className="bg-white border border-line rounded-xl p-6">
          <h2 className="text-lg font-bold text-brand-800">{t("loginRequired")}</h2>
          <p className="mt-2 text-sm text-mute">{t("loginRequiredRfq")}</p>
          <Link to="/login" className="btn-primary mt-5 inline-flex">
            {t("login")}
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell wide>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{t("history")}</p>
        <h1 className="reveal mt-1 text-2xl sm:text-3xl font-bold text-brand-800">{t("myRfqsTitle")}</h1>
        <p className="mt-2 text-sm text-mute">
          {usingDemo
            ? "Prototype demo RFQ loaded (no history yet). Compare supplier quotes below."
            : t("myRfqsHint")}
        </p>
      </div>

      <RfqDocSwitcher
        list={list}
        selectedId={selectedId}
        onSelect={setSelectedId}
        acceptedByRfq={acceptedByRfq}
        t={t}
      />

      <section className="bg-white border border-line rounded-xl p-5 sm:p-6 min-h-[24rem] pb-28">
          {selected ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-line">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                    {displayStatus}
                  </p>
                  <h2 className="mt-1 text-xl sm:text-2xl font-bold text-brand-800">{selected.id}</h2>
                  <p className="mt-1 text-xs text-mute">
                    Submitted {new Date(selected.submittedAt).toLocaleString()}
                  </p>
                  {selected.responseDate ? (
                    <p className="mt-2 text-sm text-ink">
                      <span className="text-mute">{t("quotationDeadlineLabel")}</span> {selected.responseDate}
                    </p>
                  ) : null}
                  {selected.deliveryDate ? (
                    <p className="mt-1 text-sm text-ink">
                      <span className="text-mute">{t("deliveryDateLabel")}</span> {selected.deliveryDate}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-ink">
                    <span className="text-mute">{t("deliveryModeLabel")}</span>{" "}
                    {selected.deliveryMode === "partial" ? t("deliveryModePartial") : t("deliveryModeOneTime")}
                  </p>
                  {selected.deliveryMode === "partial" && Array.isArray(selected.deliveryLots)
                    ? selected.deliveryLots.map((lot, index) => (
                        <p key={`lot-${index}`} className="mt-1 text-sm text-ink">
                          <span className="text-mute">{t("deliveryLotLabel", { n: index + 1 })}</span>{" "}
                          {lot.date || "—"}
                          {lot.note ? ` · ${lot.note}` : ""}
                        </p>
                      ))
                    : null}
                  {selected.canonicalCategory ? (
                    <p className="mt-1 text-sm text-ink">
                      <span className="text-mute">{t("categoryLabel")}</span> {selected.canonicalCategory}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-ink">
                    <span className="text-mute">{t("projectLabel")}</span>{" "}
                    {rfqProjectName(selected) || t("filterProjectUnassigned")}
                  </p>
                  {selected.address ? (
                    <p className="mt-1 text-sm text-ink">
                      <span className="text-mute">{t("addressLabel")}</span> {selected.address}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-ink">
                    <span className="text-mute">{t("substitutesLabel")}</span>{" "}
                    {selected.acceptSubstitutes ? t("substitutesAccepted") : t("substitutesNotAccepted")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => downloadRfq(selected)}
                    className="btn-soft !px-4 !py-2.5 !border-brand-600 !text-brand-700"
                  >
                    {t("download")}
                  </button>
                </div>
              </div>

              <div className="mt-5">
                <RfqStepBar
                  steps={RFQ_LIFECYCLE_STEPS}
                  activeId={activeStep}
                  progressId={progressId}
                  onSelect={setActiveStep}
                />
              </div>

              <div className="mt-6">
                {activeStep === "submitted" ? (
                  <SubmittedStep rfq={selected} t={t} />
                ) : null}

                {activeStep === "quotes" ? (
                  <QuoteVariant
                    rfq={selected}
                    quotes={quotes}
                    acceptance={acceptance}
                    onAccept={(payload) => {
                      setAcceptedByRfq((prev) => ({
                        ...prev,
                        [selected.id]: {
                          ...payload,
                          quoteSubmitted: true,
                          quoteSupplierAccepted: false,
                        },
                      }));
                    }}
                    onSupplierAcceptSelection={() => {
                      setAcceptedByRfq((prev) => ({
                        ...prev,
                        [selected.id]: {
                          ...(prev[selected.id] || {}),
                          quoteSupplierAccepted: true,
                        },
                      }));
                      setActiveStep("purchaseOrder");
                    }}
                    onReset={() => {
                      setAcceptedByRfq((prev) => {
                        const next = { ...prev };
                        delete next[selected.id];
                        return next;
                      });
                      setPoByRfq((prev) => {
                        const next = { ...prev };
                        delete next[selected.id];
                        return next;
                      });
                      setPaymentByRfq((prev) => {
                        const next = { ...prev };
                        delete next[selected.id];
                        return next;
                      });
                      setDeliveryByRfq((prev) => {
                        const next = { ...prev };
                        delete next[selected.id];
                        return next;
                      });
                      setActiveStep("quotes");
                    }}
                  />
                ) : null}

                {activeStep === "purchaseOrder" ? (
                  <PurchaseOrderStep
                    acceptance={acceptance}
                    po={poByRfq[selected.id] || { buyerConfirmed: false, sent: false, supplierAccepted: false }}
                    onChange={(next) => setPoByRfq((prev) => ({ ...prev, [selected.id]: next }))}
                    onContinue={() => {
                      if (acceptedQuotesAreCod(acceptance, quotes)) {
                        setPaymentByRfq((prev) => ({
                          ...prev,
                          [selected.id]: {
                            method: "cod",
                            receiptName: prev[selected.id]?.receiptName || "",
                            supplierAccepted: false,
                          },
                        }));
                      }
                      setActiveStep("payment");
                    }}
                    onBack={() => setActiveStep("quotes")}
                  />
                ) : null}

                {activeStep === "payment" ? (
                  <PaymentStep
                    acceptance={acceptance}
                    quotes={quotes}
                    po={po}
                    payment={paymentByRfq[selected.id] || { method: "", receiptName: "", supplierAccepted: false }}
                    onChange={(next) =>
                      setPaymentByRfq((prev) => ({ ...prev, [selected.id]: next }))
                    }
                    onContinue={() => setActiveStep("delivery")}
                    onBack={() => setActiveStep("purchaseOrder")}
                  />
                ) : null}

                {activeStep === "delivery" ? (
                  <DeliveryStep
                    rfq={selected}
                    acceptance={acceptance}
                    quotes={quotes}
                    po={po}
                    payment={paymentByRfq[selected.id]}
                    delivery={deliveryByRfq[selected.id] || { noteName: "", buyerAccepted: false }}
                    onChange={(next) =>
                      setDeliveryByRfq((prev) => ({ ...prev, [selected.id]: next }))
                    }
                    onBack={() => setActiveStep("payment")}
                  />
                ) : null}
              </div>
            </>
          ) : (
            <p className="text-sm text-mute">{t("selectRfqHint")}</p>
          )}
        </section>
    </Shell>
  );
}

function Shell({ children, wide = false, fluid = false }) {
  const width = fluid ? "w-full max-w-none" : wide ? "max-w-[100rem]" : "max-w-3xl";
  return (
    <div className="bg-paper min-h-screen">
      <SiteHeader fluid={fluid} wide={wide} />
      <main className={`${width} mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10`}>{children}</main>
    </div>
  );
}

function SubmittedStep({ rfq, t }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mute">Request</p>
      <h3 className="mt-1 text-lg font-bold text-brand-800">Submitted RFQ</h3>
      <p className="mt-1 text-sm text-mute">Review what you sent. Supplier quotes appear in the next step.</p>

      <h4 className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-mute">{t("lineItems")}</h4>
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {rfq.lines.map((l) => (
          <li key={`${l.productId}-${l.qty}`} className="flex justify-between gap-3 py-3 text-sm">
            <span className="min-w-0">
              <span className="font-medium text-ink">
                {l.name} × {l.qty}
                {l.intent === "buy" || l.intent === "quote" ? (
                  <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-brand-700 bg-brand-50 px-1.5 py-0.5">
                    {t(l.intent === "buy" ? "intentBuy" : "intentQuote")}
                  </span>
                ) : null}
                {l.green ? (
                  <span className="ml-2 inline-flex items-center gap-0.5 bg-[#1f8a45] text-white text-[10px] font-bold uppercase tracking-[0.08em] px-1.5 py-0.5">
                    {t("greenBadge")}
                  </span>
                ) : null}
                {l.custom ? (
                  <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-brand-700 bg-brand-50 px-1.5 py-0.5">
                    {t("customItem")}
                  </span>
                ) : null}
              </span>
              {l.productNo ? <span className="block text-xs text-mute mt-0.5">{l.productNo}</span> : null}
              {l.description ? <span className="block text-xs text-mute mt-0.5">{l.description}</span> : null}
              <AttachmentLinks files={l.attachments} />
              {l.supplier ? <span className="block text-xs text-mute mt-0.5">{l.supplier}</span> : null}
            </span>
            <span className="text-mute shrink-0 text-right">
              {l.unitPrice == null ? (
                formatPrice(null)
              ) : l.requestedUnitPrice != null && Number(l.requestedUnitPrice) < Number(l.unitPrice) ? (
                <>
                  <span className="block text-xs line-through">{formatPrice(l.unitPrice)}</span>
                  <span className="font-semibold text-brand-700">{formatPrice(l.requestedUnitPrice)}</span>
                </>
              ) : (
                formatPrice(l.unitPrice)
              )}
            </span>
          </li>
        ))}
      </ul>
      {rfq.note ? (
        <p className="mt-4 text-sm text-mute">
          <span className="font-medium text-ink">{t("noteLabel")}</span> {rfq.note}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-line">
        <p className="text-sm text-mute">
          {rfq.unpricedCount ? `${rfq.unpricedCount} item(s) price upon request` : "All line items priced"}
        </p>
        <p className="text-base font-bold text-brand-700">
          {t("pricedSubtotal")}: {formatPrice(rfq.pricedSubtotal)}
        </p>
      </div>
    </div>
  );
}

function DocStatus({ steps }) {
  return (
    <ol className="mt-4 space-y-2">
      {steps.map((s) => (
        <li key={s.label} className="flex items-start gap-2.5 text-sm">
          <span
            className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center text-[10px] font-bold ${
              s.done
                ? "bg-brand-600 text-white"
                : s.current
                  ? "border-2 border-brand-600 text-brand-700"
                  : "border border-line text-mute"
            }`}
          >
            {s.done ? "✓" : s.n}
          </span>
          <span className={s.done || s.current ? "text-ink" : "text-mute"}>
            <span className="font-medium">{s.label}</span>
            {s.hint ? <span className="block text-xs text-mute mt-0.5">{s.hint}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

function PurchaseOrderStep({ acceptance, po, onChange, onContinue, onBack }) {
  if (!acceptance?.quoteSupplierAccepted) {
    return (
      <div className="border border-dashed border-line rounded-xl px-5 py-8 text-center">
        <p className="font-semibold text-brand-800">Waiting on Quotes</p>
        <p className="mt-2 text-sm text-mute">
          Submit your selected prices to the supplier. After they accept, confirm the purchase order here.
        </p>
        <button type="button" className="btn-soft mt-4 !px-5" onClick={onBack}>
          Go to Quotes
        </button>
      </div>
    );
  }

  const buyerConfirmed = Boolean(po?.buyerConfirmed);
  const sent = Boolean(po?.sent);
  const supplierAccepted = Boolean(po?.supplierAccepted);
  const lines = acceptance.lines || [];

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mute">Purchase Order</p>
      <h3 className="mt-1 text-lg font-bold text-brand-800">Confirm items, then send to supplier</h3>
      <p className="mt-1 text-sm text-mute">
        {acceptance.label} · {formatPrice(acceptance.total)}
      </p>

      <DocStatus
        steps={[
          {
            n: 1,
            label: "Buyer confirms item content",
            hint: "Check qty, product, and supplier against the accepted quote.",
            done: buyerConfirmed,
            current: !buyerConfirmed,
          },
          {
            n: 2,
            label: "Send PO to supplier",
            done: sent,
            current: buyerConfirmed && !sent,
          },
          {
            n: 3,
            label: "Supplier accepts PO",
            hint: "Payment unlocks after this accept.",
            done: supplierAccepted,
            current: sent && !supplierAccepted,
          },
        ]}
      />

      <div className="mt-5 border border-line rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper/80 text-[11px] uppercase tracking-wide text-mute">
            <tr>
              <th className="text-left font-semibold px-3 py-2">Item</th>
              <th className="text-left font-semibold px-3 py-2">Supplier</th>
              <th className="text-right font-semibold px-3 py-2">Qty</th>
              <th className="text-right font-semibold px-3 py-2">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {lines.map((line) => (
              <tr key={`${line.quoteId}-${line.productId}`}>
                <td className="px-3 py-2.5">
                  <p className="font-medium text-ink">{line.offer?.name || line.requestName}</p>
                  {line.offer?.name && line.offer.name !== line.requestName ? (
                    <p className="text-[11px] text-mute mt-0.5">RFQ: {line.requestName}</p>
                  ) : null}
                </td>
                <td className="px-3 py-2.5 text-mute">{line.supplierName}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{line.offer?.qty ?? "—"}</td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                  {formatPrice(line.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line bg-paper/50">
              <td colSpan={3} className="px-3 py-2.5 text-sm font-semibold text-ink">
                Total
              </td>
              <td className="px-3 py-2.5 text-right font-bold text-brand-700 tabular-nums">
                {formatPrice(acceptance.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className="btn-soft !px-4 !py-2.5" onClick={onBack}>
          Back
        </button>
        {!buyerConfirmed ? (
          <button
            type="button"
            className="btn-primary !px-5 !py-2.5"
            onClick={() => onChange({ ...po, buyerConfirmed: true, sent: false, supplierAccepted: false })}
          >
            Confirm items
          </button>
        ) : null}
        {buyerConfirmed && !sent ? (
          <button
            type="button"
            className="btn-primary !px-5 !py-2.5"
            onClick={() => onChange({ ...po, buyerConfirmed: true, sent: true, supplierAccepted: false })}
          >
            Send to supplier
          </button>
        ) : null}
        {sent && !supplierAccepted ? (
          <button
            type="button"
            className="btn-primary !px-5 !py-2.5"
            onClick={() =>
              onChange({ ...po, buyerConfirmed: true, sent: true, supplierAccepted: true })
            }
          >
            Simulate supplier accept
          </button>
        ) : null}
        {supplierAccepted ? (
          <button type="button" className="btn-primary !px-5 !py-2.5" onClick={onContinue}>
            Continue to payment
          </button>
        ) : null}
      </div>
      {sent && !supplierAccepted ? (
        <p className="mt-3 text-xs text-mute">PO sent. Waiting for the supplier to accept…</p>
      ) : null}
      {supplierAccepted ? (
        <p className="mt-3 text-sm font-semibold text-brand-700">Supplier accepted the purchase order.</p>
      ) : null}
    </div>
  );
}

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    if (!value || !navigator.clipboard) return;
    navigator.clipboard.writeText(String(value)).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    });
  }

  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-mute">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-ink break-all">{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 text-[11px] font-semibold text-brand-700 hover:text-brand-800"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function BankTransferInfo({ acceptance }) {
  const names = acceptance.supplierNames?.length ? acceptance.supplierNames : ["Supplier"];
  const totals = {};
  (acceptance.lines || []).forEach((line) => {
    const name = line.supplierName || "Supplier";
    totals[name] = (totals[name] || 0) + Number(line.lineTotal || 0);
  });

  return (
    <div className="mt-5 space-y-3">
      {names.map((name) => {
        const info = buildSupplierBankInfo(name);
        const amount = totals[name] != null ? Math.round(totals[name] * 100) / 100 : acceptance.total;
        return (
          <div key={name} className="border border-line rounded-xl p-4 bg-paper/40">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mute">Bank transfer</p>
            <h4 className="mt-1 text-sm font-bold text-brand-800">Pay {info.supplierName}</h4>
            <p className="mt-1 text-xs text-mute">
              Transfer {formatPrice(amount)} in {info.currency}. Use the RFQ / PO number as the payment reference.
            </p>
            <div className="mt-3 divide-y divide-line">
              <CopyField label="Bank" value={`${info.bankShort} (${info.bankCode}) · ${info.bankName}`} />
              <CopyField label="Account name" value={info.accountName} />
              <CopyField label="Account number" value={info.accountNumber} />
              <CopyField label="SWIFT / BIC" value={info.swift} />
              <CopyField label="FPS ID" value={info.fpsId} />
              <CopyField label="Currency" value={info.currency} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PaymentStep({ acceptance, quotes, po, payment, onChange, onContinue, onBack }) {
  if (!acceptance?.quoteSupplierAccepted) {
    return (
      <div className="border border-dashed border-line rounded-xl px-5 py-8 text-center">
        <p className="font-semibold text-brand-800">Submit a selection first</p>
        <p className="mt-2 text-sm text-mute">Pick offers on Quotes, send them to the supplier, then wait for accept.</p>
        <button type="button" className="btn-soft mt-4 !px-5" onClick={onBack}>
          Go back
        </button>
      </div>
    );
  }

  if (!po?.supplierAccepted) {
    return (
      <div className="border border-dashed border-line rounded-xl px-5 py-8 text-center">
        <p className="font-semibold text-brand-800">Purchase Order required</p>
        <p className="mt-2 text-sm text-mute">Confirm the PO and wait for the supplier to accept it before payment.</p>
        <button type="button" className="btn-soft mt-4 !px-5" onClick={onBack}>
          Go to Purchase Order
        </button>
      </div>
    );
  }

  const method = payment?.method || "";
  const receiptName = payment?.receiptName || "";
  const supplierAccepted = Boolean(payment?.supplierAccepted);
  const isCod = method === "cod" || acceptedQuotesAreCod(acceptance, quotes);
  const canContinue = isCod ? Boolean(method) : Boolean(method && receiptName && supplierAccepted);

  function onUploadReceipt(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange({
      ...payment,
      receiptName: file.name,
      supplierAccepted: false,
    });
    e.target.value = "";
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mute">Payment</p>
      <h3 className="mt-1 text-lg font-bold text-brand-800">Pay &amp; confirm with receipt</h3>
      <p className="mt-1 text-sm text-mute">
        {acceptance.label} · {formatPrice(acceptance.total)}
      </p>

      <DocStatus
        steps={[
          {
            n: 1,
            label: "Choose payment method",
            done: Boolean(method),
            current: !method,
          },
          {
            n: 2,
            label: "Upload payment receipt",
            hint: isCod
              ? "Optional for COD — pay on delivery. You can open Delivery now."
              : "Bank / card transfer proof.",
            done: isCod || Boolean(receiptName),
            current: !isCod && Boolean(method) && !receiptName,
          },
          {
            n: 3,
            label: "Supplier accepts receipt",
            hint: isCod ? "Not required for COD (貨到付款)." : "Supplier confirms payment received.",
            done: isCod || supplierAccepted,
            current: !isCod && Boolean(receiptName) && !supplierAccepted,
          },
        ]}
      />

      <div className="mt-5 grid sm:grid-cols-2 gap-3">
        {[
          { id: "online", title: "Online payment", hint: "Bank transfer using the account below, then upload receipt." },
          { id: "cod", title: "COD — 貨到付款", hint: "Pay on delivery. Bank details are not required." },
        ].map((opt) => {
          const selected = method === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() =>
                onChange({
                  ...payment,
                  method: opt.id,
                  // Changing method clears prior confirm
                  supplierAccepted: false,
                })
              }
              className={`text-left border rounded-xl px-4 py-4 transition-colors ${
                selected ? "border-brand-600 bg-brand-50" : "border-line bg-white hover:border-brand-600/50"
              }`}
            >
              <p className="font-semibold text-brand-800">{opt.title}</p>
              <p className="mt-1 text-xs text-mute leading-relaxed">{opt.hint}</p>
            </button>
          );
        })}
      </div>

      {method === "online" ? <BankTransferInfo acceptance={acceptance} /> : null}

      <div className="mt-5 border border-line rounded-xl p-4">
        <p className="text-sm font-semibold text-brand-800">Payment receipt</p>
        <p className="mt-1 text-xs text-mute">
          {isCod
            ? "COD (貨到付款) — pay on delivery. Receipt and supplier accept are not required to open Delivery."
            : "Buyer uploads · supplier must accept before delivery."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="btn-soft !px-4 !py-2 cursor-pointer">
            <input type="file" accept="image/*,.pdf" className="sr-only" onChange={onUploadReceipt} />
            {receiptName ? "Replace file" : "Upload receipt"}
          </label>
          {receiptName ? (
            <span className="text-sm text-ink truncate max-w-[16rem]" title={receiptName}>
              {receiptName}
            </span>
          ) : (
            <span className="text-sm text-mute">No file yet</span>
          )}
        </div>

        {receiptName && !supplierAccepted ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-xs text-mute">Waiting for supplier to accept this receipt…</p>
            <button
              type="button"
              className="btn-primary !px-4 !py-2 text-sm"
              onClick={() => onChange({ ...payment, supplierAccepted: true })}
            >
              Simulate supplier accept
            </button>
          </div>
        ) : null}

        {supplierAccepted ? (
          <p className="mt-4 text-sm font-semibold text-brand-700 border-t border-line pt-4">
            Supplier accepted the receipt.
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className="btn-soft !px-4 !py-2.5" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="btn-primary !px-5 !py-2.5 disabled:opacity-40"
          disabled={!canContinue}
          onClick={onContinue}
        >
          Continue to delivery
        </button>
      </div>
    </div>
  );
}

function DeliveryStep({ rfq, acceptance, quotes, po, payment, delivery, onChange, onBack }) {
  if (!acceptance) {
    return (
      <div className="border border-dashed border-line rounded-xl px-5 py-8 text-center">
        <p className="font-semibold text-brand-800">No accepted selection yet</p>
        <p className="mt-2 text-sm text-mute">Complete Quotes → Purchase Order → Payment first, or jump there from the step bar.</p>
      </div>
    );
  }

  if (!canOpenDelivery(payment, acceptance, quotes, po)) {
    return (
      <div className="border border-dashed border-line rounded-xl px-5 py-8 text-center">
        <p className="font-semibold text-brand-800">Finish payment first</p>
        <p className="mt-2 text-sm text-mute">Upload receipt and wait for supplier accept, then return here. COD (貨到付款) can skip this gate.</p>
        <button type="button" className="btn-soft mt-4 !px-5" onClick={onBack}>
          Go to Payment
        </button>
      </div>
    );
  }

  const noteName = delivery?.noteName || "";
  const buyerAccepted = Boolean(delivery?.buyerAccepted);

  function onUploadNote(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange({
      ...delivery,
      noteName: file.name,
      buyerAccepted: false,
    });
    e.target.value = "";
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mute">Delivery &amp; docs</p>
      <h3 className="mt-1 text-lg font-bold text-brand-800">Delivery note confirmation</h3>
      <p className="mt-1 text-sm text-mute">
        {acceptance.label} · {formatPrice(acceptance.total)} ·{" "}
        {payment?.method === "cod" ? "COD" : "Online"}
      </p>

      <DocStatus
        steps={[
          {
            n: 1,
            label: "Supplier uploads delivery note",
            done: Boolean(noteName),
            current: !noteName,
          },
          {
            n: 2,
            label: "Buyer accepts delivery note",
            hint: "Confirm goods / note match the order.",
            done: buyerAccepted,
            current: Boolean(noteName) && !buyerAccepted,
          },
        ]}
      />

      <div className="mt-5 space-y-3">
        <label className="block">
          <span className="block text-sm font-medium mb-1">Site / delivery address</span>
          <input className="field-input" defaultValue={rfq.address || ""} readOnly />
        </label>
      </div>

      <div className="mt-5 border border-line rounded-xl p-4">
        <p className="text-sm font-semibold text-brand-800">Delivery note</p>
        <p className="mt-1 text-xs text-mute">Supplier uploads · buyer must accept to close delivery.</p>

        {!noteName ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-mute">Waiting for supplier upload…</p>
            <label className="btn-primary !px-4 !py-2 cursor-pointer text-sm">
              <input type="file" accept="image/*,.pdf" className="sr-only" onChange={onUploadNote} />
              Simulate supplier upload
            </label>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-ink truncate max-w-[16rem]" title={noteName}>
                {noteName}
              </span>
              <label className="btn-soft !px-3 !py-1.5 cursor-pointer text-xs">
                <input type="file" accept="image/*,.pdf" className="sr-only" onChange={onUploadNote} />
                Replace
              </label>
            </div>

            {!buyerAccepted ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <p className="text-xs text-mute">Review the note, then accept as buyer.</p>
                <button
                  type="button"
                  className="btn-primary !px-4 !py-2 text-sm"
                  onClick={() => onChange({ ...delivery, buyerAccepted: true })}
                >
                  Buyer accept delivery note
                </button>
              </div>
            ) : (
              <p className="text-sm font-semibold text-brand-700 border-t border-line pt-4">
                Buyer accepted the delivery note. Delivery complete.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className="btn-soft !px-4 !py-2.5" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
}
