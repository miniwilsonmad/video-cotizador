<template>
  <main class="calculator">
    <!-- HEADER -->
    <header class="hero">
      <span class="hero-icon">🎥</span>
      <h1>Cotizador de Video</h1>
      <p class="hero-sub">Producción profesional · Precios claros · Sin sorpresas</p>
    </header>

    <div class="card-wrapper" v-if="!showSummary">
      <!-- PROGRESS BAR -->
      <nav class="progress-track" aria-label="Progreso">
        <div class="progress-bg"></div>
        <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
        <span
          v-for="(label, idx) in steps"
          :key="idx"
          :class="['progress-step', { done: step > idx + 1, active: step === idx + 1 }]"
        >
          <span class="step-dot">{{ step > idx + 1 ? '✓' : idx + 1 }}</span>
          <span class="step-label">{{ label }}</span>
        </span>
      </nav>

      <!-- VOICE BANNER -->
      <Transition name="fade-up">
        <div v-if="voiceBanner" class="voice-banner" :class="voiceBanner.type">
          <span class="voice-banner-icon">{{ voiceBanner.type === 'partial' ? '🎤' : '✅' }}</span>
          <div class="voice-banner-body">
            <template v-if="voiceBanner.found.length">
              <strong>Entendí:</strong> {{ voiceBanner.found.join(', ') }}<br/>
            </template>
            <template v-if="voiceBanner.missing.length">
              <em>Falta:</em> {{ voiceBanner.missing.join(' y ') }} — selecciona abajo
            </template>
          </div>
          <button class="voice-banner-close" @click="dismissBanner">×</button>
        </div>
      </Transition>

      <!-- STEP 1: SERVICE CARDS -->
      <Transition name="slide" mode="out-in">
        <section v-if="step === 1" key="step1" class="step-body">
          <h2 class="step-title">¿Qué tipo de video necesitas?</h2>
          <div class="card-grid">
            <button
              v-for="s in config.services"
              :key="s.id"
              :class="['service-card', { selected: serviceId === s.id }]"
              @click="serviceId = s.id; next()"
            >
              <span class="card-emoji">{{ serviceIcon(s.label) }}</span>
              <span class="card-label">{{ s.label }}</span>
            </button>
          </div>
        </section>

        <!-- STEP 2: DURATION CARDS -->
        <section v-else-if="step === 2" key="step2" class="step-body">
          <button class="back-link" @click="back">← Volver</button>
          <h2 class="step-title">{{ selectedService?.label }}</h2>
          <p class="step-sub">Elige la duración del video</p>
          <div class="card-grid">
            <button
              v-for="l in availableLengths"
              :key="l.id"
              :class="['duration-card', { selected: lengthId === l.id }]"
              @click="lengthId = l.id; next()"
            >
              <span class="dur-label">{{ l.label }}</span>
              <span class="dur-price">{{ money(l.price) }}</span>
            </button>
          </div>
        </section>

        <!-- STEP 3: EXTRAS -->
        <section v-else key="step3" class="step-body">
          <button class="back-link" @click="back">← Volver</button>
          <h2 class="step-title">{{ selectedService?.label }} — {{ selectedLength?.label }}</h2>
          <p class="step-sub">Agrega extras a tu producción</p>
          <div class="extras-grid">
            <button
              v-for="e in config.extras"
              :key="e.id"
              :class="['extra-card', { on: extraIds.includes(e.id) }]"
              @click="toggleExtra(e.id)"
            >
              <span class="extra-icon">{{ extraIds.includes(e.id) ? '✓' : '+' }}</span>
              <span class="extra-label">{{ e.label }}</span>
              <span class="extra-price">+{{ money(e.price) }}</span>
            </button>
          </div>
          <div class="step-actions">
            <button
              class="btn-primary btn-large"
              @click="finish"
            >
              Ver cotización — {{ money(currentRunningTotal) }}
            </button>
          </div>
        </section>
      </Transition>

      <p class="admin-link">
        <router-link to="/admin" title="Administración">⚙️</router-link>
      </p>
    </div>

    <!-- SUMMARY -->
    <div v-else class="card-wrapper">
      <Transition name="fade-up" appear>
        <div class="summary">
          <span class="summary-emoji">📋</span>
          <h2>Tu cotización</h2>
          <p class="summary-service">{{ selectedService?.label }} · {{ selectedLength?.label }}</p>

          <div class="summary-rows">
            <div class="summary-row">
              <span>{{ selectedService?.label }} — {{ selectedLength?.label }}</span>
              <span class="amount">{{ money(basePrice) }}</span>
            </div>
            <div v-for="e in selectedExtras" :key="e.id" class="summary-row extra-row">
              <span>{{ e.label }}</span>
              <span class="amount">+{{ money(e.price) }}</span>
            </div>
            <div v-if="selectedExtras.length === 0" class="summary-row muted">
              <span>Sin extras</span>
              <span class="amount">—</span>
            </div>
          </div>

          <div class="summary-totals">
            <div class="summary-row subtotal-row">
              <span>Subtotal</span>
              <span class="amount">{{ money(subtotal) }}</span>
            </div>
            <div class="summary-row iva-row">
              <span>IVA (13%)</span>
              <span class="amount">+{{ money(iva) }}</span>
            </div>
            <div class="summary-total">
              <span>Total</span>
              <span class="total-price">{{ money(totalConIVA) }}</span>
            </div>
          </div>

          <div class="summary-actions">
            <button class="btn-secondary" @click="showSummary = false">← Ajustar</button>
            <button class="btn-primary" @click="restart">Nueva cotización</button>
          </div>
        </div>
      </Transition>
    </div>
  </main>

  <!-- FLOATING MIC BUTTON -->
  <div v-if="voiceSupported" class="voice-fab-container">
    <Transition name="fade-up">
      <div v-if="voiceError" class="voice-error-toast">
        {{ voiceError }}
        <button @click="voiceError = null">×</button>
      </div>
    </Transition>
    <button
      :class="['voice-fab', { listening: isListening }]"
      @click="isListening ? voiceStop() : voiceStart('es-CR')"
      :title="isListening ? 'Detener' : 'Dictar cotización'"
    >
      <span class="voice-fab-icon">{{ isListening ? '⏹' : '🎤' }}</span>
    </button>
    <Transition name="fade-up">
      <span v-if="isListening" class="voice-fab-label">Escuchando...</span>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useConfig } from "../composables/useConfig.js";
import { useVoiceInput } from "../composables/useVoiceInput.js";
import { parseVoiceInput } from "../composables/useVoiceParser.js";

const { config, fetchFromSheets } = useConfig();
const {
  isListening,
  transcript,
  error: voiceError,
  isSupported: voiceSupported,
  start: voiceStart,
  stop: voiceStop,
  cancel: voiceCancel,
} = useVoiceInput();

onMounted(async () => {
  if (config.sheetsServicesUrl && config.sheetsExtrasUrl) {
    await fetchFromSheets();
  }
});

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
});

const steps = ["Servicio", "Duración", "Extras"];
const TOTAL_STEPS = 3;

const step = ref(1);
const serviceId = ref(null);
const lengthId = ref(null);
const extraIds = ref([]);

const selectedService = computed(() => config.services.find((s) => s.id === serviceId.value) ?? null);
const availableLengths = computed(() => selectedService.value?.lengths ?? []);
const selectedLength = computed(() => availableLengths.value.find((l) => l.id === lengthId.value) ?? null);
const selectedExtras = computed(() => config.extras.filter((e) => extraIds.value.includes(e.id)));
const IVA_RATE = 0.13;

const basePrice = computed(() => selectedLength.value?.price ?? 0);
const extrasTotal = computed(() => selectedExtras.value.reduce((sum, e) => sum + e.price, 0));
const subtotal = computed(() => basePrice.value + extrasTotal.value);
const iva = computed(() => Math.round(subtotal.value * IVA_RATE));
const totalConIVA = computed(() => subtotal.value + iva.value);

// Running total shown on step 3 button (subtotal sin IVA)
const currentRunningTotal = computed(() => subtotal.value);

const progressPct = computed(() => ((step.value - 1) / (TOTAL_STEPS - 1)) * 100);

watch(serviceId, () => {
  lengthId.value = null;
});

const canContinue = computed(() => {
  if (step.value === 1) return serviceId.value !== null;
  if (step.value === 2) return lengthId.value !== null;
  return true;
});

function next() {
  if (step.value < TOTAL_STEPS && canContinue.value) step.value += 1;
}
function back() {
  if (step.value > 1) step.value -= 1;
}

function toggleExtra(id) {
  const idx = extraIds.value.indexOf(id);
  if (idx === -1) {
    extraIds.value.push(id);
  } else {
    extraIds.value.splice(idx, 1);
  }
}

const showSummary = ref(false);
function finish() {
  showSummary.value = true;
}
function restart() {
  step.value = 1;
  serviceId.value = null;
  lengthId.value = null;
  extraIds.value = [];
  showSummary.value = false;
  voiceBanner.value = null;
}

// ── Voice input ──────────────────────────
const voiceBanner = ref(null); // { type: 'success'|'partial', found: [...], missing: [...] }

// Watch transcript: when voice recognition completes, parse and apply
watch(
  () => transcript.value,
  (text) => {
    if (!text) return;
    applyVoiceInput(text);
  }
);

function applyVoiceInput(text) {
  const result = parseVoiceInput(text, config);

  // Aplicar lo que se encontró
  if (result.serviceId) serviceId.value = result.serviceId;
  if (result.lengthId) lengthId.value = result.lengthId;
  if (result.extraIds.length) extraIds.value = result.extraIds;

  // Construir banner de feedback
  const found = [];
  if (result.serviceId) found.push(result._serviceLabel);
  if (result.lengthId) found.push(result._lengthLabel);
  result.extraIds.forEach((id) => {
    const ex = config.extras.find((e) => e.id === id);
    if (ex) found.push(ex.label);
  });

  if (result.missing.length === 0) {
    // Todo encontrado: ir directo al resumen
    voiceBanner.value = null;
    showSummary.value = true;
  } else {
    // Faltan campos: navegar al paso que falta
    if (result.missing.includes("servicio")) {
      step.value = 1;
    } else if (result.missing.includes("duración")) {
      step.value = 2;
    } else {
      step.value = 3;
    }
    voiceBanner.value = {
      type: "partial",
      found,
      missing: result.missing,
    };
  }
}

function dismissBanner() {
  voiceBanner.value = null;
}
function money(value) {
  return usd.format(value);
}

// Icon mapping per service
const iconMap = {
  corporativo: "🏢",
  documental: "🎬",
  bodas: "💒",
  "video musical": "🎵",
  musical: "🎵",
  highlights: "✨",
  "resumen de evento": "✨",
  "bienes raíces": "🏠",
  naturaleza: "🌿",
  comercial: "📦",
  "comercial de producto": "📦",
};

function serviceIcon(label) {
  const lower = label.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lower.includes(key)) return icon;
  }
  return "🎥";
}
</script>
