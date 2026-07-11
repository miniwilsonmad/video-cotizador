<template>
  <main>
    <h1>Panel de Administración</h1>
    <div class="container">
      <!-- LOGIN GATE -->
      <div v-if="!authenticated" class="login-box">
        <h2>Acceso restringido</h2>
        <form @submit.prevent="login">
          <input
            v-model="passwordInput"
            type="password"
            placeholder="Contraseña"
            autofocus
          />
          <button type="submit">Entrar</button>
        </form>
        <p v-if="loginError" class="error">{{ loginError }}</p>
      </div>

      <!-- ADMIN PANEL -->
      <div v-else>
        <nav class="tabs">
          <button :class="{ active: tab === 'services' }" @click="tab = 'services'">Servicios</button>
          <button :class="{ active: tab === 'extras' }" @click="tab = 'extras'">Extras</button>
          <button :class="{ active: tab === 'settings' }" @click="tab = 'settings'">Ajustes</button>
        </nav>

        <!-- SERVICES TAB -->
        <section v-if="tab === 'services'">
          <div class="section-header">
            <h2>Servicios ({{ config.services.length }})</h2>
            <button @click="addService">+ Nuevo servicio</button>
          </div>

          <div v-for="(svc, si) in config.services" :key="svc.id" class="card">
            <div class="card-header">
              <input v-model="svc.label" class="inline-input" placeholder="Nombre del servicio" />
              <button class="secondary small danger" @click="removeService(si)">✕</button>
            </div>
            <div class="card-body">
              <h4>Duraciones y precios</h4>
              <div v-for="(len, li) in svc.lengths" :key="len.id" class="row-inline">
                <input v-model="len.label" placeholder="Ej: 1 a 3 minutos" />
                <span>$</span>
                <input v-model.number="len.price" type="number" min="0" placeholder="Precio" class="price-input" />
                <button class="secondary small danger" @click="removeLength(si, li)">✕</button>
              </div>
              <button class="small outline" @click="addLength(si)">+ Agregar duración</button>
            </div>
          </div>
        </section>

        <!-- EXTRAS TAB -->
        <section v-if="tab === 'extras'">
          <div class="section-header">
            <h2>Extras ({{ config.extras.length }})</h2>
            <button @click="addExtra">+ Nuevo extra</button>
          </div>
          <div v-for="(ext, ei) in config.extras" :key="ext.id" class="card">
            <div class="card-header">
              <input v-model="ext.label" class="inline-input" placeholder="Nombre del extra" />
              <span>$</span>
              <input v-model.number="ext.price" type="number" min="0" class="price-input" />
              <button class="secondary small danger" @click="removeExtra(ei)">✕</button>
            </div>
          </div>
        </section>

        <!-- SETTINGS TAB -->
        <section v-if="tab === 'settings'">
          <h2>Ajustes</h2>
          <div class="card">
            <h4>Cambiar contraseña de administrador</h4>
            <div class="row-inline">
              <input v-model="newPassword" type="password" placeholder="Nueva contraseña" />
              <button @click="changePassword">Guardar</button>
            </div>
            <p v-if="pwMsg">{{ pwMsg }}</p>
          </div>
          <div class="card">
            <h4>Exportar / Importar configuración</h4>
            <div class="row-buttons">
              <button @click="doExport">📥 Exportar JSON</button>
              <button class="secondary" @click="triggerImport">📤 Importar JSON</button>
              <button class="secondary danger" @click="doReset">🔄 Restaurar defaults</button>
            </div>
            <input
              v-if="showImport"
              v-model="importJson"
              type="text"
              placeholder="Pega aquí el JSON de configuración..."
            />
            <button v-if="showImport" @click="doImport">Cargar</button>
          </div>
          <div class="card">
            <button class="secondary" @click="logout">🔒 Cerrar sesión</button>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref } from "vue";
import { useConfig } from "../composables/useConfig.js";

const { config, resetToDefaults, exportConfig, importConfig, verifyPassword } = useConfig();

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

// Services CRUD
let svcCounter = 0;
let lenCounter = 0;
let extCounter = 0;

function makeId(prefix) {
  return prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
}

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
  config.extras.push({
    id: makeId("ext"),
    label: "Nuevo extra",
    price: 50,
  });
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
  }
}
</script>

<style scoped>
.login-box {
  max-width: 400px;
  margin: 4rem auto;
  text-align: center;
}
.login-box h2 {
  margin-bottom: 1rem;
}
.error {
  color: #d93526;
  margin-top: 0.5rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
.tabs button {
  padding: 0.5rem 1.5rem;
}
.tabs button.active {
  background: var(--pico-primary);
  color: var(--pico-primary-inverse);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card {
  border: 1px solid var(--pico-muted-border-color);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.card-body {
  padding-left: 0.5rem;
}
.card-body h4 {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  opacity: 0.7;
}

.inline-input {
  flex: 1;
  margin-bottom: 0;
}
.price-input {
  width: 100px;
}

.row-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.row-inline input {
  margin-bottom: 0;
}

.row-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.small {
  font-size: 0.85rem;
  padding: 0.25rem 0.6rem;
}
.outline {
  background: transparent;
  border: 1px dashed var(--pico-muted-border-color);
  color: var(--pico-primary);
}
.danger {
  color: #d93526;
  border-color: #d93526;
}
</style>
