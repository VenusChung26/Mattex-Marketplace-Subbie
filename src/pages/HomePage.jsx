import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import SupplierLogo from "../components/SupplierLogo";
import AuthModal from "../components/AuthModal";
import CustomProductModal from "../components/CustomProductModal";
import AiSpecExtractModal from "../components/AiSpecExtractModal";
import CategoryMultiSelect, { SelectedCategoryChips } from "../components/CategoryMultiSelect";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import { useStore } from "../hooks/useStore";
import { useLanguage } from "../i18n";
import {
  addCustomLine,
  addToCart,
  getCategoryDefs,
  getEffectivePrice,
  getGreenProducts,
  getSuppliers,
  getTopProducts,
  isLoggedIn,
  searchProducts,
  searchProductsUnion,
  setPendingCart,
  setPendingCustom,
  supplierPath,
} from "../lib/store";

const CATEGORY_PREVIEW_COUNT = 8;
const SUPPLIER_PREVIEW_COUNT = 9;

/**
 * Subbie storefront landing.
 */
export default function HomePage() {
  const { user, cartCount } = useStore();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [customOpen, setCustomOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [navQuery, setNavQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [extractOpen, setExtractOpen] = useState(false);
  const [extractFiles, setExtractFiles] = useState([]);
  const [extractSession, setExtractSession] = useState(null);
  const specFileInputRef = useRef(null);
  const [greenOnly, setGreenOnly] = useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [suppliersExpanded, setSuppliersExpanded] = useState(false);
  const [catalogStuck, setCatalogStuck] = useState(false);
  const [catalogPinned, setCatalogPinned] = useState(false);
  const [navHeight, setNavHeight] = useState(64);
  const [authOpen, setAuthOpen] = useState(false);
  const holdCatalogPinRef = useRef(false);
  const searchStuck = catalogStuck || catalogPinned;

  useEffect(() => {
    setNavQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const measureNav = () => {
      const nav = document.getElementById("siteNav");
      if (!nav) return;
      setNavHeight(Math.round(nav.getBoundingClientRect().height));
    };
    measureNav();
    window.addEventListener("resize", measureNav);
    return () => window.removeEventListener("resize", measureNav);
  }, [user, cartCount]);

  useEffect(() => {
    const onScroll = () => {
      const section = document.getElementById("products");
      if (!section) return;
      const rect = section.getBoundingClientRect();
      if (holdCatalogPinRef.current) {
        setCatalogStuck(true);
        if (rect.top <= navHeight + 2) holdCatalogPinRef.current = false;
        return;
      }
      const inCatalog = rect.top <= navHeight && rect.bottom > navHeight + 140;
      setCatalogStuck(inCatalog);
      if (rect.top > navHeight + 8) setCatalogPinned(false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [navHeight]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const categories = useMemo(() => getCategoryDefs(), []);
  const visibleCategories = categoriesExpanded
    ? categories
    : categories.slice(0, CATEGORY_PREVIEW_COUNT);
  const top = useMemo(() => getTopProducts(5), []);
  const greens = useMemo(() => getGreenProducts(5), []);
  const suppliers = useMemo(() => getSuppliers(), []);
  const visibleSuppliers = suppliersExpanded
    ? suppliers
    : suppliers.slice(0, SUPPLIER_PREVIEW_COUNT);
  const hiddenSupplierCount = Math.max(suppliers.length - SUPPLIER_PREVIEW_COUNT, 0);

  const products = useMemo(() => {
    let list;
    if (extractSession?.items?.length) {
      const cats = [...new Set(extractSession.items.map((item) => item.category).filter(Boolean))];
      const category = selectedCategories.length
        ? selectedCategories
        : cats.length
          ? cats
          : "all";
      const fullQueries = extractSession.items.map((item) =>
        [item.name, item.spec].filter(Boolean).join(" ")
      );
      list = searchProductsUnion(fullQueries, category);
      if (!list.length) {
        list = searchProductsUnion(
          extractSession.items.map((item) => item.name),
          category
        );
      }
    } else {
      list = searchProducts(searchQuery, selectedCategories);
    }
    if (greenOnly) list = list.filter((p) => p.green);
    if (priceFilter === "priced") list = list.filter((p) => getEffectivePrice(p).displayPrice != null);
    if (priceFilter === "unpriced") list = list.filter((p) => getEffectivePrice(p).displayPrice == null);
    return list;
  }, [searchQuery, selectedCategories, greenOnly, priceFilter, extractSession]);

  const hasFilters =
    greenOnly ||
    selectedCategories.length > 0 ||
    Boolean(searchQuery.trim()) ||
    priceFilter !== "all" ||
    Boolean(extractSession?.items?.length);

  useEffect(() => {
    if (params.get("custom") !== "1") return;
    if (!isLoggedIn()) return;
    setCustomOpen(true);
    const next = new URLSearchParams(params);
    next.delete("custom");
    const qs = next.toString();
    navigate({ pathname: "/", search: qs ? `?${qs}` : "", hash: "products" }, { replace: true });
  }, [params, navigate]);

  function showToast(message) {
    setToast(message);
  }

  function openCustomProduct() {
    if (!isLoggedIn()) {
      setPendingCustom();
      setAuthOpen(true);
      return;
    }
    setCustomOpen(true);
  }

  function handleAddCustom(payload) {
    const result = addCustomLine(payload);
    if (!result.ok) return;
    showToast(t("addedCustomToRfq"));
  }

  function scrollToCatalog() {
    holdCatalogPinRef.current = true;
    setCatalogPinned(true);
    const run = () => {
      const bar = document.getElementById("catalog-toolbar");
      const nav = document.getElementById("siteNav");
      if (!bar) {
        document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const navH = nav ? Math.round(nav.getBoundingClientRect().height) : navHeight;
      const top = window.scrollY + bar.getBoundingClientRect().top - navH;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    };
    requestAnimationFrame(() => requestAnimationFrame(run));
  }

  const urlQ = params.get("q");
  const urlCat = params.get("cat");
  useEffect(() => {
    if (!urlQ && !urlCat) return undefined;
    if (urlQ) {
      setSearchQuery(urlQ);
      setNavQuery(urlQ);
      setGreenOnly(/\bgreen\b/i.test(urlQ));
    }
    if (urlCat) {
      setSelectedCategories([urlCat]);
      setGreenOnly(false);
    }
    const timer = window.setTimeout(() => scrollToCatalog(), 80);
    return () => window.clearTimeout(timer);
  }, [urlQ, urlCat]);

  function handleExtractSearch({ items, attachments }) {
    setExtractSession({ items, attachments });
    const cats = [...new Set(items.map((item) => item.category).filter(Boolean))];
    setSelectedCategories(cats);
    setSearchQuery("");
    setGreenOnly(false);
    scrollToCatalog();
  }

  function handleAddExtracted() {
    const items = extractSession?.items || [];
    if (!items.length) return;
    if (!isLoggedIn()) {
      setPendingCustom();
      setAuthOpen(true);
      return;
    }
    let added = 0;
    for (const item of items) {
      const result = addCustomLine({
        name: item.name,
        description: [item.category, item.spec].filter(Boolean).join(" · "),
        category: item.category,
        attachments: extractSession.attachments,
      });
      if (result.ok) added += 1;
    }
    if (added) showToast(t("addedExtractedToRfq", { n: added }));
  }

  function handleAdd(productId, intent = "quote") {
    if (!isLoggedIn()) {
      setPendingCart(productId, intent);
      setAuthOpen(true);
      return;
    }
    addToCart(productId, { intent });
    const product =
      products.find((p) => p.id === productId) ||
      top.find((p) => p.id === productId) ||
      greens.find((p) => p.id === productId);
    showToast(
      t(intent === "buy" ? "addedBuyToRfq" : "addedQuoteToRfq", { name: product?.name || "item" })
    );
  }

  function clearFilters() {
    setGreenOnly(false);
    setSearchQuery("");
    setSelectedCategories([]);
    setPriceFilter("all");
    setExtractSession(null);
  }

  function selectCategory(name) {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
    setGreenOnly(false);
    scrollToCatalog();
  }

  function onCartClick() {
    if (!isLoggedIn()) {
      setAuthOpen(true);
      return;
    }
    navigate("/rfq");
  }

  function onCatalogQueryChange(value) {
    setExtractSession(null);
    setSearchQuery(value);
    setGreenOnly(/\bgreen\b/i.test(value));
  }

  function submitNavSearch(event, value) {
    event?.preventDefault();
    onCatalogQueryChange(value ?? navQuery);
    scrollToCatalog();
  }

  return (
    <>
      <SiteHeader
        overlay
        searchValue={navQuery}
        onSearchChange={setNavQuery}
        onSearchSubmit={submitNavSearch}
        selectedCategories={selectedCategories}
        onSelectCategory={selectCategory}
        onClearFilters={() => {
          clearFilters();
          scrollToCatalog();
        }}
        onCatalogClick={scrollToCatalog}
        onDraftClick={onCartClick}
      />

      <div className="hero-shell flex flex-col">
        <section className="flex-1 flex items-end">
          <div className="max-w-7xl mx-auto w-full px-4 pb-24 pt-32 sm:pb-28 sm:pt-36">
            <p className="reveal font-display text-5xl sm:text-6xl lg:text-7xl font-semibold text-white tracking-tight leading-none">
              Subbie
            </p>
            <h1 className="reveal reveal-delay mt-5 text-xl sm:text-2xl lg:text-[1.75rem] font-medium text-white/90 max-w-xl leading-snug">
              {t("heroHeadline")}
            </h1>
            <p className="reveal reveal-delay-2 mt-4 text-base sm:text-lg text-white/65 max-w-lg leading-relaxed">
              {t("heroSupport")}
            </p>
            <div className="reveal reveal-delay-2 mt-8 flex flex-wrap gap-3">
              <a
                href="#products"
                className="btn-primary !px-6 !py-3.5"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToCatalog();
                }}
              >
                {t("browseCatalog")}
              </a>
              <Link to="/rfq" className="btn-ghost !px-6 !py-3.5">
                {t("openRfqDraft")}
              </Link>
            </div>
          </div>
        </section>
      </div>

      <div className="sheet relative z-10">
        <section id="categories" className="max-w-7xl mx-auto px-4 pt-9 sm:pt-11" style={{ scrollMarginTop: navHeight }}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mute mb-1">{t("browse")}</p>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-brand-800">{t("materialCategories")}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setCategoriesExpanded((v) => !v)}
                className="text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                {categoriesExpanded
                  ? t("showLess")
                  : `${t("showMore")} (${Math.max(categories.length - CATEGORY_PREVIEW_COUNT, 0)})`}
              </button>
              <button
                type="button"
                onClick={() => {
                  clearFilters();
                  scrollToCatalog();
                }}
                className="text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                {t("allProducts")}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {visibleCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                title={c.name}
                onClick={() => selectCategory(c.name)}
                className={`cat-tile group ${selectedCategories.includes(c.name) ? "is-active" : ""}`}
              >
                <img src={c.image} alt="" loading="lazy" />
                <span className="cat-tile-body">
                  <span className="min-w-0 text-left text-[11px] sm:text-xs font-semibold text-white leading-snug line-clamp-2">
                    {c.name}
                  </span>
                  <span className="shrink-0 inline-flex h-5 min-w-[1.2rem] items-center justify-center bg-white/95 text-brand-800 text-[10px] font-bold px-1.5">
                    {c.count}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section id="green" className="max-w-7xl mx-auto px-4 pt-14 sm:pt-16" style={{ scrollMarginTop: navHeight }}>
          <div className="relative overflow-hidden bg-brand-800 text-white px-6 py-8 sm:px-9 sm:py-10 mb-7">
            <div
              className="absolute inset-0 opacity-25 bg-cover bg-center"
              style={{ backgroundImage: 'url("/assets/cat-timber.png")' }}
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-800 via-brand-800/92 to-brand-800/70" aria-hidden />
            <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-200">{t("greenPreferred")}</p>
                <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold leading-tight">
                  {t("greenHeadline")}
                </h2>
                <p className="mt-3 text-sm sm:text-base text-white/70 leading-relaxed">
                  {t("greenSupport")}
                </p>
              </div>
              <Link
                to="/green"
                className="inline-flex shrink-0 items-center bg-brand-400 px-5 py-3 text-sm font-semibold text-charcoal hover:bg-brand-200 transition-colors"
              >
                {t("shopAllGreen")}
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 xl:gap-4">
            {greens.map((p) => (
              <ProductCard key={p.id} product={p} compact onAdd={handleAdd} />
            ))}
          </div>
        </section>

        <section id="top" className="max-w-7xl mx-auto px-4 pt-14 sm:pt-16" style={{ scrollMarginTop: navHeight }}>
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mute mb-2">{t("featured")}</p>
              <h2 className="font-display text-3xl font-semibold text-brand-800">{t("topProducts")}</h2>
            </div>
            <a
              href="#products"
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
              onClick={(e) => {
                e.preventDefault();
                scrollToCatalog();
              }}
            >
              {t("fullCatalog")} →
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 xl:gap-4">
            {top.map((p) => (
              <ProductCard key={p.id} product={p} compact rank={p.featuredRank} onAdd={handleAdd} />
            ))}
          </div>
        </section>

        <section id="suppliers" className="max-w-7xl mx-auto px-4 pt-14 sm:pt-16" style={{ scrollMarginTop: navHeight }}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mute mb-2">{t("partners")}</p>
              <h2 className="font-display text-3xl font-semibold text-brand-800">{t("supplierCompanies")}</h2>
              <p className="text-sm text-mute mt-2">{t("supplierSupport")}</p>
            </div>
            {hiddenSupplierCount > 0 ? (
              <button
                type="button"
                onClick={() => setSuppliersExpanded((v) => !v)}
                className="text-sm font-semibold text-brand-600 hover:text-brand-700 shrink-0"
              >
                {suppliersExpanded ? t("showLess") : `${t("showMore")} (${hiddenSupplierCount})`}
              </button>
            ) : null}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-1">
            {visibleSuppliers.map((s) => (
              <Link
                key={s.slug}
                to={supplierPath(s.name)}
                className="supplier-row group flex items-center gap-3 py-2.5 border-b border-line"
              >
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-brand-50">
                  <SupplierLogo name={s.name} className="h-12 w-12" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink group-hover:text-brand-600 truncate transition-colors">
                    {s.name}
                  </span>
                  <span className="block text-xs text-mute">
                    {s.count === 1 ? t("productCountOne") : t("productsCount", { n: s.count })}
                  </span>
                </span>
                <span className="text-brand-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </span>
              </Link>
            ))}
          </div>
          {hiddenSupplierCount > 0 ? (
            <div className="mt-5 flex justify-center sm:hidden">
              <button
                type="button"
                onClick={() => setSuppliersExpanded((v) => !v)}
                className="btn-soft !px-5 !py-2.5"
              >
                {suppliersExpanded ? t("showLess") : `${t("showMore")} (${hiddenSupplierCount})`}
              </button>
            </div>
          ) : null}
        </section>

        <section id="support" className="mt-14 sm:mt-16 border-y border-line bg-white/70" style={{ scrollMarginTop: navHeight }}>
          <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
            <div className="mb-6 max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mute mb-2">{t("howItWorks")}</p>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-brand-800">
                {t("howHeadline")}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              <div>
                <span className="step-num">1</span>
                <p className="mt-3 font-semibold text-ink">{t("step1Title")}</p>
                <p className="mt-1.5 text-sm text-mute leading-relaxed">
                  {t("step1Body")}
                </p>
              </div>
              <div>
                <span className="step-num">2</span>
                <p className="mt-3 font-semibold text-ink">{t("step2Title")}</p>
                <p className="mt-1.5 text-sm text-mute leading-relaxed">
                  {t("step2Body")}
                </p>
              </div>
              <div>
                <span className="step-num">3</span>
                <p className="mt-3 font-semibold text-ink">{t("step3Title")}</p>
                <p className="mt-1.5 text-sm text-mute leading-relaxed">
                  {t("step3Body")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Catalog desk — sticky under header while browsing products */}
        <section
          id="products"
          className="pt-14 sm:pt-16"
          style={{ scrollMarginTop: navHeight }}
        >
          <div
            id="catalog-toolbar"
            className={`bg-charcoal text-white sticky z-30 transition-shadow ${
              searchStuck ? "shadow-[0_12px_28px_rgba(0,0,0,0.35)]" : ""
            }`}
            style={{ top: navHeight }}
          >
            <div
              className={`max-w-7xl mx-auto px-4 ${
                searchStuck ? "py-3 sm:py-3.5" : "py-10 sm:py-12"
              }`}
            >
              {!searchStuck ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
                    {t("fullCatalog")}
                  </p>
                  <h2 className="mt-2 font-display text-4xl sm:text-5xl font-semibold tracking-tight">
                    {t("allProductsTitle")}
                  </h2>
                  <p className="mt-2 text-white/65 max-w-xl text-sm sm:text-base">
                    {t("searchHint")}
                  </p>
                </>
              ) : (
                <div className="mb-2.5 flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-lg sm:text-xl font-semibold tracking-tight">
                    {t("allProductsTitle")}
                  </h2>
                  <p className="hidden sm:block text-xs text-white/50 truncate">
                    {t("searchHint")}
                  </p>
                </div>
              )}
              <div className={`${searchStuck ? "mt-0" : "mt-6"} flex flex-col sm:flex-row gap-3`}>
                <input
                  id="catalog-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onCatalogQueryChange(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className={`field-input flex-1 !rounded-none !border-0 !bg-white !text-ink ${
                    searchStuck ? "!py-2.5" : ""
                  }`}
                  autoComplete="off"
                  aria-label={t("catalog")}
                />
                <CategoryMultiSelect
                  categories={categories}
                  selected={selectedCategories}
                  onChange={(names) => {
                    setGreenOnly(false);
                    setSelectedCategories(names);
                  }}
                  compact={searchStuck}
                />
                <input
                  ref={specFileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.txt,.csv,.doc,.docx,image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const next = Array.from(e.target.files || []).slice(0, 8);
                    e.target.value = "";
                    if (!next.length) return;
                    setExtractFiles(next);
                    setExtractOpen(true);
                  }}
                />
                <button
                  type="button"
                  onClick={() => specFileInputRef.current?.click()}
                  className={`shrink-0 border border-white/30 text-white/90 hover:bg-white/10 px-4 text-sm font-semibold ${
                    searchStuck ? "py-2.5" : "py-3"
                  }`}
                >
                  {t("uploadSpec")}
                </button>
              </div>
              <div className={`${searchStuck ? "mt-2.5" : "mt-3"} flex flex-wrap gap-1.5`}>
                {[
                  ["all", t("priceFilterAll")],
                  ["priced", t("priceFilterPriced")],
                  ["unpriced", t("priceFilterUnpriced")],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPriceFilter(id)}
                    className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide border rounded-full ${
                      priceFilter === id
                        ? "bg-white text-charcoal border-white"
                        : "border-white/30 text-white/75 hover:bg-white/10"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {selectedCategories.length ? (
                <div className="mt-2">
                  <SelectedCategoryChips
                    selected={selectedCategories}
                    onChange={(names) => {
                      setGreenOnly(false);
                      setSelectedCategories(names);
                    }}
                    tone="dark"
                  />
                </div>
              ) : null}
              {extractSession?.items?.length ? (
                <p className="mt-2 text-xs text-white/70">
                  {t("extractSearchBanner", { n: extractSession.items.length })}
                </p>
              ) : null}
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-end justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="font-display text-2xl font-semibold text-brand-800">
                  {products.length === 1
                    ? t("productLabelOne")
                    : t("productsLabel", { n: products.length })}
                </h3>
                {hasFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                  >
                    {t("clearAll")}
                  </button>
                ) : null}
              </div>
              <Link to="/rfq" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                {t("openRfqDraft")} →
              </Link>
            </div>
            {products.length === 0 ? (
              <div className="border border-dashed border-line bg-white/60 px-6 py-12 text-center">
                <p className="text-base font-semibold text-brand-800">{t("noProducts")}</p>
                <p className="mt-2 text-sm text-mute">
                  {extractSession?.items?.length ? t("noProductsExtractHint") : t("noProductsHint")}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  {extractSession?.items?.length ? (
                    <button type="button" onClick={handleAddExtracted} className="btn-primary !px-5">
                      {t("addExtractedToRfq", { n: extractSession.items.length })}
                    </button>
                  ) : (
                    <button type="button" onClick={openCustomProduct} className="btn-primary !px-5">
                      + {t("noProductsCustomCta")}
                    </button>
                  )}
                  <button type="button" onClick={clearFilters} className="btn-soft !px-5">
                    {t("clearFilters")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} onAdd={handleAdd} />
                ))}
              </div>
            )}
          </div>
        </section>

        <SiteFooter />
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <CustomProductModal
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        onSubmit={handleAddCustom}
      />
      <AiSpecExtractModal
        open={extractOpen}
        onClose={() => {
          setExtractOpen(false);
          setExtractFiles([]);
        }}
        categories={categories}
        initialFiles={extractFiles}
        onSearch={handleExtractSearch}
      />
      {toast ? (
        <div
          className="fixed bottom-44 right-6 z-50 max-w-sm border border-brand-700 bg-charcoal text-white px-4 py-3 text-sm toast shadow-lg"
          role="status"
        >
          {toast}
        </div>
      ) : null}
      <div className="fixed bottom-6 right-5 z-50 flex flex-col items-center gap-3">
        <Link
          to="/whatsapp"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_28px_rgba(16,21,19,0.32)] hover:bg-[#1ebe57] transition-colors"
          aria-label={t("whatsapp")}
        >
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </Link>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-charcoal text-white shadow-[0_8px_20px_rgba(16,21,19,0.28)] hover:bg-brand-800 transition-colors"
          aria-label={t("backToTop")}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
            <path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </>
  );
}
