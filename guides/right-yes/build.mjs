// Builds The Right Yes PDF and its shop cover from content.mjs.
// Run from the repo root:  node guides/right-yes/build.mjs
// Writes public/guides/The-Right-Yes.pdf and public/shop/the-right-yes.png
import { createRequire } from "module";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";
// Playwright is not a project dependency; it is found wherever it is installed (require uses NODE_PATH)
const { chromium } = createRequire(import.meta.url)("playwright");
import { META, WELCOME, HOW, HOW_NOTES, WEEKS, DAYS, COMMIT, AFFIRMATIONS, CIRCLE, CLOSING } from "./content.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const font = (p) => pathToFileURL(path.join(root, "node_modules", p)).href;
const logo = `data:image/png;base64,${readFileSync(path.join(root, "public/logo.png")).toString("base64")}`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// Typographic quotes and apostrophes
const typo = (s) => esc(s).replace(/(^|[\s(\[—])"/g, "$1“").replace(/"/g, "”").replace(/'/g, "’");

/* ---------- The mandala medallion (cover) ---------- */
function mandala(size = 420) {
  const c = size / 2, out = [];
  const C = { gold: "#deb547", rust: "#a8502e", green: "#4b5e4a", cream: "#f3ead8", tan: "#c9a77c", esp: "#2c1b13", dark: "#3d281d" };
  out.push(`<circle cx="${c}" cy="${c}" r="${c - 2}" fill="${C.dark}" stroke="${C.gold}" stroke-width="2"/>`);
  const ring = (n, r, rx, ry, fill, stroke = "none", off = 0) => {
    for (let i = 0; i < n; i++) {
      const a = (360 / n) * i + off;
      out.push(`<ellipse cx="${c}" cy="${c - r}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="1.2" transform="rotate(${a} ${c} ${c})"/>`);
    }
  };
  const dots = (n, r, d, fill, off = 0) => {
    for (let i = 0; i < n; i++) {
      const a = ((360 / n) * i + off) * Math.PI / 180;
      out.push(`<circle cx="${(c + r * Math.sin(a)).toFixed(1)}" cy="${(c - r * Math.cos(a)).toFixed(1)}" r="${d}" fill="${fill}"/>`);
    }
  };
  const circ = (r, stroke, w = 1.5, fill = "none") => out.push(`<circle cx="${c}" cy="${c}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`);
  dots(48, c - 14, 4, C.gold);
  circ(c - 26, C.tan, 1);
  ring(24, c - 48, 11, 22, C.rust, C.esp);
  ring(24, c - 48, 5, 12, C.cream, "none");
  dots(24, c - 48, 0, C.gold, 7.5);
  dots(24, c - 76, 5, C.green, 7.5);
  circ(c - 88, C.gold, 2);
  ring(16, c - 112, 14, 26, C.green, C.esp);
  ring(16, c - 112, 7, 14, C.gold, "none");
  ring(16, c - 112, 9, 18, C.cream, C.esp, 11.25);
  dots(32, c - 142, 3.5, C.cream);
  circ(c - 150, C.tan, 1);
  ring(12, c - 166, 10, 20, C.rust, C.esp);
  ring(12, c - 166, 5, 10, C.cream, "none", 15);
  circ(36, C.gold, 2, C.esp);
  ring(8, 20, 6, 12, C.gold, "none");
  circ(9, "none", 0, C.cream);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${out.join("")}</svg>`;
}

/* ---------- Pages ---------- */
let pageNo = 0;
const foot = () => `<div class="foot"><span>THE RIGHT YES</span><span>${pageNo}</span></div>`;
const page = (inner, cls = "") => { pageNo++; return `<section class="page ${cls}">${inner}${cls.includes("dark") || cls.includes("cover") ? "" : foot()}</section>`; };
const lines = (n) => `<div class="lines">${"<div></div>".repeat(n)}</div>`;

const cover = () => page(`
  <div class="medal">${mandala(400)}</div>
  <h1>${META.title}</h1>
  <p class="sub">${typo(META.subtitle)}</p>
  <div class="rule"></div>
  <p class="author">${META.author.toUpperCase()}</p>
  <div class="brand"><img src="${logo}" alt=""><span>BUILD &amp; BLOOM COLLECTIVE</span></div>
`, "cover dark");

const contents = () => page(`
  <p class="eb rust">Inside</p><h2>Contents</h2><div class="rule"></div>
  <div class="toc">
    <div><b>Welcome</b><span>Start here</span></div>
    <div><b>How to use</b><span>Every day, about 15 minutes</span></div>
    ${WEEKS.map((w) => `<div><b>Week ${w.n}</b><span>${w.name}: ${typo(w.sub)} <i>Days ${w.days[0]} to ${w.days[1]}</i></span></div>`).join("")}
    <div><b>Day 21</b><span>My Right Yes: your commitment page</span></div>
    <div><b>Circle</b><span>The Right Yes Circle: the practice in one sitting, for groups</span></div>
    <div><b>Keep going</b><span>Affirmations and what comes next</span></div>
  </div>
`);

const welcome = () => page(`
  <p class="eb rust">Welcome</p><h2>Start here</h2><div class="rule"></div>
  <p class="lede">${typo(META.line)}</p>
  ${WELCOME.map((p) => `<p>${typo(p)}</p>`).join("")}
  <p class="sign">With you,<br><span>${META.author}</span></p>
`);

const how = () => page(`
  <p class="eb rust">How to use this guide</p><h2>Every day, about 15 minutes</h2><div class="rule"></div>
  <div class="how">${HOW.map(([h, d], i) => `<div><b>${i + 1}</b><div><h3>${h}</h3><p>${typo(d)}</p></div></div>`).join("")}</div>
  <div class="weeks">${WEEKS.map((w) => `<div><span class="eb gold">Week ${w.n}</span><h3>${w.name}</h3><p>${typo(w.sub)}</p></div>`).join("")}</div>
  ${HOW_NOTES.map((p) => `<p class="small">${typo(p)}</p>`).join("")}
`);

const week = (w) => page(`
  <p class="eb gold">Week ${w.n} · Days ${w.days[0]} to ${w.days[1]}</p>
  <h1 class="wk">${w.name}</h1>
  <p class="sub">${typo(w.sub)}</p>
  <div class="rule"></div>
  <p class="wkintro">${typo(w.intro)}</p>
  ${w.n === 1 ? `<div class="signs"><p class="eb gold">The six signs of trying</p><ol>${["Busy but not moving", "Planning as protection", "Waiting to be ready", "Carrying everyone else", "Quietly doubting", "Hearing God and still not moving"].map((s) => `<li>${s}</li>`).join("")}</ol></div>` : ""}
`, "dark week");

const dayRead = (d) => page(`
  <p class="eb rust">Day ${d.n}</p>
  <h2 class="day">${typo(d.title)}</h2>
  <p class="tag">${typo(d.line)}</p>
  <div class="reading">${d.reading.map((p) => `<p>${typo(p)}</p>`).join("")}</div>
  <div class="scripture"><p class="eb rust">Scripture · ${d.scripture.ref} (KJV)</p><p class="verse">${typo(d.scripture.text)}</p><p>${typo(d.reflection)}</p></div>
`);

const dayWrite = (d) => {
  const per = d.marks ? 13 : d.prompts.length === 1 ? 19 : 9;
  return page(`
    <div class="step"><p class="eb">Day ${d.n} · Your Right Yes step</p><p>${typo(d.step)}</p></div>
    <p class="eb rust" style="margin-top:22px">Journal</p>
    ${d.marks ? `<div class="marks">${d.marks.map((m) => `<div><span class="box"></span>${typo(m)}</div>`).join("")}</div>` : ""}
    ${d.prompts.map((q) => `<p class="q">${typo(q)}</p>${lines(per)}`).join("")}
  `);
};

const commit = () => page(`
  <p class="eb rust">Day 21 and beyond</p><h2>My Right Yes</h2><div class="rule"></div>
  <div class="commit">${COMMIT.map((c, i) => `<p class="q">${typo(c)}</p>${lines(i === 3 ? 3 : 2)}`).join("")}</div>
  <div class="signrow"><div><div class="ln"></div><span>Signed</span></div><div><div class="ln"></div><span>Date</span></div></div>
`);

const circle1 = () => page(`
  <p class="eb rust">For circles, retreats, and workshops</p><h2>${CIRCLE.title}</h2><div class="rule"></div>
  <p class="lede">${typo(CIRCLE.sub)}</p>
  <p class="small">Work in pairs inside the larger circle. Have pens and a printed card (next page) for each woman. One person keeps time. Scripture is welcome in the circle but never required.</p>
  ${CIRCLE.steps.slice(0, 2).map((s, i) => cstep(s, i)).join("")}
`, "tight");
const circle1b = () => page(`
  <p class="eb rust">${CIRCLE.title} · continued</p>
  ${CIRCLE.steps.slice(2).map((s, i) => cstep(s, i + 2)).join("")}
  <p class="small" style="margin-top:14pt">At the Reset Circle, your right yes becomes the heart of your One Priority plan for the first 90 days of 2027.</p>
`, "tight");
const cstep = (s, i) => `<div class="cstep"><div class="chead"><span class="num">${i + 1}</span><h3>${s.name}</h3><span class="min">${s.minutes} minutes</span></div><p class="clead">${typo(s.lead)}</p><ul>${s.do.map((x) => `<li>${typo(x)}</li>`).join("")}</ul></div>`;

const circle2 = () => page(`
  <p class="eb rust">${CIRCLE.title} · Your card</p><h2>Hear it. Clear it. Say it.</h2><div class="rule"></div>
  ${CIRCLE.card.map((c) => `<p class="q">${typo(c)}</p>${lines(3)}`).join("")}
  <p class="small" style="margin-top:18px">Take this home. Begin Day 1 of the guide this week, and let your right yes become your one priority for the next 90 days.</p>
`);

const keep = () => page(`
  <p class="eb rust">Keep going</p><h2>Say it out loud</h2><div class="rule"></div>
  <p class="small">Read these in the morning, on hard days, or any time you need to remember who you are.</p>
  <div class="aff">${AFFIRMATIONS.map((a) => `<p>${typo(a)}</p>`).join("")}</div>
`);

const closing = () => page(`
  <p class="eb gold">You did it</p><h1 class="wk" style="font-size:44px">What comes next</h1><div class="rule"></div>
  ${CLOSING.map((p) => `<p class="wkintro">${typo(p)}</p>`).join("")}
  <div class="brand" style="margin-top:36px"><img src="${logo}" alt=""><span>BUILD &amp; BLOOM COLLECTIVE</span></div>
  <p class="fine">© ${new Date().getFullYear()} ${META.author}, Build &amp; Bloom Collective. For your personal use. Scripture quotations are from the King James Version. This guide is for reflection and encouragement. It is not therapy, medical, legal, or financial advice.</p>
`, "dark week");

const body = [cover(), contents(), welcome(), how()];
for (const w of WEEKS) {
  body.push(week(w));
  for (const d of DAYS.filter((x) => x.n >= w.days[0] && x.n <= w.days[1])) body.push(dayRead(d), dayWrite(d));
}
body.push(commit(), circle1(), circle1b(), circle2(), keep(), closing());

const css = `
@font-face { font-family: Fraunces; src: url(${font("@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2")}) format("woff2"); font-weight: 100 900; }
@font-face { font-family: Fraunces; font-style: italic; src: url(${font("@fontsource-variable/fraunces/files/fraunces-latin-full-italic.woff2")}) format("woff2"); font-weight: 100 900; }
${[400, 500, 600, 700].map((w) => `@font-face { font-family: Garamond; font-weight: ${w}; src: url(${font(`@fontsource/eb-garamond/files/eb-garamond-latin-${w}-normal.woff2`)}) format("woff2"); }
@font-face { font-family: Garamond; font-weight: ${w}; font-style: italic; src: url(${font(`@fontsource/eb-garamond/files/eb-garamond-latin-${w}-italic.woff2`)}) format("woff2"); }`).join("\n")}
@page { size: 8.5in 11in; margin: 0; }
:root { --esp: #2c1b13; --dark: #3d281d; --ivory: #fffdf8; --cream: #f4ede1; --rust: #8a4426; --gold: #deb547; --green: #4b5e4a; --muted: #7a6a5c; --line: #d9cfc0; }
* { box-sizing: border-box; }
html, body { margin: 0; background: #ddd; }
body { font-family: Garamond, Georgia, serif; color: var(--esp); font-size: 12.4pt; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 8.5in; height: 11in; padding: 0.8in 0.9in 0.95in; position: relative; overflow: hidden; background: var(--ivory); page-break-after: always; break-after: page; }
.page.tight { padding-top: 0.6in; }
.foot { position: absolute; left: 0.9in; right: 0.9in; bottom: 0.45in; display: flex; justify-content: space-between; font-size: 8.5pt; letter-spacing: 0.25em; color: #b3a493; }
h1, h2, h3 { font-family: Fraunces, Georgia, serif; font-weight: 700; margin: 0; line-height: 1.1; }
h2 { font-size: 30pt; color: var(--esp); }
h3 { font-size: 14pt; }
p { margin: 0 0 9pt; }
.eb { font-size: 8.5pt; letter-spacing: 0.28em; text-transform: uppercase; font-weight: 600; margin: 0 0 6pt; }
.rust { color: var(--rust); } .gold { color: var(--gold); }
.rule { width: 70px; height: 3px; background: var(--gold); margin: 14pt 0 18pt; }
.lede { font-size: 15pt; line-height: 1.45; }
.small { font-size: 11pt; color: #4a3a2f; }
.dark { background: var(--esp); color: var(--cream); }
.dark h1 { color: var(--ivory); }
.cover { display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: 0.85in; }
.cover .medal { width: 4.1in; height: 4.1in; border-radius: 50%; padding: 0.14in; background: radial-gradient(circle, #4a3326 0%, #2c1b13 72%); box-shadow: 0 0 0 1px rgba(222,181,71,.35); margin-bottom: 0.4in; }
.cover .medal svg { width: 100%; height: 100%; }
.cover h1 { font-size: 58pt; letter-spacing: -0.01em; margin: 6pt 0 10pt; }
.cover .sub, .week .sub { font-style: italic; font-size: 16pt; color: #e8dcc7; }
.cover .rule, .week .rule { margin: 18pt auto; }
.week .rule { margin-left: 0; }
.author { letter-spacing: 0.32em; font-size: 10pt; font-weight: 600; color: var(--ivory); }
.brand { display: flex; align-items: center; gap: 10px; margin-top: auto; font-size: 8.5pt; letter-spacing: 0.28em; color: var(--gold); font-weight: 600; }
.brand img { width: 30px; height: 33px; }
.cover .brand { margin-bottom: 0.2in; }
.toc > div { display: grid; grid-template-columns: 1.15in 1fr; gap: 12px; padding: 11pt 0; border-bottom: 1px solid var(--line); }
.toc b { font-family: Fraunces; color: var(--gold); font-size: 12pt; }
.toc i { color: var(--muted); font-size: 10.5pt; display: block; }
.sign { margin-top: 18pt; font-style: italic; }
.sign span { font-family: Fraunces; font-style: normal; font-weight: 600; font-size: 14pt; }
.how > div { display: flex; gap: 16px; padding: 10pt 0; border-bottom: 1px solid var(--line); }
.how b { font-family: Fraunces; font-size: 24pt; color: var(--rust); width: 30px; line-height: 1; }
.how p { margin: 3pt 0 0; color: #4a3a2f; }
.weeks { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 22pt 0 18pt; }
.weeks > div { background: var(--esp); color: var(--cream); padding: 14pt; border-radius: 4px 22px 4px 4px; }
.weeks h3 { color: var(--ivory); font-size: 17pt; margin-bottom: 5pt; }
.weeks p { font-size: 10.5pt; margin: 0; }
.week { padding-top: 2.1in; }
h1.wk { font-size: 64pt; margin: 4pt 0 10pt; }
.wkintro { font-size: 14pt; line-height: 1.55; color: #eadfcd; max-width: 5.6in; }
.signs { margin-top: 26pt; border-left: 3px solid var(--gold); padding-left: 16pt; }
.signs ol { margin: 0; padding-left: 18pt; font-size: 13pt; line-height: 1.7; color: var(--ivory); }
h2.day { font-size: 26pt; }
.tag { font-style: italic; color: var(--rust); border-left: 3px solid var(--gold); padding-left: 10pt; margin: 8pt 0 14pt; font-size: 13pt; }
.reading p { margin-bottom: 8pt; }
.scripture { background: var(--cream); border-radius: 4px 18px 4px 4px; padding: 13pt 16pt 8pt; margin-top: 12pt; font-size: 11.5pt; }
.scripture .verse { font-style: italic; font-size: 13pt; line-height: 1.4; }
.step { border: 1.5px solid var(--esp); border-radius: 4px 18px 4px 4px; padding: 13pt 16pt 6pt; }
.step .eb { color: var(--esp); }
.q { font-weight: 600; margin: 16pt 0 2pt; }
.lines div { border-bottom: 1px solid #cfc4b4; height: 27px; }
.marks { display: grid; grid-template-columns: 1fr 1fr; gap: 8pt 18pt; margin: 6pt 0 4pt; }
.marks > div { display: flex; gap: 9px; align-items: center; }
.box { width: 15px; height: 15px; border: 1.5px solid var(--esp); border-radius: 3px; flex: none; }
.commit .q { margin-top: 12pt; }
.signrow { display: flex; gap: 40px; margin-top: 30pt; }
.signrow > div { flex: 1; }
.signrow .ln { border-bottom: 1.5px solid var(--esp); height: 30px; }
.signrow span { font-size: 8.5pt; letter-spacing: 0.25em; text-transform: uppercase; color: var(--muted); }
.cstep { border-top: 1px solid var(--line); padding: 9pt 0 2pt; }
.chead { display: flex; align-items: baseline; gap: 10px; }
.chead .num { font-family: Fraunces; font-weight: 700; color: var(--gold); font-size: 20pt; }
.chead .min { margin-left: auto; font-size: 9pt; letter-spacing: 0.2em; text-transform: uppercase; color: var(--rust); font-weight: 600; }
.clead { font-style: italic; margin: 2pt 0 4pt; }
.cstep ul { margin: 0 0 4pt; padding-left: 18pt; font-size: 11.2pt; line-height: 1.42; }
.cstep li { margin-bottom: 2pt; }
.aff p { font-family: Fraunces; font-size: 17pt; font-weight: 600; line-height: 1.3; padding: 11pt 0; border-bottom: 1px solid var(--line); margin: 0; }
.fine { font-size: 8.5pt; color: #a8977f; margin-top: 18pt; line-height: 1.45; }
`;

const html = `<!doctype html><html><head><meta charset="utf-8"><title>The Right Yes</title><style>${css}</style></head><body>${body.join("\n")}</body></html>`;
const htmlPath = path.join(here, "the-right-yes.html");
writeFileSync(htmlPath, html);

const browser = await chromium.launch();
const pg = await browser.newPage({ viewport: { width: 816, height: 1056 } });
await pg.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
await pg.evaluate(() => document.fonts.ready);
// Make sure nothing spills off the bottom of a page
const over = await pg.evaluate(() => [...document.querySelectorAll(".page")].map((p, i) => {
  const foot = p.querySelector(".foot");
  const limit = (foot ? foot.getBoundingClientRect().top : p.getBoundingClientRect().bottom) - 6;
  const kids = [...p.children].filter((k) => !k.classList.contains("foot"));
  const bottom = Math.max(...kids.map((k) => k.getBoundingClientRect().bottom));
  return bottom > limit ? `page ${i + 1} overflows by ${Math.round(bottom - limit)}px` : null;
}).filter(Boolean));
if (over.length) { console.error("Too long:\n" + over.join("\n")); process.exitCode = 1; }
await pg.pdf({ path: path.join(root, "public/guides/The-Right-Yes.pdf"), width: "8.5in", height: "11in", printBackground: true, preferCSSPageSize: true });
// Shop cover: the first page, 800 wide
const cov = await browser.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 800 / 816 });
await cov.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
await cov.evaluate(() => document.fonts.ready);
await cov.locator(".page").first().screenshot({ path: path.join(root, "public/shop/the-right-yes.png") });
await browser.close();
console.log(`Built ${pageNo} pages.`);
