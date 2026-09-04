import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { absAsset, absUrl, siteOrigin, withLocale, stripLocale } from "../src/lib/locale.js";
import { OG_HEIGHT, OG_WIDTH, categoryOgPath, ogImagePath } from "../src/lib/ogImage.js";
import { seoCopy } from "../src/lib/seoCopy.js";
import { breadcrumbJsonLd, orgJsonLd, productJsonLd } from "../src/lib/seoJsonLd.js";
import { catalogPathForCategory, getCategoryDefs, getSuppliers, isDiscontinued, searchProducts } from "../src/lib/store.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const LOCALES = ["en", "zh"];
const origin = siteOrigin();

function esc(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function headSnippet({ title, description, path: pagePath, image, noindex = false, jsonLd, ogType = "website", lang }) {
  const url = absUrl(origin, pagePath);
  const enUrl = absUrl(origin, withLocale("en", stripLocale(pagePath)));
  const zhUrl = absUrl(origin, withLocale("zh", stripLocale(pagePath)));
  const img = absAsset(origin, ogImagePath(image || "/og-default.jpg"));
  const robots = noindex ? "noindex, nofollow" : "index, follow";
  const payload = Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : jsonLd ? [jsonLd] : [];
  const json = payload.length
    ? `<script type="application/ld+json">${JSON.stringify(payload.length === 1 ? payload[0] : payload).replace(/</g, "\\u003c")}</script>`
    : "";
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<link rel="alternate" hreflang="en" href="${esc(enUrl)}" />`,
    `<link rel="alternate" hreflang="zh-Hant" href="${esc(zhUrl)}" />`,
    `<link rel="alternate" hreflang="x-default" href="${esc(enUrl)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:type" content="${esc(ogType)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(img)}" />`,
    `<meta property="og:image:url" content="${esc(img)}" />`,
    img.startsWith("https://") ? `<meta property="og:image:secure_url" content="${esc(img)}" />` : "",
    `<meta property="og:image:type" content="image/jpeg" />`,
    `<meta property="og:image:width" content="${OG_WIDTH}" />`,
    `<meta property="og:image:height" content="${OG_HEIGHT}" />`,
    `<meta property="og:image:alt" content="${esc(title)}" />`,
    `<link rel="image_src" href="${esc(img)}" />`,
    `<meta property="og:site_name" content="Mattex Marketplace" />`,
    `<meta property="og:locale" content="${lang === "zh" ? "zh_HK" : "en_HK"}" />`,
    `<meta property="og:locale:alternate" content="${lang === "zh" ? "en_HK" : "zh_HK"}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(img)}" />`,
    json,
  ]
    .filter(Boolean)
    .join("\n    ");
}

function inject(html, lang, snippet) {
  const htmlLang = lang === "zh" ? "zh-Hant" : "en";
  let next = html.replace(/<html lang="[^"]*">/, `<html lang="${htmlLang}">`);
  if (next.includes("<!--seo-head-->")) {
    next = next.replace(/<!--seo-head-->[\s\S]*?<!--\/seo-head-->/, `<!--seo-head-->\n    ${snippet}\n    <!--/seo-head-->`);
    next = next.replace(/<title>[^<]*<\/title>\s*/, "");
    return next;
  }
  return next.replace(/<title>[^<]*<\/title>/, `${snippet}`);
}

async function writePage(relPath, html) {
  const filePath = path.join(distDir, relPath, "index.html");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, html);
}

function crumbs(lang, items) {
  return breadcrumbJsonLd(
    origin,
    items.map((item) => ({ name: item.name, path: withLocale(lang, item.path) }))
  );
}

async function main() {
  const template = await readFile(path.join(distDir, "index.html"), "utf8");
  const products = searchProducts("").filter((p) => !isDiscontinued(p));
  const suppliers = getSuppliers();
  const pages = [];

  for (const lang of LOCALES) {
    const copy = seoCopy(lang);
    pages.push({
      rel: lang,
      lang,
      title: copy.homeTitle,
      description: copy.homeDesc,
      path: withLocale(lang, "/"),
      image: "/og-default.jpg",
      jsonLd: [orgJsonLd(origin), crumbs(lang, [{ name: "Mattex Marketplace", path: "/" }])],
    });
    for (const category of getCategoryDefs()) {
      pages.push({
        rel: `${lang}/catalog/${category.id}`,
        lang,
        title: copy.categoryTitle(category.name),
        description: copy.categoryDesc(category.name),
        path: withLocale(lang, `/catalog/${category.id}`),
        image: categoryOgPath(category.id),
        jsonLd: [
          orgJsonLd(origin),
          crumbs(lang, [
            { name: "Mattex Marketplace", path: "/" },
            { name: category.name, path: `/catalog/${category.id}` },
          ]),
        ],
      });
    }
    pages.push({
      rel: `${lang}/green`,
      lang,
      title: copy.greenTitle,
      description: copy.greenDesc,
      path: withLocale(lang, "/green"),
      image: "/og-default.jpg",
      jsonLd: [orgJsonLd(origin), crumbs(lang, [{ name: "Mattex Marketplace", path: "/" }, { name: "Green", path: "/green" }])],
    });
    for (const supplier of suppliers) {
      pages.push({
        rel: `${lang}/supplier/${supplier.slug}`,
        lang,
        title: copy.supplierTitle(supplier.name),
        description: copy.supplierDesc(supplier.name),
        path: withLocale(lang, `/supplier/${supplier.slug}`),
        image: "/og-default.jpg",
        jsonLd: [orgJsonLd(origin), crumbs(lang, [{ name: "Mattex Marketplace", path: "/" }, { name: supplier.name, path: `/supplier/${supplier.slug}` }])],
      });
    }
    for (const product of products) {
      pages.push({
        rel: `${lang}/details/${product.id}`,
        lang,
        title: copy.productTitle(product.name),
        description: copy.productDesc(product),
        path: withLocale(lang, `/details/${product.id}`),
        image: product.image || "/og-default.jpg",
        ogType: "product",
        jsonLd: [
          orgJsonLd(origin),
          productJsonLd(origin, product, lang),
          crumbs(lang, [
            { name: "Mattex Marketplace", path: "/" },
            { name: product.category, path: catalogPathForCategory(product.category) },
            { name: product.name, path: `/details/${product.id}` },
          ]),
        ],
      });
    }
  }

  for (const page of pages) {
    const snippet = headSnippet(page);
    await writePage(page.rel, inject(template, page.lang, snippet));
  }

  const home = pages.find((page) => page.rel === "en");
  if (home) {
    await writeFile(path.join(distDir, "index.html"), inject(template, home.lang, headSnippet(home)));
  }

  const indexable = pages.filter((page) => !page.noindex);
  const urlset = indexable
    .filter((page) => page.lang === "en")
    .map((page) => {
      const loc = absUrl(origin, page.path);
      const zh = absUrl(origin, withLocale("zh", stripLocale(page.path)));
      return `  <url>
    <loc>${esc(loc)}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${esc(loc)}" />
    <xhtml:link rel="alternate" hreflang="zh-Hant" href="${esc(zh)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(loc)}" />
  </url>`;
    })
    .join("\n");

  await writeFile(
    path.join(distDir, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlset}
</urlset>
`
  );

  const blocked = [
    "/login",
    "/signup",
    "/rfq",
    "/rfqs",
    "/whatsapp",
    "/whatsapp-chat",
    "/email-sent",
    "/en/login",
    "/zh/login",
    "/en/signup",
    "/zh/signup",
    "/en/rfq",
    "/zh/rfq",
    "/en/rfqs",
    "/zh/rfqs",
    "/en/whatsapp",
    "/zh/whatsapp",
    "/en/whatsapp-chat",
    "/zh/whatsapp-chat",
    "/en/email-sent",
    "/zh/email-sent",
  ];
  await writeFile(
    path.join(distDir, "robots.txt"),
    `User-agent: *
Allow: /
${blocked.map((item) => `Disallow: ${item}`).join("\n")}

Sitemap: ${absUrl(origin, "/sitemap.xml")}
`
  );

  console.log(`Prerendered ${pages.length} pages at ${origin}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
