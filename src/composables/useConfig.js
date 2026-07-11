import { reactive } from "vue";
import { defaultConfig } from "../data/defaultConfig.js";

const STORAGE_KEY = "video-cotizador-config";

// --- CSV parsing ---
function parseServicesCSV(csv) {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  // Header: id,label,length_id,length_label,length_price
  const serviceMap = new Map();
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    if (cols.length < 5) continue;
    const [svcId, svcLabel, lenId, lenLabel, lenPrice] = cols;
    const price = parseFloat(lenPrice);
    if (isNaN(price)) continue;

    if (!serviceMap.has(svcId)) {
      serviceMap.set(svcId, { id: svcId, label: svcLabel, lengths: [] });
    }
    serviceMap.get(svcId).lengths.push({ id: lenId, label: lenLabel, price });
  }
  return [...serviceMap.values()];
}

function parseExtrasCSV(csv) {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  // Header: id,label,price
  const extras = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    if (cols.length < 3) continue;
    const [id, label, priceStr] = cols;
    const price = parseFloat(priceStr);
    if (isNaN(price)) continue;
    extras.push({ id, label, price });
  }
  return extras;
}

// --- State ---
function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.services) && Array.isArray(parsed.extras)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load localStorage config, using defaults");
  }
  return JSON.parse(JSON.stringify(defaultConfig));
}

const state = reactive(loadConfig());

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// --- Composable ---
export function useConfig() {
  // ---- Google Sheets integration ----
  async function fetchFromSheets() {
    const svcUrl = state.sheetsServicesUrl;
    const extUrl = state.sheetsExtrasUrl;
    if (!svcUrl || !extUrl) {
      return { success: false, error: "Faltan las URLs de Google Sheets." };
    }

    try {
      const [svcRes, extRes] = await Promise.all([
        fetch(svcUrl, { cache: "no-store" }),
        fetch(extUrl, { cache: "no-store" }),
      ]);

      if (!svcRes.ok || !extRes.ok) {
        return { success: false, error: "Error al descargar los CSV. Revisa que las hojas estén publicadas." };
      }

      const [svcCsv, extCsv] = await Promise.all([svcRes.text(), extRes.text()]);
      const services = parseServicesCSV(svcCsv);
      const extras = parseExtrasCSV(extCsv);

      if (services.length === 0 || extras.length === 0) {
        return { success: false, error: "CSV vacío o formato incorrecto. Revisa la estructura." };
      }

      state.services = services;
      state.extras = extras;
      state._lastSync = new Date().toISOString();
      persist();
      return { success: true, services: services.length, extras: extras.length };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // ---- Config management ----
  function setSheetUrls(svcUrl, extUrl) {
    state.sheetsServicesUrl = svcUrl;
    state.sheetsExtrasUrl = extUrl;
    persist();
  }

  function resetToDefaults() {
    const clone = JSON.parse(JSON.stringify(defaultConfig));
    state.services = clone.services;
    state.extras = clone.extras;
    state.adminPassword = clone.adminPassword;
    persist();
  }

  function exportConfig() {
    return JSON.stringify(
      {
        services: state.services,
        extras: state.extras,
        adminPassword: state.adminPassword,
        sheetsServicesUrl: state.sheetsServicesUrl || "",
        sheetsExtrasUrl: state.sheetsExtrasUrl || "",
      },
      null,
      2
    );
  }

  function importConfig(json) {
    try {
      const parsed = JSON.parse(json);
      if (parsed && Array.isArray(parsed.services) && Array.isArray(parsed.extras)) {
        state.services = parsed.services;
        state.extras = parsed.extras;
        if (parsed.adminPassword) state.adminPassword = parsed.adminPassword;
        if (parsed.sheetsServicesUrl !== undefined) state.sheetsServicesUrl = parsed.sheetsServicesUrl;
        if (parsed.sheetsExtrasUrl !== undefined) state.sheetsExtrasUrl = parsed.sheetsExtrasUrl;
        persist();
        return true;
      }
    } catch (e) {
      console.error("Invalid config JSON", e);
    }
    return false;
  }

  function verifyPassword(pw) {
    return pw === state.adminPassword;
  }

  return {
    config: state,
    fetchFromSheets,
    setSheetUrls,
    resetToDefaults,
    exportConfig,
    importConfig,
    verifyPassword,
    persist,
  };
}
