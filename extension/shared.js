/**
 * Shared helpers for Meta Library Downloader.
 * Loaded by the service worker (importScripts) and content scripts.
 */
var MLD = (function () {
  var WINNER_DAYS = 30;

  var CTA_ALIASES = {
    SHOP_NOW: "Shop now",
    LEARN_MORE: "Learn more",
    SIGN_UP: "Sign up",
    SUBSCRIBE: "Subscribe",
    DOWNLOAD: "Download",
    BOOK_NOW: "Book now",
    CONTACT_US: "Contact us",
    GET_QUOTE: "Get quote",
    APPLY_NOW: "Apply now",
    WATCH_MORE: "Watch more",
    LISTEN_NOW: "Listen now",
    GET_OFFER: "Get offer",
    ORDER_NOW: "Order now",
    SEND_MESSAGE: "Send message",
    WHATSAPP_MESSAGE: "WhatsApp",
    CALL_NOW: "Call now",
    INSTALL_MOBILE_APP: "Install",
    USE_APP: "Use app",
    PLAY_GAME: "Play game",
    GET_DIRECTIONS: "Get directions",
    OPEN_LINK: "Open link",
    DONATE_NOW: "Donate now",
    BUY_NOW: "Buy now",
    GET_SHOWTIMES: "Get showtimes",
    REQUEST_TIME: "Request time",
    SEE_MENU: "See menu",
    GET_PROMOTIONS: "Get promotions",
    NO_BUTTON: "",
  };

  var CTA_PHRASES = [
    "shop now",
    "learn more",
    "sign up",
    "subscribe",
    "download",
    "book now",
    "contact us",
    "get quote",
    "apply now",
    "watch more",
    "listen now",
    "get offer",
    "order now",
    "send message",
    "whatsapp",
    "call now",
    "install",
    "use app",
    "play game",
    "get directions",
    "open link",
    "donate now",
    "buy now",
    "buy tickets",
    "get showtimes",
    "see menu",
    "get deal",
    "try now",
    "send whatsapp message",
    "watch video",
    "get started",
    "start now",
    "register",
    "join now",
    "book a call",
    "اطلب الآن",
    "تسوق الآن",
    "اعرف المزيد",
    "سجل الآن",
    "تواصل معنا",
  ];

  var CHROME_LINE = [
    /^library id:/i,
    /^see ad details$/i,
    /^see summary details$/i,
    /^started running on\b/i,
    /^(active|inactive)$/i,
    /^(facebook|instagram|messenger|audience network|threads|whatsapp)$/i,
    /^(see more|see less)$/i,
    /^sponsored$/i,
    /^open\s*drop[\s-]*down$/i,
    /^copy brief$/i,
    /^offer$/i,
    /^spy$/i,
    /^download$/i,
    /^watch$/i,
    /^\d+d$/i,
    /^about this ad$/i,
    /^\d+\s+versions?$/i,
    /^this ad (is|has|was)\b/i,
    /^opens? in (a )?new tab$/i,
    /^use this ad$/i,
    /^platforms?$/i,
  ];

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

  function cleanCopy(text) {
    return String(text || "")
      .replace(/[\u200B-\u200D\uFEFF\u2060\u00AD]/g, "")
      .replace(/\u00A0/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function isChromeLine(line) {
    var t = cleanCopy(line);
    if (!t) return true;
    for (var i = 0; i < CHROME_LINE.length; i++) {
      if (CHROME_LINE[i].test(t)) return true;
    }
    return false;
  }

  function looksLikeDomDump(text) {
    return /Library ID:|Started running on|See ad details|See summary details/i.test(text || "");
  }

  function humanizeCta(value) {
    var raw = cleanCopy(value);
    if (!raw) return "";
    var key = raw.replace(/\s+/g, "_").toUpperCase();
    if (Object.prototype.hasOwnProperty.call(CTA_ALIASES, key)) return CTA_ALIASES[key];
    return raw;
  }

  function isCta(value) {
    var t = cleanCopy(value).toLowerCase();
    if (!t) return false;
    if (Object.prototype.hasOwnProperty.call(CTA_ALIASES, t.replace(/\s+/g, "_").toUpperCase())) return true;
    for (var i = 0; i < CTA_PHRASES.length; i++) {
      if (t === CTA_PHRASES[i]) return true;
    }
    return false;
  }

  function isUsableCopy(text) {
    var c = cleanCopy(text);
    if (c.length < 2) return false;
    if (isChromeLine(c)) return false;
    if (looksLikeDomDump(c)) return false;
    if (!/[A-Za-z0-9\u0600-\u06FF\u00C0-\u024F]/.test(c)) return false;
    return true;
  }

  function pickCopy(current, incoming) {
    var aOk = isUsableCopy(current);
    var bOk = isUsableCopy(incoming);
    if (aOk && bOk) {
      var a = cleanCopy(current);
      var b = cleanCopy(incoming);
      return b.length > a.length ? b : a;
    }
    if (bOk) return cleanCopy(incoming);
    if (aOk) return cleanCopy(current);
    return "";
  }

  function textFrom(value) {
    if (!value) return "";
    if (typeof value === "string") return cleanCopy(value);
    if (typeof value === "object") return cleanCopy(value.text || value.body || "");
    return "";
  }

  function extractCopyFromSnapshot(snapshot) {
    snapshot = snapshot || {};
    var cards = snapshot.cards || [];
    var extras = snapshot.extra_texts || snapshot.extraTexts || [];
    var body = textFrom(snapshot.body) || textFrom(snapshot.body_text);
    var i;
    if (!body) {
      for (i = 0; i < extras.length; i++) {
        var extra = textFrom(extras[i]);
        if (extra) body = body ? body + "\n" + extra : extra;
      }
    }
    var title = cleanCopy(snapshot.title || snapshot.headline || "");
    var description = cleanCopy(first(snapshot.link_description, snapshot.description, ""));
    var caption = textFrom(snapshot.caption);
    if (!body && caption) body = caption;
    if (description && (description === body || description === title)) description = "";
    var cta = humanizeCta(snapshot.cta_text || snapshot.ctaText || "");
    if (!cta && snapshot.cta_type && snapshot.cta_type !== "UNKNOWN" && snapshot.cta_type !== "NO_BUTTON") {
      cta = humanizeCta(snapshot.cta_type);
    }
    var link = first(snapshot.link_url, snapshot.linkUrl, snapshot.link_destination_display_url, "");
    for (i = 0; i < cards.length; i++) {
      var card = cards[i] || {};
      if (!body) body = textFrom(card.body) || textFrom(card.text);
      if (!title) title = cleanCopy(card.title || card.headline || "");
      if (!description) description = cleanCopy(card.link_description || card.description || "");
      if (!cta) cta = humanizeCta(card.cta_text || card.cta_type || "");
      if (!link) link = first(card.link_url, card.linkUrl, "");
    }
    if (description && (description === body || description === title)) description = "";
    return {
      body: body,
      title: title,
      description: description,
      cta: cta,
      link: String(link || ""),
    };
  }

  var CARD_CUTOFFS = [
    /sponsored/i,
    /open\s*drop[\s-]*down/i,
  ];

  var CARD_TAIL = [
    /^\s*see ad details\s*$/im,
    /^\s*see summary details\s*$/im,
    /^\s*Library ID:\s*\d/im,
    /^\s*System status\s*/im,
  ];

  function sliceAdCopyText(text) {
    var s = String(text || "").replace(/\r/g, "");
    var bestIdx = -1;
    for (var c = 0; c < CARD_CUTOFFS.length; c++) {
      var match = s.match(CARD_CUTOFFS[c]);
      if (match) {
        var idx = s.indexOf(match[0]) + match[0].length;
        if (idx > bestIdx) bestIdx = idx;
      }
    }
    if (bestIdx > 0) s = s.slice(bestIdx);
    for (var t = 0; t < CARD_TAIL.length; t++) {
      var tail = s.match(CARD_TAIL[t]);
      if (tail) s = s.slice(0, tail.index);
    }
    return s.trim();
  }

  function parseCardCopy(text, pageName) {
    var hasCutoff = false;
    for (var c = 0; c < CARD_CUTOFFS.length; c++) {
      if (CARD_CUTOFFS[c].test(text || "")) { hasCutoff = true; break; }
    }
    var source = hasCutoff ? sliceAdCopyText(text) : String(text || "");
    var rawLines = source.split(/\r?\n/);
    var lines = [];
    var i;
    for (i = 0; i < rawLines.length; i++) {
      var line = cleanCopy(rawLines[i]);
      if (!line) continue;
      if (isChromeLine(line)) continue;
      if (pageName && line.toLowerCase() === cleanCopy(pageName).toLowerCase()) continue;
      if (
        /^(facebook|instagram|messenger|audience network|threads)(\s*[·|,]\s*(facebook|instagram|messenger|audience network|threads))+$/i.test(
          line
        )
      ) {
        continue;
      }
      lines.push(line);
    }
    var status = /\binactive\b/i.test(text || "") ? "Inactive" : /\bactive\b/i.test(text || "") ? "Active" : "";
    var cta = "";
    var title = "";
    var bodyLines = [];
    for (i = 0; i < lines.length; i++) {
      if (!hasCutoff && isCta(lines[i]) && !cta) {
        cta = humanizeCta(lines[i]);
        continue;
      }
      bodyLines.push(lines[i]);
    }
    if (!hasCutoff && bodyLines.length >= 2) {
      var last = bodyLines[bodyLines.length - 1];
      var firstLine = bodyLines[0];
      if (last.length <= 80 && last.length < firstLine.length && last.split(" ").length <= 12) {
        title = last;
        bodyLines = bodyLines.slice(0, -1);
      }
    }
    return {
      body: cleanCopy(bodyLines.join("\n")),
      title: title,
      description: "",
      cta: cta,
      status: status,
    };
  }

  function parseWatchInput(raw) {
    var value = String(raw || "").trim();
    if (!value) return null;
    if (/^https?:\/\//i.test(value) || /facebook\.com/i.test(value)) {
      try {
        var href = /^https?:\/\//i.test(value) ? value : "https://" + value.replace(/^\/\//, "");
        var url = new URL(href);
        var pageId = url.searchParams.get("view_all_page_id") || url.searchParams.get("page_id") || "";
        var seedAdId = url.searchParams.get("id") || "";
        if (pageId || seedAdId) {
          return { pageId: pageId, pageName: "", seedAdId: seedAdId, input: value };
        }
        var slug = url.pathname.replace(/^\//, "").split("/")[0];
        if (slug && slug !== "ads" && slug !== "profile.php" && slug !== "pages") {
          return { pageId: "", pageName: decodeURIComponent(slug), seedAdId: "", input: value };
        }
      } catch (e) {
        /* fall through */
      }
    }
    if (/^\d{5,}$/.test(value)) {
      return { pageId: value, pageName: "", seedAdId: "", input: value };
    }
    return { pageId: "", pageName: value, seedAdId: "", input: value };
  }

  function uniqueIds(matches) {
    var ids = [];
    var seen = {};
    for (var i = 0; i < matches.length; i++) {
      var id = matches[i];
      if (!id || seen[id]) continue;
      seen[id] = true;
      ids.push(id);
    }
    return ids;
  }

  function extractAdIdsFromHtml(html) {
    var text = String(html || "");
    var found = [];
    var patterns = [
      /"ad_archive_id"\s*:\s*"(\d+)"/g,
      /"adArchiveID"\s*:\s*"(\d+)"/g,
      /ad_archive_id\\":\\"(\d+)/g,
      /Library ID:\s*(\d+)/gi,
    ];
    for (var p = 0; p < patterns.length; p++) {
      var re = patterns[p];
      var match;
      while ((match = re.exec(text))) found.push(match[1]);
    }
    return uniqueIds(found);
  }

  function extractPageIdFromHtml(html) {
    var text = String(html || "");
    var match =
      text.match(/"page_id"\s*:\s*"(\d+)"/) ||
      text.match(/"pageID"\s*:\s*"(\d+)"/) ||
      text.match(/view_all_page_id=(\d+)/);
    return match ? match[1] : "";
  }

  function extractPageNameFromHtml(html) {
    var text = String(html || "");
    var match = text.match(/"page_name"\s*:\s*"((?:\\.|[^"\\])*)"/) || text.match(/"pageName"\s*:\s*"((?:\\.|[^"\\])*)"/);
    if (!match) return "";
    try {
      return JSON.parse('"' + match[1] + '"');
    } catch (e) {
      return match[1];
    }
  }

  function unwrapFacebookLink(href) {
    if (!href) return "";
    try {
      var u = new URL(href, "https://www.facebook.com");
      var dest = u.searchParams.get("u");
      if ((u.pathname === "/l.php" || u.pathname.indexOf("/flx/warn") === 0) && dest) {
        return dest;
      }
      var host = u.hostname.replace(/^www\./, "");
      if (
        /(^|\.)facebook\.com$|(^|\.)fb\.com$|(^|\.)fbcdn\.net$|(^|\.)instagram\.com$|(^|\.)fbsbx\.com$/.test(host)
      ) {
        return "";
      }
      return u.href;
    } catch (e) {
      return href;
    }
  }

  function libraryUrl(id) {
    return id ? "https://www.facebook.com/ads/library/?id=" + encodeURIComponent(id) : "";
  }

  function pageAdsUrl(pageId, pageName) {
    if (pageId) {
      return (
        "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&view_all_page_id=" +
        encodeURIComponent(pageId) +
        "&search_type=page"
      );
    }
    if (pageName) {
      return (
        "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=" +
        encodeURIComponent(pageName) +
        "&search_type=keyword_unordered"
      );
    }
    return "https://www.facebook.com/ads/library/";
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
    var copy = extractCopyFromSnapshot(snapshot);
    var status = raw.is_active === false || raw.isActive === false ? "Inactive" : raw.is_active || raw.isActive ? "Active" : "";
    return {
      id: id,
      pageName: pageName,
      pageId: pageId,
      startDate: start,
      endDate: end,
      platforms: platforms,
      body: copy.body,
      title: copy.title,
      description: copy.description,
      cta: copy.cta,
      link: copy.link,
      status: status,
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
        if (ad.id) {
          if (ids[ad.id] == null) {
            ids[ad.id] = out.length;
            out.push(ad);
          } else {
            out[ids[ad.id]] = mergeAd(out[ids[ad.id]], ad);
          }
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
      "Status",
      "Start Date",
      "Platforms",
      "Primary Text",
      "Headline",
      "Description",
      "CTA",
      "Destination URL",
      "Ad Library URL",
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
          ad.status || "",
          startDateIso(ad.startDate),
          (ad.platforms || []).join("|"),
          ad.body,
          ad.title,
          ad.description || "",
          ad.cta,
          ad.link,
          libraryUrl(ad.id),
          types.join("|") || "unknown",
          urls.join(" | "),
        ]
          .map(csvEscape)
          .join(",")
      );
    }
    return "\uFEFF" + lines.join("\r\n");
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
    var platforms = (current.platforms && current.platforms.length ? current.platforms : incoming.platforms) || [];
    return {
      id: current.id || incoming.id,
      pageName: current.pageName && current.pageName !== "Unknown page" ? current.pageName : incoming.pageName,
      pageId: current.pageId || incoming.pageId,
      startDate: start,
      endDate: end,
      platforms: platforms,
      body: pickCopy(current.body, incoming.body),
      title: pickCopy(current.title, incoming.title),
      description: pickCopy(current.description, incoming.description),
      cta: pickCopy(current.cta, incoming.cta) || humanizeCta(incoming.cta || current.cta),
      link: current.link || incoming.link,
      status: current.status || incoming.status || "",
      media: media,
      days: days,
      isWinner: days >= WINNER_DAYS,
    };
  }

  return {
    WINNER_DAYS: WINNER_DAYS,
    parseMaybeJson: parseMaybeJson,
    cleanCopy: cleanCopy,
    isUsableCopy: isUsableCopy,
    humanizeCta: humanizeCta,
    extractCopyFromSnapshot: extractCopyFromSnapshot,
    parseCardCopy: parseCardCopy,
    sliceAdCopyText: sliceAdCopyText,
    parseWatchInput: parseWatchInput,
    extractAdIdsFromHtml: extractAdIdsFromHtml,
    extractPageIdFromHtml: extractPageIdFromHtml,
    extractPageNameFromHtml: extractPageNameFromHtml,
    unwrapFacebookLink: unwrapFacebookLink,
    libraryUrl: libraryUrl,
    pageAdsUrl: pageAdsUrl,
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
