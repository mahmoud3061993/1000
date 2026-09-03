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
