import { reactive, watch } from "vue";
import { defaultConfig } from "../data/defaultConfig.js";

const STORAGE_KEY = "video-cotizador-config";

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Basic validation
      if (parsed && Array.isArray(parsed.services) && Array.isArray(parsed.extras)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load config from localStorage, using defaults");
  }
  // Deep clone default
  return JSON.parse(JSON.stringify(defaultConfig));
}

const state = reactive(loadConfig());

// Auto-save on changes (debounced by microtask)
let dirty = false;
watch(
  () => [state.services, state.extras, state.adminPassword],
  () => {
    if (!dirty) {
      dirty = true;
      Promise.resolve().then(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        dirty = false;
      });
    }
  },
  { deep: true }
);

export function useConfig() {
  function resetToDefaults() {
    const clone = JSON.parse(JSON.stringify(defaultConfig));
    state.services = clone.services;
    state.extras = clone.extras;
    state.adminPassword = clone.adminPassword;
  }

  function exportConfig() {
    return JSON.stringify(
      { services: state.services, extras: state.extras, adminPassword: state.adminPassword },
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

  return { config: state, resetToDefaults, exportConfig, importConfig, verifyPassword };
}
