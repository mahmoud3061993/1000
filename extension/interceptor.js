(function () {
  if (window.__MLD_INTERCEPTOR__) return;
  window.__MLD_INTERCEPTOR__ = true;

  function emitAds(ads) {
    if (!ads || !ads.length) return;
    try {
      window.postMessage({ source: "mld-interceptor", ads: ads }, "*");
    } catch (e) {
      /* page may be closing */
    }
  }

  function scan(payload) {
    try {
      var ads = MLD.adsFromPayload(payload);
      emitAds(ads);
    } catch (e) {
      /* ignore malformed payloads */
    }
  }

  function fromText(text) {
    if (!text || text.length < 20) return;
    if (text.indexOf("ad_archive") === -1 && text.indexOf("adArchive") === -1) return;
    scan(text);
  }

  var origFetch = window.fetch;
  if (typeof origFetch === "function") {
    window.fetch = function () {
      var args = arguments;
      return origFetch.apply(this, args).then(function (res) {
        try {
          var clone = res.clone();
          clone.text().then(fromText).catch(function () {});
        } catch (e) {}
        return res;
      });
    };
  }

  var origOpen = XMLHttpRequest.prototype.open;
  var origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__mldUrl = url;
    return origOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    this.addEventListener("load", function () {
      try {
        fromText(this.responseText);
      } catch (e) {}
    });
    return origSend.apply(this, arguments);
  };
})();
