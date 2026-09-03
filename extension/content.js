/* global MLD, chrome */
(function () {
  if (window.__MLD_CONTENT__) return;
  window.__MLD_CONTENT__ = true;

  var adsById = {};
  var winnersOnly = false;
  var busy = false;

  function runtime() {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) return chrome;
    return window.__MLD_CHROME__ || null;
  }

  function send(message) {
    return new Promise(function (resolve) {
      var api = runtime();
      if (!api || !api.runtime || !api.runtime.sendMessage) {
        resolve({ ok: false, error: "Extension runtime unavailable" });
        return;
      }
      try {
        api.runtime.sendMessage(message, function (response) {
          if (chrome && chrome.runtime && chrome.runtime.lastError) {
            resolve({ ok: false, error: chrome.runtime.lastError.message });
            return;
          }
          resolve(response || { ok: false, error: "No response" });
        });
      } catch (e) {
        resolve({ ok: false, error: String(e.message || e) });
      }
    });
  }

  function storageGet(defaults) {
    return new Promise(function (resolve) {
      var api = runtime();
      if (!api || !api.storage) {
        resolve(defaults);
        return;
      }
      api.storage.local.get(defaults, function (value) {
        resolve(value || defaults);
      });
    });
  }

  function storageSet(patch) {
    var api = runtime();
    if (!api || !api.storage) return;
    api.storage.local.set(patch);
  }

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function toast(message, kind) {
    var host = $(".mld-toast");
    if (!host) {
      host = el("div", "mld-toast");
      document.documentElement.appendChild(host);
    }
    host.textContent = message;
    host.dataset.kind = kind || "ok";
    host.classList.add("mld-show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      host.classList.remove("mld-show");
    }, 2800);
  }

  function copyText(text, okMessage) {
    if (!text) {
      toast("Nothing to copy yet", "err");
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          toast(okMessage || "Copied");
        },
        function () {
          toast("Could not copy", "err");
        }
      );
      return;
    }
    toast("Clipboard unavailable", "err");
  }

  function allAds() {
    return Object.keys(adsById).map(function (id) {
      return adsById[id];
    });
  }

  function visibleAds() {
    var ads = allAds();
    if (!winnersOnly) return ads;
    return ads.filter(function (ad) {
      return ad.isWinner;
    });
  }

  function rememberAd(ad) {
    if (!ad || !ad.id) return;
    adsById[ad.id] = MLD.mergeAd(adsById[ad.id], ad);
  }

  function scrapeMediaFromCard(root) {
    var media = [];
    if (!root) return media;
    root.querySelectorAll("img").forEach(function (img) {
      if (img.closest(".mld-toolbar, .mld-panel, .mld-modal")) return;
      var w = img.naturalWidth || img.width || 0;
      var h = img.naturalHeight || img.height || 0;
      if (w && h && (w < 80 || h < 80)) return;
      var url = img.currentSrc || img.src;
      if (url && url.indexOf("data:") !== 0) media.push({ kind: "image", url: url });
    });
    root.querySelectorAll("video, video source").forEach(function (node) {
      if (node.closest(".mld-toolbar, .mld-panel, .mld-modal")) return;
      var url = node.currentSrc || node.src;
      if (url) media.push({ kind: "video", url: url });
    });
    return media;
  }

  function scrapeOfferLink(root) {
    if (!root) return "";
    var found = "";
    root.querySelectorAll("a[href]").forEach(function (anchor) {
      if (found || anchor.closest(".mld-toolbar, .mld-panel, .mld-modal")) return;
      var href = MLD.unwrapFacebookLink(anchor.href);
      if (href) found = href;
    });
    return found;
  }

  function cardInnerText(root) {
    if (!root) return "";
    var clone = root.cloneNode(true);
    clone.querySelectorAll(".mld-toolbar, .mld-panel, .mld-modal, .mld-toast").forEach(function (node) {
      node.remove();
    });
    return clone.innerText || "";
  }

  function scrapeBodyFromDom(root) {
    if (!root) return "";
    var sponsored = null;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (/^\s*sponsored\s*$/i.test(walker.currentNode.nodeValue || "")) {
        sponsored = walker.currentNode;
        break;
      }
    }
    if (!sponsored) return "";
    var container = sponsored.parentElement;
    while (container && container !== root) {
      var next = container.nextElementSibling;
      if (next) {
        var text = MLD.cleanCopy(next.innerText || "");
        if (text && text.length > 10 && MLD.isUsableCopy(text.split("\n")[0])) {
          return text;
        }
      }
      container = container.parentElement;
    }
    return "";
  }

  function scrapeCta(root) {
    if (!root) return "";
    var buttons = root.querySelectorAll('a[role="button"], div[role="button"], a[data-lynx-mode]');
    for (var i = 0; i < buttons.length; i++) {
      var txt = MLD.cleanCopy(buttons[i].textContent || "");
      if (txt && MLD.humanizeCta(txt)) return MLD.humanizeCta(txt);
    }
    return "";
  }

  function scrapeHeadline(root) {
    if (!root) return "";
    var links = root.querySelectorAll("a[href]");
    for (var i = 0; i < links.length; i++) {
      var href = links[i].href || "";
      if (!/facebook\.com|fbcdn\.net|instagram\.com/i.test(href) || /l\.php|flx\/warn/i.test(href)) {
        var span = links[i].querySelector("span");
        if (span) {
          var text = MLD.cleanCopy(span.textContent || "");
          if (text && text.length >= 3 && text.length <= 120) return text;
        }
      }
    }
    return "";
  }

  function scrapeAdFromCard(root, libraryId) {
    var fullText = cardInnerText(root);
    var start = MLD.parseStartDate(fullText);
    var nameNode = root.querySelector('a[href*="facebook.com/"]');
    var pageName = nameNode ? (nameNode.textContent || "").trim() : "";

    var domBody = scrapeBodyFromDom(root);
    var domCta = scrapeCta(root);
    var domHeadline = scrapeHeadline(root);

    var copy = MLD.parseCardCopy(fullText, pageName);
    var body = MLD.isUsableCopy(domBody) ? domBody : copy.body;
    var cta = domCta || copy.cta;
    var title = domHeadline || copy.title;
    var media = scrapeMediaFromCard(root);
    var link = scrapeOfferLink(root);
    return MLD.normalizeAd({
      ad_archive_id: libraryId,
      page_name: pageName,
      start_date: start ? Math.floor(start / 1000) : 0,
      is_active: copy.status !== "Inactive",
      snapshot: {
        page_name: pageName,
        body: { text: body },
        title: title,
        cta_text: cta,
        link_url: link,
        link_description: copy.description || "",
        images: media
          .filter(function (m) {
            return m.kind === "image";
          })
          .map(function (m) {
            return { original_image_url: m.url };
          }),
        videos: media
          .filter(function (m) {
            return m.kind === "video";
          })
          .map(function (m) {
            return { video_hd_url: m.url };
          }),
      },
    });
  }

  function cardRootFromTextNode(textNode) {
    var node = textNode.parentElement;
    var best = null;
    while (node && node !== document.body) {
      var text = node.innerText || "";
      if (/Library ID:\s*\d+/i.test(text)) {
        var ids = text.match(/Library ID:\s*\d+/gi) || [];
        if (ids.length === 1) best = node;
        if (ids.length > 1 && best) break;
      }
      node = node.parentElement;
    }
    return best;
  }

  function findCards() {
    var found = [];
    if (!document.body) return found;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var seen = {};
    while (walker.nextNode()) {
      var value = walker.currentNode.nodeValue || "";
      var id = MLD.parseLibraryId(value);
      if (!id || seen[id]) continue;
      var root = cardRootFromTextNode(walker.currentNode);
      if (!root) continue;
      seen[id] = true;
      found.push({ id: id, root: root });
    }
    return found;
  }

  function downloadableMedia(ad) {
    return (ad.media || []).filter(function (item) {
      return item.url && !MLD.isStreamUrl(item.url);
    });
  }

  async function downloadAd(ad) {
    var media = downloadableMedia(ad);
    if (!media.length) return { ok: false, error: "No downloadable image or MP4 found" };
    var last = { ok: false };
    for (var i = 0; i < media.length; i++) {
      last = await send({
        type: "mld-download",
        url: media[i].url,
        filename: MLD.filenameFor(ad, media[i], i),
        advertiser: ad.pageName,
        adId: ad.id,
        kind: media[i].kind,
      });
      if (!last.ok) return last;
    }
    return { ok: true, count: media.length };
  }

  function applyCardState(root, ad) {
    root.classList.toggle("mld-winner", Boolean(ad.isWinner));
    root.classList.toggle("mld-dim", winnersOnly && !ad.isWinner);
  }

  function openOffer(ad) {
    if (ad.link) {
      window.open(ad.link, "_blank", "noopener");
      return;
    }
    toast("No landing page found on this ad", "err");
  }

  function openSpy(playbook) {
    closeModal();
    var modal = el("div", "mld-modal");
    var box = el("div", "mld-modal-box mld-spy-box");
    var title = playbook.pageName || "Advertiser";
    box.appendChild(el("h3", "", "Spy on page · " + title));
    var stats = el("div", "mld-spy-grid");
    [
      ["Ads on screen", String(playbook.adCount)],
      ["Avg runtime", playbook.avgRuntime + " days"],
      ["30+ day winners", String(playbook.winners)],
      ["Video / image", playbook.video + " / " + playbook.image + (playbook.mixed ? " (+" + playbook.mixed + " mixed)" : "")],
    ].forEach(function (row) {
      var cell = el("div", "mld-spy-cell");
      cell.appendChild(el("small", "", row[0]));
      cell.appendChild(el("strong", "", row[1]));
      stats.appendChild(cell);
    });
    box.appendChild(stats);
    if (playbook.topCreative) {
      var top = el("div", "mld-spy-top");
      top.appendChild(el("small", "", "Top creative (longest running)"));
      top.appendChild(
        el(
          "p",
          "",
          (playbook.topCreative.days || 0) +
            " days · Library ID " +
            playbook.topCreative.id +
            (playbook.topCreative.title ? " · " + playbook.topCreative.title : "")
        )
      );
      if (playbook.topCreative.body) {
        top.appendChild(el("p", "mld-spy-copy", playbook.topCreative.body.slice(0, 280)));
      }
      box.appendChild(top);
    }
    var actions = el("div", "mld-modal-actions");
    var pageAds = el("button", "mld-btn", "All ads from this page");
    pageAds.addEventListener("click", function () {
      window.open(MLD.pageAdsUrl(playbook.pageId, playbook.pageName), "_blank", "noopener");
    });
    var dl = el("button", "mld-btn mld-btn-primary", "Download this advertiser");
    dl.addEventListener("click", function () {
      closeModal();
      bulkDownload(playbook.ads || []);
    });
    var csv = el("button", "mld-btn", "Export to Google Sheets");
    csv.addEventListener("click", function () {
      openGoogleSheetsImport(playbook.ads || []);
    });
    var close = el("button", "mld-btn", "Close");
    close.addEventListener("click", closeModal);
    actions.appendChild(close);
    actions.appendChild(pageAds);
    actions.appendChild(csv);
    actions.appendChild(dl);
    box.appendChild(actions);
    modal.appendChild(box);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
    });
    document.documentElement.appendChild(modal);
  }

  function openSpyPicker(groups) {
    if (!groups.length) {
      toast("No advertisers found on this page yet", "err");
      return;
    }
    if (groups.length === 1) {
      openSpy(groups[0]);
      return;
    }
    closeModal();
    var modal = el("div", "mld-modal");
    var box = el("div", "mld-modal-box mld-spy-box");
    box.appendChild(el("h3", "", "Spy on page"));
    box.appendChild(el("p", "mld-muted", "Pick an advertiser from the ads currently on screen."));
    groups.forEach(function (group) {
      var row = el("button", "mld-spy-row");
      row.type = "button";
      row.appendChild(el("strong", "", group.pageName));
      row.appendChild(
        el("span", "", group.adCount + " ads · " + group.winners + " winners · avg " + group.avgRuntime + "d")
      );
      row.addEventListener("click", function () {
        openSpy(group);
      });
      box.appendChild(row);
    });
    var close = el("button", "mld-btn", "Close");
    close.addEventListener("click", closeModal);
    box.appendChild(el("div", "mld-modal-actions")).appendChild(close);
    modal.appendChild(box);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
    });
    document.documentElement.appendChild(modal);
  }

  function closeModal() {
    document.querySelectorAll(".mld-modal").forEach(function (node) {
      node.remove();
    });
  }

  function injectToolbar(root, ad) {
    var existing = root.querySelector(":scope > .mld-toolbar");
    if (existing) existing.remove();
    var bar = el("div", "mld-toolbar");
    bar.setAttribute("data-mld-id", ad.id);

    if (ad.isWinner) {
      var crown = el("span", "mld-crown", "👑 " + ad.days + "d");
      crown.title = "Running " + ad.days + " days — likely a winner";
      bar.appendChild(crown);
    } else if (ad.days) {
      bar.appendChild(el("span", "mld-days", ad.days + "d"));
    }

    var dl = el("button", "mld-chip mld-chip-primary", "Download");
    dl.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      downloadAd(ad).then(function (result) {
        if (result.ok) toast("Saved " + result.count + " file" + (result.count > 1 ? "s" : ""));
        else toast(result.error || "Download failed", "err");
      });
    });
    bar.appendChild(dl);

    var offer = el("button", "mld-chip", "Offer");
    offer.title = ad.link || "Open the landing page";
    offer.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openOffer(ad);
    });
    bar.appendChild(offer);

    var spy = el("button", "mld-chip", "Spy");
    spy.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var ads = allAds().filter(function (item) {
        return (ad.pageId && item.pageId === ad.pageId) || item.pageName === ad.pageName;
      });
      openSpy(MLD.advertiserPlaybook(ads.length ? ads : [ad]));
    });
    bar.appendChild(spy);

    root.insertBefore(bar, root.firstChild);
    applyCardState(root, ad);
  }

  function updatePanelStats() {
    var panel = $(".mld-panel");
    if (!panel) return;
    var ads = allAds();
    var winners = ads.filter(function (ad) {
      return ad.isWinner;
    }).length;
    var stats = panel.querySelector(".mld-panel-stats");
    if (stats) stats.textContent = ads.length + " ads · " + winners + " winners";
  }

  function setProgress(current, total) {
    var node = $(".mld-progress");
    if (!node) return;
    if (!total) {
      node.hidden = true;
      return;
    }
    node.hidden = false;
    node.textContent = "⬇ " + current + "/" + total + " downloaded";
  }

  async function bulkDownload(list) {
    if (busy) {
      toast("A download is already running");
      return;
    }
    var ads = (list || []).filter(function (ad) {
      return downloadableMedia(ad).length;
    });
    if (!ads.length) {
      toast("No downloadable ads on screen yet", "err");
      return;
    }
    busy = true;
    setProgress(0, ads.length);
    var ok = 0;
    for (var i = 0; i < ads.length; i++) {
      var result = await downloadAd(ads[i]);
      if (result.ok) ok += 1;
      setProgress(i + 1, ads.length);
    }
    busy = false;
    toast("Downloaded " + ok + "/" + ads.length + " ads");
    setTimeout(function () {
      setProgress(0, 0);
    }, 1800);
  }

  function exportToGoogleSheets(list) {
    var ads = list && list.length ? list : visibleAds();
    if (!ads.length) {
      toast("Nothing to export yet", "err");
      return;
    }
    var csv = MLD.adsToCsv(ads);
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var reader = new FileReader();
    reader.onload = function () {
      var base64 = reader.result.split(",")[1];
      var gUrl =
        "https://docs.google.com/spreadsheets/d/create?title=" +
        encodeURIComponent("Ad Library Export " + new Date().toISOString().slice(0, 10));
      window.open(gUrl, "_blank", "noopener");
      setTimeout(function () {
        send({
          type: "mld-csv",
          csv: csv,
          filename: "ad-library-export.csv",
        });
      }, 200);
      toast("Google Sheet opened + CSV saved");
    };
    reader.readAsDataURL(blob);
  }

  function openGoogleSheetsImport(list) {
    var ads = list && list.length ? list : visibleAds();
    if (!ads.length) {
      toast("Nothing to export yet", "err");
      return;
    }
    var csv = MLD.adsToCsv(ads);
    var csvBlob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var csvUrl = URL.createObjectURL(csvBlob);
    var a = document.createElement("a");
    a.href = csvUrl;
    a.download = "ad-library-export.csv";
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(csvUrl);
    }, 1000);
    setTimeout(function () {
      window.open(
        "https://sheets.google.com/create",
        "_blank",
        "noopener"
      );
      toast("CSV downloaded — import it in the Google Sheet that just opened (File → Import)");
    }, 400);
  }

  function injectPanel() {
    if ($(".mld-panel")) return;
    var panel = el("div", "mld-panel");
    panel.innerHTML =
      '<div class="mld-panel-head">' +
      "<strong>Meta Library Downloader</strong>" +
      '<span class="mld-panel-stats">Scanning…</span>' +
      "</div>";
    var bulk = el("button", "mld-btn mld-btn-primary", "Bulk download all");
    bulk.addEventListener("click", function () {
      bulkDownload(visibleAds());
    });
    var spy = el("button", "mld-btn", "Spy on page");
    spy.addEventListener("click", function () {
      openSpyPicker(MLD.groupByAdvertiser(allAds()));
    });
    var csv = el("button", "mld-btn", "Export to Google Sheets");
    csv.addEventListener("click", function () {
      openGoogleSheetsImport(visibleAds());
    });
    var filter = el("label", "mld-filter");
    var box = document.createElement("input");
    box.type = "checkbox";
    box.addEventListener("change", function () {
      winnersOnly = box.checked;
      storageSet({ mldWinnersOnly: winnersOnly });
      scan();
    });
    filter.appendChild(box);
    filter.appendChild(document.createTextNode(" 30+ day winners only"));
    var progress = el("div", "mld-progress");
    progress.id = "mld-progress";
    progress.hidden = true;
    panel.appendChild(bulk);
    panel.appendChild(spy);
    panel.appendChild(csv);
    panel.appendChild(filter);
    panel.appendChild(progress);
    document.documentElement.appendChild(panel);
  }

  function scan() {
    var cards = findCards();
    cards.forEach(function (card) {
      var scraped = scrapeAdFromCard(card.root, card.id);
      rememberAd(scraped);
      var ad = adsById[card.id];
      if (ad) injectToolbar(card.root, ad);
    });
    updatePanelStats();
  }

  window.addEventListener("message", function (event) {
    if (event.source !== window) return;
    if (!event.data || event.data.source !== "mld-interceptor") return;
    var ads = event.data.ads || [];
    ads.forEach(rememberAd);
    scan();
  });

  storageGet({ mldWinnersOnly: false }).then(function (stored) {
    winnersOnly = Boolean(stored.mldWinnersOnly);
    injectPanel();
    var box = document.querySelector(".mld-filter input");
    if (box) box.checked = winnersOnly;
    scan();
  });

  var scheduled = null;
  function scheduleScan() {
    if (scheduled) return;
    scheduled = setTimeout(function () {
      scheduled = null;
      scan();
    }, 250);
  }

  var observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setInterval(scan, 2000);
})();
