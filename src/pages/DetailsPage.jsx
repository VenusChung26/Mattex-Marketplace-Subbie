import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AuthModal from "../components/AuthModal";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import ProductPrice from "../components/ProductPrice";
import ProductRating from "../components/ProductRating";
import { useLanguage } from "../i18n";
import {
  addToCart,
  canDirectBuy,
  getEffectivePrice,
  getProduct,
  isLoggedIn,
  setPendingCart,
  stockStatusKey,
  supplierPath,
} from "../lib/store";

const STOCK_TONE = {
  in_stock: "bg-brand-50 text-brand-800",
  limited: "bg-[#fbf3e4] text-[#8a5a12]",
  made_to_order: "bg-paper text-ink",
  out_of_stock: "bg-[#f8e8e8] text-[#8a2b2b]",
};

export default function DetailsPage() {
  const { id } = useParams();
  const product = getProduct(id);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [authOpen, setAuthOpen] = useState(false);
  const [addedFlash, setAddedFlash] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setQty(product?.moq || 1);
    setAddedFlash("");
  }, [product?.id, product?.moq]);

  if (!product) {
    return (
      <div className="bg-paper min-h-screen">
        <SiteHeader />
        <main className="max-w-7xl mx-auto px-4 py-10">
          <div className="bg-white border border-line rounded-xl p-8 text-center">
            <h1 className="reveal text-xl font-bold text-brand-800">{t("productNotFound")}</h1>
            <p className="mt-2 text-sm text-mute">{t("productNotFoundHint")}</p>
            <Link to={{ pathname: "/", hash: "products" }} className="btn-primary mt-5 inline-flex">
              {t("browseCatalog")}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const priced = canDirectBuy(product);
  const priceStatus = getEffectivePrice(product).status;
  const priceHint =
    priceStatus === "quoted"
      ? `${t("quotedBuyHint")} ${t("requestQuoteHint")}`
      : priceStatus === "expired-requote"
        ? t("quotedPriceExpiredRequote")
        : priced
          ? `${t("buyNowHint")} ${t("requestQuoteHint")}`
          : t("requestQuoteOnlyHint");
  const minQty = Math.max(1, Number(product.moq) || 1);
  const leadTime = product.leadTime
    ? product.leadTime.min === product.leadTime.max
      ? String(product.leadTime.min)
      : `${product.leadTime.min}–${product.leadTime.max}`
    : "—";
  const facts = [
    { label: t("productNo"), value: product.productNo || product.id.toUpperCase() },
    {
      label: t("stockStatus"),
      value: t(stockStatusKey(product.stockStatus)),
      pill: true,
      tone: STOCK_TONE[product.stockStatus] || STOCK_TONE.in_stock,
    },
    { label: t("moq"), value: `${product.moq} ${product.unit}` },
    { label: t("leadTime"), value: t("leadTimeValue", { time: leadTime }) },
    { label: t("standard"), value: product.standard },
  ];

  function goToRfq(intent) {
    const nextQty = Math.max(minQty, Math.floor(Number(qty)) || minQty);
    if (!isLoggedIn()) {
      setPendingCart(product.id, intent, nextQty);
      setAuthOpen(true);
      return;
    }
    addToCart(product.id, { intent, qty: nextQty });
    setAddedFlash(intent);
    setTimeout(() => navigate("/rfq"), 450);
  }

  const flashLabel =
    addedFlash === "buy"
      ? t("addedBuyOpeningRfq")
      : addedFlash === "quote"
        ? t("addedQuoteOpeningRfq")
        : "";

  return (
    <div className="bg-paper min-h-screen pb-28 lg:pb-0">
      <SiteHeader />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
        <nav className="mb-5 text-sm text-mute">
          <Link to={{ pathname: "/", hash: "products" }} className="hover:text-brand-600">
            {t("catalog")}
          </Link>
          <span className="mx-2 text-line">/</span>
          <span className="text-ink">{product.category}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="relative overflow-hidden bg-brand-50 border border-line rounded-xl self-start w-full">
            {product.green ? (
              <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 bg-[#1f8a45] text-white text-[10px] font-bold px-2 py-1 tracking-[0.08em]">
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
                {t("greenBadge")}
              </span>
            ) : null}
            <img src={product.image} alt={product.name} className="block w-full h-auto" />
          </div>

          <div className="reveal">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
              {product.category}
            </p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-brand-800 leading-tight">
              {product.name}
            </h1>
            <p className="mt-3 text-sm text-mute">
              {t("supplierLabel")}:{" "}
              {product.supplier ? (
                <Link
                  to={supplierPath(product.supplier)}
                  className="text-brand-600 hover:underline font-medium"
                >
                  {product.supplier}
                </Link>
              ) : (
                t("subbiePartner")
              )}
            </p>
            <ProductRating product={product} size="lg" className="mt-2" />
            <ProductPrice product={product} size="detail" />
            <p className="mt-5 text-sm text-mute leading-relaxed max-w-prose">{product.description}</p>

            <dl className="mt-6 divide-y divide-line border-y border-line">
              {facts.map((row) => (
                <div key={row.label} className="py-2.5 flex items-start justify-between gap-4">
                  <dt className="text-sm text-mute shrink-0">{row.label}</dt>
                  <dd className="text-sm font-medium text-ink text-right">
                    {row.pill ? (
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold ${row.tone}`}>
                        {row.value}
                      </span>
                    ) : (
                      row.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex flex-wrap items-end gap-4">
              <label className="block">
                <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-mute mb-1">
                  {t("qty")}
                </span>
                <input
                  type="number"
                  min={minQty}
                  value={qty}
                  onChange={(e) => {
                    const next = Math.floor(Number(e.target.value));
                    setQty(Number.isFinite(next) ? next : minQty);
                  }}
                  onBlur={() => setQty((v) => Math.max(minQty, Math.floor(Number(v)) || minQty))}
                  className="w-24 border border-line px-3 py-2 text-sm"
                />
                <span className="mt-1 block text-[11px] text-mute">
                  {t("qtyMinMoq", { n: `${minQty} ${product.unit}` })}
                </span>
              </label>
            </div>

            <p className="mt-5 text-xs text-mute leading-relaxed max-w-prose">
              {priceHint}
            </p>

            <div className="mt-4 hidden lg:flex flex-wrap gap-2.5">
              {priced ? (
                <button type="button" onClick={() => goToRfq("buy")} className="btn-primary !px-5 !py-3">
                  {addedFlash === "buy" ? flashLabel : t("buyNow")}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => goToRfq("quote")}
                className={priced ? "btn-soft !px-5 !py-3 !border-brand-600 !text-brand-700" : "btn-primary !px-5 !py-3"}
              >
                {addedFlash === "quote" ? flashLabel : t("requestQuote")}
              </button>
              <Link to={{ pathname: "/", hash: "products" }} className="btn-soft !px-5 !py-3">
                {t("backToCatalog")}
              </Link>
            </div>

            <h2 className="mt-8 text-sm font-semibold text-ink">{t("specifications")}</h2>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {product.specs.map((s) => (
                <li key={s} className="py-2.5 text-sm text-mute">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <div className="hidden lg:block">
        <SiteFooter />
      </div>

      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-line bg-white/95 backdrop-blur p-3">
        <div className={`max-w-7xl mx-auto grid gap-2 ${priced ? "grid-cols-2" : "grid-cols-1"}`}>
          {priced ? (
            <button type="button" onClick={() => goToRfq("buy")} className="btn-primary !py-3">
              {addedFlash === "buy" ? t("addedShort") : t("buyNow")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => goToRfq("quote")}
            className={priced ? "btn-soft !py-3 !border-brand-600 !text-brand-700" : "btn-primary !py-3"}
          >
            {addedFlash === "quote" ? t("addedShort") : t("requestQuote")}
          </button>
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
