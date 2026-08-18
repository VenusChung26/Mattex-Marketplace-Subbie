import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { canDirectBuy, isLoggedIn, stockStatusKey, supplierPath } from "../lib/store";
import { useLanguage } from "../i18n";
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

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 shrink-0 btn-added-check"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function AddedLabel({ t }) {
  return (
    <span className="inline-flex items-center justify-center gap-1">
      <CheckIcon />
      {t("addedDone")}
    </span>
  );
}

function leadTimeLabel(lead, t) {
  if (!lead) return "—";
  const time = lead.min === lead.max ? String(lead.min) : `${lead.min}–${lead.max}`;
  return t("leadTimeValue", { time });
}

const ACTION_BTN =
  "w-full min-h-[2.5rem] !px-2 !py-2 !text-xs leading-tight text-center whitespace-normal";

export default function ProductCard({ product, onAdd, rank = null }) {
  const { t } = useLanguage();
  const priced = canDirectBuy(product);
  const [added, setAdded] = useState("");

  useEffect(() => {
    if (!added) return undefined;
    const timer = window.setTimeout(() => setAdded(""), 1600);
    return () => window.clearTimeout(timer);
  }, [added]);

  function handleAdd(intent) {
    onAdd?.(product.id, intent);
    if (isLoggedIn()) setAdded(intent);
  }

  return (
    <article className="product-tile relative flex flex-col overflow-hidden h-full">
      {rank != null ? (
        <span className="absolute top-2.5 left-2.5 z-10 bg-charcoal/90 text-white text-[11px] font-bold px-2 py-1">
          #{rank}
        </span>
      ) : null}
      {product.green ? (
        <span className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 bg-[#1f8a45] text-white text-[10px] font-bold px-2 py-1 tracking-[0.08em]">
          <LeavesIcon />
          {t("greenBadge")}
        </span>
      ) : null}
      <Link
        to={`/details/${product.id}`}
        className="aspect-[16/10] max-h-48 sm:max-h-56 overflow-hidden bg-brand-50 block"
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 ease-out hover:scale-[1.04]"
          loading="lazy"
        />
      </Link>
      <div className="flex flex-col flex-1 p-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-600">
          {product.category}
        </p>
        <h3 className="mt-1 font-semibold text-ink leading-snug text-base line-clamp-2">
          <Link to={`/details/${product.id}`} className="hover:text-brand-600 transition-colors">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-xs text-mute truncate">
          {t("by")}{" "}
          {product.supplier ? (
            <Link to={supplierPath(product.supplier)} className="hover:text-brand-600 hover:underline">
              {product.supplier}
            </Link>
          ) : (
            "Subbie Partner"
          )}
        </p>
        <ProductRating product={product} className="mt-1.5" />
        <p className="mt-2.5 flex flex-wrap gap-1">
          <span className="inline-flex items-center bg-paper text-[10px] font-semibold text-ink px-1.5 py-0.5">
            {t(stockStatusKey(product.stockStatus))}
          </span>
          <span className="inline-flex items-center bg-paper text-[10px] font-medium text-mute px-1.5 py-0.5">
            {t("moq")} {product.moq} {product.unit}
          </span>
          <span className="inline-flex items-center bg-paper text-[10px] font-medium text-mute px-1.5 py-0.5">
            {leadTimeLabel(product.leadTime, t)}
          </span>
        </p>
        <div className="mt-auto mt-4">
          <ProductPrice product={product} className="!mt-0" />
          <div className={`mt-3 grid gap-2 ${priced ? "grid-cols-2" : "grid-cols-1"}`}>
            {priced ? (
              <button
                type="button"
                onClick={() => handleAdd("buy")}
                className={`btn-primary ${ACTION_BTN} ${added === "buy" ? "btn-added" : ""}`}
              >
                {added === "buy" ? <AddedLabel t={t} /> : t("buyNow")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => handleAdd("quote")}
              className={`${
                added === "quote"
                  ? "btn-primary"
                  : priced
                    ? "btn-soft !border-brand-600/50 !text-brand-700"
                    : "btn-primary"
              } ${ACTION_BTN} ${added === "quote" ? "btn-added" : ""}`}
            >
              {added === "quote" ? <AddedLabel t={t} /> : t("requestQuote")}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
