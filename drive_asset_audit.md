# Glowforge Marketing Drive — Asset Audit

Goal: surface **reusable hero/email visuals** + **proven top-performers**, then
visually vet the winners and tie them to campaign performance.

Method: rank on free metadata signals (resolution≈filesize, recency, folder
semantics, filename keywords), dedupe, **visually vet** the shortlist (see
tooling below), and join to campaign performance from HubSpot / Supermetrics.

Root folder: `1qlMHxtqPHxCxjlXZRgbdf_jA1maf3p7f`

## Library map (where value lives)

| Folder | What's in it | Use for |
|---|---|---|
| Creative Team / Photo Assets | Organized photoshoots: Aura Photoshoot Mar23, Proofgrade Materials, Holiday Imagery, Hardware, Holiday Plushy, Misc Print Imagery | Hero/lifestyle stills |
| Creative Team / Produced Assets | ~40 finished campaign sets (Aura Launch, Spark Launch, Holiday Magic/BFCM, Craft Series, Daydream Evergreen, Pro HD, Magic Canvas) | Finished on-brand creative |
| Creative Team / Brand Books & Logos | Brand guidelines + logos | Brand reference |
| Creative Team / Ad Swipe Board | Reference/swipe | Inspiration |
| Marketing / Email Marketing | HMB_Email 1–6.png | Email heroes |
| Marketing / Paid Social, Feature/Product Launches, Testimonials, Influencer | Channel creative (tie to performance) | Proven performers |
| Dash Social Content | Creator UGC TikToks + screenshots | UGC (track 2, not selected) |
| root (loose) | Aura_Top-Down, GF-Pro-HD-Top-Down, Hero Crafter, HMB-circle-plasma | Hi-res product heroes |

## How to vet an asset (tooling)

`download_file_content` returns base64; for real creative (0.3–40 MB) that
overflows the model's token budget, so the MCP harness **saves the raw JSON to
disk** instead of returning it. That disk copy is the win — the heavy bytes
never hit context. `scripts/vet-drive-asset.py` decodes that saved file and
emits a small JPG (thumbnail or labeled contact sheet) that costs a few hundred
tokens to review instead of ~90k.

```
# single asset (auto-pick newest download) -> thumbnail
python3 scripts/vet-drive-asset.py --latest out.jpg
# several assets -> one labeled contact sheet
python3 scripts/vet-drive-asset.py --montage sheet.jpg <saved1.txt> <saved2.txt> ...
```

Workflow: call `download_file_content(fileId)` (it "errors" by saving to disk) →
run the script on the saved path(s) → `Read` the thumbnail/sheet.

## Winners — visually vetted ✅

Both top-performing campaigns' creative was downloaded and reviewed via the
tooling above.

### Holiday Magic Bundle (HMB) email series — vetted, all 6
Folder `1YlkiuSqNYGkL1NstOnKwJjPT_05mv2tN` (also in HMB Approved Assets).
Verdict: **strong, reusable, cohesive.** Consistent Glowforge system — teal
logo, coral/teal rounded CTAs, sparkle motif, uniform social footer; clear
series arc (tease deal → bundle value → urgency). Standout creative idea:
the **"Home(made) for the holidays"** wordmark (Email 2).

| Email | Headline | Note |
|---|---|---|
| 1 | "Kickstart the holidays early…" | Pro machine hero on teal; >$1,000-extras bundle |
| 2 | "Home(made) for the holidays" | Wordmark play; lifestyle + machine |
| 3 | "The ultimate all-in-one bundle…" | Arched magenta hero; 3-icon value row |
| 4 | "Make the holidays magical" | Warm lifestyle; bulleted props |
| 5 | "The holiday deal you've been waiting for" | Bright workshop; icon row |
| 6 | "Gift yourself magic this season" | Value recap; final CTA |

### Magic Canvas — vetted, representative set
Folder `1VVnRr3t204gC0ehjocy8cbr29nnN53nP` (Feature Launch – Magic Canvas).
Verdict: **print-grade, on-brand, highly reusable.** Clean white-bg product
photography of laser-engraved goods that proves the AI-prompt→object value
prop, plus a clear "Type it → Choose a style → Print it" explainer.
Reviewed: How-It-Works explainer, raccoon phone case, robot coasters, mandala
cutting board, landscape cutting board, raccoon phone-case + keychain pair.

## Campaign → asset-folder mapping (all 6 campaigns)

Sessions/influenced from HubSpot (pulled this session). ✅ = direct name match,
⚠️ = inferred (no dedicated folder; closest on-brand set named).

| Campaign | Sessions | Influenced | Asset folder(s) | Match |
|---|---:|---:|---|---|
| Black Friday/Cyber Monday 2025 | 100,055 | 0 | Holiday Magic Bundle – Approved Assets `1zGEd3pMjegruSh3HA-wmndzi58PXGfpO`; BFCM `1fpcwETGOWeDzCj7sx0Zfdr5IuiKPHmNR`; Paid Ads – Round 2 BFCM `1h6yTxq1Al5Rx53_2ceh1N6d0p2505MmC`; BFCM Organic Social 11-25 `14iFIJVj51PhxX4BsylE6gt0rFvgwm2v7` | ✅ |
| U Prem Magic Canvas | 0 | 62,712 | Feature Launch – Magic Canvas `1VVnRr3t204gC0ehjocy8cbr29nnN53nP`; Magic Canvas – May 2025 update `171eMoWDZCu6VmiHMoUs0-hubBo5jR-fM`; Paid `1TRD0YAz1VkF-KqsWsJEEXCPMLD5FatTy` | ✅ |
| IS Team Craft Upgrade 2025 | 2,926 | 19,913 | Craft Series `1yeOHcDJt-TZatBsV5xXZZXAxDX-ci_UW`; Craft Series Carousels `1J0Xsgfb22MtPIz9pBXFJ5iT9LRNQCMjx`; Craft series holiday slideshow Upgrade `1YD7gMVrZD6J-fMl0GvUYPu5jLSAbu8Gn` | ✅ |
| Glowforge Hybrid Workflow Showcase | 1,829 | 12,547 | No "Hybrid Workflow" folder. Closest: Pro HD Selling Livestream – May 2025 `1cqnyGPRGaY6gxGqLBw91dqiTZBy6QmJC`; Launch Tofu – Aura and pro `1PdF3Uwx1jLladSKYHN5fktwCxDCrKonX` | ⚠️ |
| Universal Premium Launch | 950 | 5,539 | No "Universal Premium" folder. UP flagship feature = Magic Canvas (above); broader: Product Launches `1YPycMi2BWEXrMtSJviYnfS6cF0l9BMDK` | ⚠️ |
| New Lead Welcome Series | 249 | 607 | Welcome series Craft Caddy `1DYAT0krayQNKyxCJKa06lruEJYeuwUa6` | ✅ |

**Mine first:** Magic Canvas (top influence + dedicated, vetted folder) and
BFCM/HMB (top traffic + vetted email set).

## Paid-social data (Supermetrics) — connector gap ⚠️

Authenticated social sources: Facebook Ads (`FA`), Facebook Insights (`FB`),
Instagram Insights (`IGI`). Paid social = **Facebook Ads (FA)**.

The connected FA ad account is `act_1510004013946729` ("Sam Kemmis"). Queries
returned **"No data found" across its entire supported history**
(2023-05-09 → present, the FA historical floor). It is an empty/personal
account, **not Glowforge's production ad account** — so live paid-social
performance cannot be retrieved through the current token.

**To unblock:** connect the Glowforge production Meta ad account at
`hub.supermetrics.com/token-management`, then re-run the FA query
(fields: `adcampaign_name, impressions, action_link_click, cost, link_CTR,
CPM, offsite_conversions_fb_pixel_purchase, website_purchase_roas`) to rank
paid-social campaigns and attribute them to the asset folders above. No
numbers are reported here because none exist in the connected account; nothing
was fabricated.

## Ranking signals (applied across full crawl)
1. Resolution proxy: filesize (hero art is MB-scale; throwaway is sub-100KB screenshots)
2. Recency: modifiedTime (what the team still reaches for)
3. Folder semantics: Produced Assets / Photo Assets >> "Screenshot ….png"
4. Filename keywords: Hero, Top-Down, HD, Clean, product names
5. Dedupe near-identical exports
