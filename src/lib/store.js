const CATEGORY_DEFS = [
  { id: "service", name: "Service", image: "/assets/sensor.png", count: 3, unit: "lot", base: 1800, supplier: "SiteServe Contracting", specs: ["Type: survey / install / inspect", "Scope: labour + report", "Lead: scheduled", "Use: site support"] },
  { id: "computer", name: "Computer", image: "/assets/plc.png", count: 3, unit: "pc", base: 920, supplier: "BuildIT Workstations", specs: ["Type: desktop / rugged laptop", "OS: Windows", "Use: site office / BIM", "Warranty: 3 year"] },
  { id: "hardware", name: "Hardware", image: "/assets/gearbox.png", count: 4, unit: "pack", base: 48, supplier: "FixRight Hardware Co.", specs: ["Type: fixings / tools", "Grade: commercial", "Finish: zinc / stainless", "Use: install"] },
  { id: "software", name: "Software", image: "/assets/vfd.png", count: 3, unit: "license", base: 240, supplier: "PlanGrid Software", specs: ["Type: BIM / takeoff / RFQ", "Term: annual", "Seats: named", "Use: project coordination"] },
  { id: "precast", name: "Precast Concrete", image: "/assets/cat-precast.png", count: 3, unit: "panel", base: 420, supplier: "Harbor Precast Co.", specs: ["Grade: C40/50", "Size: modular", "Finish: fair-faced", "Use: structural"] },
  { id: "barriers", name: "Barriers", image: "/assets/cat-barriers.png", count: 2, unit: "unit", base: 280, supplier: "SafeRoute Barriers Ltd.", specs: ["Type: temporary / permanent", "Material: concrete", "Length: 2–3 m", "Reflective: optional"] },
  { id: "brick", name: "Brick & Block", image: "/assets/cat-brick.png", count: 3, unit: "pack", base: 95, supplier: "Redclay Masonry Works", specs: ["Material: clay / concrete", "Size: standard", "Strength: load-bearing", "Finish: common / facing"] },
  { id: "waterproof", name: "Waterproofing", image: "/assets/cat-waterproof.png", count: 5, unit: "roll", base: 145, supplier: "AquaShield Membranes", specs: ["Type: membrane", "Thickness: 1.5–4 mm", "Application: torch / self-adhesive", "Area: roof / basement"] },
  { id: "manhole", name: "Manhole & Channel", image: "/assets/cat-manhole.png", count: 1, unit: "set", base: 560, supplier: "DrainCore Industrial", specs: ["Cover: ductile iron", "Channel: polymer concrete", "Load class: D400", "Size: DN600"] },
  { id: "insulation", name: "Insulation", image: "/assets/cat-insulation.png", count: 2, unit: "pack", base: 210, supplier: "ThermoWrap Building Systems", specs: ["Type: XPS / PIR", "Thickness: 50–100 mm", "R-value: high", "Edge: tongue & groove"] },
  { id: "plaster", name: "Plastering", image: "/assets/cat-plaster.png", count: 9, unit: "bag", base: 18, supplier: "FinishLine Plasters", specs: ["Type: gypsum / cement", "Bag size: 25 kg", "Finish: skim / base", "Indoor / outdoor"] },
  { id: "safetynet", name: "Safety Net", image: "/assets/cat-safetynet.png", count: 0, unit: "roll", base: 320, supplier: "SiteGuard Safety Gear", specs: ["Mesh: HDPE", "Color: orange", "Use: edge protection", "UV stabilized"] },
  { id: "steel", name: "Structure Steel Element, Metal Product", image: "/assets/cat-steel.png", count: 13, unit: "pc", base: 380, supplier: "Northspan Steel Group", specs: ["Grade: S275 / S355", "Section: UB / UC / angle", "Finish: primed", "Cut-to-length: yes"] },
  { id: "tile", name: "Tile", image: "/assets/cat-tile.png", count: 6, unit: "box", base: 42, supplier: "Stoneform Ceramics", specs: ["Material: ceramic / porcelain", "Size: 300×300–600×600", "Finish: matt / gloss", "Use: floor / wall"] },
  { id: "timber", name: "Timber / Plywood", image: "/assets/cat-timber.png", count: 4, unit: "sheet", base: 68, supplier: "Pacific Timber Supply", specs: ["Species: softwood / hardwood", "Grade: structural", "Thickness: 9–18 mm", "Treatment: optional"] },
  { id: "board", name: "Board", image: "/assets/cat-board.png", count: 4, unit: "sheet", base: 36, supplier: "PanelCraft Interiors", specs: ["Type: gypsum / cement board", "Size: 1200×2400", "Thickness: 9–15 mm", "Edge: tapered"] },
  { id: "aggregate", name: "Aggregate", image: "/assets/cat-aggregate.png", count: 4, unit: "ton", base: 55, supplier: "QuarryPeak Aggregates", specs: ["Type: crushed stone / sand", "Size: 10–20 mm", "Wash: washed", "Use: concrete / fill"] },
  { id: "pipe", name: "Pipe & Fittings & Accessories", image: "/assets/cat-pipe.png", count: 11, unit: "pc", base: 24, supplier: "Flowline Pipe & Fittings", specs: ["Material: UPVC / steel", "Size: DN15–DN200", "Pressure: PN10–PN16", "Includes: fittings"] },
  { id: "cable", name: "Cable Containment", image: "/assets/cat-cable.png", count: 3, unit: "length", base: 88, supplier: "VoltTray Electrical", specs: ["Type: tray / trunking", "Material: GI steel", "Width: 100–300 mm", "Finish: hot-dip galvanized"] },
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
  software: ["PlanGrid Software", "Takeoff Lab"],
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

const GREEN_PRODUCT_IDS = new Set([
  "insulation-01",
  "insulation-02",
  "timber-01",
  "timber-02",
  "aggregate-01",
  "board-01",
  "board-02",
  "tile-01",
  "waterproof-02",
  "precast-02",
]);

const SAMPLE_PROJECTS = [
  "Kai Tak Tower",
  "Tsuen Wan Station Fit-out",
  "Central Harbourfront",
  "HKIA 3RS",
];

const GREEN_BLURBS = {
  "insulation-01": "High thermal resistance for lower HVAC load and energy use.",
  "insulation-02": "Continuous insulation pack for envelope performance upgrades.",
  "timber-01": "FSC-certified plywood for responsible structural framing.",
  "timber-02": "Responsibly sourced timber sheet for fit-out and formwork.",
  "aggregate-01": "Recycled aggregate that reduces virgin quarry demand.",
  "board-01": "Low-VOC gypsum board for healthier indoor air.",
  "board-02": "Lightweight board option that cuts transport emissions.",
  "tile-01": "Porcelain tile with lower embodied carbon mix design.",
  "waterproof-02": "Long-life membrane that reduces rework and waste.",
  "precast-02": "Optimized precast panel for less on-site waste.",
};

const CATEGORY_BLURBS = {
  precast: "Modular C40/50 panel, spec-ready for structural RFQ.",
  barriers: "Concrete barrier unit for temporary or permanent works.",
  brick: "Load-bearing brick pack for facing and common masonry.",
  waterproof: "Torch-on or self-adhesive membrane for roof and basement.",
  manhole: "D400 cover and channel set for drainage works.",
  insulation: "High-R board pack for envelope and HVAC load reduction.",
  plaster: "25 kg skim or base coat for indoor and outdoor finishing.",
  safetynet: "UV-stabilized HDPE mesh for edge protection.",
  steel: "Primed UB/UC sections, cut-to-length for structural frames.",
  tile: "Ceramic or porcelain tile for floor and wall finishes.",
  timber: "Structural plywood sheet for framing, fit-out, and formwork.",
  board: "Gypsum or cement board, tapered edge for interiors.",
  aggregate: "Washed crushed stone or sand for concrete and fill.",
  pipe: "UPVC or steel pipe with fittings, DN15–DN200.",
  cable: "Galvanized tray or trunking for electrical containment.",
  service: "Scheduled site service lot with labour and report.",
  computer: "Rugged workstation for site office and BIM coordination.",
  hardware: "Commercial fixings pack for install and assembly.",
  software: "Named annual license for takeoff, BIM, and RFQ.",
};

const CATEGORY_STANDARDS = {
  precast: "BS EN 13369:2018",
  barriers: "BS EN 1317-2:2010",
  brick: "BS EN 771-1:2011",
  waterproof: "BS EN 13707:2013",
  manhole: "BS EN 124-2:2015",
  insulation: "BS EN 13165:2012",
  plaster: "BS EN 998-1:2016",
  safetynet: "BS EN 1263-1:2014",
  steel: "BS 4449:2005",
  tile: "BS EN 14411:2016",
  timber: "BS EN 636:2012",
  board: "BS EN 520:2004",
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

function canDirectBuy(product) {
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

function isQuoteActive(quote) {
  if (!quote?.validUntil) return false;
  const end = new Date(`${quote.validUntil}T23:59:59`);
  if (Number.isNaN(end.getTime())) return false;
  return end.getTime() >= Date.now();
}

function getEffectivePrice(product) {
  if (!product) return { displayPrice: null, status: "none", quote: null };
  const quote = product.quote || null;
  if (!quote) {
    return {
      displayPrice: product.price ?? null,
      status: product.price == null ? "none" : "list",
      quote: null,
    };
  }
  if (isQuoteActive(quote)) {
    return { displayPrice: quote.unitPrice, status: "quoted", quote };
  }
  if (quote.listPrice != null) {
    return { displayPrice: quote.listPrice, status: "expired-list", quote };
  }
  return { displayPrice: null, status: "expired-requote", quote };
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

function buildProducts() {
  const featuredIds = ["precast-01", "barriers-01", "brick-01", "waterproof-01", "steel-01"];
  const out = [];
  CATEGORY_DEFS.forEach((cat) => {
    const total = cat.id === "safetynet" ? 2 : cat.count;
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
  return out;
}

const PRODUCTS = buildProducts();

const CATEGORIES = CATEGORY_DEFS.map((c) => c.name);

function getCategoryDefs() {
  return CATEGORY_DEFS.map((c) => ({
    id: c.id,
    name: c.name,
    image: c.image,
    count: PRODUCTS.filter((p) => p.category === c.name).length,
  }));
}

function getCategories() {
  return CATEGORIES.slice();
}

function getTopProducts(limit) {
  const n = limit || 5;
  return PRODUCTS.filter((p) => p.featuredRank != null)
    .sort((a, b) => a.featuredRank - b.featuredRank)
    .slice(0, n);
}

function getGreenProducts(limit) {
  const list = PRODUCTS.filter((p) => p.green);
  return typeof limit === "number" ? list.slice(0, limit) : list;
}

function getProductsByCategory(category) {
  const names = Array.isArray(category)
    ? category.filter(Boolean)
    : !category || category === "all"
      ? []
      : [category];
  if (!names.length) return PRODUCTS.slice();
  const set = new Set(names);
  return PRODUCTS.filter((p) => set.has(p.category));
}

function productSearchBlob(product) {
  const specs = Array.isArray(product.specs) ? product.specs.join(" ") : "";
  const price =
    product.price == null ? "price upon request" : String(product.price);
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
    price,
    product.quote?.validUntil,
    product.quote ? "quoted price quotation validity" : "",
    product.green ? "green eco sustainable low-carbon fsc recycled" : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function searchProducts(query, category) {
  const base = getProductsByCategory(category);
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

function searchProductsUnion(queries, category) {
  const seen = new Set();
  const out = [];
  for (const raw of queries || []) {
    const hits = searchProducts(raw, category);
    for (const product of hits) {
      if (seen.has(product.id)) continue;
      seen.add(product.id);
      out.push(product);
    }
  }
  return out;
}

function supplierSlug(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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

function getProductRating(product) {
  const seed = hashSeed(product?.id || product?.name || "product");
  return {
    rating: Math.round(clamp(3.7 + (seed % 14) / 10, 3.6, 5) * 10) / 10,
    reviews: 8 + ((seed >> 2) % 92),
  };
}

function getSuppliers() {
  const map = new Map();
  PRODUCTS.forEach((p) => {
    if (!p.supplier) return;
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
      name: s.name,
      image: s.image,
      verified: hashSeed(s.slug) % 3 !== 2,
      count: s.count,
      categories: Array.from(s.categories).sort(),
      metrics: buildSupplierMetrics(s.slug),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getSupplier(slugOrName) {
  const key = supplierSlug(slugOrName);
  return getSuppliers().find((s) => s.slug === key) || null;
}

function getProductsBySupplier(slugOrName) {
  const key = supplierSlug(slugOrName);
  return PRODUCTS.filter((p) => supplierSlug(p.supplier) === key);
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
const SEQ_KEY = "subbie_rfq_seq";
const WHATSAPP_NUMBER = "15550142200";

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
  localStorage.setItem(key, JSON.stringify(value));
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

function getDraft() {
  const email = currentEmail();
  if (!email) return emptyDraft();
  const map = getDraftsMap();
  return map[email] ? normalizeDraft(map[email]) : emptyDraft();
}

function setDraft(draft) {
  const email = currentEmail();
  if (!email) return;
  const map = getDraftsMap();
  map[email] = normalizeDraft(draft);
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
  return getDraft().lines.reduce((sum, line) => sum + (line.qty || 0), 0);
}

function newCustomProductId() {
  return `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function addToCart(productId, { intent, qty } = {}) {
  const product = getProduct(productId);
  if (!product || !currentEmail()) return getCart();
  const draft = getDraft();
  const minQty = Math.max(1, Number(product.moq) || 1);
  const addQty = Math.max(minQty, Math.floor(Number(qty)) || minQty);
  const nextIntent = intent || (getEffectivePrice(product).displayPrice != null ? "buy" : "quote");
  const existing = draft.lines.find((l) => l.productId === productId && !l.custom);
  if (existing) {
    existing.qty = Math.max(existing.qty || 0, addQty);
    existing.intent = nextIntent;
  } else {
    draft.lines.push({ productId, qty: addQty, intent: nextIntent });
  }
  setDraft(draft);
  return getCart();
}

function normalizeAttachments(list) {
  if (!list) return [];
  return (Array.isArray(list) ? list : [list])
    .map((item) => {
      const url = String(item?.url || "");
      return {
        name: String(item?.name || "file").slice(0, 180),
        type: String(item?.type || ""),
        size: Number(item?.size) || 0,
        kind: item?.kind === "image" || item?.kind === "text" ? item.kind : "document",
        url: url.startsWith("data:") ? url : "",
      };
    })
    .filter((item) => item.name)
    .slice(0, 8);
}

function addCustomLine({ name, description = "", qty = 1, category = "", attachments, image = "" } = {}) {
  if (!currentEmail()) return { ok: false, error: "not_logged_in" };
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
  localStorage.setItem(SEQ_KEY, String(seq));
  return `RFQ-${seq}`;
}

function getRfqs() {
  const email = currentEmail();
  if (!email) return [];
  const map = getRfqsMap();
  return Array.isArray(map[email]) ? map[email] : [];
}

function submitRfq(productIds, options = {}) {
  const email = currentEmail();
  if (!email) return { ok: false, error: "not_logged_in" };
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

  const totals = draftTotals({ ...draft, lines: selectedLines });
  const channel = options.channel === "whatsapp" ? "whatsapp" : "rfq";
  const rfq = {
    id: nextRfqId(),
    status: channel === "whatsapp" ? "whatsapp_sent" : "submitted",
    channel,
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
    })),
    pricedSubtotal: totals.pricedSubtotal,
    unpricedCount: totals.unpricedCount,
  };
  const map = getRfqsMap();
  const list = Array.isArray(map[email]) ? map[email] : [];
  list.unshift(rfq);
  map[email] = list;
  setRfqsMap(map);

  // Keep unselected lines in the draft for later RFQs
  const remaining = draft.lines.filter((l) => !selectedSet.has(String(l.productId)));
  setDraft({
    ...draft,
    lines: remaining,
  });
  emitStoreChange();
  return { ok: true, rfq };
}

function getRfq(id) {
  return getRfqs().find((r) => r.id === id) || null;
}

function reorderRfq(id) {
  const src = getRfq(id);
  if (!src || !currentEmail()) return { ok: false };
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

function whatsappUrl(product) {
  const text = product
    ? `Hi Subbie sales, I'd like to ask for the price of: ${product.name} (SKU: ${product.id.toUpperCase()}).`
    : "Hi Subbie sales, I'd like to ask about product pricing.";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
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
  getTopProducts,
  getGreenProducts,
  getProductsByCategory,
  searchProducts,
  searchProductsUnion,
  supplierSlug,
  supplierPath,
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
  getProductRating,
  canDirectBuy,
  getEffectivePrice,
  formatQuoteDate,
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
  getRfq,
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
  WHATSAPP_NUMBER
};

refreshStoreSnapshot();
