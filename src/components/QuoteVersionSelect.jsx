import { formatQuoteVersionOption, quoteEffectiveVersionNo, quoteVersionList } from "../lib/store";

const DRAFT_VALUE = "draft";

export default function QuoteVersionSelect({
  rfq,
  value,
  onChange,
  showDraft = false,
  draftLabel = "Draft",
  currentLabel = "Current",
  id = "quote-version",
  label = "Quote version",
}) {
  const versions = quoteVersionList(rfq);
  if (!versions.length) return null;
  const effective = quoteEffectiveVersionNo(rfq);
  const selected = value == null || value === "" ? (showDraft ? DRAFT_VALUE : String(effective)) : String(value);

  return (
    <label className="block min-w-[16rem]">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-mute">{label}</span>
      <select
        id={id}
        value={selected}
        onChange={(e) => onChange?.(e.target.value)}
        className="mt-0.5 w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink"
      >
        {showDraft ? <option value={DRAFT_VALUE}>{draftLabel}</option> : null}
        {versions.map((version) => (
          <option key={version.version} value={String(version.version)}>
            {formatQuoteVersionOption(version, { effectiveVersion: effective, currentLabel })}
          </option>
        ))}
      </select>
    </label>
  );
}

export { DRAFT_VALUE };
