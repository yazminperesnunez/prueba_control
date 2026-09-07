// app scrip/app.js

const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbzAOnPrWpOn-HRfgH86WxniEp46zLV91kMGf8ZkiztYHRDAxtz1SF7WUqo8mRmGfVpt/exec";

// Función genérica para enviar peticiones a Apps Script
async function fetchAppsScript(accion, payload) {
  try {
    const response = await fetch(URL_APPS_SCRIPT, {
      method: "POST",
      body: JSON.stringify({ accion, ...payload })
    });
    return await response.json();
  } catch (error) {
    console.error("Error al conectar con Apps Script:", error);
    throw error;
  }
}

// ==========================================
// MÓDULO: DASHBOARD (index.html)
// ==========================================
function cargarDashboard() {
  // Mostramos estado de carga
  document.getElementById("kpiTotalCompras").innerText = "...";
  document.getElementById("kpiTotalPagado").innerText = "...";
  document.getElementById("kpiSaldoPendiente").innerText = "...";

  fetchAppsScript("obtenerMetricas", {})
    .then(data => {
      document.getElementById("kpiTotalCompras").innerText = formatoMoneda(data.totalCompras || 0);
      document.getElementById("kpiTotalPagado").innerText = formatoMoneda(data.totalPagado || 0);
      document.getElementById("kpiSaldoPendiente").innerText = formatoMoneda(data.saldoPendiente || 0);
      document.getElementById("kpiComplementos").innerText = data.complementosFaltantes || 0;
    })
    .catch(() => alert("No se pudo cargar la información del Dashboard."));
}

// ==========================================
// MÓDULO: PROVEEDORES (proveedores.html)
// ==========================================
function registrarProveedor(event) {
  event.preventDefault();
  const form = event.target;
  const btnSubmit = form.querySelector('button[type="submit"]');
  btnSubmit.disabled = true;
  btnSubmit.innerText = "Procesando...";

  // Recolectar datos
  const payload = {
    rfc: form.rfc.value,
    razonSocial: form.razonSocial.value,
    regimenFiscal: form.regimenFiscal.value,
    correo: form.correo.value,
    telefono: form.telefono.value,
    direccion: form.direccion.value
  };

  // Convertir archivos a Base64 si existen (simulado para el ejemplo)
  const fileInput = form.csf.files[0];
  if (fileInput) {
    leerArchivoBase64(fileInput).then(base64Data => {
      payload.csfFile = {
        name: fileInput.name,
        mimeType: fileInput.type,
        data: base64Data
      };
      enviarDatosProveedor(payload, btnSubmit, form);
    });
  } else {
    enviarDatosProveedor(payload, btnSubmit, form);
  }
}

function enviarDatosProveedor(payload, btn, form) {
  fetchAppsScript("registrarProveedor", payload)
    .then(res => {
      if (res.success) {
        alert("Proveedor registrado exitosamente en Sheets y Drive.");
        form.reset();
      } else {
        alert("Error al registrar proveedor: " + res.error);
      }
    })
    .finally(() => {
      btn.disabled = false;
      btn.innerText = "Guardar y Subir a Drive";
    });
}

// ==========================================
// MÓDULO: PROCESOS (procesos.html)
// ==========================================
function registrarProceso(event) {
  event.preventDefault();
  const form = event.target;
  const btnSubmit = form.querySelector('button[type="submit"]');
  btnSubmit.disabled = true;
  btnSubmit.innerText = "Procesando...";

  const payload = {
    proveedorId: form.proveedorId.value,
    concepto: form.concepto.value,
    monto: form.monto.value
  };

  const fileInput = form.cotizacionFile.files[0];
  if (fileInput) {
    leerArchivoBase64(fileInput).then(base64Data => {
      payload.cotizacionFile = { name: fileInput.name, mimeType: fileInput.type, data: base64Data };
      ejecutarFetch(form, "registrarProceso", payload, btnSubmit, "Aperturar y Generar Carpeta");
    });
  }
}

function actualizarProceso(event) {
  event.preventDefault();
  const form = event.target;
  const btnSubmit = form.querySelector('button[type="submit"]');
  btnSubmit.disabled = true;
  btnSubmit.innerText = "Procesando...";

  const payload = {
    procesoId: form.procesoId.value,
    estatus: form.estatus.value,
    esquemaPago: form.esquemaPago.value
  };

  const fileInput = form.contratoFile.files[0];
  if (fileInput) {
    leerArchivoBase64(fileInput).then(base64Data => {
      payload.contratoFile = { name: fileInput.name, mimeType: fileInput.type, data: base64Data };
      ejecutarFetch(form, "actualizarProceso", payload, btnSubmit, "Guardar Cambios");
    });
  } else {
    ejecutarFetch(form, "actualizarProceso", payload, btnSubmit, "Guardar Cambios");
  }
}

// ==========================================
// MÓDULO: PAGOS (pagos.html)
// ==========================================
function registrarPago(event) {
  event.preventDefault();
  const form = event.target;
  const btnSubmit = form.querySelector('button[type="submit"]');
  btnSubmit.disabled = true;
  btnSubmit.innerText = "Procesando...";

  const payload = {
    procesoId: form.procesoId.value,
    montoAbonado: form.montoAbonado.value,
    fechaTransferencia: form.fechaTransferencia.value
  };

  const fileInput = form.comprobanteFile.files[0];
  if (fileInput) {
    leerArchivoBase64(fileInput).then(base64Data => {
      payload.comprobanteFile = { name: fileInput.name, mimeType: fileInput.type, data: base64Data };
      ejecutarFetch(form, "registrarPago", payload, btnSubmit, "Aplicar Pago");
    });
  }
}

// ==========================================
// MÓDULO: PORTAL (portal.html)
// ==========================================
function subirCFDI(event) {
  event.preventDefault();
  const form = event.target;
  const btnSubmit = form.querySelector('button[type="submit"]');
  btnSubmit.disabled = true;
  btnSubmit.innerText = "Subiendo...";

  const payload = {
    refPago: document.getElementById('ref-pago') ? document.getElementById('ref-pago').innerText : ''
  };

  const xmlInput = form.xmlFile.files[0];
  const pdfInput = form.pdfFile ? form.pdfFile.files[0] : null;

  leerArchivoBase64(xmlInput).then(xmlData => {
    payload.xmlFile = { name: xmlInput.name, mimeType: xmlInput.type, data: xmlData };
    if (pdfInput) {
      leerArchivoBase64(pdfInput).then(pdfData => {
        payload.pdfFile = { name: pdfInput.name, mimeType: pdfInput.type, data: pdfData };
        enviarCFDI(payload, btnSubmit, form);
      });
    } else {
      enviarCFDI(payload, btnSubmit, form);
    }
  });
}

function enviarCFDI(payload, btnSubmit, form) {
  fetchAppsScript("subirCFDI", payload).then(res => {
    if (res.success) {
      document.getElementById('portal-content').innerHTML = `
        <div class="text-center py-4">
          <h3 class="fw-bold text-success">¡Documentos Recibidos!</h3>
          <p class="text-secondary">El CFDI ha sido validado correctamente.</p>
        </div>`;
    } else {
      alert("Error: " + res.error);
      btnSubmit.disabled = false;
      btnSubmit.innerText = "Subir CFDI";
    }
  });
}

// Función genérica para reducir código repetido
function ejecutarFetch(form, accion, payload, btnSubmit, originalText) {
  fetchAppsScript(accion, payload)
    .then(res => {
      if (res.success) {
        alert("Operación exitosa");
        form.reset();
      } else {
        alert("Error: " + res.error);
      }
    })
    .finally(() => {
      btnSubmit.disabled = false;
      btnSubmit.innerText = originalText;
    });
}

// ==========================================
// UTILIDADES
// ==========================================
function formatoMoneda(valor) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);
}

function leerArchivoBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]); // Solo la parte base64
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}
