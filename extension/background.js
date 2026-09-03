/* global MLD, chrome */
importScripts("shared.js");

var RECENT_KEY = "mldRecent";
var RECENT_LIMIT = 20;

function arrayBufferToBase64(buffer) {
  var bytes = new Uint8Array(buffer);
  var chunk = 0x8000;
  var parts = [];
  for (var i = 0; i < bytes.length; i += chunk) {
    parts.push(String.fromCharCode.apply(null, bytes.subarray(i, i + chunk)));
  }
  return btoa(parts.join(""));
}

function guessMime(filename, fallback) {
  var ext = String(filename || "")
    .split(".")
    .pop()
    .toLowerCase();
  if (ext === "mp4") return "video/mp4";
  if (ext === "webm") return "video/webm";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return fallback || "application/octet-stream";
}

async function rememberDownload(entry) {
  var stored = await chrome.storage.local.get({ mldRecent: [] });
  var recent = Array.isArray(stored[RECENT_KEY]) ? stored[RECENT_KEY] : [];
  recent.unshift({
    id: entry.id || "",
    advertiser: entry.advertiser || "Unknown page",
    filename: entry.filename || "",
    kind: entry.kind || "file",
    at: Date.now(),
  });
  if (recent.length > RECENT_LIMIT) recent = recent.slice(0, RECENT_LIMIT);
  await chrome.storage.local.set({ mldRecent: recent });
}

async function downloadUrl(url, filename) {
  var path = "MetaAdLibrary/" + filename;
  try {
    var res = await fetch(url, { credentials: "omit", cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    var buf = await res.arrayBuffer();
    if (!buf || !buf.byteLength) throw new Error("empty file");
    if (buf.byteLength < 12 * 1024 * 1024) {
      var b64 = arrayBufferToBase64(buf);
      var mime = guessMime(filename, res.headers.get("content-type"));
      var dataUrl = "data:" + mime + ";base64," + b64;
      return await chrome.downloads.download({
        url: dataUrl,
        filename: path,
        saveAs: false,
        conflictAction: "uniquify",
      });
    }
  } catch (e) {
    /* fall through to a direct Chrome download */
  }
  return await chrome.downloads.download({
    url: url,
    filename: path,
    saveAs: false,
    conflictAction: "uniquify",
  });
}

async function downloadMedia(message) {
  var url = message.url;
  var filename = MLD.sanitizeFilename(message.filename || "ad.bin");
  if (!url) return { ok: false, error: "No media URL" };
  if (MLD.isStreamUrl(url)) {
    return { ok: false, error: "This ad only exposed an .m3u8 stream, not a clean MP4." };
  }
  var downloadId = await downloadUrl(url, filename);
  await rememberDownload({
    id: message.adId,
    advertiser: message.advertiser,
    filename: filename,
    kind: message.kind || "file",
  });
  return { ok: true, downloadId: downloadId, filename: filename };
}

async function downloadCsv(message) {
  var csv = message.csv || MLD.adsToCsv(message.ads || []);
  var filename = message.filename || "ad-library-export.csv";
  var dataUrl = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  var downloadId = await chrome.downloads.download({
    url: dataUrl,
    filename: "MetaAdLibrary/" + filename,
    saveAs: false,
    conflictAction: "uniquify",
  });
  return { ok: true, downloadId: downloadId };
}

var WATCH_KEY = "mldWatches";
var WATCH_ID_LIMIT = 250;

async function getWatches() {
  var stored = await chrome.storage.local.get({ mldWatches: [] });
  return Array.isArray(stored[WATCH_KEY]) ? stored[WATCH_KEY] : [];
}

async function saveWatches(watches) {
  await chrome.storage.local.set({ mldWatches: watches });
  return watches;
}

function watchKey(watch) {
  return String((watch && (watch.pageId || watch.pageName || watch.seedAdId || watch.input)) || "");
}

function matchesWatch(watch, ad) {
  if (!watch || !ad) return false;
  if (watch.pageId && ad.pageId && String(watch.pageId) === String(ad.pageId)) return true;
  if (watch.pageName && ad.pageName && String(watch.pageName).toLowerCase() === String(ad.pageName).toLowerCase()) {
    return true;
  }
  return false;
}

async function notifyNewAd(watch, ad) {
  if (!chrome.notifications || !ad || !ad.id) return;
  var name = (watch && watch.pageName) || ad.pageName || "Advertiser";
  var preview = MLD.cleanCopy(ad.body || ad.title || "A new ad started running").slice(0, 180);
  try {
    await chrome.notifications.create("mld-ad-" + ad.id, {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "New ad · " + name,
      message: preview || "A new ad started running",
      priority: 2,
    });
  } catch (e) {
    /* notifications permission may be blocked */
  }
}

function mergeSeenIds(watch, ids, adsById, notify) {
  var prev = {};
  var old = watch.lastSeenIds || [];
  var i;
  for (i = 0; i < old.length; i++) prev[old[i]] = true;
  var firstRun = old.length === 0;
  var next = old.slice();
  var fresh = [];
  for (i = 0; i < ids.length; i++) {
    var id = String(ids[i] || "");
    if (!id) continue;
    if (!prev[id]) {
      if (!firstRun) fresh.push(id);
      prev[id] = true;
      next.push(id);
    }
  }
  if (next.length > WATCH_ID_LIMIT) next = next.slice(-WATCH_ID_LIMIT);
  watch.lastSeenIds = next;
  watch.lastChecked = Date.now();
  if (notify && !firstRun) {
    for (i = 0; i < fresh.length; i++) {
      var ad = (adsById && adsById[fresh[i]]) || { id: fresh[i], pageName: watch.pageName };
      notifyNewAd(watch, ad);
    }
  }
  return fresh;
}

async function addWatch(message) {
  var parsed = MLD.parseWatchInput(message.input || message.pageId || message.pageName || "");
  if (!parsed) return { ok: false, error: "Add a Page ID or Ad Library link" };
  if (message.pageId) parsed.pageId = message.pageId;
  if (message.pageName) parsed.pageName = message.pageName;
  if (!parsed.pageId && !parsed.pageName && !parsed.seedAdId) {
    return { ok: false, error: "Could not read that advertiser" };
  }
  var watches = await getWatches();
  var key = watchKey(parsed);
  var existing = null;
  for (var i = 0; i < watches.length; i++) {
    if (watchKey(watches[i]) === key) existing = watches[i];
  }
  if (!existing) {
    existing = {
      pageId: parsed.pageId || "",
      pageName: parsed.pageName || "",
      seedAdId: parsed.seedAdId || "",
      input: parsed.input || "",
      lastSeenIds: [],
      lastChecked: 0,
      addedAt: Date.now(),
    };
    watches.push(existing);
  } else {
    if (parsed.pageId) existing.pageId = parsed.pageId;
    if (parsed.pageName) existing.pageName = parsed.pageName;
  }
  await saveWatches(watches);
  await checkOneWatch(existing, false);
  await saveWatches(watches);
  return { ok: true, watches: watches };
}

async function removeWatch(pageId, pageName) {
  var watches = await getWatches();
  watches = watches.filter(function (watch) {
    if (pageId && watch.pageId === pageId) return false;
    if (!pageId && pageName && watch.pageName === pageName) return false;
    return true;
  });
  await saveWatches(watches);
  return { ok: true, watches: watches };
}

async function checkOneWatch(watch, notify) {
  var url = MLD.pageAdsUrl(watch.pageId, watch.pageName);
  if (!watch.pageId && watch.seedAdId) url = MLD.libraryUrl(watch.seedAdId);
  try {
    var res = await fetch(url, { credentials: "include", cache: "no-store" });
    var html = await res.text();
    var ids = MLD.extractAdIdsFromHtml(html);
    var pageId = MLD.extractPageIdFromHtml(html);
    var pageName = MLD.extractPageNameFromHtml(html);
    if (pageId && !watch.pageId) watch.pageId = pageId;
    if (pageName && !watch.pageName) watch.pageName = pageName;
    mergeSeenIds(watch, ids, null, notify);
    watch.lastError = "";
  } catch (error) {
    watch.lastError = String(error && error.message ? error.message : error);
    watch.lastChecked = Date.now();
  }
  return watch;
}

async function checkAllWatches(notify) {
  var watches = await getWatches();
  for (var i = 0; i < watches.length; i++) {
    await checkOneWatch(watches[i], notify !== false);
  }
  await saveWatches(watches);
  return { ok: true, watches: watches };
}

async function ingestSeenAds(ads) {
  var list = ads || [];
  if (!list.length) return { ok: true };
  var watches = await getWatches();
  if (!watches.length) return { ok: true };
  var changed = false;
  for (var w = 0; w < watches.length; w++) {
    var watch = watches[w];
    var ids = [];
    var byId = {};
    for (var i = 0; i < list.length; i++) {
      var ad = list[i];
      if (!matchesWatch(watch, ad) || !ad.id) continue;
      ids.push(String(ad.id));
      byId[ad.id] = ad;
      if (ad.pageName && !watch.pageName) watch.pageName = ad.pageName;
      if (ad.pageId && !watch.pageId) watch.pageId = ad.pageId;
    }
    if (ids.length) {
      mergeSeenIds(watch, ids, byId, true);
      changed = true;
    }
  }
  if (changed) await saveWatches(watches);
  return { ok: true };
}

function ensureWatchAlarm() {
  chrome.alarms.create("mld-watch", { periodInMinutes: 15 });
}

chrome.runtime.onInstalled.addListener(ensureWatchAlarm);
chrome.runtime.onStartup.addListener(ensureWatchAlarm);
ensureWatchAlarm();

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm && alarm.name === "mld-watch") checkAllWatches(true);
});

if (chrome.notifications && chrome.notifications.onClicked) {
  chrome.notifications.onClicked.addListener(function (id) {
    var adId = String(id || "").replace(/^mld-ad-/, "");
    if (adId) chrome.tabs.create({ url: MLD.libraryUrl(adId) });
  });
}

chrome.runtime.onMessage.addListener(function (message, _sender, sendResponse) {
  if (!message || !message.type) return;
  var task;
  if (message.type === "mld-download") task = downloadMedia(message);
  else if (message.type === "mld-csv") task = downloadCsv(message);
  else if (message.type === "mld-recent") {
    chrome.storage.local.get({ mldRecent: [] }).then(function (stored) {
      sendResponse({ ok: true, recent: stored.mldRecent || [] });
    });
    return true;
  } else if (message.type === "mld-watch-add") task = addWatch(message);
  else if (message.type === "mld-watch-remove") task = removeWatch(message.pageId, message.pageName);
  else if (message.type === "mld-watch-list") task = getWatches().then(function (watches) {
    return { ok: true, watches: watches };
  });
  else if (message.type === "mld-watch-check") task = checkAllWatches(true);
  else if (message.type === "mld-seen-ads") {
    ingestSeenAds(message.ads || []).then(function (result) {
      sendResponse(result);
    });
    return true;
  } else {
    return;
  }
  task
    .then(function (result) {
      sendResponse(result);
    })
    .catch(function (error) {
      sendResponse({ ok: false, error: String(error && error.message ? error.message : error) });
    });
  return true;
});
