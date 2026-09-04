import { MATTEX_PRODUCTS } from "../data/mattexProducts.js";
import { collectAttachmentUrls, collectProductImageUrls, fitWhatsappUrls, uploadRfqPdf } from "./rfqBlob.js";
import { buildQuotePdf, canSharePdfFile, downloadBlob, sharePdfFile } from "./quotePdf.js";
import { fetchRemoteState, isSupabaseConfigured, persistKv } from "./supabasePersist.js";

const HIDDEN_CATEGORY_IDS = new Set(["service", "computer", "hardware"]);
const SYNTHETIC_CATEGORY_IDS = new Set(["service", "computer", "hardware"]);

const CATEGORY_DEFS = [
  { id: "reinforcement-mesh", name: "Reinforcement Mesh", image: "/assets/prod-mesh.png", count: 12, unit: "sheet", base: 100, supplier: "Mattex", specs: ["Type: reinforcement mesh", "Size: 2.1m × 4.8m / custom", "Standard: BS4483 / BS4449", "Use: road / slab"] },
  { id: "safety-net", name: "Dense Mesh Flame Retardant Safety Net", image: "/assets/prod-safetynet.png", count: 7, unit: "sheet", base: 100, supplier: "Mattex", specs: ["Type: dense mesh FR net", "Color: green / orange", "Use: edge protection", "Stock: HK / site lead"] },
  { id: "gypsum-block", name: "Gypsum Block", image: "/assets/prod-gypsum-block.png", count: 3, unit: "m²", base: 100, supplier: "Mattex", specs: ["Material: gypsum block", "Size: 500 mm series", "Density: 1100–1200 kg/m³", "Use: partition"] },
  { id: "xps-foam-board", name: "XPS Foam Board", image: "/assets/prod-xps.png", count: 21, unit: "sheet", base: 100, supplier: "Mattex", specs: ["Type: XPS foam board", "Grade: JL150–JL900", "Thickness: 50–100 mm", "Fire: B1 / B2"] },
  { id: "tiles", name: "Tiles", image: "/assets/prod-tile.png", count: 152, unit: "m²", base: 100, supplier: "Mattex", specs: ["Material: sintered stone / porcelain", "Size: 600×600–1200×3000", "Finish: marble / texture / artistic", "Use: floor / wall"] },
  { id: "vinyl", name: "Vinyl", image: "/assets/prod-vinyl.png", count: 2, unit: "m²", base: 100, supplier: "Mattex", specs: ["Type: homogeneous / heterogeneous vinyl", "Size: 2×20 m", "Thickness: 2–3 mm", "Use: flooring"] },
  { id: "precasted-concrete", name: "Precasted Concrete", image: "/assets/prod-precast.png", count: 40, unit: "m³", base: 100, supplier: "Mattex", specs: ["Type: precast block", "Size: modular / custom", "Finish: structural", "Use: civil / building"] },
  { id: "cat-ladder", name: "Cat Ladder", image: "/assets/prod-ironwork.png", count: 1, unit: "lot", base: 100, supplier: "Mattex", specs: ["Type: cat ladder", "Finish: galvanized", "Custom: by drawing"] },
  { id: "steel-shelving", name: "Logistics Storage Platform & Steel Shelving", image: "/assets/prod-ironwork.png", count: 1, unit: "lot", base: 100, supplier: "Mattex", specs: ["Type: storage platform / shelving", "Custom: by drawing"] },
  { id: "handrails", name: "Handrails", image: "/assets/prod-ironwork.png", count: 1, unit: "lot", base: 100, supplier: "Mattex", specs: ["Type: ball joint handrail", "Custom: by drawing"] },
  { id: "balustrades", name: "Balustrades", image: "/assets/prod-ironwork.png", count: 4, unit: "lot", base: 100, supplier: "Mattex", specs: ["Type: carbon / stainless / disability", "Custom: by drawing"] },
  { id: "forge-welded-grating", name: "Forge-welded Grating", image: "/assets/prod-grating.png", count: 5, unit: "m²", base: 100, supplier: "Mattex", specs: ["Type: forge-welded", "Material: galvanized steel", "Load: by drawing"] },
  { id: "press-lock-grating", name: "Press-Lock Grating", image: "/assets/prod-grating.png", count: 6, unit: "m²", base: 100, supplier: "Mattex", specs: ["Type: press-lock", "Material: galvanized steel", "Load: by drawing"] },
  { id: "gu-gratings", name: "GU Type Drainage Gratings", image: "/assets/prod-grating.png", count: 15, unit: "lot", base: 100, supplier: "Mattex", specs: ["Type: GU drainage grating", "Material: galvanized steel"] },
  { id: "gt-gratings", name: "GT Type Drainage Gratings", image: "/assets/prod-grating.png", count: 24, unit: "lot", base: 100, supplier: "Mattex", specs: ["Type: GT drainage grating", "Material: galvanized steel"] },
  { id: "gypsum-board", name: "Gypsum Board", image: "/assets/prod-gypsum-board.png", count: 4, unit: "m²", base: 100, supplier: "Mattex", specs: ["Type: fire-resistant gypsum board", "Size: 1220×2440", "Thickness: 9.5–15 mm"] },
  { id: "service", name: "Service", image: "/assets/sensor.png", count: 3, unit: "lot", base: 1800, supplier: "SiteServe Contracting", specs: ["Type: survey / install / inspect", "Scope: labour + report", "Lead: scheduled", "Use: site support"] },
  { id: "computer", name: "Computer", image: "/assets/plc.png", count: 3, unit: "pc", base: 920, supplier: "BuildIT Workstations", specs: ["Type: desktop / rugged laptop", "OS: Windows", "Use: site office / BIM", "Warranty: 3 year"] },
  { id: "hardware", name: "Hardware", image: "/assets/gearbox.png", count: 4, unit: "pack", base: 48, supplier: "FixRight Hardware Co.", specs: ["Type: fixings / tools", "Grade: commercial", "Finish: zinc / stainless", "Use: install"] },
  { id: "software", name: "Software", image: "/assets/vfd.png", count: 14, unit: "license", base: 240, supplier: "Mattex", specs: ["Type: construction software / platform", "Term: project / annual", "Use: site management / safety / BIM"] },
];

const ALT_SUPPLIERS = {
  precast: ["Harbor Precast Co.", "Bayform Concrete Systems"],
  barriers: ["SafeRoute Barriers Ltd.", "LaneLock Civil Products"],
  brick: ["Redclay Masonry Works", "BlockHouse Materials"],
  waterproof: ["AquaShield Membranes", "SealSpan Roofing Tech"],
  manhole: ["DrainCore Industrial"],
  insulation: ["ThermoWrap Building Systems", "EcoEnvelope Insulation"],
  plaster: ["FinishLine Plasters", "WallReady Coatings"],
  safetynet: ["SiteGuard Safety Gear", "EdgePro Construction Safety"],
  steel: ["Northspan Steel Group", "MetroFab Structural"],
  tile: ["Stoneform Ceramics", "SurfaceCraft Tile Co."],
  timber: ["Pacific Timber Supply", "GreenBeam Wood Products"],
  board: ["PanelCraft Interiors", "SheetLine Building Boards"],
  aggregate: ["QuarryPeak Aggregates", "RecycleBase Materials"],
  pipe: ["Flowline Pipe & Fittings", "HydroLink Plumbing Supply"],
  cable: ["VoltTray Electrical", "ConduitMax Systems"],
  service: ["SiteServe Contracting", "FieldLine Site Services"],
  computer: ["BuildIT Workstations", "SiteDesk Computing"],
  hardware: ["FixRight Hardware Co.", "BoltHouse Fasteners"],
};
const FEATURED_NAMES = {
  "precast-01": "Hollow-core Precast Slab",
  "barriers-01": "Jersey Concrete Barrier",
  "brick-01": "Clay Facing Brick Pack",
  "waterproof-01": "Torch-on Waterproof Membrane",
  "steel-01": "UB Structural Steel Beam",
  "insulation-01": "High-R PIR Insulation Board",
  "timber-01": "FSC-Certified Structural Plywood",
  "aggregate-01": "Recycled Concrete Aggregate",
  "board-01": "Low-VOC Gypsum Board",
  "tile-01": "Low-Carbon Porcelain Tile",
  "service-01": "Site Survey & Setting-out",
  "computer-01": "Rugged Site Workstation",
  "hardware-01": "Structural Fixings Kit",
  "software-01": "BIM Coordination License",
};

const GREEN_PRODUCT_IDS = new Set();

const SAMPLE_PROJECTS = [
  "Kai Tak Tower",
  "Tsuen Wan Station Fit-out",
  "Central Harbourfront",
  "HKIA 3RS",
];

const GREEN_BLURBS = {
  "timber-01": "FSC-certified plywood for responsible structural framing.",
  "timber-02": "Responsibly sourced timber sheet for fit-out and formwork.",
  "aggregate-01": "Recycled aggregate that reduces virgin quarry demand.",
  "waterproof-02": "Long-life membrane that reduces rework and waste.",
};

const CATEGORY_BLURBS = {
  precast: "Precast concrete blocks and custom units, quote-ready from Mattex.",
  barriers: "Concrete barrier unit for temporary or permanent works.",
  brick: "Gypsum partition blocks, 500 mm series, quote-ready from Mattex.",
  waterproof: "Torch-on or self-adhesive membrane for roof and basement.",
  manhole: "Forge-welded, press-lock, GU and GT drainage gratings.",
  insulation: "JL series XPS foam board, 50–100 mm, quote-ready from Mattex.",
  plaster: "25 kg skim or base coat for indoor and outdoor finishing.",
  safetynet: "Dense mesh flame-retardant safety nets in site sizes.",
  steel: "Reinforcement mesh, cat ladders, handrails and balustrades.",
  tile: "Sintered stone, porcelain tile and homogeneous vinyl flooring.",
  timber: "Structural plywood sheet for framing, fit-out, and formwork.",
  board: "Fire-resistant gypsum board 9.5–15 mm.",
  aggregate: "Washed crushed stone or sand for concrete and fill.",
  pipe: "UPVC or steel pipe with fittings, DN15–DN200.",
  cable: "Galvanized tray or trunking for electrical containment.",
  service: "Scheduled site service lot with labour and report.",
  computer: "Rugged workstation for site office and BIM coordination.",
  hardware: "Commercial fixings pack for install and assembly.",
  software: "Named annual license for takeoff, BIM, and RFQ.",
};

const CATEGORY_STANDARDS = {
  precast: "ISO 9001:2015",
  barriers: "BS EN 1317-2:2010",
  brick: "ISO 9001:2015",
  waterproof: "BS EN 13707:2013",
  manhole: "ISO 9001:2015",
  insulation: "ISO 9001:2015",
  plaster: "BS EN 998-1:2016",
  safetynet: "GB 5725-2009",
  steel: "BS4483:2005",
  tile: "ISO 9001:2015",
  timber: "BS EN 636:2012",
  board: "ISO 9001:2015",
  aggregate: "BS EN 12620:2013",
  pipe: "BS EN 1401-1:2019",
  cable: "BS EN 61537:2007",
  service: "ISO 9001:2015",
  computer: "IEC 60950-1",
  hardware: "BS EN 10204:2004",
  software: "ISO/IEC 27001:2022",
};

const CATEGORY_PREFIX = {
  precast: "PC",
  barriers: "BR",
  brick: "BK",
  waterproof: "WP",
  manhole: "MH",
  insulation: "IN",
  plaster: "PL",
  safetynet: "SN",
  steel: "ST",
  tile: "TL",
  timber: "TB",
  board: "BD",
  aggregate: "AG",
  pipe: "PF",
  cable: "CB",
  service: "SV",
  computer: "CP",
  hardware: "HW",
  software: "SW",
};

const UNIT_MOQ = {
  panel: 4,
  unit: 2,
  pack: 10,
  roll: 5,
  set: 1,
  bag: 20,
  pc: 1,
  box: 10,
  sheet: 8,
  ton: 5,
  length: 10,
  lot: 1,
  license: 1,
  m: 1,
  m2: 1,
  m3: 1,
  "m²": 1,
  "m³": 1,
};

const STOCK_I18N = {
  in_stock: "stockInStock",
  limited: "stockLimited",
  made_to_order: "stockMadeToOrder",
  out_of_stock: "stockOutOfStock",
};

function stockStatusFor(index, price) {
  if (price == null) return index % 2 === 0 ? "made_to_order" : "limited";
  if (index % 11 === 0) return "out_of_stock";
  if (index % 7 === 0) return "made_to_order";
  if (index % 4 === 0) return "limited";
  return "in_stock";
}

function leadTimeFor(status, index) {
  if (status === "out_of_stock") return { min: 21, max: 28 };
  if (status === "made_to_order") return index % 2 === 0 ? { min: 14, max: 14 } : { min: 14, max: 21 };
  if (status === "limited") return { min: 7, max: 7 };
  return index % 3 === 0 ? { min: 3, max: 3 } : { min: 7, max: 7 };
}

function stockStatusKey(status) {
  return STOCK_I18N[status] || "stockInStock";
}

function isDiscontinued(product) {
  return Boolean(product?.discontinued);
}

function activeCatalog(list) {
  return (list || []).filter((p) => !isDiscontinued(p));
}

function canDirectBuy(product) {
  if (isDiscontinued(product)) return false;
  return getEffectivePrice(product).displayPrice != null;
}

function quoteFor(i, price, isGreen) {
  if (price == null) return null;
  const listPrice = Math.round(price * 1.12 * 100) / 100;
  if (isGreen || i % 2 === 1) {
    let validUntil = "2026-11-17";
    if (i % 8 === 1) validUntil = "2026-08-24";
    else if (i % 5 === 0) validUntil = "2026-09-10";
    return { unitPrice: price, listPrice, validUntil, months: 3 };
  }
  if (i % 6 === 2) {
    return {
      unitPrice: Math.round(price * 0.9 * 100) / 100,
      listPrice: price,
      validUntil: "2026-06-30",
      months: 3,
    };
  }
  if (i % 9 === 4) {
    return { unitPrice: price, listPrice: null, validUntil: "2026-05-15", months: 3 };
  }
  return null;
}

function withMattexDemoPrice(product) {
  const seed = hashSeed(product.id);
  const stockStatus = product.stockStatus || stockStatusFor(seed % 11, null);
  return {
    ...product,
    price: null,
    quote: null,
    stockStatus,
    leadTime: product.leadTime || leadTimeFor(stockStatus, seed % 11),
  };
}

function isHitProduct(product) {
  return Boolean(product && (product.hit || product.featuredRank != null));
}

function withHitFlag(product) {
  if (product.featuredRank != null) return { ...product, hit: true };
  const seed = hashSeed(product.id);
  if (seed % 7 === 0) return { ...product, hit: true };
  return { ...product, hit: Boolean(product.hit) };
}

function applyMattexDemoPrices(list) {
  const out = list.map((p) => {
    const next = withHitFlag({ ...withMattexDemoPrice(p), sales: true });
    if (p.featuredRank != null) return next;
    const seed = hashSeed(p.id);
    if (seed % 73 !== 0) return next;
    return { ...next, discontinued: true };
  });
  return out;
}

function isQuoteActive(quote) {
  if (!quote?.validUntil) return false;
  const end = new Date(`${quote.validUntil}T23:59:59`);
  if (Number.isNaN(end.getTime())) return false;
  return end.getTime() >= Date.now();
}

function getEffectivePrice(product) {
  if (!product) return { displayPrice: null, status: "none", quote: null };
  return { displayPrice: null, status: "none", quote: null };
}

function formatQuoteDate(iso, lang) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === "zh" ? "zh-HK" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatQuoteDateShort(iso, lang) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === "zh" ? "zh-HK" : "en-GB", {
    day: "numeric",
    month: "short",
  });
}

function buildProducts() {
  const featuredIds = [];
  const out = [];
  CATEGORY_DEFS.forEach((cat) => {
    if (!SYNTHETIC_CATEGORY_IDS.has(cat.id)) return;
    const total = cat.count;
    for (let i = 1; i <= total; i++) {
      const id = cat.id + "-" + String(i).padStart(2, "0");
      const unpriced = i % 3 === 0 || (total <= 4 && i === total);
      const price = unpriced
        ? null
        : Math.round((cat.base * (0.85 + (i % 7) * 0.08)) * 100) / 100;
      const name =
        FEATURED_NAMES[id] ||
        cat.name.split(",")[0].trim() + " " + cat.unit + " #" + i;
      const isGreen = GREEN_PRODUCT_IDS.has(id);
      const suppliers = ALT_SUPPLIERS[cat.id] || [cat.supplier];
      const supplier = suppliers[(i - 1) % suppliers.length];
      const prefix = CATEGORY_PREFIX[cat.id] || cat.id.slice(0, 2).toUpperCase();
      const productNo = `SB-${prefix}-${String(i).padStart(4, "0")}`;
      const stockStatus = stockStatusFor(i, price);
      const moq = UNIT_MOQ[cat.unit] || 1;
      const quote = quoteFor(i, price, isGreen);
      out.push({
        id,
        name,
        productNo,
        category: cat.name,
        supplier,
        featuredRank: featuredIds.includes(id) ? featuredIds.indexOf(id) + 1 : null,
        green: isGreen,
        price,
        quote,
        unit: cat.unit,
        moq,
        stockStatus,
        leadTime: leadTimeFor(stockStatus, i),
        standard: CATEGORY_STANDARDS[cat.id] || "—",
        description: isGreen
          ? GREEN_BLURBS[id] || "Green-preferred SKU for lower-impact project procurement."
          : CATEGORY_BLURBS[cat.id] || "Spec-ready SKU for RFQ.",
        image: cat.image,
        specs: isGreen
          ? cat.specs.concat(["Tag: Green preferred", "Impact: lower-carbon option"])
          : cat.specs.slice(),
      });
    }
  });
  const leftover = out.filter(
    (p) => !HIDDEN_CATEGORY_IDS.has(categoryIdFromName(p.category)) && isMattexSupplier(p.supplier)
  );
  return applyMattexDemoPrices(MATTEX_PRODUCTS).concat(leftover);
}

function categoryIdFromName(name) {
  const found = CATEGORY_DEFS.find((c) => c.name === name);
  return found ? found.id : "";
}

const PRODUCTS = buildProducts();

const CATEGORIES = CATEGORY_DEFS.map((c) => c.name);

function getCategoryDefs() {
  return CATEGORY_DEFS.filter((c) => !HIDDEN_CATEGORY_IDS.has(c.id)).map((c) => ({
    id: c.id,
    name: c.name,
    image: c.image,
    count: activeCatalog(PRODUCTS).filter((p) => p.category === c.name).length,
  }));
}

function getCategories() {
  return CATEGORY_DEFS.filter((c) => !HIDDEN_CATEGORY_IDS.has(c.id)).map((c) => c.name);
}

function getCategoryBySlug(slug) {
  const id = String(slug || "").trim();
  if (!id || HIDDEN_CATEGORY_IDS.has(id)) return null;
  return getCategoryDefs().find((c) => c.id === id) || null;
}

function getCategoryByName(name) {
  const value = String(name || "").trim();
  if (!value) return null;
  return getCategoryDefs().find((c) => c.name === value) || null;
}

function catalogPathForCategory(nameOrSlug) {
  const found = getCategoryBySlug(nameOrSlug) || getCategoryByName(nameOrSlug);
  return found ? `/catalog/${found.id}` : "/";
}

function getTopProducts(limit) {
  const n = limit || 5;
  return activeCatalog(PRODUCTS)
    .filter((p) => p.featuredRank != null)
    .sort((a, b) => a.featuredRank - b.featuredRank)
    .slice(0, n);
}

function getGreenProducts(limit) {
  const list = activeCatalog(PRODUCTS).filter((p) => p.green);
  return typeof limit === "number" ? list.slice(0, limit) : list;
}

function getSalesProducts(limit) {
  const list = activeCatalog(PRODUCTS).filter((p) => p.sales);
  const featured = list
    .filter((p) => p.featuredRank != null)
    .sort((a, b) => a.featuredRank - b.featuredRank);
  const rest = list.filter((p) => p.featuredRank == null);
  const ordered = featured.concat(rest);
  return typeof limit === "number" ? ordered.slice(0, limit) : ordered;
}

function getProductsByCategory(category) {
  const names = Array.isArray(category)
    ? category.filter(Boolean)
    : !category || category === "all"
      ? []
      : [category];
  const source = activeCatalog(PRODUCTS);
  if (!names.length) return source.slice();
  const set = new Set(names);
  return source.filter((p) => set.has(p.category));
}

const CATEGORY_SEARCH_TERMS = {
  "Reinforcement Mesh": ["BRC", "welded mesh", "reinforcing mesh", "square mesh", "鋼筋網", "鐵網", "鋼網"],
  "Dense Mesh Flame Retardant Safety Net": ["safety net", "FR net", "debris net", "密目網", "安全網", "阻燃網"],
  "Gypsum Block": ["gypsum block", "partition block", "石膏砌塊", "石膏磚"],
  "XPS Foam Board": ["XPS", "foam board", "insulation board", "擠塑板", "保溫板"],
  "Tiles": ["tile", "sintered stone", "porcelain", "瓷磚", "岩板"],
  "Vinyl": ["vinyl flooring", "PVC floor", "膠地板", "塑膠地板"],
  "Precasted Concrete": ["precast", "precast block", "預製混凝土", "預製件"],
  "Cat Ladder": ["cat ladder", "roof ladder", "貓梯", "爬梯"],
  "Logistics Storage Platform & Steel Shelving": ["steel shelving", "storage platform", "貨架", "鋼架"],
  "Handrails": ["handrail", "ball joint", "扶手"],
  "Balustrades": ["balustrade", "railing", "欄杆", "欄河"],
  "Forge-welded Grating": ["forge-welded grating", "steel grating", "焊接格柵", "鋼格板"],
  "Press-Lock Grating": ["press-lock grating", "pressure locked grating", "壓鎖格柵"],
  "GU Type Drainage Gratings": ["GU grating", "drainage grating", "排水溝蓋"],
  "GT Type Drainage Gratings": ["GT grating", "drainage grating", "排水溝蓋"],
  "Gypsum Board": ["plasterboard", "drywall", "石膏板"],
  "Software": ["license", "BIM", "軟件授權"],
};

function getProductRemarks(product) {
  if (!product) return [];
  if (Array.isArray(product.remarks) && product.remarks.length) {
    return product.remarks.map((term) => String(term).trim()).filter(Boolean);
  }
  const fromName = String(product.name || "")
    .split(/[—–,/()]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 1 && part.length < 48);
  const fromCat = CATEGORY_SEARCH_TERMS[product.category] || [];
  const extra = [product.productNo, product.standard].filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const term of [...fromName, ...fromCat, ...extra]) {
    const key = String(term).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(String(term));
  }
  return out.slice(0, 14);
}

function productSearchBlob(product) {
  const specs = Array.isArray(product.specs) ? product.specs.join(" ") : "";
  return [
    product.id,
    product.productNo,
    product.name,
    product.category,
    product.supplier,
    product.description,
    product.standard,
    product.stockStatus,
    specs,
    getProductRemarks(product).join(" "),
    "price upon request quote",
    product.green ? "green eco sustainable low-carbon fsc recycled" : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

const SEARCH_FIELD_KEYS = ["name", "category", "sku", "spec", "supplier", "remarks"];

function productSearchText(product, fields) {
  const selected = Array.isArray(fields) ? fields.filter((f) => SEARCH_FIELD_KEYS.includes(f)) : [];
  if (!selected.length || selected.length === SEARCH_FIELD_KEYS.length) {
    return productSearchBlob(product);
  }
  const specs = Array.isArray(product.specs) ? product.specs.join(" ") : "";
  const parts = [];
  if (selected.includes("name")) parts.push(product.name);
  if (selected.includes("category")) parts.push(product.category);
  if (selected.includes("sku")) parts.push(product.productNo, product.id);
  if (selected.includes("spec")) parts.push(specs, product.standard, product.description);
  if (selected.includes("supplier")) parts.push(product.supplier);
  if (selected.includes("remarks")) parts.push(getProductRemarks(product).join(" "));
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function searchProducts(query, category, options = {}) {
  const base = getProductsByCategory(category);
  const q = String(query || "")
    .trim()
    .toLowerCase();
  if (!q) return base;
  const tokens = q.split(/\s+/).filter(Boolean);
  return base.filter((p) => {
    const blob = productSearchText(p, options.fields);
    return tokens.every((token) => blob.includes(token));
  });
}

function searchProductsUnion(queries, category, options = {}) {
  const seen = new Set();
  const out = [];
  for (const raw of queries || []) {
    const hits = searchProducts(raw, category, options);
    for (const product of hits) {
      if (seen.has(product.id)) continue;
      seen.add(product.id);
      out.push(product);
    }
  }
  return out;
}

function tokenizeMatch(value) {
  return String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fff]+/)
    .filter((token) => token.length >= 2);
}

function suggestCatalogMatch(item) {
  const nameTokens = tokenizeMatch(item?.name);
  const specTokens = tokenizeMatch(item?.spec);
  const category = String(item?.category || "").toLowerCase();
  if (!nameTokens.length && !specTokens.length) return null;
  let best = null;
  let bestScore = 0;
  for (const product of activeCatalog(PRODUCTS)) {
    const name = String(product.name || "").toLowerCase();
    const blob = [
      name,
      product.productNo,
      product.id,
      product.category,
      product.description,
      Array.isArray(product.specs) ? product.specs.join(" ") : "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    let score = 0;
    for (const token of nameTokens) {
      if (name.includes(token)) score += 4;
      else if (blob.includes(token)) score += 1;
    }
    for (const token of specTokens) {
      if (blob.includes(token)) score += 2;
    }
    if (category && String(product.category || "").toLowerCase() === category) score += 3;
    if (score > bestScore) {
      bestScore = score;
      best = product;
    }
  }
  if (!best || bestScore < 4) return null;
  return {
    id: best.id,
    name: best.name,
    productNo: best.productNo,
    category: best.category,
    image: best.image,
  };
}

function getProductsByIds(ids) {
  const set = new Set((ids || []).map(String));
  return activeCatalog(PRODUCTS).filter((p) => set.has(String(p.id)));
}

function supplierSlug(name) {
  const raw = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  if (raw === "mattex" || raw.startsWith("mattex-")) return "mattex";
  return raw;
}

function supplierPath(name) {
  return `/supplier/${supplierSlug(name)}`;
}

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < String(str).length; i += 1) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const SUPPLIER_LOGO_PALETTES = [
  { bg: "#245A41", fg: "#F3F8F5", accent: "#8FCB9B" },
  { bg: "#1B4633", fg: "#E8F0EA", accent: "#C5DCC8" },
  { bg: "#2C4A3E", fg: "#F6F7F5", accent: "#6BAF86" },
  { bg: "#101513", fg: "#DCECE2", accent: "#4F8F6C" },
  { bg: "#3D5348", fg: "#F1F7F3", accent: "#A9C9B4" },
  { bg: "#1E3A4C", fg: "#E8F2F0", accent: "#7EB8B0" },
  { bg: "#4A4033", fg: "#F7F1E8", accent: "#C4B08A" },
  { bg: "#3A2F45", fg: "#F3EEF6", accent: "#B7A2C9" },
];

function supplierInitials(name) {
  const parts = String(name || "S")
    .replace(/[.,]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return String(parts[0] || "S").slice(0, 2).toUpperCase();
}

function supplierBrand(name) {
  const seed = hashSeed(name || "supplier");
  const palette = SUPPLIER_LOGO_PALETTES[seed % SUPPLIER_LOGO_PALETTES.length];
  return {
    initials: supplierInitials(name),
    variant: seed % 5,
    ...palette,
  };
}

const SUPPLIER_BANKS = [
  { bank: "The Hongkong and Shanghai Banking Corporation", short: "HSBC", swift: "HSBCHKHHHKH", code: "004" },
  { bank: "Hang Seng Bank Limited", short: "Hang Seng", swift: "HASEHKHHXXX", code: "024" },
  { bank: "Bank of China (Hong Kong) Limited", short: "BOCHK", swift: "BKCHHKHHXXX", code: "012" },
];

function buildSupplierBankInfo(name) {
  const seed = hashSeed(name || "supplier");
  const bank = SUPPLIER_BANKS[seed % SUPPLIER_BANKS.length];
  const branch = String(100 + (seed % 800));
  const account = String(100000 + ((seed >> 2) % 900000));
  return {
    supplierName: name,
    bankName: bank.bank,
    bankShort: bank.short,
    bankCode: bank.code,
    swift: bank.swift,
    accountName: String(name || "Supplier").toUpperCase(),
    accountNumber: `${bank.code}-${branch}-${account}`,
    fpsId: String(80000000 + (seed % 19999999)),
    currency: "HKD",
  };
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function buildSupplierMetrics(slug) {
  const seed = hashSeed(slug || "supplier");
  const subbieRating = clamp(4.2 + (seed % 8) / 10, 3.8, 5);
  const buyerRating = clamp(3.9 + ((seed >> 2) % 10) / 10, 3.6, 5);
  const subbieOrders = 90 + (seed % 240);
  const buyerReviews = 28 + ((seed >> 1) % 110);
  const subbieComplete = clamp(91 + (seed % 9), 88, 99);
  const buyerComplete = clamp(88 + ((seed >> 4) % 11), 85, 99);
  const subbieOnTime = clamp(87 + ((seed >> 3) % 12), 84, 99);
  const buyerOnTime = clamp(84 + ((seed >> 5) % 14), 80, 98);
  const weight = subbieOrders + buyerReviews;
  const searches = 640 + (seed % 2100);
  const found = Math.round(searches * (0.28 + ((seed >> 3) % 18) / 100));
  const rfqs = Math.max(8, Math.round(found * (0.08 + ((seed >> 5) % 10) / 100)));
  return {
    rating: Math.round(((subbieRating * subbieOrders + buyerRating * buyerReviews) / weight) * 10) / 10,
    completionRate: Math.round((subbieComplete + buyerComplete) / 2),
    onTimeRate: Math.round((subbieOnTime + buyerOnTime) / 2),
    searchCount: searches,
    foundCount: found,
    rfqCount: rfqs,
  };
}

function getProductRating() {
  return { rating: 0, reviews: 0, empty: true };
}

const SUPPLIER_DISPLAY_NAMES = {
  Mattex: "Mattex Asia Development Limited",
};

function supplierDisplayName(name) {
  return SUPPLIER_DISPLAY_NAMES[name] || name || "";
}

function isMattexSupplier(name) {
  const slug = supplierSlug(name);
  return slug === "mattex" || slug.startsWith("mattex-") || /\bmattex\b/i.test(String(name || ""));
}

const supplierMetricsBySlug = new Map();

function emptySupplierMetrics() {
  return {
    rating: 0,
    completionRate: 0,
    onTimeRate: 0,
    searchCount: 0,
    foundCount: 0,
    rfqCount: 0,
    empty: true,
  };
}

function metricsForSlug(slug) {
  return supplierMetricsBySlug.get(slug) || emptySupplierMetrics();
}

function mergeDraftMaps(local, remote) {
  const out = remote && typeof remote === "object" ? { ...remote } : {};
  const src = local && typeof local === "object" ? local : {};
  for (const [key, draft] of Object.entries(src)) {
    const localLines = Array.isArray(draft?.lines) ? draft.lines.length : 0;
    const remoteLines = Array.isArray(out[key]?.lines) ? out[key].lines.length : 0;
    if (localLines && localLines >= remoteLines) out[key] = draft;
  }
  return out;
}

function mergeRfqMaps(local, remote) {
  const out = remote && typeof remote === "object" ? { ...remote } : {};
  const src = local && typeof local === "object" ? local : {};
  for (const [key, list] of Object.entries(src)) {
    const byId = new Map((Array.isArray(out[key]) ? out[key] : []).map((rfq) => [rfq?.id, rfq]));
    for (const rfq of Array.isArray(list) ? list : []) {
      if (rfq?.id && !byId.has(rfq.id)) byId.set(rfq.id, rfq);
    }
    out[key] = [...byId.values()].sort((a, b) =>
      String(b?.submittedAt || "").localeCompare(String(a?.submittedAt || ""))
    );
  }
  return out;
}

function writeLocalOnly(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

async function hydrateStore() {
  try {
    const remote = await fetchRemoteState();
    if (!remote) return false;
    if (remote.products.length) {
      PRODUCTS.splice(0, PRODUCTS.length, ...remote.products);
    }
    supplierMetricsBySlug.clear();
    Object.entries(remote.metrics || {}).forEach(([slug, metrics]) => {
      supplierMetricsBySlug.set(slug, metrics);
    });
    if (remote.kv[ACCOUNTS_KEY]) {
      writeLocalOnly(ACCOUNTS_KEY, { ...readJson(ACCOUNTS_KEY, {}), ...remote.kv[ACCOUNTS_KEY] });
    }
    if (remote.kv[DRAFTS_KEY]) {
      writeLocalOnly(DRAFTS_KEY, mergeDraftMaps(readJson(DRAFTS_KEY, {}), remote.kv[DRAFTS_KEY]));
    }
    if (remote.kv[RFQS_KEY]) {
      writeLocalOnly(RFQS_KEY, mergeRfqMaps(readJson(RFQS_KEY, {}), remote.kv[RFQS_KEY]));
    }
    const remoteSeq = Number(remote.kv[SEQ_KEY] || 0);
    let localSeq = 0;
    try {
      localSeq = Number(localStorage.getItem(SEQ_KEY) || 0);
    } catch {
      localSeq = 0;
    }
    if (remoteSeq > localSeq) {
      try {
        localStorage.setItem(SEQ_KEY, String(remoteSeq));
      } catch {
        /* ignore */
      }
    }
    emitStoreChange();
    return true;
  } catch (error) {
    console.warn("supabase hydrate", error?.message || error);
    return false;
  }
}

function getSuppliers() {
  const map = new Map();
  PRODUCTS.forEach((p) => {
    if (!p.supplier || !isMattexSupplier(p.supplier)) return;
    const slug = supplierSlug(p.supplier);
    if (!map.has(slug)) {
      map.set(slug, {
        slug,
        name: p.supplier,
        image: p.image,
        categories: new Set(),
        count: 0,
      });
    }
    const entry = map.get(slug);
    entry.count += 1;
    entry.categories.add(p.category);
    if (!entry.image && p.image) entry.image = p.image;
  });
  return Array.from(map.values())
    .map((s) => ({
      slug: s.slug,
      name: supplierDisplayName(s.name),
      image: s.image,
      verified: hashSeed(s.slug) % 3 !== 2,
      count: s.count,
      categories: Array.from(s.categories).sort(),
      metrics: metricsForSlug(s.slug),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getSupplier(slugOrName) {
  const key = supplierSlug(slugOrName);
  return getSuppliers().find((s) => s.slug === key) || null;
}

function getProductsBySupplier(slugOrName) {
  const key = supplierSlug(slugOrName);
  return activeCatalog(PRODUCTS).filter((p) => supplierSlug(p.supplier) === key);
}

function getTopProductsForSupplier(slugOrName, limit) {
  const n = limit || 5;
  const list = getProductsBySupplier(slugOrName);
  const featured = list
    .filter((p) => p.featuredRank != null)
    .sort((a, b) => a.featuredRank - b.featuredRank);
  const rest = list
    .filter((p) => p.featuredRank == null)
    .sort((a, b) => Number(b.green) - Number(a.green) || a.name.localeCompare(b.name));
  return featured.concat(rest).slice(0, n);
}

function searchSupplierProducts(slugOrName, query) {
  const base = getProductsBySupplier(slugOrName);
  const q = String(query || "")
    .trim()
    .toLowerCase();
  if (!q) return base;
  const tokens = q.split(/\s+/).filter(Boolean);
  return base.filter((p) => {
    const blob = productSearchBlob(p);
    return tokens.every((token) => blob.includes(token));
  });
}



const listeners = new Set();
let storeSnapshot = {
  user: null,
  cartCount: 0,
  draft: { lines: [], note: "" },
  rfqs: [],
};

function refreshStoreSnapshot() {
  storeSnapshot = {
    user: getUser(),
    cartCount: cartCount(),
    draft: getDraft(),
    rfqs: getRfqs(),
  };
}

function emitStoreChange() {
  refreshStoreSnapshot();
  listeners.forEach((l) => l());
}
export function subscribeStore(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function getStoreSnapshot() {
  return storeSnapshot;
}

const AUTH_KEY = "subbie_auth";
const ACCOUNTS_KEY = "subbie_accounts";
const DRAFTS_KEY = "subbie_drafts_by_user";
const RFQS_KEY = "subbie_rfqs_by_user";
const GUEST_KEY = "__guest__";
const SEQ_KEY = "subbie_rfq_seq";
const WHATSAPP_NUMBER = "85256013989";
const WHATSAPP_DISPLAY = "852-56013989";
const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}`;
const MATTEX_CHAIN_URL = "https://uat-chain.mattex.com.hk/overview";
const MATTEX_SITE_URL = "https://www.mattex.com.hk/";

const PENDING_CART_KEY = "subbie_pending_cart";
const PENDING_WA_RFQ_KEY = "subbie_pending_whatsapp_rfq";
const PENDING_CUSTOM_KEY = "subbie_pending_custom";
const PENDING_WA_ORDER_KEY = "subbie_pending_whatsapp_order";

function formatPrice(price) {
  if (price == null) {
    try {
      return localStorage.getItem("subbie_lang") === "zh" ? "價格待定" : "Price Upon Request";
    } catch {
      return "Price Upon Request";
    }
  }
  return (
    "$" +
    price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
  persistKv(key, value);
}

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function isLoggedIn() {
  const data = getUser();
  return Boolean(data && data.email);
}

function normalizeProfileProject(value) {
  return String(value || "").trim() || SAMPLE_PROJECTS[0];
}

function getUser() {
  const user = readJson(AUTH_KEY, null);
  if (!user) return null;
  return {
    ...user,
    project: normalizeProfileProject(user.project),
  };
}

function emptyDraft() {
  return {
    lines: [],
    note: "",
    responseDate: "",
    deliveryDate: "",
    deliveryMode: "one_time",
    deliveryLots: [],
    project: "",
    address: "",
    canonicalCategory: "",
    acceptSubstitutes: false,
  };
}

function normalizeDeliveryMode(value) {
  return value === "partial" ? "partial" : "one_time";
}

function emptyDeliveryLot() {
  return { date: "", note: "" };
}

function normalizeDeliveryLots(list, { mode, deliveryDate } = {}) {
  const lots = (Array.isArray(list) ? list : []).map((lot) => ({
    date: String(lot?.date || "").trim(),
    note: String(lot?.note || "").trim(),
  }));
  if (normalizeDeliveryMode(mode) !== "partial") return lots;
  if (!lots.length) lots.push({ date: String(deliveryDate || "").trim(), note: "" });
  while (lots.length < 2) lots.push(emptyDeliveryLot());
  return lots;
}

function normalizeDraft(draft) {
  const src = draft || {};
  return {
    lines: Array.isArray(src.lines) ? src.lines : [],
    note: src.note || "",
    responseDate: src.responseDate || src.quotationDeadline || "",
    deliveryDate: src.deliveryDate || "",
    deliveryMode: normalizeDeliveryMode(src.deliveryMode),
    deliveryLots: normalizeDeliveryLots(src.deliveryLots, {
      mode: src.deliveryMode,
      deliveryDate: src.deliveryDate,
    }),
    project: String(src.project || "").trim(),
    address: src.address || "",
    canonicalCategory: src.canonicalCategory || "",
    acceptSubstitutes: Boolean(src.acceptSubstitutes),
  };
}

function getDraftsMap() {
  return readJson(DRAFTS_KEY, {});
}

function setDraftsMap(map) {
  writeJson(DRAFTS_KEY, map);
}

function getRfqsMap() {
  return readJson(RFQS_KEY, {});
}

function setRfqsMap(map) {
  writeJson(RFQS_KEY, map);
}

function currentEmail() {
  const user = getUser();
  return user ? normalizeEmail(user.email) : null;
}

function accountKey() {
  return currentEmail() || GUEST_KEY;
}

function getDraft() {
  const key = accountKey();
  const map = getDraftsMap();
  return map[key] ? normalizeDraft(map[key]) : emptyDraft();
}

function setDraft(draft) {
  const key = accountKey();
  const map = getDraftsMap();
  map[key] = normalizeDraft(draft);
  setDraftsMap(map);
  emitStoreChange();
}

function getCart() {
  return getDraft().lines.map((line) => {
    if (line.custom) {
      return {
        id: line.productId,
        name: line.name || "Custom item",
        price: null,
        qty: line.qty,
        custom: true,
        intent: line.intent || "quote",
      };
    }
    const product = getProduct(line.productId);
    return {
      id: line.productId,
      name: product ? product.name : line.productId,
      price: product ? getEffectivePrice(product).displayPrice : null,
      qty: line.qty,
      custom: false,
      intent: line.intent || (product && getEffectivePrice(product).displayPrice != null ? "buy" : "quote"),
    };
  });
}

function cartCount() {
  return getDraft().lines.length;
}

function newCustomProductId() {
  return `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function addToCart(productId, { intent, qty } = {}) {
  const product = getProduct(productId);
  if (!product || isDiscontinued(product)) return getCart();
  const draft = getDraft();
  const minQty = Math.max(1, Number(product.moq) || 1);
  const addQty = Math.max(minQty, Math.floor(Number(qty)) || minQty);
  const nextIntent = intent || (getEffectivePrice(product).displayPrice != null ? "buy" : "quote");
  const existing = draft.lines.find((l) => l.productId === productId && !l.custom);
  if (existing) {
    existing.qty = (existing.qty || 0) + addQty;
    existing.intent = nextIntent;
  } else {
    draft.lines.push({ productId, qty: addQty, intent: nextIntent });
  }
  setDraft(draft);
  return getCart();
}

function isStoredAttachmentUrl(url) {
  const value = String(url || "").trim();
  return value.startsWith("data:") || /^https?:\/\//i.test(value);
}

function normalizeAttachments(list) {
  if (!list) return [];
  return (Array.isArray(list) ? list : [list])
    .map((item) => {
      const url = String(item?.url || "").trim();
      return {
        name: String(item?.name || "file").slice(0, 180),
        type: String(item?.type || ""),
        size: Number(item?.size) || 0,
        kind: item?.kind === "image" || item?.kind === "text" ? item.kind : "document",
        url: isStoredAttachmentUrl(url) ? url : "",
      };
    })
    .filter((item) => item.name)
    .slice(0, 8);
}

function addCustomLine({ name, description = "", qty = 1, category = "", attachments, image = "" } = {}) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return { ok: false, error: "name" };
  const nextQty = Math.floor(Number(qty));
  const draft = getDraft();
  const productId = newCustomProductId();
    draft.lines.push({
      productId,
      qty: Number.isFinite(nextQty) && nextQty >= 1 ? nextQty : 1,
      custom: true,
      intent: "quote",
      name: trimmed,
      description: String(description || "").trim(),
      category: String(category || "").trim(),
      attachments: normalizeAttachments(attachments),
      image: String(image || ""),
    });
  setDraft(draft);
  return { ok: true, productId };
}

function updateCustomLine(productId, patch = {}) {
  const draft = getDraft();
  const line = draft.lines.find((l) => String(l.productId) === String(productId));
  if (!line || !line.custom) return { ok: false, error: "not_found" };
  if (patch.name != null) {
    const trimmed = String(patch.name).trim();
    if (!trimmed) return { ok: false, error: "name" };
    line.name = trimmed;
  }
  if (patch.description != null) {
    line.description = String(patch.description).trim();
  }
  if (patch.qty != null) {
    const next = Math.floor(Number(patch.qty));
    if (!Number.isFinite(next) || next < 1) return { ok: false, error: "qty" };
    line.qty = next;
  }
  if (patch.category != null) {
    line.category = String(patch.category || "").trim();
  }
  if (patch.attachments !== undefined) {
    line.attachments = normalizeAttachments(patch.attachments);
  }
  if (patch.image !== undefined) {
    line.image = String(patch.image || "");
  }
  setDraft(draft);
  return { ok: true };
}

function setLineQty(productId, qty) {
  const draft = getDraft();
  const line = draft.lines.find((l) => String(l.productId) === String(productId));
  if (!line) return draft;
  const next = Math.floor(Number(qty));
  if (!Number.isFinite(next) || next < 1) return draft;
  const product = line.custom ? null : getProduct(line.productId);
  const minQty = product ? Math.max(1, Number(product.moq) || 1) : 1;
  line.qty = Math.max(minQty, next);
  setDraft(draft);
  return draft;
}

function setLineIntent(productId, intent) {
  const draft = getDraft();
  const line = draft.lines.find((l) => String(l.productId) === String(productId));
  if (!line) return { ok: false, reason: "missing" };
  const next = intent === "buy" ? "buy" : "quote";
  if (next === "buy") {
    if (line.custom) return { ok: false, reason: "unpriced" };
    const product = getProduct(line.productId);
    const price = product ? getEffectivePrice(product).displayPrice : null;
    if (price == null) return { ok: false, reason: "unpriced" };
  }
  line.intent = next;
  if (next === "buy") delete line.requestedUnitPrice;
  setDraft(draft);
  return { ok: true };
}

function setLineRequestedPrice(productId, value) {
  const draft = getDraft();
  const line = draft.lines.find((l) => String(l.productId) === String(productId));
  if (!line || line.custom) return draft;
  const product = getProduct(line.productId);
  const listPrice = product ? getEffectivePrice(product).displayPrice : null;
  if (listPrice == null) return draft;
  if (value === "" || value == null) {
    delete line.requestedUnitPrice;
    setDraft(draft);
    return draft;
  }
  const n = Math.round(Number(value) * 100) / 100;
  if (!Number.isFinite(n) || n <= 0) return draft;
  line.requestedUnitPrice = n;
  setDraft(draft);
  return draft;
}

function removeLine(productId) {
  const draft = getDraft();
  draft.lines = draft.lines.filter((l) => String(l.productId) !== String(productId));
  setDraft(draft);
  return draft;
}

function removeLines(productIds) {
  const ids = new Set((productIds || []).map((id) => String(id)));
  if (!ids.size) return getDraft();
  const draft = getDraft();
  draft.lines = draft.lines.filter((l) => !ids.has(String(l.productId)));
  setDraft(draft);
  return draft;
}

function setDraftNote(note) {
  const draft = getDraft();
  draft.note = String(note || "");
  setDraft(draft);
  return draft;
}

function setDraftResponseDate(value) {
  const draft = getDraft();
  draft.responseDate = String(value || "");
  setDraft(draft);
  return draft;
}

function setDraftAddress(value) {
  const draft = getDraft();
  draft.address = String(value || "");
  setDraft(draft);
  return draft;
}

function setDraftProject(value) {
  const draft = getDraft();
  draft.project = String(value || "").trim();
  setDraft(draft);
  return draft;
}

function setDraftDeliveryDate(value) {
  const draft = getDraft();
  draft.deliveryDate = String(value || "");
  setDraft(draft);
  return draft;
}

function setDraftDeliveryMode(value) {
  const draft = getDraft();
  draft.deliveryMode = normalizeDeliveryMode(value);
  if (draft.deliveryMode === "partial") {
    draft.deliveryLots = normalizeDeliveryLots(draft.deliveryLots, {
      mode: "partial",
      deliveryDate: draft.deliveryDate,
    });
  }
  setDraft(draft);
  return draft;
}

function setDraftDeliveryLots(lots) {
  const draft = getDraft();
  draft.deliveryLots = normalizeDeliveryLots(lots, {
    mode: draft.deliveryMode,
    deliveryDate: draft.deliveryDate,
  });
  if (draft.deliveryMode === "partial" && draft.deliveryLots[0]?.date) {
    draft.deliveryDate = draft.deliveryLots[0].date;
  }
  setDraft(draft);
  return draft;
}

function setDraftCanonicalCategory(value) {
  const draft = getDraft();
  draft.canonicalCategory = String(value || "");
  setDraft(draft);
  return draft;
}

function setDraftAcceptSubstitutes(value) {
  const draft = getDraft();
  draft.acceptSubstitutes = Boolean(value);
  setDraft(draft);
  return draft;
}

function inferCanonicalCategory(lines) {
  const counts = {};
  for (const line of lines || []) {
    const name = line.category || (line.custom ? "" : getProduct(line.productId)?.category) || "";
    if (!name) continue;
    counts[name] = (counts[name] || 0) + 1;
  }
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return ranked.length ? ranked[0][0] : "";
}

function draftTotals(draft, productIds) {
  let pricedSubtotal = 0;
  let unpricedCount = 0;
  const hasFilter = arguments.length > 1;
  const idFilter = hasFilter ? new Set((productIds || []).map(String)) : null;
  const sourceLines = idFilter
    ? (draft.lines || []).filter((line) => idFilter.has(String(line.productId)))
    : draft.lines || [];
  const enriched = sourceLines.map((line) => {
    if (line.custom) {
      unpricedCount += 1;
      return {
        productId: line.productId,
        qty: line.qty,
        name: line.name || "Custom item",
        description: line.description || "",
        supplier: null,
        unitPrice: null,
        image: line.image || null,
        custom: true,
        intent: line.intent || "quote",
        moq: 1,
        productNo: "",
        category: line.category || "",
        green: false,
        attachments: Array.isArray(line.attachments) ? line.attachments : [],
      };
    }
    const product = getProduct(line.productId);
    const unitPrice = product ? getEffectivePrice(product).displayPrice : null;
    if (unitPrice == null) unpricedCount += 1;
    else pricedSubtotal += unitPrice * line.qty;
    return {
      productId: line.productId,
      qty: line.qty,
      name: product ? product.name : line.productId,
      description: product ? product.description : "",
      supplier: product ? product.supplier : null,
      unitPrice,
      requestedUnitPrice:
        line.requestedUnitPrice != null && Number(line.requestedUnitPrice) > 0
          ? Number(line.requestedUnitPrice)
          : null,
      image: product ? product.image : null,
      custom: false,
      intent: line.intent || (unitPrice != null ? "buy" : "quote"),
      moq: product ? product.moq : 1,
      productNo: product ? product.productNo : "",
      category: product ? product.category : "",
      green: Boolean(product?.green),
    };
  });
  return {
    lines: enriched,
    pricedSubtotal,
    unpricedCount,
    note: draft.note || "",
    responseDate: draft.responseDate || "",
    deliveryDate: draft.deliveryDate || "",
    deliveryMode: normalizeDeliveryMode(draft.deliveryMode),
    deliveryLots: normalizeDeliveryLots(draft.deliveryLots, {
      mode: draft.deliveryMode,
      deliveryDate: draft.deliveryDate,
    }),
    project: String(draft.project || "").trim(),
    address: draft.address || "",
    canonicalCategory: draft.canonicalCategory || "",
    acceptSubstitutes: Boolean(draft.acceptSubstitutes),
  };
}

function nextRfqId() {
  const seq = Number(localStorage.getItem(SEQ_KEY) || "1000") + 1;
  try {
    localStorage.setItem(SEQ_KEY, String(seq));
  } catch {
    /* ignore quota */
  }
  persistKv(SEQ_KEY, seq);
  return `RFQ-${seq}`;
}

function getRfqs() {
  const key = accountKey();
  const map = getRfqsMap();
  return Array.isArray(map[key]) ? map[key] : [];
}

function submitRfq(productIds, options = {}) {
  const email = accountKey();
  let draft = getDraft();
  if (!draft.lines.length) return { ok: false, error: "empty" };
  const skipLogistics = Boolean(options.skipLogistics);
  if (!skipLogistics) {
    if (!String(draft.responseDate || "").trim()) return { ok: false, error: "response_date" };
    if (!String(draft.deliveryDate || "").trim()) return { ok: false, error: "delivery_date" };
  }
  const deliveryMode = normalizeDeliveryMode(draft.deliveryMode);
  const deliveryLots = normalizeDeliveryLots(draft.deliveryLots, {
    mode: deliveryMode,
    deliveryDate: draft.deliveryDate,
  });
  if (!skipLogistics && deliveryMode === "partial") {
    const dated = deliveryLots.filter((lot) => lot.date);
    if (dated.length < 2) return { ok: false, error: "delivery_lots" };
  }
  if (!skipLogistics && !String(draft.address || "").trim()) return { ok: false, error: "address" };

  const selectedIds =
    Array.isArray(productIds) && productIds.length
      ? productIds.map(String)
      : draft.lines.map((l) => String(l.productId));
  const selectedSet = new Set(selectedIds);
  const selectedLines = draft.lines.filter((l) => selectedSet.has(String(l.productId)));
  if (!selectedLines.length) return { ok: false, error: "none_selected" };
  const blocked = selectedLines.filter((l) => !l.custom && isDiscontinued(getProduct(l.productId)));
  if (blocked.length) return { ok: false, error: "discontinued" };

  const totals = draftTotals({ ...draft, lines: selectedLines });
  const channel =
    options.channel === "whatsapp" ? "whatsapp" : options.channel === "email" ? "email" : "rfq";
  const rfq = {
    id: nextRfqId(),
    status: channel === "whatsapp" ? "whatsapp_sent" : channel === "email" ? "email_sent" : "submitted",
    channel,
    askKind: options.kind === "buy" ? "buy" : "quote",
    submittedAt: new Date().toISOString(),
    note: totals.note,
    responseDate: totals.responseDate,
    quotationDeadline: totals.responseDate,
    deliveryDate: deliveryMode === "partial" ? deliveryLots.find((lot) => lot.date)?.date || totals.deliveryDate : totals.deliveryDate,
    deliveryMode,
    deliveryLots: deliveryMode === "partial" ? deliveryLots.filter((lot) => lot.date || lot.note) : [],
    project: String(totals.project || "").trim(),
    address: totals.address,
    canonicalCategory: totals.canonicalCategory,
    acceptSubstitutes: Boolean(totals.acceptSubstitutes),
    lines: totals.lines.map((l) => ({
      productId: l.productId,
      name: l.name,
      supplier: l.supplier,
      qty: l.qty,
      unitPrice: l.unitPrice,
      requestedUnitPrice: l.requestedUnitPrice != null ? l.requestedUnitPrice : null,
      custom: Boolean(l.custom),
      description: l.description || "",
      intent: l.intent || (l.unitPrice != null ? "buy" : "quote"),
      productNo: l.productNo || "",
      category: l.category || "",
      green: Boolean(l.green),
      image: l.image || null,
      attachments: Array.isArray(l.attachments) ? l.attachments : [],
      remark: String(l.remark || ""),
    })),
    pricedSubtotal: totals.pricedSubtotal,
    unpricedCount: totals.unpricedCount,
  };
  const map = getRfqsMap();
  const list = Array.isArray(map[email]) ? map[email] : [];
  list.unshift(rfq);
  map[email] = list;
  setRfqsMap(map);
  emitStoreChange();
  return { ok: true, rfq };
}

function sendImmediateQuote(productId, { qty, channel } = {}) {
  return whatsappNow(productId, { qty, kind: "quote", lang: "zh" });
}

function sendWhatsappQuote(productId, { qty } = {}) {
  return whatsappNow(productId, { qty, kind: "quote", lang: "zh" });
}

function getRfq(id) {
  return getRfqs().find((r) => r.id === id) || null;
}

function saveRfq(rfq) {
  if (!rfq?.id) return { ok: false };
  const key = accountKey();
  const map = getRfqsMap();
  const list = Array.isArray(map[key]) ? map[key] : [];
  const idx = list.findIndex((r) => r.id === rfq.id);
  if (idx < 0) return { ok: false };
  const lines = Array.isArray(rfq.lines) ? rfq.lines : [];
  const next = {
    ...rfq,
    lines,
    pricedSubtotal: lines.reduce((sum, l) => sum + (Number(l.unitPrice) || 0) * (Number(l.qty) || 0), 0),
    unpricedCount: lines.filter((l) => l.unitPrice == null).length,
  };
  list[idx] = next;
  map[key] = list;
  setRfqsMap(map);
  emitStoreChange();
  return { ok: true, rfq: next };
}

function reorderRfq(id) {
  const src = getRfq(id);
  if (!src) return { ok: false };
  setDraft({
    note: src.note || "",
    responseDate: src.responseDate || src.quotationDeadline || "",
    deliveryDate: src.deliveryDate || "",
    deliveryMode: normalizeDeliveryMode(src.deliveryMode),
    deliveryLots: normalizeDeliveryLots(src.deliveryLots, {
      mode: src.deliveryMode,
      deliveryDate: src.deliveryDate,
    }),
    project: String(src.project || "").trim(),
    address: src.address || "",
    canonicalCategory: src.canonicalCategory || "",
    acceptSubstitutes: Boolean(src.acceptSubstitutes),
    lines: src.lines.map((l) => {
      if (l.custom || String(l.productId || "").startsWith("custom_")) {
        return {
          productId: String(l.productId || "").startsWith("custom_")
            ? l.productId
            : newCustomProductId(),
          qty: l.qty,
          custom: true,
          intent: "quote",
          name: l.name || "Custom item",
          description: l.description || "",
          category: l.category || "",
          attachments: Array.isArray(l.attachments) ? l.attachments : [],
        };
      }
      return { productId: l.productId, qty: l.qty, intent: l.intent || "quote" };
    }),
  });
  return { ok: true };
}

function getAccountsMap() {
  return readJson(ACCOUNTS_KEY, {});
}

function setAccountsMap(map) {
  writeJson(ACCOUNTS_KEY, map);
}

function getAccount(email) {
  const key = normalizeEmail(email);
  const map = getAccountsMap();
  return map[key] || null;
}

function publicUserFromAccount(account) {
  if (!account) return null;
  return {
    email: account.email,
    name: account.name,
    phone: account.phone || "",
    jobTitle: account.jobTitle || "",
    companyName: account.companyName || "",
    companyReg: account.companyReg || "",
    companyPhone: account.companyPhone || "",
    companyAddress: account.companyAddress || "",
    project: normalizeProfileProject(account.project),
    at: Date.now(),
  };
}

function setSessionUser(user) {
  const previous = getUser();
  const prevEmail = previous ? normalizeEmail(previous.email) : null;
  const nextEmail = normalizeEmail(user.email);

  if (prevEmail && prevEmail !== nextEmail) {
    sessionStorage.removeItem(PENDING_CART_KEY);
    sessionStorage.removeItem(PENDING_WA_RFQ_KEY);
  }

  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  emitStoreChange();
}

function registerUser(profile) {
  const email = normalizeEmail(profile.email);
  if (!email) return { ok: false, error: "email" };
  if (!String(profile.name || "").trim()) return { ok: false, error: "name" };
  if (!String(profile.phone || "").trim()) return { ok: false, error: "phone" };
  if (!String(profile.jobTitle || "").trim()) return { ok: false, error: "jobTitle" };
  if (!String(profile.companyName || "").trim()) return { ok: false, error: "companyName" };
  if (!String(profile.companyAddress || "").trim()) return { ok: false, error: "companyAddress" };
  if (!String(profile.password || "").trim() || String(profile.password).length < 4) {
    return { ok: false, error: "password" };
  }

  const map = getAccountsMap();
  if (map[email]) return { ok: false, error: "exists" };

  const account = {
    email,
    password: String(profile.password),
    name: String(profile.name).trim(),
    phone: String(profile.phone).trim(),
    jobTitle: String(profile.jobTitle).trim(),
    companyName: String(profile.companyName).trim(),
    companyReg: String(profile.companyReg || "").trim(),
    companyPhone: String(profile.companyPhone || "").trim(),
    companyAddress: String(profile.companyAddress).trim(),
    project: normalizeProfileProject(profile.project),
    createdAt: new Date().toISOString(),
  };
  map[email] = account;
  setAccountsMap(map);
  setSessionUser(publicUserFromAccount(account));
  return { ok: true, user: publicUserFromAccount(account) };
}

function updateUserProfile(patch = {}) {
  const current = getUser();
  if (!current?.email) return { ok: false, error: "not_logged_in" };
  const email = normalizeEmail(current.email);

  const next = {
    name: String(patch.name ?? current.name ?? "").trim(),
    phone: String(patch.phone ?? current.phone ?? "").trim(),
    jobTitle: String(patch.jobTitle ?? current.jobTitle ?? "").trim(),
    companyName: String(patch.companyName ?? current.companyName ?? "").trim(),
    companyReg: String(patch.companyReg ?? current.companyReg ?? "").trim(),
    companyPhone: String(patch.companyPhone ?? current.companyPhone ?? "").trim(),
    companyAddress: String(patch.companyAddress ?? current.companyAddress ?? "").trim(),
    project: normalizeProfileProject(patch.project ?? current.project),
  };
  if (!next.name) return { ok: false, error: "name" };
  if (!next.companyName) return { ok: false, error: "companyName" };
  if (!next.companyAddress) return { ok: false, error: "companyAddress" };

  const map = getAccountsMap();
  if (map[email]) {
    map[email] = {
      ...map[email],
      ...next,
      updatedAt: new Date().toISOString(),
    };
    setAccountsMap(map);
    setSessionUser(publicUserFromAccount(map[email]));
  } else {
    setSessionUser({
      ...current,
      ...next,
      email: current.email,
      at: Date.now(),
    });
  }
  return { ok: true, user: getUser() };
}

function loginUser({ email, password, name }) {
  const nextEmail = normalizeEmail(email);
  if (!nextEmail) return { ok: false, error: "email" };

  const account = getAccount(nextEmail);
  if (account) {
    if (password != null && String(password) !== String(account.password)) {
      return { ok: false, error: "password" };
    }
    setSessionUser(publicUserFromAccount(account));
    return { ok: true, user: publicUserFromAccount(account) };
  }

  // Legacy / quick login path (no registered company profile yet)
  setSessionUser({
    email: nextEmail,
    name: name || nextEmail.split("@")[0],
    phone: "",
    jobTitle: "",
    companyName: "",
    companyReg: "",
    companyPhone: "",
    companyAddress: "",
    project: SAMPLE_PROJECTS[0],
    at: Date.now(),
  });
  return { ok: true, user: getUser() };
}

function logoutUser() {
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(PENDING_CUSTOM_KEY);
  emitStoreChange();
}

function setPendingCart(productId, intent, qty) {
  if (!productId) return;
  sessionStorage.setItem(
    PENDING_CART_KEY,
    JSON.stringify({
      productId,
      intent: intent || "quote",
      qty: qty || null,
    })
  );
}

function setPendingWhatsappRfq(productId) {
  if (productId) sessionStorage.setItem(PENDING_WA_RFQ_KEY, productId);
}

function setPendingWhatsappOrder(order) {
  if (!order) return;
  try {
    sessionStorage.setItem(PENDING_WA_ORDER_KEY, JSON.stringify(order));
  } catch {
    /* ignore */
  }
}

function getPendingWhatsappOrder() {
  try {
    const raw = sessionStorage.getItem(PENDING_WA_ORDER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.lines) ? parsed : null;
  } catch {
    return null;
  }
}

function setPendingCustom() {
  sessionStorage.setItem(PENDING_CUSTOM_KEY, "1");
}

function consumePendingAfterAuth() {
  const pendingCart = sessionStorage.getItem(PENDING_CART_KEY);
  const pendingWa = sessionStorage.getItem(PENDING_WA_RFQ_KEY);
  const pendingCustom = sessionStorage.getItem(PENDING_CUSTOM_KEY);
  sessionStorage.removeItem(PENDING_CART_KEY);
  sessionStorage.removeItem(PENDING_WA_RFQ_KEY);
  sessionStorage.removeItem(PENDING_CUSTOM_KEY);

  let wentToRfq = false;
  if (pendingCart) {
    let productId = pendingCart;
    let intent = "quote";
    let qty;
    try {
      const parsed = JSON.parse(pendingCart);
      if (parsed && parsed.productId) {
        productId = parsed.productId;
        intent = parsed.intent || "quote";
        qty = parsed.qty;
      }
    } catch {
      productId = pendingCart;
    }
    addToCart(productId, { intent, qty });
    wentToRfq = true;
  }
  if (pendingWa) {
    addToCart(pendingWa);
    wentToRfq = true;
  }
  if (pendingCustom && !wentToRfq) {
    return "/?custom=1#products";
  }
  return wentToRfq ? "/rfq" : "/";
}

function enrichCartLine(line) {
  if (!line) return null;
  if (line.custom) {
    return {
      name: line.name || "Custom item",
      productNo: line.productNo || "",
      productId: line.productId,
      custom: true,
      description: line.description || "",
      qty: line.qty || 1,
      unit: line.unit || "",
      unitPrice: line.unitPrice ?? null,
      supplier: line.supplier || "",
      image: line.image || "",
      attachments: Array.isArray(line.attachments) ? line.attachments : [],
    };
  }
  const product = getProduct(line.productId);
  return {
    name: line.name || product?.name || line.productId,
    productNo: line.productNo || product?.productNo || "",
    productId: line.productId,
    custom: false,
    description: line.description || "",
    qty: line.qty || 1,
    unit: product?.unit || line.unit || "",
    unitPrice: line.unitPrice ?? (product ? getEffectivePrice(product).displayPrice : null),
    supplier: line.supplier || product?.supplier || "",
    image: line.image || product?.image || "",
    attachments: Array.isArray(line.attachments) ? line.attachments : [],
  };
}

function flattenWaSpec(text) {
  return String(text || "")
    .trim()
    .replace(/\s*\n+\s*/g, "; ");
}

function waImageLabel(src, lang) {
  const value = String(src || "").trim();
  if (!value) return "";
  if (value.startsWith("data:")) return lang === "zh" ? "自訂相片" : "custom photo";
  if (/^https?:\/\//i.test(value)) return value;
  return value.split("/").pop() || value;
}

function waAttachmentNames(files) {
  return (Array.isArray(files) ? files : [])
    .map((file) => String(file?.name || "").trim())
    .filter(Boolean)
    .join(", ");
}

function hasWaMedia(rows) {
  return rows.some(
    (line) =>
      (line.attachments && line.attachments.length) ||
      (line.image && String(line.image).startsWith("data:"))
  );
}

function waField(label, value, prefixWidth) {
  const prefix = `${label}:`;
  const pad = " ".repeat(Math.max(0, prefixWidth - Array.from(prefix).length));
  return `   ${prefix}${pad} ${value}`;
}

function whatsappItemBlock(line, index) {
  const isCustom = Boolean(line.custom);
  const name = String(line.name || (isCustom ? "自訂產品" : line.productId) || "-").trim();
  const sku = line.productNo || (isCustom ? "自訂" : line.productId) || "-";
  const qty = `${line.qty}${line.unit ? ` ${line.unit}` : ""}`;
  const price = line.unitPrice != null ? formatPrice(line.unitPrice) : "待報價";
  const spec = flattenWaSpec(line.description);
  const width = 6;
  const rows = [
    `${index + 1}.`,
    waField("貨名", name, width),
    waField("貨號", sku, width),
    waField("數量", qty, width),
    waField("單價", price, width),
  ];
  if (isCustom && spec) rows.push(waField("規格／備註", spec, width));
  const attached = waAttachmentNames(line.attachments);
  if (attached) rows.push(waField("附件", attached, width));
  return rows.join("\n");
}

function waRefLabel(kind, zh = true) {
  if (kind === "buy") return zh ? "訂單編號" : "Order no.";
  return zh ? "RFQ 編號" : "RFQ no.";
}

function whatsappWrapList(list, kind, refNo) {
  const isBuy = kind === "buy";
  const intro = isBuy ? "你好，我想買以下現貨：" : "你好，我想問以下報價：";
  const outro = isBuy ? "請確認庫存及單價，謝謝。" : "請提供交貨期及單價，謝謝。";
  const head = refNo ? `${intro}\n${waRefLabel(kind)}：${refNo}` : intro;
  return `${head}\n\n${list}\n\n${outro}`;
}

function whatsappPdfHintText(kind, refNo, pdfUrl) {
  const isBuy = kind === "buy";
  const intro = isBuy ? "你好，我想買以下現貨：" : "你好，我想問以下報價：";
  const outro = isBuy ? "請確認庫存及單價，謝謝。" : "請提供交貨期及單價，謝謝。";
  const refLine = refNo ? `${waRefLabel(kind)}：${refNo}` : "";
  const pdfLine = pdfUrl ? `產品清單 PDF：\n${pdfUrl}` : "請睇附件 PDF（產品清單）。";
  return [intro, refLine, pdfLine, outro].filter(Boolean).join("\n\n");
}

function whatsappChatHref(text = "") {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

function whatsappNativeHref(text = "") {
  const base = `whatsapp://send?phone=${WHATSAPP_NUMBER}`;
  return text ? `${base}&text=${encodeURIComponent(text)}` : base;
}

function openWhatsappChat(text = "") {
  if (typeof window === "undefined") return;
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
  window.open(mobile ? whatsappNativeHref(text) : whatsappChatHref(text), "_blank", "noopener,noreferrer");
}

function copyPlainText(text) {
  if (typeof document === "undefined") return;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => copyPlainTextFallback(text));
    return;
  }
  copyPlainTextFallback(text);
}

function copyPlainTextFallback(text) {
  try {
    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  } catch {
    /* ignore */
  }
}

function closeWhatsappCopiedModal() {
  const el = document.querySelector("[data-wa-copy-modal]");
  const url = el?.dataset.waPdfUrl;
  el?.remove();
  if (url && url.startsWith("blob:") && url !== waPdfCache?.pdf?.url) URL.revokeObjectURL(url);
  document.body.style.overflow = "";
}

function modalButtonStyle(primary, disabled = false) {
  const base = primary
    ? "display:inline-flex;align-items:center;justify-content:center;border:0;background:#245a41;color:#fff;font-weight:600;font-size:0.8125rem;padding:0.65rem 1.05rem;"
    : "display:inline-flex;align-items:center;justify-content:center;border:1px solid #d6ddd8;background:#fff;color:#121816;font-weight:600;font-size:0.8125rem;padding:0.65rem 0.9rem;";
  return disabled ? `${base}cursor:not-allowed;opacity:0.5;` : `${base}cursor:pointer;`;
}

function showWhatsappPdfModal({ kind, count, text, pdf, failed, reused, refNo, blobUrl, uploading }) {
  if (typeof document === "undefined") return;
  closeWhatsappCopiedModal();
  const zh = String(document.documentElement.lang || "").startsWith("zh");
  const refLabel = waRefLabel(kind, zh);
  const hasBlob = Boolean(blobUrl);
  const waitForPdfLink = Boolean(uploading && !hasBlob && !failed);
  const copy = zh
    ? {
        title: failed
          ? "未能產生 PDF"
          : uploading
            ? "正在上傳 PDF…"
            : reused
              ? "請用同一份 PDF"
              : pdf
                ? hasBlob
                  ? "PDF 連結已準備"
                  : "報價清單 PDF 已準備"
                : "正在產生 PDF…",
        alert: reused
          ? `清單未變，重用同一份 PDF 連結。今次 WhatsApp 會用新${refLabel} ${refNo || ""}。`
          : "",
        ref: refNo ? `${refLabel}：${refNo}` : "",
        body: failed
          ? "清單已複製。開啟 WhatsApp 後貼上即可。"
          : uploading
            ? "正在把 PDF 同產品圖片上傳到 Vercel Blob，之後會把連結寫入 WhatsApp。"
            : pdf
              ? hasBlob
                ? `共 ${count} 項。WhatsApp 訊息會帶 PDF 連結同產品圖片。`
                : `共 ${count} 項。WhatsApp 連結加唔到檔案，請先下載 PDF，再開對話用附件傳送。`
              : "正在把貨名、貨號、數量、單價同產品圖整成 PDF。",
        preview: "PDF 預覽",
        download: reused ? "再次下載同一份 PDF" : "下載 PDF",
        share: "分享 PDF",
        open: "開啟 WhatsApp",
        close: "關閉",
      }
    : {
        title: failed
          ? "Could not create PDF"
          : uploading
            ? "Uploading PDF…"
            : reused
              ? "Use the same PDF"
              : pdf
                ? hasBlob
                  ? "PDF link is ready"
                  : "Quote PDF is ready"
                : "Preparing PDF…",
        alert: reused
          ? `This list has not changed — reusing the same PDF link. WhatsApp will use a new ${refLabel} ${refNo || ""}.`
          : "",
        ref: refNo ? `${refLabel}: ${refNo}` : "",
        body: failed
          ? "The list is copied. Open WhatsApp, then paste to send."
          : uploading
            ? "Uploading the PDF and product images to Vercel Blob, then putting the links in WhatsApp."
            : pdf
              ? hasBlob
                ? `${count} item(s). WhatsApp will include the PDF link and product images.`
                : `${count} item(s). WhatsApp links cannot attach files — download the PDF, then attach it in the chat.`
              : "Creating a PDF with name, SKU, qty, unit price, and product images.",
        preview: "PDF preview",
        download: reused ? "Download the same PDF again" : "Download PDF",
        share: "Share PDF",
        open: "Open WhatsApp",
        close: "Close",
      };

  const overlay = document.createElement("div");
  overlay.dataset.waCopyModal = "1";
  if (pdf?.url) overlay.dataset.waPdfUrl = pdf.url;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "wa-copy-title");
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;padding:1.25rem;background:rgba(16,21,19,0.55);";

  const card = document.createElement("div");
  card.style.cssText =
    "width:min(34rem,100%);max-height:min(40rem,calc(100vh - 2.5rem));overflow:auto;background:#fff;border:1px solid #d6ddd8;border-radius:0.75rem;box-shadow:0 18px 40px rgba(0,0,0,0.22);padding:1.25rem 1.35rem 1.15rem;";

  const title = document.createElement("h2");
  title.id = "wa-copy-title";
  title.textContent = copy.title;
  title.style.cssText = "margin:0;font-size:1.15rem;font-weight:700;color:#143528;";

  const body = document.createElement("p");
  body.textContent = copy.body;
  body.style.cssText = "margin:0.55rem 0 0;font-size:0.875rem;line-height:1.45;color:#5b6660;";

  const actions = document.createElement("div");
  actions.style.cssText = "display:flex;flex-wrap:wrap;justify-content:flex-end;gap:0.5rem;margin-top:1rem;";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.textContent = copy.close;
  closeBtn.style.cssText = modalButtonStyle(false);

  function onKey(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      document.removeEventListener("keydown", onKey);
      closeWhatsappCopiedModal();
    }
  }

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeWhatsappCopiedModal();
  });
  closeBtn.addEventListener("click", () => {
    document.removeEventListener("keydown", onKey);
    closeWhatsappCopiedModal();
  });

  card.append(title);

  if (copy.ref) {
    const refEl = document.createElement("p");
    refEl.textContent = copy.ref;
    refEl.style.cssText =
      "margin:0.45rem 0 0;font-size:0.8125rem;font-weight:700;color:#143528;letter-spacing:0.02em;";
    card.append(refEl);
  }

  if (copy.alert) {
    const alertEl = document.createElement("p");
    alertEl.setAttribute("role", "alert");
    alertEl.textContent = copy.alert;
    alertEl.style.cssText =
      "margin:0.7rem 0 0;padding:0.65rem 0.75rem;border:1px solid #ead7a0;background:#fff8e8;color:#6a4f08;font-size:0.8125rem;line-height:1.45;border-radius:0.5rem;";
    card.append(alertEl);
  }

  card.append(body);

  if (blobUrl) {
    const linkWrap = document.createElement("p");
    linkWrap.style.cssText = "margin:0.7rem 0 0;font-size:0.8125rem;line-height:1.45;word-break:break-all;";
    const link = document.createElement("a");
    link.href = blobUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = blobUrl;
    link.style.cssText = "color:#245a41;font-weight:600;";
    linkWrap.append(link);
    card.append(linkWrap);
  }

  if (pdf?.url) {
    const previewLabel = document.createElement("p");
    previewLabel.textContent = copy.preview;
    previewLabel.style.cssText =
      "margin:1rem 0 0.4rem;font-size:0.7rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#5b6660;";
    const frame = document.createElement("iframe");
    frame.title = copy.preview;
    frame.src = pdf.url;
    frame.style.cssText =
      "display:block;width:100%;height:16rem;border:1px solid #d6ddd8;border-radius:0.5rem;background:#f6f7f5;";
    card.append(previewLabel, frame);

    const downloadBtn = document.createElement("button");
    downloadBtn.type = "button";
    downloadBtn.textContent = copy.download;
    downloadBtn.style.cssText = modalButtonStyle(false);
    downloadBtn.addEventListener("click", () => downloadBlob(pdf.blob, pdf.filename));

    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.textContent = copy.open;
    openBtn.disabled = waitForPdfLink;
    openBtn.setAttribute("aria-busy", waitForPdfLink ? "true" : "false");
    openBtn.style.cssText = modalButtonStyle(true, waitForPdfLink);
    if (waitForPdfLink) {
      openBtn.title = zh ? "PDF 連結上載中，請稍候" : "PDF link is still uploading";
    }
    openBtn.addEventListener("click", () => {
      if (openBtn.disabled) return;
      if (!reused && !blobUrl) downloadBlob(pdf.blob, pdf.filename);
      copyPlainText(text);
      openWhatsappChat(text);
      document.removeEventListener("keydown", onKey);
      closeWhatsappCopiedModal();
    });

    if (canSharePdfFile(pdf.file)) {
      const shareBtn = document.createElement("button");
      shareBtn.type = "button";
      shareBtn.textContent = copy.share;
      shareBtn.style.cssText = modalButtonStyle(true);
      shareBtn.addEventListener("click", async () => {
        const shared = await sharePdfFile(pdf.file, text);
        if (shared) {
          document.removeEventListener("keydown", onKey);
          closeWhatsappCopiedModal();
        }
      });
      actions.append(closeBtn, downloadBtn, shareBtn, openBtn);
    } else {
      actions.append(closeBtn, downloadBtn, openBtn);
    }
    card.append(actions);
    overlay.append(card);
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    if (waitForPdfLink) closeBtn.focus();
    else openBtn.focus();
    return;
  }

  if (failed) {
    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.textContent = copy.open;
    openBtn.style.cssText = modalButtonStyle(true);
    openBtn.addEventListener("click", () => {
      copyPlainText(text);
      openWhatsappChat(text.replace("請睇附件 PDF（產品清單）。", "（清單已複製，請喺呢度貼上）"));
      document.removeEventListener("keydown", onKey);
      closeWhatsappCopiedModal();
    });
    actions.append(closeBtn, openBtn);
  } else {
    actions.append(closeBtn);
  }
  card.append(actions);
  overlay.append(card);
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";
  document.addEventListener("keydown", onKey);
}

function firstImageAttachmentUrl(files) {
  const list = Array.isArray(files) ? files : [];
  const found = list.find((file) => {
    const type = String(file?.type || "");
    const url = String(file?.url || "");
    return file?.kind === "image" || type.startsWith("image/") || url.startsWith("data:image/");
  });
  return found?.url || "";
}

function quotePdfItems(rows) {
  return rows.map((line, i) => {
    const isCustom = Boolean(line.custom);
    const attachments = Array.isArray(line.attachments) ? line.attachments : [];
    return {
      index: i + 1,
      name: String(line.name || (isCustom ? "自訂產品" : line.productId) || "-").trim(),
      sku: line.productNo || (isCustom ? "自訂" : line.productId) || "-",
      qty: `${line.qty}${line.unit ? ` ${line.unit}` : ""}`,
      price: line.unitPrice != null ? formatPrice(line.unitPrice) : "待報價",
      spec: isCustom ? flattenWaSpec(line.description) : "",
      attachments: waAttachmentNames(attachments),
      image: line.image || firstImageAttachmentUrl(attachments) || "",
    };
  });
}

function whatsappDraftText(lines, kind, refNo) {
  const rows = (Array.isArray(lines) ? lines : []).map(enrichCartLine).filter(Boolean);
  return whatsappWrapList(rows.map((line, i) => whatsappItemBlock(line, i)).join("\n\n"), kind, refNo);
}

function whatsappDraftUrl() {
  return whatsappChatHref();
}

function quotePdfFingerprint(kind, items, refNo) {
  return JSON.stringify({
    kind: kind === "buy" ? "buy" : "quote",
    refNo: String(refNo || "").trim(),
    items: (Array.isArray(items) ? items : []).map((item) => [
      item.name,
      item.sku,
      item.qty,
      item.price,
      item.spec || "",
      item.attachments || "",
      item.image || "",
    ]),
  });
}

let whatsappPdfGeneration = 0;
let waPdfCache = null;
let waPdfInflight = null;
let waPublishInflight = null;

function rememberWaPdf(fingerprint, pdf, extra = {}) {
  if (waPdfCache?.pdf?.url && waPdfCache.pdf.url !== pdf?.url && String(waPdfCache.pdf.url).startsWith("blob:")) {
    URL.revokeObjectURL(waPdfCache.pdf.url);
  }
  waPdfCache = pdf
    ? {
        fingerprint,
        pdf,
        blobUrl: extra.blobUrl || (waPdfCache?.fingerprint === fingerprint ? waPdfCache.blobUrl : "") || "",
        imageUrls: extra.imageUrls || (waPdfCache?.fingerprint === fingerprint ? waPdfCache.imageUrls : []) || [],
        attachmentUrls: extra.attachmentUrls || (waPdfCache?.fingerprint === fingerprint ? waPdfCache.attachmentUrls : []) || [],
      }
    : null;
}

async function publishRfqAssets(pdf, rows, refNo, fingerprint) {
  if (waPdfCache?.fingerprint === fingerprint && waPdfCache.blobUrl) {
    return { blobUrl: waPdfCache.blobUrl, imageUrls: waPdfCache.imageUrls || [], attachmentUrls: waPdfCache.attachmentUrls || [] };
  }
  if (waPublishInflight?.fingerprint === fingerprint) return waPublishInflight.promise;
  const promise = publishRfqPdf(pdf, rows, refNo).then((published) => {
    rememberWaPdf(fingerprint, pdf, published);
    return published;
  });
  waPublishInflight = { fingerprint, promise };
  try {
    return await promise;
  } finally {
    if (waPublishInflight?.fingerprint === fingerprint) waPublishInflight = null;
  }
}

function buildWhatsappShareText(kind, refNo, rows, blobUrl, imageUrls, attachmentUrls) {
  const withImages = fitWhatsappUrls(whatsappPdfHintText(kind, refNo, blobUrl), imageUrls, "產品圖片：");
  const extra = (Array.isArray(attachmentUrls) ? attachmentUrls : []).filter((url) => !(imageUrls || []).includes(url));
  const fitted = fitWhatsappUrls(withImages.text, extra, "規格附件：");
  const fallback = whatsappWrapList(rows.map((line, i) => whatsappItemBlock(line, i)).join("\n\n"), kind, refNo);
  return blobUrl ? fitted.text : fallback;
}

async function publishRfqPdf(pdf, rows, refNo) {
  const blobUrl = await uploadRfqPdf(pdf.file, refNo);
  const imageUrls = await collectProductImageUrls(rows, refNo);
  const attachmentUrls = await collectAttachmentUrls(rows, refNo);
  return { blobUrl, imageUrls, attachmentUrls };
}

function openWhatsappDraft(lines, kind, options = {}) {
  const rows = (Array.isArray(lines) ? lines : []).map(enrichCartLine).filter(Boolean);
  const items = quotePdfItems(rows);
  const refNo = String(options?.refNo || "").trim() || nextRfqId();
  const fingerprint = quotePdfFingerprint(kind, items, refNo);
  const fallbackText = whatsappWrapList(rows.map((line, i) => whatsappItemBlock(line, i)).join("\n\n"), kind, refNo);
  const url = whatsappChatHref(whatsappPdfHintText(kind, refNo));
  if (typeof window === "undefined") return { url, truncated: false, copied: true, count: rows.length, refNo };
  copyPlainText(fallbackText);

  const cached = waPdfCache?.fingerprint === fingerprint ? waPdfCache : null;
  if (cached?.pdf && cached.blobUrl) {
    const text = buildWhatsappShareText(kind, refNo, rows, cached.blobUrl, cached.imageUrls, cached.attachmentUrls);
    copyPlainText(text);
    showWhatsappPdfModal({
      kind,
      count: rows.length,
      text,
      pdf: cached.pdf,
      reused: true,
      refNo,
      blobUrl: cached.blobUrl,
    });
    return { url: whatsappChatHref(text), truncated: false, copied: true, count: rows.length, refNo, reused: true };
  }

  const generation = ++whatsappPdfGeneration;
  showWhatsappPdfModal({ kind, count: rows.length, text: fallbackText, refNo });
  const pending =
    waPdfInflight?.fingerprint === fingerprint
      ? waPdfInflight.promise
      : buildQuotePdf({ kind, items, refNo }).then((pdf) => {
          rememberWaPdf(fingerprint, pdf);
          return pdf;
        });
  waPdfInflight = { fingerprint, promise: pending };
  pending
    .then(async (pdf) => {
      if (generation !== whatsappPdfGeneration) return;
      if (!document.querySelector("[data-wa-copy-modal]")) return;
      showWhatsappPdfModal({ kind, count: rows.length, text: fallbackText, pdf, refNo, uploading: true });
      try {
        const published = await publishRfqAssets(pdf, rows, refNo, fingerprint);
        const text = buildWhatsappShareText(kind, refNo, rows, published.blobUrl, published.imageUrls, published.attachmentUrls);
        copyPlainText(text);
        if (generation !== whatsappPdfGeneration) return;
        if (!document.querySelector("[data-wa-copy-modal]")) return;
        showWhatsappPdfModal({
          kind,
          count: rows.length,
          text,
          pdf,
          refNo,
          blobUrl: published.blobUrl,
        });
      } catch {
        if (generation !== whatsappPdfGeneration) return;
        if (!document.querySelector("[data-wa-copy-modal]")) return;
        showWhatsappPdfModal({ kind, count: rows.length, text: fallbackText, pdf, refNo });
      }
    })
    .catch(() => {
      if (generation !== whatsappPdfGeneration) return;
      if (!document.querySelector("[data-wa-copy-modal]")) return;
      if (waPdfInflight?.fingerprint === fingerprint) waPdfInflight = null;
      showWhatsappPdfModal({ kind, count: rows.length, text: fallbackText, failed: true, refNo });
    });
  return { url, truncated: false, copied: true, count: rows.length, refNo };
}

function whatsappNow(productId, { qty, kind, lang = "zh" } = {}) {
  const product = getProduct(productId);
  if (!product || isDiscontinued(product)) return { ok: false, error: "discontinued" };
  const intent = kind === "buy" ? "buy" : "quote";
  addToCart(productId, { intent, qty });
  const line = getDraft().lines.find((l) => String(l.productId) === String(productId) && !l.custom);
  if (!line) return { ok: false };
  return { ok: true, ...openWhatsappDraft([line], intent) };
}

function whatsappUrl() {
  return whatsappChatHref();
}

function rfqProjectName(rfq) {
  if (!rfq) return "";
  if (Object.prototype.hasOwnProperty.call(rfq, "project")) {
    return String(rfq.project || "").trim();
  }
  const digits = Number(String(rfq.id || "").replace(/\D/g, "")) || 0;
  return SAMPLE_PROJECTS[Math.abs(digits) % SAMPLE_PROJECTS.length];
}

export {
  PRODUCTS,
  CATEGORIES,
  CATEGORY_DEFS,
  getCategoryDefs,
  getCategories,
  getCategoryBySlug,
  getCategoryByName,
  catalogPathForCategory,
  getTopProducts,
  getGreenProducts,
  getSalesProducts,
  getProductsByCategory,
  searchProducts,
  searchProductsUnion,
  supplierSlug,
  supplierPath,
  supplierDisplayName,
  isMattexSupplier,
  getSuppliers,
  getSupplier,
  supplierBrand,
  buildSupplierBankInfo,
  getProductsBySupplier,
  getTopProductsForSupplier,
  searchSupplierProducts,
  buildSupplierMetrics,
  formatPrice,
  SAMPLE_PROJECTS,
  rfqProjectName,
  getProduct,
  getProductRemarks,
  getProductRating,
  hydrateStore,
  isSupabaseConfigured,
  canDirectBuy,
  isDiscontinued,
  suggestCatalogMatch,
  getProductsByIds,
  getEffectivePrice,
  isHitProduct,
  formatQuoteDate,
  formatQuoteDateShort,
  stockStatusKey,
  isLoggedIn,
  getUser,
  getDraft,
  setDraft,
  getCart,
  cartCount,
  addToCart,
  addCustomLine,
  updateCustomLine,
  setLineQty,
  setLineIntent,
  setLineRequestedPrice,
  removeLine,
  removeLines,
  setDraftNote,
  setDraftResponseDate,
  setDraftAddress,
  setDraftProject,
  setDraftDeliveryDate,
  setDraftDeliveryMode,
  setDraftDeliveryLots,
  setDraftCanonicalCategory,
  setDraftAcceptSubstitutes,
  inferCanonicalCategory,
  draftTotals,
  getRfqs,
  submitRfq,
  sendImmediateQuote,
  sendWhatsappQuote,
  whatsappNow,
  enrichCartLine,
  whatsappDraftUrl,
  openWhatsappDraft,
  getRfq,
  saveRfq,
  reorderRfq,
  loginUser,
  registerUser,
  updateUserProfile,
  logoutUser,
  setPendingCart,
  setPendingWhatsappRfq,
  setPendingWhatsappOrder,
  getPendingWhatsappOrder,
  setPendingCustom,
  consumePendingAfterAuth,
  whatsappUrl,
  emptyDraft,
  PENDING_CART_KEY,
  PENDING_WA_RFQ_KEY,
  WHATSAPP_NUMBER,
  WHATSAPP_DISPLAY,
  WHATSAPP_HREF,
  MATTEX_CHAIN_URL,
  MATTEX_SITE_URL,
};

refreshStoreSnapshot();
