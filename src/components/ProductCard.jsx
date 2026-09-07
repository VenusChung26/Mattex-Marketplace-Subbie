import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { Check, CircleDollarSign, Minus, Plus, ShoppingCart } from "lucide-react";
import { canDirectBuy, catalogPathForCategory, isHitProduct, removeLine, setLineQty, stockStatusKey, supplierDisplayName, supplierPath } from "../lib/store";
import { useStore } from "../hooks/useStore";
import { useLanguage } from "../i18n";
import { withLocale } from "../lib/locale";
import ProductPrice from "./ProductPrice";
import ProductRating from "./ProductRating";

function LeavesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 shrink-0"
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
  );
}

function leadTimeLabel(lead, t) {
  if (!lead) return "—";
  const time = lead.min === lead.max ? String(lead.min) : `${lead.min}–${lead.max}`;
  return t("leadTimeValue", { time });
}

const TAG_PILL =
  "inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 tracking-[0.08em] uppercase";

export function ProductImage({ src, alt, className = "", imgClassName = "", compact = false }) {
  const { t } = useLanguage();
  return (
    <span className={`relative block overflow-hidden ${className}`}>
      <img src={src} alt={alt} className={imgClassName} loading="lazy" decoding="async" />
      <span
        className={`absolute bottom-0 inset-x-0 pointer-events-none bg-charcoal/75 text-white text-center ${
          compact ? "text-[8px] leading-tight px-1 py-0.5" : "text-[10px] px-1.5 py-1"
        }`}
      >
        {t("imageForReference")}
      </span>
    </span>
  );
}

export function ProductTagPills({ product, className = "" }) {
  const { t } = useLanguage();
  const hit = isHitProduct(product);
  if (!product?.green && !hit) return null;
  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
      {hit ? (
        <span className={`${TAG_PILL} bg-charcoal text-white`}>{t("hitBadge")}</span>
      ) : null}
      {product.green ? (
        <span className={`${TAG_PILL} bg-[#1f8a45] text-white`}>
          <LeavesIcon />
          {t("greenBadge")}
        </span>
      ) : null}
    </span>
  );
}

const META_CHIP = "inline-flex items-center whitespace-nowrap bg-paper text-[10px] px-1.5 py-0.5";

export function ProductMetaChips({ product, className = "", showTags = false }) {
  const { t } = useLanguage();
  const stockKey = stockStatusKey(product.stockStatus);
  const inStock = product.stockStatus === "in_stock";
  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      <span
        className={`${META_CHIP} font-semibold ${
          inStock ? "bg-brand-50 text-brand-800" : "text-ink"
        }`}
      >
        {t(stockKey)}
      </span>
      <span className={`${META_CHIP} font-medium text-mute`}>
        {t("moq")} {product.moq} {product.unit}
      </span>
      <span className={`${META_CHIP} font-medium text-mute`}>
        {leadTimeLabel(product.leadTime, t)}
      </span>
      {showTags ? <ProductTagPills product={product} /> : null}
    </div>
  );
}

export function ProductBadges({ product, rank = null }) {
  const { t } = useLanguage();
  const hit = isHitProduct(product);
  const showRank = rank != null;
  if (!product?.green && !hit && !showRank) return null;
  return (
    <div className="absolute top-2.5 right-2.5 z-10 flex flex-wrap items-start justify-end gap-1 pointer-events-none">
      {showRank ? (
        <span className="bg-charcoal/90 text-white text-[11px] font-bold px-2 py-1">#{rank}</span>
      ) : hit ? (
        <span className="bg-charcoal/90 text-white text-[10px] font-bold px-2 py-1 tracking-[0.08em]">
          {t("hitBadge")}
        </span>
      ) : null}
      {product.green ? (
        <span className="inline-flex items-center gap-1 bg-[#1f8a45] text-white text-[10px] font-bold px-2 py-1 tracking-[0.08em]">
          <LeavesIcon />
          {t("greenBadge")}
        </span>
      ) : null}
    </div>
  );
}

function canHoverMenu() {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function cartLineFor(draft, productId) {
  return (draft?.lines || []).find((line) => String(line.productId) === String(productId) && !line.custom) || null;
}

function clampQty(value) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

function tileAddIntent(product) {
  return canDirectBuy(product) ? "buy" : "quote";
}

const TILE_ICON_BTN =
  "inline-flex h-10 min-w-0 flex-1 items-center justify-center !px-0 !py-0";
const TILE_STEPPER_BTN =
  "inline-flex h-10 w-7 shrink-0 items-center justify-center text-mute hover:bg-paper hover:text-ink disabled:opacity-40";
const ADD_FLASH_MS = 480;

function ConfirmRemoveDialog({ title, cancelLabel, confirmLabel, onCancel, onConfirm }) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="presentation">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-cart-title"
        className="relative w-full max-w-sm border border-line bg-white p-5 shadow-[0_24px_60px_rgba(16,21,19,0.25)]"
      >
        <h3 id="remove-cart-title" className="text-base font-bold text-brand-800">
          {title}
        </h3>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn-soft !px-4 !py-2" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="btn-primary !px-4 !py-2" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function TileActionIcon({ flash, children }) {
  return flash ? <Check className="h-4 w-4 shrink-0 btn-added-check" aria-hidden /> : children;
}

export function ProductTileActions({ product, onAdd }) {
  const { t, lang } = useLanguage();
  const { draft } = useStore();
  const navigate = useNavigate();
  const [qtyDraft, setQtyDraft] = useState(null);
  const [flash, setFlash] = useState("");
  const [flashKey, setFlashKey] = useState(0);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const flashRef = useRef("");
  const flashTimer = useRef(null);
  const navTimer = useRef(null);
  const line = cartLineFor(draft, product.id);
  const inCart = Boolean(line);
  const addIntent = tileAddIntent(product);
  const minQty = Math.max(1, Number(product.moq) || 1);
  const cartQty = inCart ? clampQty(line.qty) : minQty;
  const shownQty = qtyDraft == null ? cartQty : qtyDraft;
  const holdingAdd = flash === "add" || flashRef.current === "add";
  const showStepper = inCart && !holdingAdd;

  useEffect(() => {
    setQtyDraft(null);
  }, [inCart, line?.qty]);

  useEffect(
    () => () => {
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
      if (navTimer.current) window.clearTimeout(navTimer.current);
    },
    []
  );

  function pulse(kind, ms = ADD_FLASH_MS) {
    flashRef.current = kind;
    setFlash(kind);
    setFlashKey((key) => key + 1);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => {
      flashRef.current = "";
      setFlash("");
    }, ms);
  }

  function requestRemove() {
    setQtyDraft(null);
    setConfirmRemove(true);
  }

  function commitQty(next) {
    const parsed = Math.floor(Number(next));
    if (!Number.isFinite(parsed) || parsed < 1) {
      requestRemove();
      return;
    }
    setQtyDraft(null);
    setLineQty(product.id, Math.max(minQty, parsed));
  }

  function handleAddToCart() {
    if (holdingAdd || inCart) return;
    pulse("add");
    onAdd?.(product.id, addIntent, minQty);
  }

  function handlePurchaseNow() {
    pulse("buy");
    if (!inCart) onAdd?.(product.id, addIntent, minQty);
    if (navTimer.current) window.clearTimeout(navTimer.current);
    navTimer.current = window.setTimeout(() => {
      navigate(withLocale(lang, "/rfq"));
    }, 260);
  }

  function handleMinus() {
    pulse("minus");
    if (cartQty <= minQty) {
      requestRemove();
      return;
    }
    commitQty(cartQty - 1);
  }

  return (
    <div className="flex w-full min-w-0 items-stretch gap-1.5">
      {showStepper ? (
        <div className="flex min-w-0 flex-1 items-stretch border border-line bg-white">
          <button
            type="button"
            key={flash === "minus" ? `minus-${flashKey}` : "minus"}
            className={`${TILE_STEPPER_BTN} ${flash === "minus" ? "btn-added" : ""}`}
            aria-label={t("decreaseQty")}
            title={t("decreaseQty")}
            onClick={handleMinus}
          >
            <Minus className="h-3.5 w-3.5" aria-hidden />
          </button>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            aria-label={t("qty")}
            value={shownQty}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              setQtyDraft(raw === "" ? "" : Math.floor(Number(raw)));
            }}
            onBlur={() => {
              if (qtyDraft == null || qtyDraft === "") {
                setQtyDraft(null);
                return;
              }
              commitQty(qtyDraft);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            className="min-w-[1.5rem] w-8 flex-1 bg-transparent text-center text-xs font-semibold tabular-nums text-ink outline-none"
          />
          <button
            type="button"
            key={flash === "plus" ? `plus-${flashKey}` : "plus"}
            className={`${TILE_STEPPER_BTN} ${flash === "plus" ? "btn-added" : ""}`}
            aria-label={t("increaseQty")}
            title={t("increaseQty")}
            onClick={() => {
              pulse("plus");
              commitQty(cartQty + 1);
            }}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      ) : (
        <button
          type="button"
          key={flash === "add" ? `add-${flashKey}` : "add"}
          className={`btn-soft ${TILE_ICON_BTN} ${flash === "add" ? "btn-added" : ""}`}
          aria-label={t("addToCart")}
          title={t("addToCart")}
          onClick={handleAddToCart}
        >
          <TileActionIcon flash={flash === "add"}>
            <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden />
          </TileActionIcon>
        </button>
      )}
      <button
        type="button"
        key={flash === "buy" ? `buy-${flashKey}` : "buy"}
        className={`btn-primary ${showStepper ? "inline-flex h-10 w-10 shrink-0 items-center justify-center !px-0 !py-0" : TILE_ICON_BTN} ${flash === "buy" ? "btn-added" : ""}`}
        aria-label={t("purchaseNow")}
        title={t("purchaseNow")}
        onClick={handlePurchaseNow}
      >
        <TileActionIcon flash={flash === "buy"}>
          <CircleDollarSign className="h-4 w-4 shrink-0" aria-hidden />
        </TileActionIcon>
      </button>
      {confirmRemove ? (
        <ConfirmRemoveDialog
          title={t("removeFromCartTitle")}
          cancelLabel={t("cancel")}
          confirmLabel={t("remove")}
          onCancel={() => {
            setQtyDraft(null);
            setConfirmRemove(false);
          }}
          onConfirm={() => {
            setConfirmRemove(false);
            setQtyDraft(null);
            removeLine(product.id);
          }}
        />
      ) : null}
    </div>
  );
}

export function ActionChoiceButton({
  className = "",
  block = true,
  count = 0,
  triggerLabel,
  nowLabel,
  addLabel,
  onNow,
  onAdd,
  onOpenChange,
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const closeTimer = useRef(null);
  const pinnedRef = useRef(false);

  function setMenu(next) {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (!next) pinnedRef.current = false;
    setOpen(next);
    onOpenChange?.(next);
  }

  function scheduleClose() {
    if (pinnedRef.current) return;
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setMenu(false), 120);
  }

  useEffect(() => {
    if (!open) return undefined;
    function onPointer(event) {
      if (!rootRef.current?.contains(event.target)) setMenu(false);
    }
    function onKey(event) {
      if (event.key === "Escape") setMenu(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    []
  );

  const label = count > 0 ? t("addedCount", { n: count }) : triggerLabel;

  return (
    <div
      ref={rootRef}
      className={`relative ${block ? "w-full" : "inline-block"} ${open ? "z-30" : ""}`}
      onMouseEnter={() => {
        if (canHoverMenu()) setMenu(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className={`${className} ${count > 0 ? "btn-added" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          pinnedRef.current = true;
          setMenu(true);
        }}
      >
        {label}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute bottom-full left-0 right-0 z-50 mb-1 min-w-[9.5rem] overflow-hidden border border-line bg-white shadow-[0_10px_28px_rgba(16,21,19,0.16)]"
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2.5 text-left text-xs font-semibold text-brand-800 hover:bg-brand-50"
            onClick={() => {
              setMenu(false);
              onNow?.();
            }}
          >
            {nowLabel}
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full border-t border-line px-3 py-2.5 text-left text-xs font-semibold text-ink hover:bg-paper"
            onClick={() => {
              setMenu(false);
              onAdd?.();
            }}
          >
            {addLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function QuoteChoiceButton(props) {
  const { t } = useLanguage();
  return (
    <ActionChoiceButton
      {...props}
      triggerLabel={props.triggerLabel || t("requestQuoteCta")}
      nowLabel={props.nowLabel || t("requestNow")}
      addLabel={props.addLabel || t("addToCart")}
      onNow={props.onNow || props.onRequestNow}
      onAdd={props.onAdd || props.onAddToOrder}
    />
  );
}

export function ProductListRow({ product, onAdd }) {
  const { t, lang } = useLanguage();

  return (
    <article className="relative flex flex-col sm:flex-row sm:items-center gap-3 border border-line bg-white p-3">
      <Link
        to={withLocale(lang, `/details/${product.id}`)}
        className="h-20 w-full sm:h-16 sm:w-24 shrink-0 overflow-hidden bg-brand-50"
      >
        <ProductImage
          src={product.image}
          alt={product.name}
          compact
          className="h-full w-full"
          imgClassName="h-full w-full object-cover"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-600">
          <Link
            to={withLocale(lang, catalogPathForCategory(product.category))}
            className="hover:text-brand-800 hover:underline"
          >
            {product.category}
          </Link>
        </p>
        <h3 className="mt-0.5 font-semibold text-ink leading-snug text-sm sm:text-base break-words">
          <Link to={withLocale(lang, `/details/${product.id}`)} className="hover:text-brand-600">
            {product.name}
          </Link>
        </h3>
        <p className="mt-0.5 text-xs text-mute truncate">
          {t("sku")} {product.productNo || product.id}
          {product.supplier ? ` · ${t("by")} ${supplierDisplayName(product.supplier)}` : ""}
        </p>
        <ProductMetaChips product={product} showTags className="mt-1.5" />
      </div>
      <div className="sm:w-36 shrink-0">
        <ProductPrice product={product} className="!mt-0" />
      </div>
      <div className="sm:w-64 shrink-0">
        <ProductTileActions product={product} onAdd={onAdd} />
      </div>
    </article>
  );
}

export default function ProductCard({ product, onAdd, rank = null }) {
  const { t, lang } = useLanguage();
  const supplierName = supplierDisplayName(product.supplier);

  return (
    <article className="product-tile relative flex flex-col overflow-visible h-full">
      <ProductBadges product={product} rank={rank} />
      <Link
        to={withLocale(lang, `/details/${product.id}`)}
        className="aspect-[16/10] max-h-48 sm:max-h-56 overflow-hidden bg-brand-50 block"
      >
        <ProductImage
          src={product.image}
          alt={product.name}
          className="h-full w-full"
          imgClassName="w-full h-full object-cover transition-transform duration-500 ease-out hover:scale-[1.04]"
        />
      </Link>
      <div className="flex flex-col flex-1 p-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-600">
          <Link
            to={withLocale(lang, catalogPathForCategory(product.category))}
            className="hover:text-brand-800 hover:underline"
          >
            {product.category}
          </Link>
        </p>
        <h3 className="mt-1 font-semibold text-ink leading-snug text-base line-clamp-2">
          <Link to={withLocale(lang, `/details/${product.id}`)} className="hover:text-brand-600 transition-colors">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-xs text-mute truncate">
          {t("by")}{" "}
          {product.supplier ? (
            <Link to={withLocale(lang, supplierPath(product.supplier))} className="hover:text-brand-600 hover:underline">
              {supplierName}
            </Link>
          ) : (
            t("subbiePartner")
          )}
        </p>
        <ProductRating product={product} className="mt-1.5" />
        <ProductMetaChips product={product} className="mt-2.5" />
        <div className="mt-auto mt-4">
          <ProductPrice product={product} className="!mt-0" />
          <div className="mt-3">
            <ProductTileActions product={product} onAdd={onAdd} />
          </div>
        </div>
      </div>
    </article>
  );
}
