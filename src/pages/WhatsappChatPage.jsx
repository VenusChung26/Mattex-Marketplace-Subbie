/**
 * PROTOTYPE — demo WhatsApp chatroom after Create Order.
 * Three variants via ?variant= A mobile · B web · C ticket + chat
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import PrototypeSwitcher from "../components/PrototypeSwitcher";
import { useLanguage } from "../i18n";
import {
  formatPrice,
  getEffectivePrice,
  getPendingWhatsappOrder,
  getProduct,
  getRfq,
  getTopProducts,
  supplierSlug,
} from "../lib/store";
import {
  VariantA,
  VariantB,
  VariantC,
  WA_CHAT_VARIANTS,
} from "./whatsapp-prototype/WhatsappChatVariants";

function clock() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function enrichLine(line) {
  const product = line.custom ? null : getProduct(line.productId);
  return {
    ...line,
    name: line.name || product?.name || line.productId,
    supplier: line.supplier || product?.supplier || "",
    image: line.image || product?.image || null,
    unitPrice:
      line.unitPrice != null
        ? line.unitPrice
        : product
          ? getEffectivePrice(product).displayPrice
          : null,
  };
}

function demoRfq() {
  const products = getTopProducts(3);
  const lines = products.map((p, i) => ({
    productId: p.id,
    name: p.name,
    supplier: p.supplier,
    qty: [8, 20, 4][i] || 2,
    unitPrice: getEffectivePrice(p).displayPrice,
    image: p.image,
    custom: false,
  }));
  return {
    id: "RFQ-DEMO-WA",
    project: "Kai Tak Site A",
    pricedSubtotal: lines.reduce((sum, l) => sum + (Number(l.unitPrice) || 0) * l.qty, 0),
    lines,
  };
}

function buildThreads(rfq, fallbackName) {
  const groups = new Map();
  for (const raw of rfq.lines || []) {
    const line = enrichLine(raw);
    const name = line.supplier || fallbackName;
    const slug = supplierSlug(name) || "sales";
    if (!groups.has(slug)) groups.set(slug, { slug, supplier: name, lines: [] });
    groups.get(slug).lines.push(line);
  }
  return Array.from(groups.values()).map((g) => ({
    ...g,
    previewTime: clock(),
  }));
}

function seedMessages(thread, t, rfq) {
  const names = (thread.lines || []).map((l) => `• ${l.name} × ${l.qty}${l.unitPrice != null ? ` (${formatPrice(l.unitPrice)})` : ""}`).join("\n");
  const text = `${t("waWantToBuy")}\n${t("waOrderIntro")}\n${names}${rfq?.id ? `\n${rfq.id}` : ""}`;
  return [
    {
      id: "order-1",
      from: "me",
      kind: "order",
      text,
      time: clock(),
      lines: thread.lines,
    },
  ];
}

export default function WhatsappChatPage() {
  const { rfqId } = useParams();
  const [params] = useSearchParams();
  const variant = String(params.get("variant") || "A").toUpperCase();
  const { t } = useLanguage();
  const stored = rfqId ? getRfq(decodeURIComponent(rfqId)) : null;
  const pending = stored ? null : getPendingWhatsappOrder();
  const isDemo = !stored && !pending;
  const rfq = useMemo(() => stored || pending || demoRfq(), [stored?.id, pending?.id]);

  const threads = useMemo(
    () => buildThreads(rfq, t("waDemoSupplier")),
    [rfq.id, rfq.lines?.length, t]
  );

  const [activeSlug, setActiveSlug] = useState(() => (threads.length > 1 && variant === "A" ? "" : threads[0]?.slug || ""));
  const [inbox, setInbox] = useState({});
  const [typing, setTyping] = useState(false);
  const [draftText, setDraftText] = useState("");
  const seededRef = useRef(new Set());

  useEffect(() => {
    setActiveSlug(threads.length > 1 && variant === "A" ? "" : threads[0]?.slug || "");
  }, [rfq.id, variant, threads.length]);

  const effectiveSlug = activeSlug || threads[0]?.slug || "";
  const thread = threads.find((x) => x.slug === effectiveSlug) || threads[0];
  const messages = inbox[effectiveSlug] || [];

  useEffect(() => {
    if (!thread) return;
    const key = `${rfq.id}:${thread.slug}`;
    if (seededRef.current.has(key)) return;
    seededRef.current.add(key);
    setInbox((prev) => {
      if (prev[thread.slug]?.length) return prev;
      return { ...prev, [thread.slug]: seedMessages(thread, t, rfq) };
    });
    setTyping(true);
    const replyTimer = setTimeout(() => {
      setTyping(false);
      setInbox((prev) => {
        const current = prev[thread.slug] || seedMessages(thread, t, rfq);
        if (current.some((m) => m.id === "reply-1")) return prev;
        return {
          ...prev,
          [thread.slug]: [
            ...current,
            {
              id: "reply-1",
              from: "them",
              kind: "text",
              text: t("waSupplierReply"),
              time: clock(),
            },
          ],
        };
      });
    }, 1400);
    return () => clearTimeout(replyTimer);
  }, [thread?.slug, rfq.id, t]);

  function onSend() {
    const text = draftText.trim();
    if (!text || !thread) return;
    setDraftText("");
    setInbox((prev) => ({
      ...prev,
      [thread.slug]: [
        ...(prev[thread.slug] || []),
        { id: `me-${Date.now()}`, from: "me", kind: "text", text, time: clock() },
      ],
    }));
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setInbox((prev) => ({
        ...prev,
        [thread.slug]: [
          ...(prev[thread.slug] || []),
          {
            id: `them-${Date.now()}`,
            from: "them",
            kind: "text",
            text: t("waSupplierReply"),
            time: clock(),
          },
        ],
      }));
    }, 900);
  }

  const shared = {
    threads,
    activeSlug,
    setActiveSlug,
    messages,
    typing,
    draftText,
    setDraftText,
    onSend,
    rfq,
    isDemo,
  };

  return (
    <div className="min-h-screen bg-[#0b141a]">
      <SiteHeader />
      <div className="border-b border-white/10 bg-[#111b21] px-4 py-2 text-center text-[11px] text-[#8696a0]">
        {t("waChatDemoBanner")}
        {isDemo ? ` · ${t("waDemoHint")}` : ` · ${t("waSentOrder", { id: rfq.id })} · ${t("waSavedInSubbie")}`}
        {" · "}
        {!isDemo ? (
          <>
            <Link to={`/rfqs?id=${encodeURIComponent(rfq.id)}`} className="text-[#00a884] hover:underline">
              {t("waViewRfqs")}
            </Link>
            {" · "}
          </>
        ) : null}
        <Link to="/rfq" className="text-[#00a884] hover:underline">
          {t("waBackDraft")}
        </Link>
      </div>
      {variant === "B" ? (
        <VariantB {...shared} />
      ) : variant === "C" ? (
        <div className="bg-paper min-h-[calc(100vh-6rem)]">
          <VariantC {...shared} />
        </div>
      ) : (
        <VariantA {...shared} />
      )}
      <p className="fixed bottom-16 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-[10px] text-white/80">
        {t("waDemoState", { supplier: thread?.supplier || "—", n: messages.length })}
      </p>
      <PrototypeSwitcher variants={WA_CHAT_VARIANTS} current={variant} />
    </div>
  );
}
