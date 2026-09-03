/* global MLD, chrome */
(function () {
  if (window.__MLD_CONTENT__) return;
  window.__MLD_CONTENT__ = true;

  var WINNER_DAYS = MLD.WINNER_DAYS;
  var adsById = {};
  var notes = {};
  var labels = {};
  var winnersOnly = false;
  var busy = false;
  var COLORS = [
    { id: "red", title: "Winner" },
    { id: "green", title: "Tested" },
    { id: "blue", title: "Later" },
    { id: "gold", title: "Angle" },
    { id: "purple", title: "Offer" },
  ];

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

  function allAds() {
    return Object.keys(adsById).map(function (id) {
      return adsById[id];
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
      if (img.closest(".mld-toolbar, .mld-note, .mld-panel, .mld-modal")) return;
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

  function scrapeAdFromCard(root, libraryId) {
    var text = root.innerText || "";
    var start = MLD.parseStartDate(text);
    var nameNode = root.querySelector('a[href*="facebook.com/"]');
    var pageName = nameNode ? (nameNode.textContent || "").trim() : "";
    var media = scrapeMediaFromCard(root);
    return MLD.normalizeAd({
      ad_archive_id: libraryId,
      page_name: pageName,
      start_date: start ? Math.floor(start / 1000) : 0,
      snapshot: {
        page_name: pageName,
        body: { text: text.split("Library ID")[0].trim().slice(0, 2000) },
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

  function adText(ad) {
    var parts = [];
    if (ad.pageName) parts.push(ad.pageName);
    if (ad.body) parts.push(ad.body);
    if (ad.title) parts.push(ad.title);
    if (ad.cta) parts.push(ad.cta);
    if (ad.link) parts.push(ad.link);
    parts.push("Library ID: " + ad.id);
    return parts.join("\n\n");
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
    var color = labels[ad.id];
    COLORS.forEach(function (c) {
      root.classList.toggle("mld-label-" + c.id, color === c.id);
    });
  }

  function openNoteEditor(ad, anchor) {
    closeModal();
    var modal = el("div", "mld-modal");
    var box = el("div", "mld-modal-box");
    box.appendChild(el("h3", "", "Note · " + (ad.pageName || ad.id)));
    var area = document.createElement("textarea");
    area.className = "mld-textarea";
    area.placeholder = "Hook, offer, why this ad is running…";
    area.value = notes[ad.id] || "";
    box.appendChild(area);
    var actions = el("div", "mld-modal-actions");
    var save = el("button", "mld-btn mld-btn-primary", "Save note");
    save.addEventListener("click", function () {
      notes[ad.id] = area.value.trim();
      storageSet({ mldNotes: notes });
      if (anchor) anchor.classList.toggle("mld-has-note", Boolean(notes[ad.id]));
      closeModal();
      toast("Note saved");
    });
    var cancel = el("button", "mld-btn", "Close");
    cancel.addEventListener("click", closeModal);
    actions.appendChild(cancel);
    actions.appendChild(save);
    box.appendChild(actions);
    modal.appendChild(box);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
    });
    document.documentElement.appendChild(modal);
    area.focus();
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
    var dl = el("button", "mld-btn mld-btn-primary", "Download this advertiser");
    dl.addEventListener("click", function () {
      closeModal();
      bulkDownload(playbook.ads || []);
    });
    var csv = el("button", "mld-btn", "Export CSV");
    csv.addEventListener("click", function () {
      exportCsv(playbook.ads || [], MLD.sanitizeFilename(title) + "_ads.csv");
    });
    var close = el("button", "mld-btn", "Close");
    close.addEventListener("click", closeModal);
    actions.appendChild(close);
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

    var copy = el("button", "mld-chip", "Copy text");
    copy.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var text = adText(ad);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () {
            toast("Ad copy copied");
          },
          function () {
            toast("Could not copy", "err");
          }
        );
      } else {
        toast("Clipboard unavailable", "err");
      }
    });
    bar.appendChild(copy);

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

    var colors = el("div", "mld-colors");
    COLORS.forEach(function (color) {
      var dot = el("button", "mld-dot mld-dot-" + color.id);
      dot.type = "button";
      dot.title = color.title;
      if (labels[ad.id] === color.id) dot.classList.add("mld-dot-on");
      dot.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        labels[ad.id] = labels[ad.id] === color.id ? "" : color.id;
        storageSet({ mldLabels: labels });
        injectToolbar(root, ad);
        applyCardState(root, ad);
      });
      colors.appendChild(dot);
    });
    bar.appendChild(colors);

    var note = el("button", "mld-chip" + (notes[ad.id] ? " mld-has-note" : ""), notes[ad.id] ? "Note ✓" : "Note");
    note.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openNoteEditor(ad, note);
    });
    bar.appendChild(note);

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

  async function exportCsv(list, filename) {
    var ads = list && list.length ? list : allAds();
    if (!ads.length) {
      toast("Nothing to export yet", "err");
      return;
    }
    var result = await send({
      type: "mld-csv",
      csv: MLD.adsToCsv(ads),
      filename: filename || "ad-library-export.csv",
    });
    if (result.ok) toast("CSV saved to Downloads/MetaAdLibrary");
    else toast(result.error || "CSV export failed", "err");
  }

  function injectPanel() {
    if ($(".mld-panel")) return;
    var panel = el("div", "mld-panel");
    panel.innerHTML =
      '<div class="mld-panel-head">' +
      '<strong>Meta Library Downloader</strong>' +
      '<span class="mld-panel-stats">Scanning…</span>' +
      "</div>";
    var bulk = el("button", "mld-btn mld-btn-primary", "Bulk download all");
    bulk.addEventListener("click", function () {
      bulkDownload(allAds());
    });
    var spy = el("button", "mld-btn", "Spy on page");
    spy.addEventListener("click", function () {
      openSpyPicker(MLD.groupByAdvertiser(allAds()));
    });
    var csv = el("button", "mld-btn", "Export CSV");
    csv.addEventListener("click", function () {
      exportCsv(allAds());
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

  storageGet({ mldNotes: {}, mldLabels: {}, mldWinnersOnly: false }).then(function (stored) {
    notes = stored.mldNotes || {};
    labels = stored.mldLabels || {};
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
