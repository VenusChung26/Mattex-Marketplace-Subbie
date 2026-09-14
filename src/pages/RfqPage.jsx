/**
 * RFQ draft — select products, then confirm logistics on the next page.
 */
import { Link, useSearchParams } from "react-router-dom";
import { useStore } from "../hooks/useStore";
import {
  addCustomLine,
  getProduct,
  isOrderable,
  draftTotals,
  formatPrice,
  removeLine,
  removeLines,
  setDraftAddress,
  setDraftProject,
  setDraftNote,
  setDraftResponseDate,
  setDraftDeliveryDate,
  setDraftDeliveryMode,
  setDraftDeliveryLots,
  setDraftCanonicalCategory,
  setDraftAcceptSubstitutes,
  inferCanonicalCategory,
  setLineQty,
  setLineIntent,
  setLineRequestedPrice,
  submitRfq,
  openWhatsappDraft,
  updateCustomLine,
  requireBuyerAuth,
  openAuthModal,
} from "../lib/store";
import { useEffect, useMemo, useState } from "react";
import SiteHeader from "../components/SiteHeader";
import CustomProductForm from "../components/CustomProductForm";
import { useLanguage } from "../i18n";
import { allProductsTo, withLocale } from "../lib/locale";
import Seo from "../components/Seo";
import { VariantA, ConfirmRfqView, CUSTOM_PLACEMENT } from "./rfq-prototype/RfqDraftVariants";
import { SHOW_RFQ } from "../lib/flags";

export default function RfqPage() {
  const { user, draft } = useStore();
  const { t, lang } = useLanguage();
  const [params] = useSearchParams();
  const variant = String(params.get("variant") || "A").toUpperCase();
  const customPlacement = CUSTOM_PLACEMENT[variant] || "inline";
  const totals = draftTotals(draft || { lines: [], note: "", responseDate: "", address: "" });
  const profileProject = String(user?.project || "").trim();
  const profileAddress = String(user?.companyAddress || "").trim();
  const [note, setNote] = useState(totals.note || "");
  const [responseDate, setResponseDate] = useState(totals.responseDate || "");
  const [deliveryDate, setDeliveryDate] = useState(totals.deliveryDate || "");
  const [deliveryMode, setDeliveryMode] = useState(totals.deliveryMode || "one_time");
  const [deliveryLots, setDeliveryLots] = useState(totals.deliveryLots || []);
  const [project, setProject] = useState(totals.project || profileProject);
  const [address, setAddress] = useState(totals.address || profileAddress);
  const [canonicalCategory, setCanonicalCategory] = useState(totals.canonicalCategory || "");
  const [acceptSubstitutes, setAcceptSubstitutes] = useState(Boolean(totals.acceptSubstitutes));
  const [success, setSuccess] = useState(null);
  const [formError, setFormError] = useState("");
  const [formErrorKind, setFormErrorKind] = useState("");
  const [formErrorField, setFormErrorField] = useState("");
  const [successKind, setSuccessKind] = useState("");
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedIds, setSelectedIds] = useState(() =>
    totals.lines.map((l) => String(l.productId))
  );
  const [editingId, setEditingId] = useState(null);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [confirmKind, setConfirmKind] = useState(null);
  const [confirmChannel, setConfirmChannel] = useState("rfq");

  const selectableLineIds = totals.lines
    .filter((line) => line.custom || isOrderable(getProduct(line.productId)))
    .map((line) => String(line.productId));

  useEffect(() => {
    const allowed = new Set(selectableLineIds);
    setSelectedIds((prev) => {
      const next = prev.filter((id) => allowed.has(id));
      if (next.length === prev.length && next.every((id, i) => id === prev[i])) return prev;
      return next;
    });
  }, [selectableLineIds.join("|")]);

  useEffect(() => {
    setNote(totals.note || "");
    setResponseDate(totals.responseDate || "");
    setDeliveryDate(totals.deliveryDate || "");
    setDeliveryMode(totals.deliveryMode || "one_time");
    setDeliveryLots(totals.deliveryLots || []);
    setProject(totals.project || profileProject);
    setAddress(totals.address || profileAddress);
    setCanonicalCategory(totals.canonicalCategory || "");
    setAcceptSubstitutes(Boolean(totals.acceptSubstitutes));
  }, [
    totals.note,
    totals.responseDate,
    totals.deliveryDate,
    totals.deliveryMode,
    JSON.stringify(totals.deliveryLots || []),
    totals.project,
    profileProject,
    totals.address,
    profileAddress,
    totals.canonicalCategory,
    totals.acceptSubstitutes,
  ]);

  useEffect(() => {
    if (String(totals.project || "").trim() || !profileProject) return;
    setDraftProject(profileProject);
  }, [totals.project, profileProject]);

  useEffect(() => {
    if (String(totals.address || "").trim() || !profileAddress) return;
    setDraftAddress(profileAddress);
  }, [totals.address, profileAddress]);

  const lineIdsKey = totals.lines.map((l) => String(l.productId)).join(",");

  useEffect(() => {
    const ids = lineIdsKey ? lineIdsKey.split(",") : [];
    setSelectedIds((prev) => {
      const keep = prev.filter((id) => ids.includes(id));
      const added = ids.filter((id) => !prev.includes(id));
      const next = [...keep, ...added];
      if (next.length === prev.length && next.every((id, i) => id === prev[i])) return prev;
      return next;
    });
    if (editingId && !ids.includes(String(editingId))) setEditingId(null);
  }, [lineIdsKey, editingId]);

  const selectedKey = selectedIds.join(",");
  useEffect(() => {
    if (canonicalCategory) return;
    const selected = new Set(selectedKey ? selectedKey.split(",") : []);
    const quoteLines = totals.lines.filter(
      (line) => line.intent !== "buy" && selected.has(String(line.productId))
    );
    const inferred = inferCanonicalCategory(quoteLines);
    if (inferred) {
      setCanonicalCategory(inferred);
      setDraftCanonicalCategory(inferred);
    }
  }, [canonicalCategory, selectedKey, lineIdsKey, totals.lines]);

  const selectedTotals = useMemo(
    () => draftTotals(draft || { lines: [] }, selectedIds),
    [draft, selectedIds]
  );

  const allSelected =
    selectableLineIds.length > 0 && selectedIds.length === selectableLineIds.length &&
    selectableLineIds.every((id) => selectedIds.includes(id));

  function handleAddCustom(payload) {
    if (!requireBuyerAuth({ custom: true })) return;
    const result = addCustomLine(payload);
    if (!result.ok) {
      setFormError(t("customNameRequired"));
      return;
    }
    setShowAddCustom(false);
    setFormError("");
  }

  function handleUpdateCustom(productId, payload) {
    const result = updateCustomLine(productId, payload);
    if (!result.ok) {
      setFormError(t("customNameRequired"));
      return;
    }
    setEditingId(null);
    setFormError("");
  }

  if (success) {
    const remainingCount = (draft?.lines || []).length;
    return (
      <Shell>
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{t("submitted")}</p>
            <h2 className="mt-1 text-xl font-bold text-brand-800">
              {successKind === "buy" ? t("rfqSentBuy") : successKind === "quote" ? t("rfqSentQuote") : t("rfqSent")}
            </h2>
            <p className="mt-2 text-sm text-mute">
              {success.id} · {success.lines.length} line(s) · {formatPrice(success.pricedSubtotal)}
            </p>
            {success.channel === "whatsapp" ? (
              <p className="mt-2 text-sm font-medium text-brand-800">{t("waSavedInSubbie")}</p>
            ) : null}
            {remainingCount > 0 ? (
              <p className="mt-3 text-sm font-medium text-brand-800">
                {remainingCount === 1
                  ? t("draftRemainingOne")
                  : t("draftRemaining", { n: remainingCount })}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              {remainingCount > 0 ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setSuccess(null);
                    setSuccessKind("");
                    setConfirmKind(null);
                  }}
                >
                  {t("continueRemainingDraft")}
                </button>
              ) : null}
              <Link to={allProductsTo(lang)} className={remainingCount > 0 ? "btn-soft !border-brand-600 !text-brand-600" : "btn-primary"}>
                {t("keepShopping")}
              </Link>
              {SHOW_RFQ ? (
              <Link to={withLocale(lang, "/rfqs")} className="btn-soft !border-brand-600 !text-brand-600">
                {t("viewMyRfqs")}
              </Link>
              ) : null}
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (!totals.lines.length) {
    return (
      <Shell>
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-4">
          <div className="bg-white border border-line rounded-xl p-8 text-center">
            <p className="text-lg font-semibold text-brand-800">{t("emptyDraft")}</p>
            <p className="mt-2 text-sm text-mute">{t("emptyDraftHint")}</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <Link to={allProductsTo(lang)} className="btn-soft">
                {t("browseCatalog")}
              </Link>
              <a href="#add-custom-product" className="btn-primary">
                + {t("noProductsCustomCta")}
              </a>
            </div>
            <p className="mt-4 text-sm text-mute">{t("emptyDraftCustomHint")}</p>
          </div>
          <div id="add-custom-product">
            <CustomProductForm onSubmit={handleAddCustom} />
          </div>
        </div>
      </Shell>
    );
  }

  function toggleId(id) {
    const key = String(id);
    if (!selectableLineIds.includes(key) && !selectedIds.includes(key)) return;
    if (!selectableLineIds.includes(key)) {
      setSelectedIds((prev) => prev.filter((x) => x !== key));
      return;
    }
    setSelectedIds((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
    setFormError("");
    setFormErrorKind("");
  }

  function toggleAll() {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(selectableLineIds);
    setFormError("");
    setFormErrorKind("");
  }

  function toggleSection(ids) {
    const keys = ids.map(String).filter((id) => selectableLineIds.includes(id));
    const allOn = keys.length > 0 && keys.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) =>
      allOn ? prev.filter((id) => !keys.includes(id)) : [...new Set([...prev, ...keys])]
    );
    setFormError("");
    setFormErrorKind("");
  }

  function onContinueKind(kind, channel = "rfq") {
    const viaWhatsapp = channel === "whatsapp";
    if (!requireBuyerAuth()) return;
    const ids = totals.lines
      .filter((line) => (kind === "buy" ? line.intent === "buy" : line.intent !== "buy"))
      .map((line) => String(line.productId))
      .filter((id) => selectedIds.includes(id));
    if (!ids.length) {
      setFormErrorKind(kind);
      setFormError(t("noneSelected"));
      return;
    }
    const blocked = ids.filter((id) => {
      const line = totals.lines.find((row) => String(row.productId) === id);
      return line && !line.custom && !isOrderable(getProduct(id));
    });
    if (blocked.length) {
      setFormErrorKind(kind);
      setFormError(t("discontinuedSubmitError"));
      return;
    }
    setFormError("");
    setFormErrorKind("");
    setFormErrorField("");
    if (kind === "buy" || kind === "quote") {
      setDraftNote(note);
      setDraftResponseDate(responseDate);
      setDraftDeliveryDate(deliveryDate);
      setDraftDeliveryMode(deliveryMode);
      setDraftDeliveryLots(deliveryLots);
      setDraftProject(project);
      setDraftAddress(address);
      setDraftCanonicalCategory(canonicalCategory);
      setDraftAcceptSubstitutes(acceptSubstitutes);
      setConfirmChannel(viaWhatsapp ? "whatsapp" : "rfq");
      setConfirmKind(kind);
      window.scrollTo(0, 0);
      return;
    }
    setConfirmChannel(viaWhatsapp ? "whatsapp" : "rfq");
    setConfirmKind(kind);
    window.scrollTo(0, 0);
  }

  function linesBelowMoq(ids) {
    return totals.lines.filter((line) => {
      if (!ids.includes(String(line.productId))) return false;
      if (line.custom) return false;
      const moq = Math.max(1, Number(line.moq) || 1);
      return Number(line.qty) < moq;
    });
  }

  function onSubmitKind(kind) {
    if (!requireBuyerAuth()) return;
    const ids = totals.lines
      .filter((line) => (kind === "buy" ? line.intent === "buy" : line.intent !== "buy"))
      .map((line) => String(line.productId))
      .filter((id) => selectedIds.includes(id));
    const under = linesBelowMoq(ids);
    if (under.length) {
      setFormErrorKind(kind);
      setFormError(t("qtyBelowMoq", { n: under[0].moq || 1 }));
      window.setTimeout(() => {
        document.getElementById("rfq-confirm-lines")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }
    setDraftNote(note);
    setDraftResponseDate(responseDate);
    setDraftDeliveryDate(deliveryDate);
    setDraftDeliveryMode(deliveryMode);
    setDraftDeliveryLots(deliveryLots);
    setDraftProject(project);
    setDraftAddress(address);
    setDraftCanonicalCategory(canonicalCategory);
    setDraftAcceptSubstitutes(acceptSubstitutes);
    const channel = confirmChannel === "whatsapp" ? "whatsapp" : "rfq";
    const result = submitRfq(ids, { kind, channel });
    if (!result.ok) {
      setFormErrorKind(kind);
      setFormErrorField(result.error || "");
      if (result.error === "response_date") setFormError(t("responseDateRequired"));
      else if (result.error === "delivery_date") setFormError(t("deliveryDateRequired"));
      else if (result.error === "delivery_lots") setFormError(t("deliveryLotsRequired"));
      else if (result.error === "address") setFormError(kind === "buy" ? t("buyNeedsAddress") : t("addressRequired"));
      else if (result.error === "none_selected") setFormError(t("noneSelected"));
      else if (result.error === "discontinued") setFormError(t("discontinuedSubmitError"));
      else setFormError(t("submitFailed"));
      if (["response_date", "delivery_date", "delivery_lots", "address"].includes(result.error)) {
        window.setTimeout(() => {
          document.getElementById("rfq-details")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 50);
      }
      return;
    }
    const lines = totals.lines.filter((line) => ids.includes(String(line.productId)));
    if (channel === "whatsapp") {
      openWhatsappDraft(lines, kind, { refNo: result.rfq.id });
    }
    setFormError("");
    setFormErrorKind("");
    setFormErrorField("");
    setConfirmKind(null);
    setConfirmChannel("rfq");
    setSuccess(result.rfq);
    setSuccessKind(kind);
  }

  function onSubmit() {
    onSubmitKind("quote");
  }

  const variantProps = {
    lines: totals.lines,
    selectedIds,
    selectedTotals,
    allSelected,
    note,
    responseDate,
    deliveryDate,
    deliveryMode,
    deliveryLots,
    project,
    address,
    canonicalCategory,
    acceptSubstitutes,
    formError,
    formErrorKind,
    formErrorField,
    toggleId,
    toggleAll,
    toggleSection,
    onSubmitKind,
    onContinueKind,
    confirmKind,
    confirmChannel,
    setConfirmKind,
    setLineQty,
    setLineIntent,
    setLineRequestedPrice,
    removeLine,
    removeLines,
    setNote,
    setResponseDate,
    setDeliveryDate,
    setDeliveryMode,
    setDeliveryLots,
    setProject,
    setAddress,
    setCanonicalCategory,
    setAcceptSubstitutes,
    setDraftNote,
    setDraftResponseDate,
    setDraftDeliveryDate,
    setDraftDeliveryMode,
    setDraftDeliveryLots,
    setDraftProject,
    setDraftAddress,
    setDraftCanonicalCategory,
    setDraftAcceptSubstitutes,
    onSubmit,
    setFormError: (msg) => {
      setFormError(msg);
      if (!msg) setFormErrorField("");
    },
    wizardStep,
    setWizardStep,
    editingId,
    setEditingId,
    showAddCustom,
    setShowAddCustom,
    onAddCustom: handleAddCustom,
    onUpdateCustom: handleUpdateCustom,
    customPlacement,
  };

  return (
    <Shell>
      {confirmKind ? (
        <ConfirmRfqView {...variantProps} />
      ) : (
        <VariantA {...variantProps} />
      )}
    </Shell>
  );
}

function Shell({ children }) {
  const { t, lang } = useLanguage();
  return (
    <div className="bg-paper min-h-screen">
      <Seo lang={lang} path={withLocale(lang, "/rfq")} title={`${t("rfqDraftTitle")} | Mattex Marketplace`} description={t("reviewQuoteHint")} noindex />
      <SiteHeader />
      {children}
    </div>
  );
}
