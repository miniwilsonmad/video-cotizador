<template>
  <main>
    <h1>Calculadora de precios de producción de videos</h1>
    <div class="container">
      <div v-if="!showSummary">
        <nav class="steps" aria-label="Progreso">
          <span :class="['step', { active: step === 1, done: step > 1 }]">
            1. Servicio
          </span>
          <span :class="['step', { active: step === 2, done: step > 2 }]">
            2. Duración
          </span>
          <span :class="['step', { active: step === 3 }]">3. Extras</span>
        </nav>

        <section v-if="step === 1">
          <select id="service" v-model="serviceId">
            <option :value="null" disabled>Elige un servicio…</option>
            <option v-for="s in SERVICES" :key="s.id" :value="s.id">
              {{ s.label }}
            </option>
          </select>
          <small>Elige el servicio que deseas cotizar.</small>
        </section>

        <section v-else-if="step === 2">
          <select id="length" v-model="lengthId">
            <option :value="null" disabled>Elige una duración…</option>
            <option v-for="l in availableLengths" :key="l.id" :value="l.id">
              {{ l.label }} — {{ money(l.price) }}
            </option>
          </select>
          <small>Duraciones disponibles para {{ selectedService?.label }}.</small>
        </section>

        <section v-else>
          <fieldset>
            <legend>Agrega extras (opcional)</legend>
            <label v-for="e in EXTRAS" :key="e.id">
              <input type="checkbox" :value="e.id" v-model="extraIds" />
              {{ e.label }} <strong>+{{ money(e.price) }}</strong>
            </label>
          </fieldset>
        </section>

        <footer class="actions">
          <button class="secondary" :disabled="step === 1" @click="back">
            Atrás
          </button>
          <button v-if="step < TOTAL_STEPS" :disabled="!canContinue" @click="next">
            Siguiente
          </button>
          <button v-else :disabled="!canContinue" @click="finish">
            Ver cotización
          </button>
        </footer>
      </div>

      <div v-else>
        <h2 class="summary-title">Resumen de tu cotización</h2>
        <table>
          <tbody>
            <tr>
              <td>
                {{ selectedService?.label }} — {{ selectedLength?.label }}
              </td>
              <td class="amount">{{ money(basePrice) }}</td>
            </tr>
            <tr v-for="e in selectedExtras" :key="e.id">
              <td>{{ e.label }}</td>
              <td class="amount">{{ money(e.price) }}</td>
            </tr>
            <tr v-if="selectedExtras.length === 0">
              <td colspan="2"><small>Sin extras seleccionados.</small></td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th>Total</th>
              <th class="amount">{{ money(total) }}</th>
            </tr>
          </tfoot>
        </table>
        <footer class="actions">
          <button class="secondary" @click="showSummary = false">Atras</button>
          <button @click="restart">Nueva cotización</button>
        </footer>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const SERVICES = [
  {
    id: "corporate",
    label: "Corporativo",
    lengths: [
      { id: "1-3", label: "1 a 3 minutos", price: 450 },
      { id: "3-5", label: "3 a 5 minutos", price: 510 },
      { id: "5-10", label: "5 a 10 minutos", price: 625 },
      { id: "10-20", label: "10 a 20 minutos", price: 800 },
    ],
  },
  {
    id: "documental",
    label: "Documental",
    lengths: [
      { id: "1-3", label: "1 a 3 minutos", price: 490 },
      { id: "3-5", label: "3 a 5 minutos", price: 525 },
      { id: "5-10", label: "5 a 10 minutos", price: 625 },
      { id: "10-20", label: "10 a 20 minutos", price: 820 },
    ],
  },
  {
    id: "bodas",
    label: "Bodas",
    lengths: [
      { id: "3-5", label: "3 a 5 minutos", price: 510 },
      { id: "5-10", label: "5 a 10 minutos", price: 625 },
      { id: "10-20", label: "10 a 20 minutos", price: 820 },
    ],
  },
  {
    id: "video-musical",
    label: "Video musical",
    lengths: [
      { id: "3-5", label: "3 a 5 minutos", price: 550 },
      { id: "5-10", label: "5 a 10 minutos", price: 600 },
    ],
  },
  {
    id: "resumen-evento",
    label: "Resumen de evento / Highlights",
    lengths: [
      { id: "1-3", label: "1 a 3 minutos", price: 350 },
      { id: "3-5", label: "3 a 5 minutos", price: 450 },
      { id: "5-10", label: "5 a 10 minutos", price: 550 },
    ],
  },
  {
    id: "bienes-raices",
    label: "Bienes raíces",
    lengths: [
      { id: "1-3", label: "1 a 3 minutos", price: 350 },
      { id: "3-5", label: "3 a 5 minutos", price: 450 },
    ],
  },
  {
    id: "naturaleza",
    label: "Naturaleza",
    lengths: [
      { id: "1-3", label: "1 a 3 minutos", price: 490 },
      { id: "3-5", label: "3 a 5 minutos", price: 525 },
      { id: "5-10", label: "5 a 10 minutos", price: 625 },
    ],
  },
  {
    id: "comercial-producto",
    label: "Comercial de producto",
    lengths: [{ id: "1-3", label: "1 a 3 minutos", price: 350 }],
  },
];

const EXTRAS = [
  { id: "drone", label: "Dron", price: 70 },
  { id: "camarografo", label: "Camarógrafo / Unidad", price: 145 },
  { id: "iluminacion", label: "Iluminación de estudio", price: 60 },
  { id: "camara-extra", label: "Cámara extra", price: 50 },
  { id: "microfonia", label: "Microfonía", price: 60 },
  { id: "viatico", label: "Viático / Gasolina", price: 40 },
];

const TOTAL_STEPS = 3;

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
});

const step = ref(1);
const serviceId = ref(null);
const lengthId = ref(null);
const extraIds = ref([]);

const selectedService = computed(
  () => SERVICES.find((s) => s.id === serviceId.value) ?? null,
);

const availableLengths = computed(() => selectedService.value?.lengths ?? []);

const selectedLength = computed(
  () => availableLengths.value.find((l) => l.id === lengthId.value) ?? null,
);

const selectedExtras = computed(() =>
  EXTRAS.filter((e) => extraIds.value.includes(e.id)),
);

const basePrice = computed(() => selectedLength.value?.price ?? 0);

const extrasTotal = computed(() =>
  selectedExtras.value.reduce((sum, e) => sum + e.price, 0),
);

const total = computed(() => basePrice.value + extrasTotal.value);

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

const showSummary = ref(false);

function finish() {
  if (canContinue.value) showSummary.value = true;
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
</script>