// content.js - Obtiene token para Discord Onboarding Exporter
(function() {
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'getToken') {
      try {
        const t = localStorage.getItem('token');
        if (t) { sendResponse({ token: t.replace(/"/g, '') }); return true; }
      } catch(e) {}
      sendResponse({ token: null });
      return true;
    }
  });
})();
