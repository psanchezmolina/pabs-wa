(() => {
  // 1) Ajusta la ruta base a tu proxy local (/api)
  const BASE = '/api';

  // 2) Referencias al DOM
  const locInput   = document.getElementById('loc-id');
  const btnConnect = document.getElementById('btn-connect');
  const panel      = document.getElementById('evo-panel');
  const output     = document.getElementById('evo-output');
  let locationId;

  // 3) Función genérica para llamadas al backend
  async function call(path, method = 'GET') {
    if (!locationId) throw new Error('Location ID no definido');
    const url = method === 'GET'
      ? `${BASE}/${path}?locationId=${encodeURIComponent(locationId)}`
      : `${BASE}/${path}`;
    const opts = { method };

    if (method !== 'GET') {
      opts.headers = { 'Content-Type': 'application/json' };
      opts.body = JSON.stringify({ locationId });
    }

    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`Error ${res.status}`);
    // Si es imagen (QR), podrías manejar blob, pero aquí devolvemos JSON
    return res.json();
  }

  // 4) Handler para Conectar (Location ID)
  btnConnect.addEventListener('click', () => {
    locationId = locInput.value.trim();
    if (!locationId) {
      alert('Introduce tu Location ID');
      return;
    }
    localStorage.setItem('locationId', locationId);
    document.getElementById('auth').style.display = 'none';
    panel.style.display = 'block';
  });

  // 5) Generar QR
  document.getElementById('btn-generate').addEventListener('click', async () => {
    output.textContent = 'Generando QR…';
    try {
      const { base64 } = await call('wa-qr');
      const img = new Image();
      img.src = `data:image/png;base64,${base64.split(',')[1]}`;
      img.alt = 'QR WhatsApp';
      output.innerHTML = '';
      output.appendChild(img);
    } catch (e) {
      output.textContent = e.message;
    }
  });

  // 6) Reiniciar instancia
  document.getElementById('btn-restart').addEventListener('click', async () => {
    output.textContent = 'Reiniciando…';
    try {
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

  // 8) Auto‑conexión si ya había un Location ID guardado
  const saved = localStorage.getItem('locationId');
  if (saved) {
    locInput.value = saved;
    btnConnect.click();
  }
})();
