// The one door every page uses to read and write data.
//
//   import { db } from "@/api/db";
//   const recipes = await db.Recipe.filter({});
//   await db.GroceryItem.update(id, { status: "have" });
//
// Each table offers the same methods as base44.entities.X: list, filter, get,
// create, bulkCreate, update, delete, deleteMany. Behind it sit two backends:
//
// - "base44": the signed-in app, talking to Base44 exactly as before.
// - "local":  the demo, kept in this browser's storage. It never calls Base44.
//
// When Rozana moves to Supabase, only this file needs a third backend; pages
// stay as they are. See docs/MIGRATION-INVENTORY.md.
import { base44 } from "@/api/base44Client";
import { DEMO_DB_KEY, isDemo } from "@/lib/demo";

// Tables Base44 does not have yet. Until they are added there (or in Supabase),
// signed-in data for them is kept in this browser.
// TODO(supabase): move these to real tables: collections, cook_log, user_settings.
export const LOCAL_ONLY = ["Collection", "CookLog", "UserSettings"];
const SIGNED_IN_LOCAL_KEY = "rozana.local.db";

const TABLES = [
  "Recipe",
  "Household",
  "PlannedMeal",
  "SavedVersion",
  "GroceryItem",
  "AppSetting",
  ...LOCAL_ONLY,
];

// ---------------------------------------------------------------------------
// Local backend: a JSON object { Table: [rows] } in localStorage.

function readStore(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}

function writeStore(key, store) {
  try {
    window.localStorage.setItem(key, JSON.stringify(store));
  } catch {
    /* storage full or blocked: the change lasts until the page reloads */
  }
}

function matches(row, query = {}) {
  return Object.entries(query).every(([field, value]) => {
    const actual = row[field];
    if (Array.isArray(actual) && !Array.isArray(value)) return actual.includes(value);
    return actual === value;
  });
}

function sortRows(rows, sort) {
  if (!sort) return rows;
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  return [...rows].sort((a, b) => {
    const result = String(a[field] ?? "").localeCompare(String(b[field] ?? ""), "en", { numeric: true });
    return desc ? -result : result;
  });
}

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function localTable(storeKey, table) {
  const all = () => readStore(storeKey)[table] || [];
  const save = (rows) => {
    const store = readStore(storeKey);
    store[table] = rows;
    writeStore(storeKey, store);
  };
  const stamp = (data) => {
    const now = new Date().toISOString();
    return { created_date: now, updated_date: now, ...data, id: data.id || newId() };
  };

  return {
    async list(sort, limit) {
      const rows = sortRows(all(), sort);
      return limit ? rows.slice(0, limit) : rows;
    },
    async filter(query, sort, limit) {
      const rows = sortRows(all().filter((row) => matches(row, query)), sort);
      return limit ? rows.slice(0, limit) : rows;
    },
    async get(id) {
      const row = all().find((item) => item.id === id);
      if (!row) throw Object.assign(new Error(`${table} ${id} not found`), { status: 404 });
      return row;
    },
    async create(data) {
      const row = stamp(data);
      save([...all(), row]);
      return row;
    },
    async bulkCreate(list = []) {
      const rows = list.map(stamp);
      save([...all(), ...rows]);
      return rows;
    },
    async update(id, data) {
      let updated = null;
      save(
        all().map((row) => {
          if (row.id !== id) return row;
          updated = { ...row, ...data, id, updated_date: new Date().toISOString() };
          return updated;
        }),
      );
      return updated;
    },
    async delete(id) {
      save(all().filter((row) => row.id !== id));
      return { id };
    },
    async deleteMany(query) {
      save(all().filter((row) => !matches(row, query)));
      return {};
    },
  };
}

// ---------------------------------------------------------------------------
// Picking a backend, per call, so switching in or out of the demo needs no reload.

export function backendName() {
  return isDemo() ? "local" : "base44";
}

function tableFor(table) {
  if (isDemo()) return localTable(DEMO_DB_KEY, table);
  if (LOCAL_ONLY.includes(table)) return localTable(SIGNED_IN_LOCAL_KEY, table);
  return base44.entities[table];
}

function proxyTable(table) {
  const methods = ["list", "filter", "get", "create", "bulkCreate", "update", "delete", "deleteMany"];
  return Object.fromEntries(methods.map((method) => [method, (...args) => tableFor(table)[method](...args)]));
}

export const db = Object.fromEntries(TABLES.map((table) => [table, proxyTable(table)]));
