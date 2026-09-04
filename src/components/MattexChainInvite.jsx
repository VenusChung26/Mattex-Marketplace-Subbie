import { MATTEX_CHAIN_URL } from "../lib/store";
import { useLanguage } from "../i18n";

export default function MattexChainInvite({ compact = false, className = "" }) {
  const { t } = useLanguage();
  return (
    <div className={className}>
      {compact ? null : (
        <p className="text-sm text-mute leading-relaxed">{t("chainInviteBody")}</p>
      )}
      <div className={`${compact ? "" : "mt-4"} grid gap-2.5`}>
        <a
          href={MATTEX_CHAIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary !py-3"
        >
          {t("openMarketplaceAccount")}
        </a>
        <a
          href={MATTEX_CHAIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-soft !py-3 !border-brand-600 !text-brand-700"
        >
          {t("becomeSupplier")}
        </a>
      </div>
      <p className="mt-2 text-xs text-mute">{t("opensMattexChain")}</p>
    </div>
  );
}
