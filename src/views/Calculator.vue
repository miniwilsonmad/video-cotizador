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

          <div class="summary-total">
            <span>Total</span>
            <span class="total-price">{{ money(total) }}</span>
          </div>

          <div class="summary-actions">
            <button class="btn-secondary" @click="showSummary = false">← Ajustar</button>
            <button class="btn-primary" @click="restart">Nueva cotización</button>
          </div>
        </div>
      </Transition>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useConfig } from "../composables/useConfig.js";

const { config, fetchFromSheets } = useConfig();

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
const basePrice = computed(() => selectedLength.value?.price ?? 0);
const extrasTotal = computed(() => selectedExtras.value.reduce((sum, e) => sum + e.price, 0));
const total = computed(() => basePrice.value + extrasTotal.value);

// Running total shown on step 3 button
const currentRunningTotal = computed(() => {
  const base = basePrice.value;
  const extras = selectedExtras.value.reduce((sum, e) => sum + e.price, 0);
  return base + extras;
});

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
