'use strict';
const App = (() => {
  /** Route-only scripts — keep Today cold path small (PulseCap MODULE_CHAIN pattern). */
  const RECOVERY_CHAIN = [
    './js/data/timelines.js',
    './js/data/timelines-hourly.js',
    './js/data/habit-links.js',
    './js/engines/bodyEngine.js',
    './js/engines/dopamineEngine.js',
    './js/engines/financeEngine.js',
    './js/engines/triggerEngine.js',
    './js/engines/linkedRecoveryEngine.js',
    './js/ui/charts.js',
    './js/modules/recovery.js',
  ];
  const MODULE_CHAIN = {
    recovery: RECOVERY_CHAIN,
    emergency: RECOVERY_CHAIN.concat(['./js/modules/emergency.js']),
    knowledge: ['./js/data/knowledge.js', './js/data/programs.js', './js/modules/knowledge.js'],
    profile: [
      './js/engines/bodyEngine.js',
      './js/engines/dopamineEngine.js',
      './js/engines/financeEngine.js',
      './js/engines/linkedRecoveryEngine.js',
      './js/data/habit-links.js',
      './js/modules/profile.js',
    ],
  };
  const _loadingScripts = {};

  function loadScript(src) {
    if (!src) return Promise.resolve();
    if (_loadingScripts[src]) return _loadingScripts[src];
    _loadingScripts[src] = new Promise(function (resolve, reject) {
      const existing = document.querySelector('script[data-sc-mod="' + src + '"]');
      if (existing) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.setAttribute('data-sc-mod', src);
      s.onload = function () {
        resolve();
      };
      s.onerror = function () {
        delete _loadingScripts[src];
        reject(new Error('Failed to load ' + src));
      };
      document.head.appendChild(s);
    });
    return _loadingScripts[src];
  }

  function loadScriptSync(src) {
    if (!src) return;
    if (document.querySelector('script[data-sc-mod="' + src + '"]')) {
      _loadingScripts[src] = _loadingScripts[src] || Promise.resolve();
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open('GET', src, false);
    xhr.send(null);
    if (xhr.status < 200 || xhr.status >= 300) throw new Error('Failed to load ' + src);
    const s = document.createElement('script');
    s.setAttribute('data-sc-mod', src);
    s.text = xhr.responseText;
    document.head.appendChild(s);
    _loadingScripts[src] = Promise.resolve();
  }

  function loadScriptChain(srcs) {
    return (srcs || []).reduce(function (p, src) {
      return p.then(function () {
        return loadScript(src);
      });
    }, Promise.resolve());
  }

  function loadScriptChainSync(srcs) {
    (srcs || []).forEach(loadScriptSync);
  }

  function loadModuleChain(id) {
    const chain = MODULE_CHAIN[id];
    if (!chain) return Promise.resolve();
    return loadScriptChain(chain);
  }

  function loadModuleChainSync(id) {
    const chain = MODULE_CHAIN[id];
    if (!chain) return;
    loadScriptChainSync(chain);
  }

  window.MODULE_CHAIN = MODULE_CHAIN;
  window.loadModuleChain = loadModuleChain;
  window.loadModuleChainSync = loadModuleChainSync;

  function hideSplash() {
    const splash = document.getElementById('splash');
    if (!splash || splash.classList.contains('hide')) {
      try {
        window.__APP_READY__ = true;
        document.documentElement.dataset.appReady = 'true';
      } catch (_) {}
      return;
    }
    splash.classList.add('hide');
    setTimeout(() => {
      splash.remove();
      try {
        window.__APP_READY__ = true;
        document.documentElement.dataset.appReady = 'true';
      } catch (_) {}
    }, 220);
  }

  function init() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js?v=56').catch(() => {});
      });
    }

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && State.get('onboardingComplete')) {
        const tab =
          window.Navigation && Navigation.readStoredTab
            ? Navigation.readStoredTab()
            : sessionStorage.getItem('steadycap_tab') || sessionStorage.getItem('dos_tab') || 'dashboard';
        if (tab === 'dashboard' && window.Dashboard) Dashboard.render();
      }
    });

    const demo = new URLSearchParams(location.search).get('demo') === '1';
    if (demo && window.SteadyDemo && SteadyDemo.seed) {
      State.useDemoStorage(true);
      sessionStorage.setItem('steadycap_demo_session', '1');
      /* false: reuse existing demo vault — avoids heavy reseed on every ?demo=1 (LH TBT). */
      SteadyDemo.seed({ force: false });
      if (typeof CapDemo !== 'undefined') {
        CapDemo.markActive();
      }
      launch();
      Navigation.go('dashboard');
      requestAnimationFrame(function () {
        requestAnimationFrame(hideSplash);
      });
      return;
    }
    State.useDemoStorage(sessionStorage.getItem('steadycap_demo_session') === '1');
    if (State.get('onboardingComplete')) {
      launch();
    } else {
      Onboarding.render();
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(hideSplash);
    });
  }

  function launch() {
    if (window.AppLock) AppLock.boot();
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

  return { launch, showToast, loadModuleChain, loadModuleChainSync };
})();
window.App = App;
