import { Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import MattexChainInvite from "../components/MattexChainInvite";
import Seo from "../components/Seo";
import { useLanguage } from "../i18n";
import { withLocale } from "../lib/locale";

export default function SignupPage() {
  const { t, lang } = useLanguage();

  return (
    <div className="bg-paper min-h-screen">
      <Seo lang={lang} path={withLocale(lang, "/signup")} title={`${t("createAccount")} | Mattex Marketplace`} description={t("createAccountHint")} noindex />
      <SiteHeader />

      <main className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white border border-line rounded-xl p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 mb-2">
            {t("mattexChain")}
          </p>
          <h1 className="reveal text-2xl sm:text-3xl font-bold text-brand-800">
            {t("chainInviteTitle")}
          </h1>
          <p className="mt-2 text-sm text-mute">{t("createAccountHint")}</p>
          <MattexChainInvite className="mt-8" />
          <p className="mt-6 text-sm text-mute">
            {t("alreadyRegistered")}{" "}
            <Link to={withLocale(lang, "/login")} className="font-semibold text-brand-600 hover:underline">
              {t("login")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
