import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AccountMenu from "./AccountMenu";
import LangToggle from "./LangToggle";
import { useStore } from "../hooks/useStore";
import { useLanguage } from "../i18n";
import { getCategoryDefs, isLoggedIn, logoutUser } from "../lib/store";

export default function SiteHeader({
  overlay = false,
  fluid = false,
  wide = false,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  selectedCategories = [],
  onSelectCategory,
  onClearFilters,
  onCatalogClick,
  onDraftClick,
} = {}) {
  const { user, cartCount } = useStore();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const categories = getCategoryDefs();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navSolid, setNavSolid] = useState(!overlay);
  const [query, setQuery] = useState(searchValue || "");
  const isHome = location.pathname === "/";

  useEffect(() => {
    if (searchValue != null) setQuery(searchValue);
  }, [searchValue]);

  useEffect(() => {
    if (!overlay) {
      setNavSolid(true);
      return undefined;
    }
    const onScroll = () => setNavSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const width = fluid ? "w-full max-w-none" : wide ? "max-w-[100rem]" : "max-w-7xl";
  const navLinks = [
    { hash: "green", label: t("green") },
    { hash: "top", label: t("topProducts") },
    { hash: "suppliers", label: t("suppliers") },
    { hash: "support", label: t("howItWorks") },
    { hash: "products", label: t("catalog") },
  ];

  function closeMenu() {
    setMenuOpen(false);
  }

  function homeTo(hash = "", extra = {}) {
    const next = new URLSearchParams();
    if (isHome) {
      const variant = new URLSearchParams(location.search).get("variant");
      if (variant) next.set("variant", variant);
    }
    if (extra.q) next.set("q", extra.q);
    if (extra.cat) next.set("cat", extra.cat);
    const search = next.toString();
    return {
      pathname: "/",
      search: search ? `?${search}` : "",
      hash,
    };
  }

  function setSearch(value) {
    setQuery(value);
    onSearchChange?.(value);
  }

  function goCatalog(extra = {}) {
    closeMenu();
    if (isHome && extra.q && onSearchSubmit) {
      onSearchSubmit(null, extra.q);
      return;
    }
    if (isHome && extra.cat && onSelectCategory) {
      onSelectCategory(extra.cat);
      return;
    }
    if (isHome && onCatalogClick) {
      onCatalogClick();
      return;
    }
    navigate(homeTo("products", extra));
  }

  function submitSearch(event) {
    event?.preventDefault();
    const next = String(query || "").trim();
    closeMenu();
    if (isHome && onSearchSubmit) {
      onSearchSubmit(event, next);
      return;
    }
    goCatalog({ q: next });
  }

  function pickCategory(name) {
    closeMenu();
    if (isHome && onSelectCategory) {
      onSelectCategory(name);
      return;
    }
    goCatalog({ cat: name });
  }

  function clearAll() {
    closeMenu();
    if (isHome && onClearFilters) {
      onClearFilters();
      return;
    }
    navigate(homeTo("products"));
  }

  function onRfqClick() {
    if (onDraftClick) {
      onDraftClick();
      return;
    }
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    navigate("/rfq");
  }

  function sectionTo(hash) {
    if (isHome) return `#${hash}`;
    return homeTo(hash);
  }

  function onSectionClick(event, hash) {
    if (hash === "products") {
      event.preventDefault();
      goCatalog();
    }
  }

  return (
    <header
      id="siteNav"
      className={`nav-glass ${overlay ? "fixed" : "sticky"} top-0 left-0 right-0 z-40 ${navSolid ? "is-solid" : ""}`}
    >
      <div className={`${width} mx-auto px-4 sm:px-6 lg:px-8`}>
        <div className="flex items-center gap-4 py-3">
          <Link to="/" className="shrink-0 flex items-center gap-2.5 text-white">
            <span className="inline-flex h-9 w-9 items-center justify-center bg-brand-600 text-white font-bold text-sm tracking-wide">
              SB
            </span>
            <div className="leading-tight">
              <span className="block text-lg font-semibold tracking-tight">Subbie</span>
              <span className="block text-[11px] tracking-[0.14em] uppercase text-white/55">{t("brandSub")}</span>
            </div>
          </Link>

          <form className="hidden md:block flex-1 min-w-0 max-w-xl" onSubmit={submitSearch}>
            <input
              type="search"
              value={query}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("navSearchPlaceholder")}
              className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/45 px-3.5 py-2 text-sm"
              autoComplete="off"
              aria-label={t("search")}
            />
          </form>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="md:hidden inline-flex h-10 w-10 items-center justify-center border border-white/20 text-white hover:bg-white/10"
              aria-label={t("search")}
              onClick={() => goCatalog()}
            >
              ⌕
            </button>
            <button
              type="button"
              onClick={onRfqClick}
              className="relative inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white/85 hover:text-white hover:bg-white/10 transition-colors"
              aria-label={`${t("rfqDraft")}, ${cartCount} items`}
            >
              <span>{t("rfqDraft")}</span>
              {cartCount > 0 ? (
                <span className="absolute -top-1.5 -right-1 min-w-[1.15rem] h-[1.15rem] px-1 bg-brand-400 text-charcoal text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              ) : null}
            </button>
            <Link
              to="/rfqs"
              className="hidden sm:inline-flex items-center px-3 py-2 text-sm font-medium text-white/85 hover:text-white hover:bg-white/10 transition-colors"
            >
              {t("myRfqs")}
            </Link>
            <AccountMenu user={user} light />
            <LangToggle light />
            <button
              type="button"
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center border border-white/20 text-white hover:bg-white/10"
              aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="text-lg leading-none">{menuOpen ? "×" : "☰"}</span>
            </button>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-1 border-t border-white/10 py-1.5 text-sm font-medium text-white/70">
          <div className="nav-dropdown">
            <Link
              to={isHome ? "#categories" : homeTo("categories")}
              className="inline-flex items-center gap-1.5 hover:text-white hover:bg-white/10 transition-colors px-3 py-2"
            >
              {t("categories")}
              <span className="text-[10px] opacity-70" aria-hidden>
                ▾
              </span>
            </Link>
            <div className="nav-dropdown-panel" role="menu" aria-label="Categories">
              <div className="nav-cat-grid">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="menuitem"
                    title={c.name}
                    onClick={() => pickCategory(c.name)}
                    className={`nav-cat-item text-left ${selectedCategories.includes(c.name) ? "!bg-brand-600/40 !text-white" : ""}`}
                  >
                    <img src={c.image} alt="" loading="lazy" />
                    <span className="min-w-0">
                      <span className="block text-[12px] font-semibold leading-snug line-clamp-2">{c.name}</span>
                      <span className="block text-[10px] text-white/45 mt-0.5">{c.count} items</span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-white/10 flex justify-between gap-3 px-1">
                <Link to={isHome ? "#categories" : homeTo("categories")} className="text-xs font-semibold text-brand-200 hover:text-white">
                  {t("viewAllCategories")}
                </Link>
                <button type="button" onClick={clearAll} className="text-xs font-semibold text-brand-200 hover:text-white">
                  {t("allProducts")}
                </button>
              </div>
            </div>
          </div>
          {navLinks.map((l) => (
            <Link
              key={l.hash}
              to={l.hash === "green" ? "/green" : sectionTo(l.hash)}
              className="hover:text-white hover:bg-white/10 transition-colors px-3 py-2"
              onClick={(e) => onSectionClick(e, l.hash)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      {menuOpen ? (
        <div className="lg:hidden border-t border-white/10 bg-charcoal/98 px-4 py-4 max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col gap-1 text-sm font-medium text-white/80">
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/40 pt-1 pb-1">{t("categories")}</p>
            <div className="grid grid-cols-1 gap-1 mb-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickCategory(c.name)}
                  className="nav-cat-item text-left"
                >
                  <img src={c.image} alt="" loading="lazy" />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold leading-snug">{c.name}</span>
                    <span className="block text-[11px] text-white/45">{c.count} items</span>
                  </span>
                </button>
              ))}
            </div>
            <form onSubmit={submitSearch}>
              <input
                type="search"
                value={query}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("navSearchPlaceholder")}
                className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/45 px-3 py-2 text-sm mb-2"
                autoComplete="off"
                aria-label={t("search")}
              />
            </form>
            {navLinks.map((l) => (
              <Link
                key={l.hash}
                to={l.hash === "green" ? "/green" : sectionTo(l.hash)}
                className="py-2.5 hover:text-white"
                onClick={(e) => {
                  closeMenu();
                  onSectionClick(e, l.hash);
                }}
              >
                {l.label}
              </Link>
            ))}
            <Link to="/rfq" className="py-2.5 hover:text-white" onClick={closeMenu}>
              {t("rfqDraft")}
            </Link>
            <Link to="/rfqs" className="py-2.5 hover:text-white" onClick={closeMenu}>
              {t("myRfqs")}
            </Link>
            {user ? (
              <>
                <p className="mt-2 pt-2 border-t border-white/15 text-xs text-white/60">{user.name}</p>
                <Link to="/login" className="py-2.5 hover:text-white" onClick={closeMenu}>
                  {t("profile")}
                </Link>
                <button
                  type="button"
                  className="py-2.5 text-left hover:text-white"
                  onClick={() => {
                    closeMenu();
                    logoutUser();
                    navigate("/");
                  }}
                >
                  {t("logout")}
                </button>
              </>
            ) : (
              <Link to="/login" className="mt-2 btn-primary !py-2.5" onClick={closeMenu}>
                {t("login")}
              </Link>
            )}
            <div className="py-2">
              <LangToggle light />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
