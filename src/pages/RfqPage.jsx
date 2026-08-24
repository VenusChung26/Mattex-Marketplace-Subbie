/**
 * RFQ draft — select products, then confirm logistics on the next page.
 */
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../hooks/useStore";
import {
  addCustomLine,
  draftTotals,
  formatPrice,
  removeLine,
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
  setPendingWhatsappOrder,
  updateCustomLine,
} from "../lib/store";
import { useEffect, useMemo, useState } from "react";
import SiteHeader from "../components/SiteHeader";
import CustomProductForm from "../components/CustomProductForm";
import { useLanguage } from "../i18n";
import { VariantA, ConfirmRfqView, RFQ_PROTOTYPE_VARIANTS, CUSTOM_PLACEMENT } from "./rfq-prototype/RfqDraftVariants";
import PrototypeSwitcher from "../components/PrototypeSwitcher";

export default function RfqPage() {
  const { user, draft } = useStore();
  const { t } = useLanguage();
  const navigate = useNavigate();
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
  const [successKind, setSuccessKind] = useState("");
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedIds, setSelectedIds] = useState(() =>
    totals.lines.map((l) => String(l.productId))
  );
  const [editingId, setEditingId] = useState(null);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [confirmKind, setConfirmKind] = useState(null);

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
    totals.lines.length > 0 && selectedIds.length === totals.lines.length;

  function handleAddCustom(payload) {
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

  if (!user) {
    return (
      <Shell>
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-white border border-line rounded-xl p-6">
            <h2 className="text-lg font-bold text-brand-800">{t("loginRequired")}</h2>
            <p className="mt-2 text-sm text-mute">{t("loginRequiredRfq")}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/login" className="btn-primary">
                {t("login")}
              </Link>
              <Link to="/signup" className="btn-soft !border-brand-600 !text-brand-600">
                {t("createAccount")}
              </Link>
            </div>
          </div>
        </div>
      </Shell>
    );
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
              <Link to="/#products" className={remainingCount > 0 ? "btn-soft !border-brand-600 !text-brand-600" : "btn-primary"}>
                {t("keepShopping")}
              </Link>
              <Link to="/rfqs" className="btn-soft !border-brand-600 !text-brand-600">
                {t("viewMyRfqs")}
              </Link>
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
            <Link to="/#products" className="btn-primary mt-5 inline-flex">
              {t("browseCatalog")}
            </Link>
            <p className="mt-4 text-sm text-mute">{t("emptyDraftCustomHint")}</p>
          </div>
          <CustomProductForm onSubmit={handleAddCustom} />
        </div>
      </Shell>
    );
  }

  function toggleId(id) {
    const key = String(id);
    setSelectedIds((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
    setFormError("");
    setFormErrorKind("");
  }

  function toggleAll() {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(totals.lines.map((l) => String(l.productId)));
    setFormError("");
    setFormErrorKind("");
  }

  function toggleSection(ids) {
    const keys = ids.map(String);
    const allOn = keys.length > 0 && keys.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) =>
      allOn ? prev.filter((id) => !keys.includes(id)) : [...new Set([...prev, ...keys])]
    );
    setFormError("");
    setFormErrorKind("");
  }

  function onContinueKind(kind) {
    const ids = totals.lines
      .filter((line) => (kind === "buy" ? line.intent === "buy" : line.intent !== "buy"))
      .map((line) => String(line.productId))
      .filter((id) => selectedIds.includes(id));
    if (!ids.length) {
      setFormErrorKind(kind);
      setFormError(t("noneSelected"));
      return;
    }
    setFormError("");
    setFormErrorKind("");
    if (kind === "buy") {
      setDraftNote(note);
      setDraftResponseDate(responseDate);
      setDraftDeliveryDate(deliveryDate);
      setDraftDeliveryMode(deliveryMode);
      setDraftDeliveryLots(deliveryLots);
      setDraftProject(project);
      setDraftAddress(address);
      setDraftCanonicalCategory(canonicalCategory);
      setDraftAcceptSubstitutes(acceptSubstitutes);
      const result = submitRfq(ids, { kind: "buy", skipLogistics: true, channel: "whatsapp" });
      if (!result.ok) {
        setFormErrorKind("buy");
        setFormError(result.error === "not_logged_in" ? t("loginRequiredRfq") : t("submitFailed"));
        return;
      }
      setPendingWhatsappOrder(result.rfq);
      navigate(`/whatsapp-chat/${encodeURIComponent(result.rfq.id)}`);
      return;
    }
    setConfirmKind(kind);
    window.scrollTo(0, 0);
  }

  function onSubmitKind(kind) {
    const ids = totals.lines
      .filter((line) => (kind === "buy" ? line.intent === "buy" : line.intent !== "buy"))
      .map((line) => String(line.productId))
      .filter((id) => selectedIds.includes(id));
    setDraftNote(note);
    setDraftResponseDate(responseDate);
    setDraftDeliveryDate(deliveryDate);
    setDraftDeliveryMode(deliveryMode);
    setDraftDeliveryLots(deliveryLots);
    setDraftProject(project);
    setDraftAddress(address);
    setDraftCanonicalCategory(canonicalCategory);
    setDraftAcceptSubstitutes(acceptSubstitutes);
    const result = submitRfq(ids, { kind });
    if (!result.ok) {
      setFormErrorKind(kind);
      if (result.error === "response_date") setFormError(t("responseDateRequired"));
      else if (result.error === "delivery_date") setFormError(t("deliveryDateRequired"));
      else if (result.error === "delivery_lots") setFormError(t("deliveryLotsRequired"));
      else if (result.error === "address") setFormError(kind === "buy" ? t("buyNeedsAddress") : t("addressRequired"));
      else if (result.error === "none_selected") setFormError(t("noneSelected"));
      else setFormError(t("submitFailed"));
      return;
    }
    setFormError("");
    setFormErrorKind("");
    setConfirmKind(null);
    if (kind === "buy") {
      navigate(`/whatsapp-chat/${encodeURIComponent(result.rfq.id)}`);
      return;
    }
    setSuccessKind(kind);
    setSuccess(result.rfq);
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
    toggleId,
    toggleAll,
    toggleSection,
    onSubmitKind,
    onContinueKind,
    confirmKind,
    setConfirmKind,
    setLineQty,
    setLineIntent,
    setLineRequestedPrice,
    removeLine,
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
    setFormError,
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
      <PrototypeSwitcher variants={RFQ_PROTOTYPE_VARIANTS} current={variant} />
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="bg-paper min-h-screen">
      <SiteHeader />
      {children}
    </div>
  );
}
