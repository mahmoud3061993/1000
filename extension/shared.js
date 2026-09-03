/**
 * Shared helpers for Meta Library Downloader.
 * Loaded by the service worker (importScripts) and content scripts.
 */
var MLD = (function () {
  var WINNER_DAYS = 30;

  function parseMaybeJson(text) {
    if (!text || typeof text !== "string") return null;
    var s = text.trim();
    if (s.indexOf("for (;;);") === 0) s = s.slice(9);
    else if (s.indexOf("for(;;);") === 0) s = s.slice(8);
    var brace = s.indexOf("{");
    var bracket = s.indexOf("[");
    if (brace === -1 && bracket === -1) return null;
    var start =
      brace === -1 ? bracket : bracket === -1 ? brace : Math.min(brace, bracket);
    try {
      return JSON.parse(s.slice(start));
    } catch (e) {
      return null;
    }
  }

  function first() {
    for (var i = 0; i < arguments.length; i++) {
      var value = arguments[i];
      if (value === 0) return 0;
      if (value !== undefined && value !== null && value !== "") return value;
    }
    return "";
  }

  function pickVideoUrl(obj) {
    if (!obj || typeof obj !== "object") return "";
    var candidates = [
      obj.video_hd_url,
      obj.videoHdUrl,
      obj.video_sd_url,
      obj.videoSdUrl,
      obj.video_url,
      obj.videoUrl,
      obj.url,
    ];
    var i;
    for (i = 0; i < candidates.length; i++) {
      if (candidates[i] && !/\.m3u8(\?|$)/i.test(candidates[i])) return candidates[i];
    }
    for (i = 0; i < candidates.length; i++) {
      if (candidates[i]) return candidates[i];
    }
    return "";
  }

  function addMedia(list, kind, url, extra) {
    if (!url || typeof url !== "string") return;
    if (url.indexOf("data:") === 0) return;
    for (var i = 0; i < list.length; i++) {
      if (list[i].url === url) return;
    }
    var item = { kind: kind, url: url };
    if (extra) {
      for (var key in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, key) && extra[key] != null) {
          item[key] = extra[key];
        }
      }
    }
    list.push(item);
  }

  function collectMedia(snapshot) {
    var media = [];
    if (!snapshot || typeof snapshot !== "object") return media;
    var images = snapshot.images || [];
    var i;
    for (i = 0; i < images.length; i++) {
      var img = images[i] || {};
      addMedia(media, "image", first(img.original_image_url, img.resized_image_url, img.url));
    }
    var videos = snapshot.videos || [];
    for (i = 0; i < videos.length; i++) {
      var vid = videos[i] || {};
      addMedia(media, "video", pickVideoUrl(vid), {
        sd: vid.video_sd_url || "",
        hd: vid.video_hd_url || "",
        preview: vid.video_preview_image_url || "",
      });
    }
    addMedia(
      media,
      "image",
      first(snapshot.original_image_url, snapshot.resized_image_url, snapshot.image_url)
    );
    addMedia(media, "video", pickVideoUrl(snapshot), {
      sd: snapshot.video_sd_url || "",
      hd: snapshot.video_hd_url || "",
    });
    var cards = snapshot.cards || [];
    for (i = 0; i < cards.length; i++) {
      var card = cards[i] || {};
      var n = i + 1;
      addMedia(media, "image", first(card.original_image_url, card.resized_image_url, card.image_url), {
        card: n,
      });
      addMedia(media, "video", pickVideoUrl(card), { card: n });
    }
    return media;
  }

  function toMs(ts) {
    if (!ts && ts !== 0) return 0;
    var n = Number(ts);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return n < 1e12 ? n * 1000 : n;
  }

  function daysRunning(start, end) {
    var s = toMs(start);
    if (!s) return 0;
    var e = toMs(end) || Date.now();
    return Math.max(0, Math.floor((e - s) / 86400000));
  }

  function startDateIso(start) {
    var ms = toMs(start);
    if (!ms) return "";
    try {
      return new Date(ms).toISOString().slice(0, 10);
    } catch (e) {
      return "";
    }
  }

  function asList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String);
    return [String(value)];
  }

  function bodyText(snapshot) {
    if (!snapshot) return "";
    var body = snapshot.body;
    if (body && typeof body === "object") return String(body.text || "");
    if (typeof body === "string") return body;
    return String(snapshot.body_text || snapshot.caption || "");
  }

  function normalizeAd(raw) {
    raw = raw || {};
    var snapshot = raw.snapshot || raw.ad_snapshot || raw.adSnapshot || {};
    var id = String(
      first(raw.ad_archive_id, raw.adArchiveID, raw.adArchiveId, raw.adid, raw.id, "")
    );
    var pageName = String(
      first(snapshot.page_name, raw.page_name, raw.pageName, snapshot.pageName, "Unknown page")
    );
    var pageId = String(first(snapshot.page_id, raw.page_id, raw.pageID, raw.pageId, ""));
    var start = first(raw.start_date, raw.startDate, snapshot.start_date, 0);
    var end = first(raw.end_date, raw.endDate, 0);
    var platforms = asList(raw.publisher_platform || raw.publisherPlatform);
    var media = collectMedia(snapshot);
    var days = daysRunning(start, end);
    return {
      id: id,
      pageName: pageName,
      pageId: pageId,
      startDate: start,
      endDate: end,
      platforms: platforms,
      body: bodyText(snapshot),
      title: String(first(snapshot.title, snapshot.headline, "")),
      cta: String(first(snapshot.cta_text, snapshot.cta_type, "")),
      link: String(first(snapshot.link_url, snapshot.link_destination_display_url, "")),
      media: media,
      days: days,
      isWinner: days >= WINNER_DAYS,
    };
  }

  function looksLikeAd(obj) {
    if (!obj || typeof obj !== "object") return false;
    var id = obj.ad_archive_id || obj.adArchiveID || obj.adArchiveId || obj.adid;
    if (!id) return false;
    return Boolean(
      obj.snapshot ||
        obj.ad_snapshot ||
        obj.adSnapshot ||
        obj.page_name ||
        obj.pageName ||
        obj.page_id ||
        obj.pageID
    );
  }

  function collectAds(root) {
    var out = [];
    var seen = [];
    var ids = {};
    function walk(obj) {
      if (!obj || typeof obj !== "object") return;
      for (var i = 0; i < seen.length; i++) {
        if (seen[i] === obj) return;
      }
      seen.push(obj);
      if (looksLikeAd(obj)) {
        var ad = normalizeAd(obj);
        if (ad.id && !ids[ad.id]) {
          ids[ad.id] = true;
          out.push(ad);
        }
      }
      if (Array.isArray(obj)) {
        for (var a = 0; a < obj.length; a++) walk(obj[a]);
      } else {
        var keys = Object.keys(obj);
        for (var k = 0; k < keys.length; k++) walk(obj[keys[k]]);
      }
    }
    walk(root);
    return out;
  }

  function adsFromPayload(textOrJson) {
    var json = typeof textOrJson === "string" ? parseMaybeJson(textOrJson) : textOrJson;
    if (!json) return [];
    return collectAds(json);
  }

  function csvEscape(value) {
    var s = String(value == null ? "" : value);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function adsToCsv(ads) {
    var headers = [
      "Advertiser",
      "Page ID",
      "Library ID",
      "Days Running",
      "Winner",
      "Start Date",
      "Platforms",
      "Primary Text",
      "Headline",
      "CTA",
      "Link",
      "Media Type",
      "Media URL",
    ];
    var lines = [headers.map(csvEscape).join(",")];
    var list = ads || [];
    for (var i = 0; i < list.length; i++) {
      var ad = list[i];
      var types = [];
      var urls = [];
      var media = ad.media || [];
      for (var m = 0; m < media.length; m++) {
        if (media[m].kind && types.indexOf(media[m].kind) === -1) types.push(media[m].kind);
        if (media[m].url) urls.push(media[m].url);
      }
      lines.push(
        [
          ad.pageName,
          ad.pageId,
          ad.id,
          ad.days,
          ad.days >= WINNER_DAYS ? "yes" : "no",
          startDateIso(ad.startDate),
          (ad.platforms || []).join("|"),
          ad.body,
          ad.title,
          ad.cta,
          ad.link,
          types.join("|") || "unknown",
          urls.join(" | "),
        ]
          .map(csvEscape)
          .join(",")
      );
    }
    return lines.join("\r\n");
  }

  function advertiserPlaybook(ads) {
    var list = ads || [];
    var pageName = (list[0] && list[0].pageName) || "Unknown page";
    var pageId = (list[0] && list[0].pageId) || "";
    var ranked = list.slice().sort(function (a, b) {
      return (b.days || 0) - (a.days || 0);
    });
    var top = ranked[0] || null;
    var totalDays = 0;
    var video = 0;
    var image = 0;
    var mixed = 0;
    var winners = 0;
    for (var i = 0; i < list.length; i++) {
      var ad = list[i];
      totalDays += ad.days || 0;
      if ((ad.days || 0) >= WINNER_DAYS) winners += 1;
      var kinds = {};
      var media = ad.media || [];
      for (var m = 0; m < media.length; m++) kinds[media[m].kind] = true;
      if (kinds.video && kinds.image) mixed += 1;
      else if (kinds.video) video += 1;
      else image += 1;
    }
    return {
      pageName: pageName,
      pageId: pageId,
      adCount: list.length,
      topCreative: top,
      avgRuntime: list.length ? Math.round((totalDays / list.length) * 10) / 10 : 0,
      video: video,
      image: image,
      mixed: mixed,
      winners: winners,
      ads: list,
    };
  }

  function groupByAdvertiser(ads) {
    var map = {};
    var order = [];
    var list = ads || [];
    for (var i = 0; i < list.length; i++) {
      var ad = list[i];
      var key = ad.pageId || ad.pageName || "unknown";
      if (!map[key]) {
        map[key] = [];
        order.push(key);
      }
      map[key].push(ad);
    }
    var groups = [];
    for (var g = 0; g < order.length; g++) {
      groups.push(advertiserPlaybook(map[order[g]]));
    }
    groups.sort(function (a, b) {
      return b.adCount - a.adCount;
    });
    return groups;
  }

  function sanitizeFilename(name) {
    var cleaned = String(name || "ad")
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 80);
    return cleaned || "ad";
  }

  function extensionFor(media) {
    var url = (media && media.url) || "";
    var kind = (media && media.kind) || "";
    if (/\.m3u8(\?|$)/i.test(url)) return "";
    var match = url.match(/\.(mp4|webm|mov|jpg|jpeg|png|webp|gif)(?:\?|$)/i);
    if (match) return match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
    if (kind === "video") return "mp4";
    return "jpg";
  }

  function isStreamUrl(url) {
    return /\.m3u8(\?|$)/i.test(url || "");
  }

  function filenameFor(ad, media, index) {
    var ext = extensionFor(media);
    var page = sanitizeFilename(ad.pageName || "ad");
    var id = sanitizeFilename(ad.id || "unknown");
    var card = media && media.card ? "_card" + media.card : "";
    var extra = index > 0 && !card ? "_" + (index + 1) : "";
    return page + "_" + id + card + extra + "." + ext;
  }

  function parseLibraryId(text) {
    if (!text) return "";
    var match = String(text).match(/Library ID:\s*(\d+)/i);
    return match ? match[1] : "";
  }

  function parseStartDate(text) {
    if (!text) return 0;
    var match = String(text).match(
      /Started running on\s+([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/i
    );
    if (!match) return 0;
    var parsed = Date.parse(match[1].replace(",", ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function betterText(current, incoming) {
    var a = String(current || "");
    var b = String(incoming || "");
    if (a && a.indexOf("Library ID:") !== -1 && b) return b;
    if (b && b.indexOf("Library ID:") !== -1 && a) return a;
    if (b && (!a || b.length < a.length * 0.6 || a.length < 8)) return b;
    return a || b;
  }

  function mergeAd(current, incoming) {
    if (!current) return incoming;
    if (!incoming) return current;
    var media = (current.media || []).slice();
    var existing = {};
    var i;
    for (i = 0; i < media.length; i++) existing[media[i].url] = true;
    var nextMedia = incoming.media || [];
    for (i = 0; i < nextMedia.length; i++) {
      if (nextMedia[i].url && !existing[nextMedia[i].url]) media.push(nextMedia[i]);
    }
    var start = current.startDate || incoming.startDate;
    if (current.startDate && incoming.startDate) {
      start = toMs(current.startDate) <= toMs(incoming.startDate) ? current.startDate : incoming.startDate;
    }
    var end = current.endDate || incoming.endDate;
    var days = daysRunning(start, end);
    return {
      id: current.id || incoming.id,
      pageName: current.pageName && current.pageName !== "Unknown page" ? current.pageName : incoming.pageName,
      pageId: current.pageId || incoming.pageId,
      startDate: start,
      endDate: end,
      platforms: (current.platforms && current.platforms.length ? current.platforms : incoming.platforms) || [],
      body: betterText(current.body, incoming.body),
      title: current.title || incoming.title,
      cta: current.cta || incoming.cta,
      link: current.link || incoming.link,
      media: media,
      days: days,
      isWinner: days >= WINNER_DAYS,
    };
  }

  return {
    WINNER_DAYS: WINNER_DAYS,
    parseMaybeJson: parseMaybeJson,
    pickVideoUrl: pickVideoUrl,
    collectMedia: collectMedia,
    daysRunning: daysRunning,
    startDateIso: startDateIso,
    normalizeAd: normalizeAd,
    collectAds: collectAds,
    adsFromPayload: adsFromPayload,
    csvEscape: csvEscape,
    adsToCsv: adsToCsv,
    advertiserPlaybook: advertiserPlaybook,
    groupByAdvertiser: groupByAdvertiser,
    sanitizeFilename: sanitizeFilename,
    filenameFor: filenameFor,
    isStreamUrl: isStreamUrl,
    parseLibraryId: parseLibraryId,
    parseStartDate: parseStartDate,
    mergeAd: mergeAd,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = MLD;
}
