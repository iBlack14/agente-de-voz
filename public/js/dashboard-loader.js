(function () {
  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      document.body.appendChild(script);
    });

  const loadScriptWithFallback = async (sources) => {
    let lastError = null;
    for (const src of sources) {
      try {
        await loadScript(src);
        return src;
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error('No se pudo cargar ningún script.');
  };

  const fetchMarkupWithFallback = async (paths) => {
    let lastError = null;
    for (const path of paths) {
      try {
        const response = await fetch(path, { cache: 'no-store', credentials: 'same-origin' });
        if (!response.ok) throw new Error(`HTTP ${response.status} en ${path}`);
        return await response.text();
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error('No se pudo cargar ningún markup.');
  };

  const loadDashboard = async () => {
    const root = document.getElementById('advanced-root');
    if (!root) return;

    try {
      root.innerHTML = await fetchMarkupWithFallback([
        '/partials/dashboard-markup.html',
        'partials/dashboard-markup.html',
        '/public/partials/dashboard-markup.html'
      ]);
      await loadScriptWithFallback([
        '/app.js?v=21',
        'app.js?v=21',
        '/public/app.js?v=21'
      ]);
      await loadScriptWithFallback([
        '/js/profile-image-modal.js?v=21',
        'js/profile-image-modal.js?v=21',
        '/public/js/profile-image-modal.js?v=21'
      ]);
    } catch (error) {
      console.error('[DashboardLoader]', error);
      root.innerHTML = `
        <div class="min-h-screen flex items-center justify-center px-6">
          <div class="glass-card rounded-2xl p-8 max-w-lg w-full text-center">
            <h2 class="text-xl font-bold text-white mb-3">Error al cargar la interfaz</h2>
            <p class="text-zinc-400 text-sm">No se pudo cargar el dashboard. Recarga la pagina o revisa el servidor.</p>
          </div>
        </div>`;
    }
  };

  if (!document.getElementById('advanced-root')) return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDashboard);
  } else {
    loadDashboard();
  }
})();
