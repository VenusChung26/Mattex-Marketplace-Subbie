import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { canDirectBuy, catalogPathForCategory, isHitProduct, stockStatusKey, supplierDisplayName, supplierPath } from "../lib/store";
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

const ACTION_BTN =
  "w-full min-h-[2.5rem] !px-2 !py-2 !text-xs leading-tight text-center whitespace-normal";

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
  const { draft } = useStore();
  const priced = canDirectBuy(product);
  const [menuOpen, setMenuOpen] = useState(false);
  const line = cartLineFor(draft, product.id);
  const buyCount = line?.intent === "buy" ? line.qty : 0;
  const quoteCount = line && line.intent !== "buy" ? line.qty : 0;

  return (
    <article
      className={`relative flex flex-col sm:flex-row sm:items-center gap-3 border border-line bg-white p-3 ${
        menuOpen ? "z-20" : ""
      }`}
    >
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
      <div className={`sm:w-56 shrink-0 grid gap-2 ${priced ? "grid-cols-2" : "grid-cols-1"}`}>
        {priced ? (
          <ActionChoiceButton
            count={buyCount}
            triggerLabel={t("buyNow")}
            nowLabel={t("buyNowAction")}
            addLabel={t("addToCart")}
            onOpenChange={setMenuOpen}
            onNow={() => onAdd?.(product.id, "buy-now")}
            onAdd={() => onAdd?.(product.id, "buy")}
            className={`btn-primary ${ACTION_BTN}`}
          />
        ) : null}
        <ActionChoiceButton
          count={quoteCount}
          triggerLabel={t("requestQuoteCta")}
          nowLabel={t("requestNow")}
          addLabel={t("addToCart")}
          onOpenChange={setMenuOpen}
          onNow={() => onAdd?.(product.id, "quote-now")}
          onAdd={() => onAdd?.(product.id, "quote")}
          className={`${
            priced ? "btn-soft !border-brand-600/50 !text-brand-700" : "btn-primary"
          } ${ACTION_BTN}`}
        />
      </div>
    </article>
  );
}

export default function ProductCard({ product, onAdd, rank = null }) {
  const { t, lang } = useLanguage();
  const { draft } = useStore();
  const priced = canDirectBuy(product);
  const [menuOpen, setMenuOpen] = useState(false);
  const line = cartLineFor(draft, product.id);
  const buyCount = line?.intent === "buy" ? line.qty : 0;
  const quoteCount = line && line.intent !== "buy" ? line.qty : 0;
  const supplierName = supplierDisplayName(product.supplier);

  return (
    <article className={`product-tile relative flex flex-col overflow-visible h-full ${menuOpen ? "z-20" : ""}`}>
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
          <div className={`mt-3 grid gap-2 ${priced ? "grid-cols-2" : "grid-cols-1"}`}>
            {priced ? (
              <ActionChoiceButton
                count={buyCount}
                triggerLabel={t("buyNow")}
                nowLabel={t("buyNowAction")}
                addLabel={t("addToCart")}
                onOpenChange={setMenuOpen}
                onNow={() => onAdd?.(product.id, "buy-now")}
                onAdd={() => onAdd?.(product.id, "buy")}
                className={`btn-primary ${ACTION_BTN}`}
              />
            ) : null}
            <ActionChoiceButton
              count={quoteCount}
              triggerLabel={t("requestQuoteCta")}
              nowLabel={t("requestNow")}
              addLabel={t("addToCart")}
              onOpenChange={setMenuOpen}
              onNow={() => onAdd?.(product.id, "quote-now")}
              onAdd={() => onAdd?.(product.id, "quote")}
              className={`${
                priced ? "btn-soft !border-brand-600/50 !text-brand-700" : "btn-primary"
              } ${ACTION_BTN}`}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
