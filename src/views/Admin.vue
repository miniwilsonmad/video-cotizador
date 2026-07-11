<template>
  <main class="admin">
    <header class="admin-hero">
      <router-link to="/" class="home-link">← Cotizador</router-link>
      <h1>Panel de Administración</h1>
    </header>

    <div class="admin-wrapper">
      <!-- LOGIN GATE -->
      <div v-if="!authenticated" class="login-box">
        <span class="login-icon">🔐</span>
        <h2>Acceso restringido</h2>
        <form @submit.prevent="login" class="login-form">
          <input
            v-model="passwordInput"
            type="password"
            placeholder="Contraseña"
            autofocus
            class="login-input"
          />
          <button type="submit" class="btn-primary">Entrar</button>
        </form>
        <p v-if="loginError" class="error-msg">{{ loginError }}</p>
      </div>

      <!-- ADMIN PANEL -->
      <div v-else class="panel">
        <nav class="tab-nav">
          <button :class="['tab-btn', { active: tab === 'services' }]" @click="tab = 'services'">
            📹 Servicios
          </button>
          <button :class="['tab-btn', { active: tab === 'extras' }]" @click="tab = 'extras'">
            ➕ Extras
          </button>
          <button :class="['tab-btn', { active: tab === 'settings' }]" @click="tab = 'settings'">
            ⚙️ Ajustes
          </button>
        </nav>

        <!-- SERVICES TAB -->
        <section v-if="tab === 'services'">
          <div class="section-head">
            <h2>Servicios ({{ config.services.length }})</h2>
            <button class="btn-primary btn-sm" @click="addService">+ Nuevo servicio</button>
          </div>

          <div v-for="(svc, si) in config.services" :key="svc.id" class="admin-card">
            <div class="admin-card-hd">
              <input v-model="svc.label" class="field-lg" placeholder="Nombre del servicio" />
              <button class="btn-icon danger" @click="removeService(si)" title="Eliminar">✕</button>
            </div>
            <div class="admin-card-bd">
              <p class="label-sm">Duraciones y precios</p>
              <div v-for="(len, li) in svc.lengths" :key="len.id" class="row-inline">
                <input v-model="len.label" placeholder="Ej: 1 a 3 minutos" class="field" />
                <span class="dollar">$</span>
                <input v-model.number="len.price" type="number" min="0" placeholder="Precio" class="field field-sm" />
                <button class="btn-icon danger sm" @click="removeLength(si, li)">✕</button>
              </div>
              <button class="btn-dashed" @click="addLength(si)">+ Agregar duración</button>
            </div>
          </div>
        </section>

        <!-- EXTRAS TAB -->
        <section v-if="tab === 'extras'">
          <div class="section-head">
            <h2>Extras ({{ config.extras.length }})</h2>
            <button class="btn-primary btn-sm" @click="addExtra">+ Nuevo extra</button>
          </div>
          <div v-for="(ext, ei) in config.extras" :key="ext.id" class="admin-card">
            <div class="admin-card-hd">
              <input v-model="ext.label" class="field-lg" placeholder="Nombre del extra" />
              <span class="dollar">$</span>
              <input v-model.number="ext.price" type="number" min="0" class="field field-sm" />
              <button class="btn-icon danger" @click="removeExtra(ei)">✕</button>
            </div>
          </div>
        </section>

        <!-- SETTINGS TAB -->
        <section v-if="tab === 'settings'">
          <h2>Ajustes</h2>

          <div class="admin-card">
            <h3>🔑 Cambiar contraseña</h3>
            <div class="row-inline">
              <input v-model="newPassword" type="password" placeholder="Nueva contraseña" class="field" />
              <button class="btn-secondary btn-sm" @click="changePassword">Guardar</button>
            </div>
            <p v-if="pwMsg" class="msg">{{ pwMsg }}</p>
          </div>

          <div class="admin-card">
            <h3>💾 Exportar / Importar</h3>
            <div class="row-btns">
              <button class="btn-secondary btn-sm" @click="doExport">📥 Exportar JSON</button>
              <button class="btn-secondary btn-sm" @click="triggerImport">📤 Importar JSON</button>
              <button class="btn-secondary btn-sm danger" @click="doReset">🔄 Restaurar defaults</button>
            </div>
            <div v-if="showImport" class="import-area">
              <textarea
                v-model="importJson"
                placeholder="Pega aquí el JSON de configuración..."
                class="field"
                rows="4"
              ></textarea>
              <button class="btn-primary btn-sm" @click="doImport">Cargar</button>
            </div>
          </div>

          <div class="admin-card">
            <h3>☁️ Google Sheets</h3>
            <p class="help">Publica cada pestaña como CSV (Archivo → Compartir → Publicar en la web).</p>
            <label class="field-label">CSV Servicios</label>
            <input v-model="sheetsSvcUrl" type="url" placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?gid=0&single=true&output=csv" class="field" />
            <label class="field-label">CSV Extras</label>
            <input v-model="sheetsExtUrl" type="url" placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?gid=123&single=true&output=csv" class="field" />
            <div class="row-btns">
              <button class="btn-primary btn-sm" @click="saveSheetUrls">💾 Guardar URLs</button>
              <button class="btn-secondary btn-sm" @click="syncSheets" :disabled="syncing">
                {{ syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar ahora' }}
              </button>
            </div>
            <p v-if="sheetsMsg" :class="['msg', sheetsMsgType === 'error' ? 'msg-err' : '']">{{ sheetsMsg }}</p>
            <p v-if="config._lastSync" class="help sync-info">Última sincronización: {{ new Date(config._lastSync).toLocaleString() }}</p>
          </div>

          <div class="admin-card">
            <button class="btn-secondary" @click="logout">🔒 Cerrar sesión</button>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref } from "vue";
import { useConfig } from "../composables/useConfig.js";

const { config, resetToDefaults, exportConfig, importConfig, verifyPassword, fetchFromSheets, setSheetUrls } = useConfig();

// Auth
const authenticated = ref(false);
const passwordInput = ref("");
const loginError = ref("");

function login() {
  if (verifyPassword(passwordInput.value)) {
    authenticated.value = true;
    loginError.value = "";
    passwordInput.value = "";
  } else {
    loginError.value = "Contraseña incorrecta.";
  }
}

function logout() {
  authenticated.value = false;
}

// Tabs
const tab = ref("services");

// ID generation
function makeId(prefix) {
  return prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
}

// Services CRUD
function addService() {
  config.services.push({
    id: makeId("svc"),
    label: "Nuevo servicio",
    lengths: [{ id: makeId("len"), label: "1 a 3 minutos", price: 300 }],
  });
}
function removeService(index) {
  config.services.splice(index, 1);
}
function addLength(svcIndex) {
  config.services[svcIndex].lengths.push({
    id: makeId("len"),
    label: "Nueva duración",
    price: 300,
  });
}
function removeLength(svcIndex, lenIndex) {
  config.services[svcIndex].lengths.splice(lenIndex, 1);
}

// Extras CRUD
function addExtra() {
  config.extras.push({ id: makeId("ext"), label: "Nuevo extra", price: 50 });
}
function removeExtra(index) {
  config.extras.splice(index, 1);
}

// Password
const newPassword = ref("");
const pwMsg = ref("");
function changePassword() {
  if (newPassword.value.length < 3) {
    pwMsg.value = "Mínimo 3 caracteres.";
    return;
  }
  config.adminPassword = newPassword.value;
  newPassword.value = "";
  pwMsg.value = "✓ Contraseña actualizada.";
  setTimeout(() => (pwMsg.value = ""), 3000);
}

// Export / Import
function doExport() {
  const blob = new Blob([exportConfig()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cotizador-config.json";
  a.click();
  URL.revokeObjectURL(url);
}

const showImport = ref(false);
const importJson = ref("");
function triggerImport() {
  showImport.value = !showImport.value;
  importJson.value = "";
}
function doImport() {
  if (!importJson.value.trim()) return;
  if (importConfig(importJson.value)) {
    alert("✓ Configuración importada correctamente.");
    showImport.value = false;
  } else {
    alert("✕ JSON inválido. Revisa el formato.");
  }
}
function doReset() {
  if (confirm("¿Restaurar toda la configuración a los valores por defecto? Se perderán tus cambios.")) {
    resetToDefaults();
    sheetsSvcUrl.value = "";
    sheetsExtUrl.value = "";
  }
}

// Google Sheets
const sheetsSvcUrl = ref(config.sheetsServicesUrl || "");
const sheetsExtUrl = ref(config.sheetsExtrasUrl || "");
const syncing = ref(false);
const sheetsMsg = ref("");
const sheetsMsgType = ref("");

function saveSheetUrls() {
  setSheetUrls(sheetsSvcUrl.value.trim(), sheetsExtUrl.value.trim());
  sheetsMsg.value = "✓ URLs guardadas. Usa 'Sincronizar ahora' para cargar los datos.";
  sheetsMsgType.value = "";
  setTimeout(() => (sheetsMsg.value = ""), 4000);
}

async function syncSheets() {
  if (!sheetsSvcUrl.value.trim() || !sheetsExtUrl.value.trim()) {
    sheetsMsg.value = "Primero ingresa y guarda ambas URLs.";
    sheetsMsgType.value = "error";
    return;
  }
  syncing.value = true;
  sheetsMsg.value = "";
  try {
    const result = await fetchFromSheets();
    if (result.success) {
      sheetsMsg.value = `✓ Sincronizado: ${result.services} servicios, ${result.extras} extras.`;
      sheetsMsgType.value = "";
    } else {
      sheetsMsg.value = "✕ " + result.error;
      sheetsMsgType.value = "error";
    }
  } catch (e) {
    sheetsMsg.value = "✕ Error de red: " + e.message;
    sheetsMsgType.value = "error";
  } finally {
    syncing.value = false;
  }
}
</script>
