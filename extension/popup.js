function timeAgo(ts) {
  if (!ts) return "not checked yet";
  var delta = Math.max(0, Date.now() - Number(ts || 0));
  var mins = Math.floor(delta / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  var hours = Math.floor(mins / 60);
  if (hours < 24) return hours + "h ago";
  return Math.floor(hours / 24) + "d ago";
}

function setStatus(text) {
  document.getElementById("watch-status").textContent = text || "";
}

function renderWatches(watches) {
  var list = document.getElementById("watches");
  list.innerHTML = "";
  (watches || []).forEach(function (watch) {
    var li = document.createElement("li");
    var info = document.createElement("div");
    var title = document.createElement("b");
    title.textContent = watch.pageName || watch.pageId || watch.input || "Advertiser";
    var meta = document.createElement("span");
    meta.textContent =
      (watch.pageId ? "ID " + watch.pageId + " · " : "") +
      (watch.lastSeenIds ? watch.lastSeenIds.length + " ads · " : "") +
      timeAgo(watch.lastChecked);
    info.appendChild(title);
    info.appendChild(document.createElement("br"));
    info.appendChild(meta);
    var remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", function () {
      chrome.runtime.sendMessage(
        { type: "mld-watch-remove", pageId: watch.pageId, pageName: watch.pageName },
        function (response) {
          renderWatches((response && response.watches) || []);
        }
      );
    });
    li.appendChild(info);
    li.appendChild(remove);
    list.appendChild(li);
  });
}

document.getElementById("open-library").addEventListener("click", function () {
  chrome.tabs.create({ url: "https://www.facebook.com/ads/library/" });
});

document.getElementById("watch-form").addEventListener("submit", function (event) {
  event.preventDefault();
  var input = document.getElementById("watch-input");
  var value = (input.value || "").trim();
  if (!value) return;
  setStatus("Saving…");
  chrome.runtime.sendMessage({ type: "mld-watch-add", input: value }, function (response) {
    if (!response || !response.ok) {
      setStatus((response && response.error) || "Could not watch that advertiser");
      return;
    }
    input.value = "";
    setStatus("Watching. Chrome will notify you when a new ad appears.");
    renderWatches(response.watches || []);
  });
});

document.getElementById("check-now").addEventListener("click", function () {
  setStatus("Checking…");
  chrome.runtime.sendMessage({ type: "mld-watch-check" }, function (response) {
    if (!response || !response.ok) {
      setStatus((response && response.error) || "Check failed");
      return;
    }
    setStatus("Checked. New ads send a Chrome notification.");
    renderWatches(response.watches || []);
  });
});

chrome.runtime.sendMessage({ type: "mld-watch-list" }, function (response) {
  renderWatches((response && response.watches) || []);
});

chrome.runtime.sendMessage({ type: "mld-recent" }, function (response) {
  var recent = (response && response.recent) || [];
  var list = document.getElementById("recent");
  var empty = document.getElementById("empty");
  document.getElementById("count").textContent = String(recent.length);
  list.innerHTML = "";
  recent.slice(0, 5).forEach(function (item) {
    var li = document.createElement("li");
    var title = document.createElement("b");
    title.textContent = item.advertiser || "Ad download";
    var meta = document.createElement("span");
    meta.textContent = (item.kind || "file") + " · " + timeAgo(item.at);
    li.appendChild(title);
    li.appendChild(meta);
    list.appendChild(li);
  });
  empty.hidden = recent.length > 0;
});
