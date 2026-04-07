(function () {
  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      document.body.appendChild(script);
    });

  const loadDashboard = async () => {
    const root = document.getElementById('dashboard-root');

    if (!root) {
      return;
    }

    try {
      const response = await fetch('/partials/dashboard-markup.html', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      root.innerHTML = await response.text();

      await loadScript('/app.js?v=6');
      await loadScript('/js/profile-image-modal.js?v=1');
    } catch (error) {
      console.error('[DashboardLoader]', error);
      root.innerHTML = `
        <div class="min-h-screen flex items-center justify-center px-6">
          <div class="glass-card rounded-2xl p-8 max-w-lg w-full text-center">
            <h2 class="text-xl font-bold text-white mb-3">Error al cargar la interfaz</h2>
            <p class="text-zinc-400 text-sm">No se pudo cargar el dashboard. Recarga la pagina o revisa el servidor.</p>
          </div>
        </div>
      `;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDashboard);
  } else {
    loadDashboard();
  }
})();
