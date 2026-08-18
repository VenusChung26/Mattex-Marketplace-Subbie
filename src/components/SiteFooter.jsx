import { Link } from "react-router-dom";
import { useLanguage } from "../i18n";

export default function SiteFooter() {
  const { t } = useLanguage();
  return (
    <footer id="contact" className="bg-charcoal text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center bg-brand-600 text-white font-bold text-xs">
              SB
            </span>
            <span className="font-semibold">Subbie</span>
          </div>
          <p className="mt-4 text-sm text-white/55 leading-relaxed max-w-[16rem]">{t("footerTagline")}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40 mb-3">{t("footerCatalog")}</p>
          <ul className="space-y-2 text-sm text-white/70">
            <li>
              <Link to="/green" className="hover:text-white">
                {t("greenProducts")}
              </Link>
            </li>
            <li>
              <a href="/#top" className="hover:text-white">
                {t("top5")}
              </a>
            </li>
            <li>
              <a href="/#suppliers" className="hover:text-white">
                {t("suppliers")}
              </a>
            </li>
            <li>
              <a href="/#products" className="hover:text-white">
                {t("allProducts")}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40 mb-3">{t("footerQuotes")}</p>
          <ul className="space-y-2 text-sm text-white/70">
            <li>
              <Link to="/rfq" className="hover:text-white">
                {t("rfqDraft")}
              </Link>
            </li>
            <li>
              <Link to="/rfqs" className="hover:text-white">
                {t("myRfqs")}
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-white">
                {t("login")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40 mb-3">{t("footerContact")}</p>
          <ul className="space-y-2 text-sm text-white/70">
            <li>sales@subbie.store</li>
            <li>Industrial RFQ desk</li>
            <li>WhatsApp sales bridge</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-white/40">
          <p>© 2026 Subbie — Storefront</p>
          <p>React · localStorage auth &amp; RFQ</p>
        </div>
      </div>
    </footer>
  );
}
