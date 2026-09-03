# Meta Library Downloader 2.1 — Chrome Web Store package

This folder is the extension source. The uploadable zip is:

**`extension/meta-library-downloader.zip`**

No payment is wired in. Every feature below works after install.

## What 2.1 includes

On [facebook.com/ads/library](https://www.facebook.com/ads/library):

- One-click download of the ad image or a clean MP4 (skips broken `.m3u8` streams)
- 👑 gold outline on ads running **30+ days**
- **Bulk download all** ads currently on screen, with `⬇ 6/24` progress
- **Spy on page** — top creative, average runtime, image vs video split, winner count
- **Open offer** — jump to the landing page behind the ad
- **Copy swipe file** — hook, headline, CTA, and offer URL for every ad on screen
- **CSV export** — primary text, headline, CTA, destination URL, Library ID, days running (UTF-8 so Excel reads Arabic/English correctly)
- Popup shows the **last 5 downloads**

Files save to `Downloads/MetaAdLibrary/`.

## Upload to Chrome Web Store

1. Open [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Select **Meta Library Downloader** (`fekhgpbfajekimfgndgohpnhojnpdeon`)
3. **Package → Upload new package** → choose `meta-library-downloader.zip`
4. Version in the zip is **2.1.0**
5. Paste the listing copy from `STORE-LISTING.md` if you want the new features described
6. Submit for review

## Load unpacked for a local test

1. chrome://extensions → Developer mode
2. Load unpacked → this `extension/` folder
3. Open the Meta Ad Library and search any advertiser

## Privacy

The recent-download list stays in `chrome.storage.local` on the user's computer. Nothing is sent to a server.
