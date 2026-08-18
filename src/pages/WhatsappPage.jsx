import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import { useLanguage } from "../i18n";
import {
  addToCart,
  formatPrice,
  getProduct,
  isLoggedIn,
  setPendingWhatsappRfq,
  whatsappUrl,
} from "../lib/store";

export default function WhatsappPage() {
  const { id } = useParams();
  const product = id ? getProduct(id) : null;
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [addToRfq, setAddToRfq] = useState(false);
  const href = whatsappUrl(product || null);

  if (id && !product) {
    return (
      <div className="bg-paper min-h-screen">
        <SiteHeader />
        <main className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white border border-line rounded-xl p-6 sm:p-8 text-center">
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

  function onContinue() {
    if (!addToRfq) {
      window.location.href = href;
      return;
    }
    if (!isLoggedIn()) {
      setPendingWhatsappRfq(product.id);
      navigate("/login");
      return;
    }
    addToCart(product.id, { intent: "quote" });
    window.open(href, "_blank", "noopener,noreferrer");
    navigate("/rfq");
  }

  return (
    <div className="bg-paper min-h-screen">
      <SiteHeader />
      <main className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white border border-line rounded-xl p-6 sm:p-8">
          <h1 className="reveal text-2xl font-bold text-brand-800 text-center">{t("whatsappTitle")}</h1>
          <p className="mt-3 text-sm text-mute text-center">
            {product
              ? t("whatsappProductLine", {
                  name: product.name,
                  price: formatPrice(product.price),
                })
              : t("whatsappGeneral")}
          </p>
          <p className="mt-4 text-sm text-mute leading-relaxed text-center">{t("whatsappHint")}</p>
          {product ? (
            <label className="mt-6 flex items-start gap-3 border border-line rounded-xl p-3 text-sm cursor-pointer hover:border-brand-600">
              <input
                type="checkbox"
                checked={addToRfq}
                onChange={(e) => setAddToRfq(e.target.checked)}
                className="mt-1 accent-[#245A41]"
              />
              <span>
                <span className="font-semibold text-ink">{t("whatsappAddToRfq")}</span>
                <span className="block text-mute mt-0.5">{t("whatsappAddHint")}</span>
              </span>
            </label>
          ) : null}
          <button
            type="button"
            onClick={onContinue}
            className="mt-6 inline-flex w-full justify-center bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1ebe57]"
          >
            {t("continueWhatsapp")}
          </button>
          <Link to="/" className="btn-soft mt-3 w-full !py-2.5">
            {t("stayOnStorefront")}
          </Link>
        </div>
      </main>
    </div>
  );
}
