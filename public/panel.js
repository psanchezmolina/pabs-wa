// public/panel.js
(() => {
  // 1) Ruta base a tu proxy local
  const BASE = '/api';

  // 2) Referencias al DOM
  const locInput   = document.getElementById('loc-id');
  const btnConnect = document.getElementById('btn-connect');
  const panel      = document.getElementById('evo-panel');
  const output     = document.getElementById('evo-output');
  let locationId;

  // 3) Lógica genérica para llamadas al backend
  async function call(path, method = 'GET') {
    if (!locationId) throw new Error('Location ID no definido');
    let url  = `${BASE}/${path}`;
    const opts = { method };

    if (method === 'GET') {
      url += `?locationId=${encodeURIComponent(locationId)}`;
    } else {
      opts.headers = { 'Content-Type': 'application/json' };
      opts.body    = JSON.stringify({ locationId });
    }

    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`Error ${res.status}`);

    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      return res.json();
    } else {
      return res.blob();
    }
  }

  // 4) Handler para “Conectar”
  btnConnect.addEventListener('click', () => {
    locationId = locInput.value.trim();
    if (!locationId) {
      alert('Introduce tu Location ID');
      return;
    }
    localStorage.setItem('locationId', locationId);
    document.getElementById('auth').style.display = 'none';
    panel.style.display = 'flex';
  });

  // 5) Generar QR
  document.getElementById('btn-generate').addEventListener('click', async () => {
    output.textContent = 'Generando QR…';
    try {
      const result = await call('wa-qr');
      output.innerHTML = '';

      if (result instanceof Blob) {
        // Renderiza la imagen si es Blob
        const imgURL = URL.createObjectURL(result);
        const img    = document.createElement('img');
        img.src      = imgURL;
        img.alt      = 'QR WhatsApp';
        output.appendChild(img);
        // Revocar la URL tras 1 min
        setTimeout(() => URL.revokeObjectURL(imgURL), 60_000);
      } else {
        // Muestra el mensaje JSON
        output.textContent = result.message || JSON.stringify(result);
      }
    } catch (e) {
      output.textContent = e.message;
    }
  });

  // 6) Reiniciar instancia
  document.getElementById('btn-restart').addEventListener('click', async () => {
    output.textContent = 'Reiniciando…';
    try {
      // Asegúrate de que tu webhook n8n esté configurado como PUT
      const json = await call('restart-instance', 'PUT');
      output.textContent =
        `Instancia ${json.instance.instanceName} → ${json.instance.state}`;
    } catch (e) {
      output.textContent = e.message;
    }
  });

  // 7) Comprobar estado de la conexión
  document.getElementById('btn-status').addEventListener('click', async () => {
    output.textContent = 'Comprobando estado…';
    try {
      const json = await call('check-connection');
      output.textContent =
        `Instancia ${json.instance.instanceName}: ${json.instance.state}`;
    } catch (e) {
      output.textContent = e.message;
    }
  });

  // 8) Auto‑conexión si ya había un Location ID
  const saved = localStorage.getItem('locationId');
  if (saved) {
    locInput.value = saved;
    btnConnect.click();
  }
})();
