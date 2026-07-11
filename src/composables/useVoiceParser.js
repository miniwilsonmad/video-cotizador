/**
 * useVoiceParser.js
 * Convierte texto dictado en selecciones del cotizador.
 * Sin backend, sin API keys — todo client-side.
 *
 * Ejemplo: "Quiero un video corporativo de 1 a 3 minutos con dron y micrófono"
 * → { serviceId: "corporate", lengthId: "1-3", extraIds: ["drone", "microfonia"], missing: [] }
 */

/**
 * Normaliza texto para comparación: minúsculas, sin acentos, sin puntuación extra.
 */
function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .replace(/[.,;:!?¡¿"'-]/g, " ")   // puntuación → espacio
    .replace(/\s+/g, " ")             // colapsar espacios
    .trim();
}

/**
 * Calcula un score de similitud simple: qué fracción de palabras del "query"
 * aparecen en el "target".
 */
function matchScore(query, target) {
  const qWords = query.split(" ");
  const tWords = target.split(" ");
  let hits = 0;
  for (const qw of qWords) {
    if (qw.length < 3) continue; // ignorar palabras muy cortas
    for (const tw of tWords) {
      if (tw.includes(qw) || qw.includes(tw)) {
        hits++;
        break;
      }
    }
  }
  return hits / Math.max(qWords.length, 1);
}

/**
 * Parsea un transcript de voz y devuelve las selecciones del cotizador.
 *
 * @param {string} transcript - Texto dictado por el usuario
 * @param {object} config - { services: [...], extras: [...] }
 * @returns {{ serviceId: string|null, lengthId: string|null, extraIds: string[], missing: string[] }}
 */
export function parseVoiceInput(transcript, config) {
  const norm = normalize(transcript);

  // ── 1. Encontrar servicio ──
  let bestService = null;
  let bestServiceScore = 0;

  for (const s of config.services) {
    const score = matchScore(norm, normalize(s.label));
    if (score > bestServiceScore) {
      bestServiceScore = score;
      bestService = s;
    }
  }

  // ── 2. Encontrar duración ──
  let bestLength = null;
  let bestLengthScore = 0;

  if (bestService) {
    for (const l of bestService.lengths) {
      const score = matchScore(norm, normalize(l.label));
      if (score > bestLengthScore) {
        bestLengthScore = score;
        bestLength = l;
      }
    }
  }

  // Si no encontró duración en el servicio, buscar entre todas
  if (!bestLength) {
    for (const s of config.services) {
      for (const l of s.lengths) {
        const score = matchScore(norm, normalize(l.label));
        if (score > bestLengthScore) {
          bestLengthScore = score;
          bestLength = l;
        }
      }
    }
  }

  // ── 3. Encontrar extras ──
  const extraIds = [];
  for (const e of config.extras) {
    const score = matchScore(norm, normalize(e.label));
    if (score >= 0.3) {
      extraIds.push(e.id);
    }
  }

  // ── 4. Detectar qué falta ──
  const missing = [];
  if (!bestService || bestServiceScore < 0.15) {
    missing.push("servicio");
  }
  if (!bestLength || bestLengthScore < 0.15) {
    missing.push("duración");
  }

  return {
    serviceId: bestService?.id ?? null,
    lengthId: bestLength?.id ?? null,
    extraIds,
    missing,
    // metadata para debugging
    _serviceLabel: bestService?.label ?? null,
    _lengthLabel: bestLength?.label ?? null,
    _serviceScore: bestServiceScore,
    _lengthScore: bestLengthScore,
  };
}
