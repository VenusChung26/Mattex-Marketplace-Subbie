import { createClient } from "@supabase/supabase-js";

const timers = new Map();

function readEnv(name) {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const meta = import.meta.env;
    if (name === "VITE_SUPABASE_URL" && meta.VITE_SUPABASE_URL) {
      return String(meta.VITE_SUPABASE_URL || "").trim();
    }
    if (name === "VITE_SUPABASE_ANON_KEY" && meta.VITE_SUPABASE_ANON_KEY) {
      return String(meta.VITE_SUPABASE_ANON_KEY || "").trim();
    }
    if (
      (name === "VITE_SUPABASE_PUBLISHABLE_KEY" || name === "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") &&
      (meta.VITE_SUPABASE_PUBLISHABLE_KEY || meta.VITE_SUPABASE_ANON_KEY)
    ) {
      return String(meta.VITE_SUPABASE_PUBLISHABLE_KEY || meta.VITE_SUPABASE_ANON_KEY || "").trim();
    }
    if (meta[name] != null) return String(meta[name] || "").trim();
  }
  if (typeof process !== "undefined" && process.env && process.env[name] != null) {
    return String(process.env[name] || "").trim();
  }
  return "";
}

export function supabaseConfig() {
  const url =
    readEnv("VITE_SUPABASE_URL") ||
    readEnv("SUPABASE_URL") ||
    readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anon =
    readEnv("VITE_SUPABASE_ANON_KEY") ||
    readEnv("VITE_SUPABASE_PUBLISHABLE_KEY") ||
    readEnv("SUPABASE_ANON_KEY") ||
    readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
    readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const service = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  return { url, anon, service };
}

export function isSupabaseConfigured() {
  const { url, anon, service } = supabaseConfig();
  return Boolean(url && (anon || service));
}

export function getSupabase(preferService = false) {
  const { url, anon, service } = supabaseConfig();
  const key = preferService && service ? service : anon || service;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const SKIP_KV_KEYS = new Set([
  "subbie_auth",
  "subbie_staff_auth",
  "subbie_lang",
  "subbie_hide_auth_invite_v2",
  "subbie_cart_auth_invite_shown_v1",
  "subbie_drafts_by_user",
]);

function skipPersistKey(key) {
  const name = String(key || "");
  return !name || SKIP_KV_KEYS.has(name) || name.startsWith("subbie_drafts");
}

export function persistKv(key, value) {
  if (skipPersistKey(key) || !isSupabaseConfigured()) return;
  const prev = timers.get(key);
  if (prev) clearTimeout(prev);
  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      const sb = getSupabase();
      if (!sb) return;
      sb.from("app_kv")
        .upsert({ key, value, updated_at: new Date().toISOString() })
        .then(({ error }) => {
          if (error) console.warn("supabase persist", key, error.message);
        });
    }, 400)
  );
}

function kvFromRows(rows) {
  const kv = {};
  for (const row of rows || []) {
    if (!row?.key || skipPersistKey(row.key)) continue;
    kv[row.key] = row.value;
  }
  return kv;
}

export async function fetchRemoteKv(keys) {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    let query = sb.from("app_kv").select("key,value").not("key", "like", "subbie_drafts%");
    if (Array.isArray(keys) && keys.length) query = query.in("key", keys);
    const { data, error } = await query;
    if (error) {
      console.warn("supabase kv", error.message);
      return null;
    }
    return kvFromRows(data);
  } catch (error) {
    console.warn("supabase kv", error?.message || error);
    return null;
  }
}

export async function fetchRemoteState() {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const [kvRes, productRes, metricRes] = await Promise.all([
      sb.from("app_kv").select("key,value").not("key", "like", "subbie_drafts%"),
      sb.from("products").select("id,payload"),
      sb.from("supplier_metrics").select("*"),
    ]);
    if (kvRes.error && productRes.error) {
      console.warn("supabase hydrate", kvRes.error.message || productRes.error.message);
      return null;
    }
    const kv = kvFromRows(kvRes.data);
    const products = (productRes.data || [])
      .map((row) => row.payload)
      .filter((p) => p && p.id);
    const metrics = {};
    for (const row of metricRes.data || []) {
      metrics[row.slug] = {
        rating: Number(row.rating) || 0,
        completionRate: Number(row.completion_rate) || 0,
        onTimeRate: Number(row.on_time_rate) || 0,
        searchCount: Number(row.search_count) || 0,
        foundCount: Number(row.found_count) || 0,
        rfqCount: Number(row.rfq_count) || 0,
        empty: Boolean(row.empty),
      };
    }
    return { kv, products, metrics };
  } catch (error) {
    console.warn("supabase hydrate", error?.message || error);
    return null;
  }
}
