function timeAgo(ts) {
  var delta = Math.max(0, Date.now() - Number(ts || 0));
  var mins = Math.floor(delta / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  var hours = Math.floor(mins / 60);
  if (hours < 24) return hours + "h ago";
  return Math.floor(hours / 24) + "d ago";
}

document.getElementById("open-library").addEventListener("click", function () {
  chrome.tabs.create({ url: "https://www.facebook.com/ads/library/" });
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
