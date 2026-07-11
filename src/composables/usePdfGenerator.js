import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Genera un PDF A4 basado en el template de TheAtmosCo.
 *
 * Uso: await generatePdf({ clientName, serviceLabel, lengthLabel, extras,
 *                          basePrice, extrasTotal, subtotal, iva, total, date })
 */
export async function generatePdf(data) {
  const {
    clientName = "Cliente",
    serviceLabel = "",
    lengthLabel = "",
    extras = [],
    basePrice = 0,
    extrasTotal = 0,
    subtotal = 0,
    iva = 0,
    total = 0,
    date = new Date().toLocaleDateString("es-CR"),
  } = data;

  const usd = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  });
  const fm = (n) => usd.format(n);

  // ── Construir HTML del template ──────────────────
  const wrapper = document.createElement("div");
  wrapper.style.position = "absolute";
  wrapper.style.left = "-9999px";
  wrapper.style.top = "0";
  wrapper.style.width = "794px"; // A4 at 96dpi
  wrapper.style.fontFamily = "'Montserrat', 'Segoe UI', sans-serif";
  wrapper.innerHTML = `
    <div style="
      width:794px; min-height:1123px; background:#fff;
      display:flex; flex-direction:column;
      font-size:13px; line-height:1.5; color:#222;
    ">
      <!-- ═══ HEADER BAND (dark) ═══ -->
      <div style="
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        padding:32px 48px 28px; color:#fff; position:relative;
      ">
        <!-- Watermark / logo area -->
        <div style="position:absolute; top:18px; right:42px; opacity:0.15; font-size:72px; font-weight:700;
          font-family:'Century Gothic','Futura',sans-serif; letter-spacing:2px;">DG</div>

        <!-- Company name -->
        <div style="font-size:12px; font-weight:700; letter-spacing:1px; margin-bottom:4px; opacity:0.9;">
          DEVSGROWTH
        </div>
        <div style="font-size:8px; opacity:0.6; margin-bottom:28px;">
          Producción Audiovisual &middot; Desarrollo de Software
        </div>

        <!-- Title -->
        <h1 style="font-size:28px; font-weight:300; margin:0 0 8px; letter-spacing:1px;">
          COTIZACIÓN DE PROYECTO
        </h1>

        <!-- Thank you -->
        <p style="font-size:12px; margin:0 0 20px; opacity:0.85;">
          ¡<strong>Gracias</strong> por tomarnos en cuenta para su proyecto!
        </p>

        <!-- Client -->
        <div style="font-size:12px;">
          <strong>Cliente:</strong> ${escapeHtml(clientName)}
        </div>
      </div>

      <!-- ═══ BODY (white) ═══ -->
      <div style="padding:28px 48px; flex:1;">
        <!-- Servicio -->
        <p style="margin:0 0 6px;">
          <strong>SERVICIO A BRINDAR</strong>: ${escapeHtml(serviceLabel)} — ${escapeHtml(lengthLabel)}
        </p>

        <!-- Desglose -->
        <h2 style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:2px;
          margin:24px 0 12px; color:#333; border-bottom:1px solid #e0e0e0; padding-bottom:4px;">
          DESGLOSE
        </h2>

        <div style="margin-bottom:4px;">
          <strong style="font-size:11px;">PRODUCCIÓN</strong>
        </div>
        <div style="font-size:10px; color:#555; margin-bottom:3px;">
          <em>Fecha</em>: ${date}
        </div>

        <!-- Line items -->
        <ul style="margin:8px 0 0; padding-left:18px; font-size:10px; color:#444;">
          <li style="margin-bottom:3px;">Realización de video tipo ${escapeHtml(serviceLabel.toLowerCase())}.</li>
          <li style="margin-bottom:3px;">Duración estimada: ${escapeHtml(lengthLabel)}.</li>
          ${extras.map((e) => `<li style="margin-bottom:3px;">${escapeHtml(e.label)} incluido.</li>`).join("")}
        </ul>

        <!-- Entregables -->
        <h2 style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:2px;
          margin:22px 0 8px; color:#333; border-bottom:1px solid #e0e0e0; padding-bottom:4px;">
          ENTREGABLES
        </h2>
        <ul style="margin:4px 0 0; padding-left:18px; font-size:10px; color:#444;">
          <li style="margin-bottom:3px;">Edición, colorización y montaje profesional.</li>
          <li style="margin-bottom:3px;">Video principal en formato ${escapeHtml(lengthLabel)}.</li>
          <li style="margin-bottom:3px;">Entrega en formato digital Full HD (1080p).</li>
        </ul>

        <!-- Legal / Validity -->
        <div style="margin-top:28px; padding-top:12px; border-top:1px solid #e8e8e8;
          font-size:8px; color:#999; line-height:1.6;">
          <p style="margin:0 0 2px;"><strong>Fecha:</strong> ${date}</p>
          <p style="margin:0 0 2px;">Cotización personalizada y exclusiva. Prohibida su divulgación a terceros.</p>
          <p style="margin:0 0 2px;">Esta cotización tiene una <strong>validez de un mes desde su emisión</strong>.</p>
          <p style="margin:0 0 2px;">La inversión total puede verse afectada de pedir algún servicio extra.</p>
          <p style="margin:0;">Se reserva el servicio y la fecha con un anticipo del 30%.</p>
        </div>
      </div>

      <!-- ═══ FOOTER BAND (dark) ═══ -->
      <div style="
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        padding:22px 48px 18px; color:#fff; display:flex; justify-content:space-between;
        align-items:flex-end;
      ">
        <!-- Left: Contact -->
        <div style="font-size:9px; opacity:0.8;">
          <div style="font-weight:700; font-size:11px; margin-bottom:4px; opacity:1;">DevsGrowth</div>
          <div>contacto@devsgrowth.com</div>
          <div>+506 0000 0000</div>
          <div style="margin-top:8px; font-style:italic; font-size:8px; max-width:280px; opacity:0.6;">
            "Convertimos ideas en productos digitales que impulsan tu negocio."
          </div>
        </div>

        <!-- Right: Totals -->
        <div style="text-align:right;">
          <div style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px;
            margin-bottom:6px; opacity:0.9;">INVERSIÓN</div>
          <div style="margin-bottom:2px;">
            <span style="font-size:10px;">Subtotal:</span>
            <span style="font-size:10px; margin-left:12px;">${fm(subtotal)}</span>
          </div>
          <div style="margin-bottom:2px;">
            <span style="font-size:10px;">IVA (13%):</span>
            <span style="font-size:10px; margin-left:12px;">${fm(iva)}</span>
          </div>
          <div style="font-size:15px; font-weight:700; margin-top:6px; padding-top:6px;
            border-top:1px solid rgba(255,255,255,0.2);">
            TOTAL: ${fm(total)}
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(wrapper);

  try {
    // ── Render to canvas ──────────────────
    const canvas = await html2canvas(wrapper.firstElementChild, {
      scale: 2, // 2x for print quality
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    // ── Create PDF ─────────────────────────
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [canvas.width / 2, canvas.height / 2], // divide by scale to get A4
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    pdf.addImage(imgData, "JPEG", 0, 0, canvas.width / 2, canvas.height / 2);

    // ── Download ──────────────────────────
    const filename = `Cotizacion_DevsGrowth_${date.replace(/\//g, "-")}.pdf`;
    pdf.save(filename);

    return { success: true, filename };
  } catch (err) {
    console.error("PDF generation failed:", err);
    return { success: false, error: err.message };
  } finally {
    document.body.removeChild(wrapper);
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
