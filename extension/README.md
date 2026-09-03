# Meta Library Downloader 2.0 — Chrome Web Store package

This folder is the extension source. The uploadable zip is:

**`extension/meta-library-downloader.zip`**

No payment is wired in. Every feature below works after install.

## What 2.0 adds

On [facebook.com/ads/library](https://www.facebook.com/ads/library):

- One-click download of the ad image or a clean MP4 (skips broken `.m3u8` streams)
- 👑 gold outline on ads running **30+ days**
- **Bulk download all** ads currently on screen, with `⬇ 6/24` progress
- **Spy on page** — top creative, average runtime, image vs video split, winner count
- **CSV export** — advertiser, copy, Library ID, media URL, days running
- Per-ad **notes** and **5 color labels** (saved locally)
- Popup shows the **last 5 downloads**

Files save to `Downloads/MetaAdLibrary/`.

## Upload to Chrome Web Store

1. Open [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Select **Meta Library Downloader** (`fekhgpbfajekimfgndgohpnhojnpdeon`)
3. **Package → Upload new package** → choose `meta-library-downloader.zip`
4. Version in the zip is **2.0.0** (store is currently 1.0)
5. Paste the listing copy from `STORE-LISTING.md` if you want the new features described
6. Submit for review

Users who already installed 1.0 will get a permission prompt because this version adds `downloads`, `storage`, and Facebook/CDN host access so it can save files and remember notes.

## Load unpacked for a local test

1. chrome://extensions → Developer mode
2. Load unpacked → this `extension/` folder
3. Open the Meta Ad Library and search any advertiser

## Privacy

Notes, labels, and the recent-download list stay in `chrome.storage.local` on the user's computer. Nothing is sent to a server.
