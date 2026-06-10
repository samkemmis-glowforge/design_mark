import { launchBrowser } from "../agent/render/browser.js";
import { fontFaceStyles } from "../agent/render/fonts.js";
import { loadBrand, brandFontFamilies } from "../agent/brand.js";
const brand = await loadBrand();
const css = await fontFaceStyles(brandFontFamilies(brand));
const browser = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.setContent(`<!doctype html><html><head><style>${css}
  html,body{margin:0} .wordmark{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding-top:6px}
  .wordmark div{font-family:Inter;font-weight:900;font-size:548px;line-height:0.80;letter-spacing:-0.045em;white-space:nowrap}
  span{outline:1px solid red}
</style></head><body><div class="wordmark">
  <div id="l1"><span>G</span><span>O</span><span>O</span><span>D</span></div>
  <div id="l2"><span>B</span><span>O</span><span>Y</span><span>.</span></div>
</div></body></html>`);
await page.evaluate(() => document.fonts.ready);
const boxes = await page.evaluate(() =>
  [...document.querySelectorAll("span")].map(s => {
    const r = s.getBoundingClientRect();
    return `${s.textContent}: x ${r.left|0}-${r.right|0}, y ${r.top|0}-${r.bottom|0}`;
  }).join("\n"));
console.log(boxes);
await browser.close();
