<template>
  <main>
    <h1>Calculadora de precios de producción de videos</h1>
    <div class="container">
      <div v-if="!showSummary">
        <nav class="steps" aria-label="Progreso">
          <span :class="['step', { active: step === 1, done: step > 1 }]">1. Servicio</span>
          <span :class="['step', { active: step === 2, done: step > 2 }]">2. Duración</span>
          <span :class="['step', { active: step === 3 }]">3. Extras</span>
        </nav>

        <section v-if="step === 1">
          <select id="service" v-model="serviceId">
            <option :value="null" disabled>Elige un servicio…</option>
            <option v-for="s in config.services" :key="s.id" :value="s.id">{{ s.label }}</option>
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
            <label v-for="e in config.extras" :key="e.id">
              <input type="checkbox" :value="e.id" v-model="extraIds" />
              {{ e.label }} <strong>+{{ money(e.price) }}</strong>
            </label>
          </fieldset>
        </section>

        <footer class="actions">
          <button class="secondary" :disabled="step === 1" @click="back">Atrás</button>
          <button v-if="step < TOTAL_STEPS" :disabled="!canContinue" @click="next">Siguiente</button>
          <button v-else :disabled="!canContinue" @click="finish">Ver cotización</button>
        </footer>
      </div>

      <div v-else>
        <h2 class="summary-title">Resumen de tu cotización</h2>
        <table>
          <tbody>
            <tr>
              <td>{{ selectedService?.label }} — {{ selectedLength?.label }}</td>
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
          <button class="secondary" @click="showSummary = false">Atrás</button>
          <button @click="restart">Nueva cotización</button>
        </footer>
      </div>
      <p class="admin-link">
        <router-link to="/admin">⚙️</router-link>
      </p>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useConfig } from "../composables/useConfig.js";

const { config } = useConfig();

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
});

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
