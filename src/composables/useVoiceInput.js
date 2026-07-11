/**
 * useVoiceInput.js
 * Composable Vue para grabación de voz con Web Speech API.
 * 100% client-side, sin backend, sin API keys.
 *
 * Compatible con: Chrome, Edge, Brave, Arc (desktop + Android)
 * NO compatible con: Firefox, Safari (usan prefijo o no soportan)
 */

import { ref, onUnmounted } from "vue";

// Tipos de SpeechRecognition según navegador
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

export function useVoiceInput() {
  const isListening = ref(false);
  const transcript = ref("");
  const error = ref(null);
  const isSupported = ref(!!SpeechRecognition);

  let recognition = null;

  /**
   * Inicia la grabación de voz.
   * @param {string} lang - Código de idioma (default: 'es-MX')
   */
  function start(lang = "es-MX") {
    if (!SpeechRecognition) {
      error.value = "Tu navegador no soporta dictado por voz. Usa Chrome o Edge.";
      return;
    }

    // Cancelar cualquier instancia previa
    if (recognition) {
      recognition.abort();
    }

    recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      isListening.value = true;
      error.value = null;
      transcript.value = "";
    };

    recognition.onresult = (event) => {
      const result = event.results[0][0].transcript;
      transcript.value = result.trim();
    };

    recognition.onerror = (event) => {
      const messages = {
        "not-allowed": "Permiso de micrófono denegado. Actívalo en configuración del navegador.",
        "no-speech": "No se detectó voz. Intenta de nuevo.",
        "audio-capture": "No se encontró micrófono.",
        "network": "Error de red. Verifica tu conexión.",
        aborted: "Grabación cancelada.",
      };
      error.value = messages[event.error] || `Error: ${event.error}`;
      isListening.value = false;
    };

    recognition.onend = () => {
      isListening.value = false;
    };

    recognition.start();
  }

  /**
   * Detiene la grabación manualmente.
   */
  function stop() {
    if (recognition) {
      recognition.stop();
      isListening.value = false;
    }
  }

  /**
   * Cancela la grabación sin procesar resultado.
   */
  function cancel() {
    if (recognition) {
      recognition.abort();
      isListening.value = false;
      transcript.value = "";
    }
  }

  // Limpiar al desmontar el componente
  onUnmounted(() => {
    if (recognition) {
      recognition.abort();
    }
  });

  return {
    isListening,
    transcript,
    error,
    isSupported,
    start,
    stop,
    cancel,
  };
}
