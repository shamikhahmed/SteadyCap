'use strict';
const App = (() => {
  function hideSplash() {
    const splash = document.getElementById('splash');
    if (!splash || splash.classList.contains('hide')) return;
    splash.classList.add('hide');
    setTimeout(() => splash.remove(), 500);
  }

  function init() {
    setTimeout(hideSplash, 1400);
    const demo = new URLSearchParams(location.search).get('demo') === '1';
    if (demo && window.Profile && Profile.loadDemoData) {
      State.useDemoStorage(true);
      sessionStorage.setItem('steadycap_demo_session', '1');
      Profile.loadDemoData({ silent: true });
      if (typeof CapDemo !== 'undefined') {
        CapDemo.markActive();
        CapDemo.showBanner('steadycap', '<strong>Demo mode</strong> — Alex recovery profile in isolated storage.');
      }
      launch();
      Navigation.go('dashboard');
      return;
    }
    State.useDemoStorage(sessionStorage.getItem('steadycap_demo_session') === '1');
    if (State.get('onboardingComplete')) {
      launch();
    } else {
      Onboarding.render();
    }

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js?v=49').catch(() => {});
      });
    }

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && State.get('onboardingComplete')) {
        const tab = (window.Navigation && Navigation.readStoredTab) ? Navigation.readStoredTab() : (sessionStorage.getItem('steadycap_tab') || sessionStorage.getItem('dos_tab') || 'dashboard');
        if (tab === 'dashboard' && window.Dashboard) Dashboard.render();
      }
    });
  }

  function launch() {
    document.getElementById('nav').style.display = '';
    document.getElementById('screen-onboarding').classList.remove('active');
    Navigation.init();
    if (window.Notifications) Notifications.init();
  }

  function showToast(msg, type) {
    type = type || 'info';
    const wrap = document.getElementById('toast-wrap');
    if (!wrap) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    wrap.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  document.addEventListener('DOMContentLoaded', init);

  return { launch, showToast };
})();
window.App = App;
