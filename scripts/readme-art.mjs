import { mkdir, writeFile } from "node:fs/promises";
const dir = new URL("../docs/images/", import.meta.url);
await mkdir(dir, { recursive: true });
const svg = (w, h, title, desc, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title desc"><title id="title">${title}</title><desc id="desc">${desc}</desc>${body}</svg>\n`;
const text = (x, y, size, fill, str, extra = "") =>
  `<text x="${x}" y="${y}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" fill="${fill}" ${extra}>${str}</text>`;
let pixels = "";
for (let row = 0; row < 10; row++)
  for (let col = 0; col < 15; col++) {
    const n = (row * 31 + col * 17) % 19;
    if (col > 7 && n < col - 6) continue;
    const offset = col > 8 ? (n % 4) * 7 : 0;
    pixels += `<rect x="${763 + col * 22 + offset}" y="${84 + row * 23 + (col > 9 ? (n % 3) * 6 : 0)}" width="16" height="16" rx="2" fill="${col < 6 ? "#b7f36b" : col < 10 ? "#5ce1d2" : "#bb8cff"}" opacity="${0.24 + (n % 7) / 10}"/>`;
  }
let lines = "";
for (let y = 1; y < 420; y += 8)
  lines += `<path d="M0 ${y}H1200" stroke="#d9ffe0" stroke-opacity=".025"/>`;
await writeFile(
  new URL("bitrot-banner.svg", dir),
  svg(
    1200,
    420,
    "BITROT — break a few bits, learn what survives",
    "A neon green wordmark beside a matrix of data pixels breaking into cyan and violet fragments.",
    `
<defs><linearGradient id="bg"><stop stop-color="#0a171c"/><stop offset="1" stop-color="#171126"/></linearGradient></defs>
<rect width="1200" height="420" rx="20" fill="url(#bg)"/>${lines}
<rect x="24" y="24" width="1152" height="372" rx="12" fill="none" stroke="#76a58e" stroke-opacity=".25"/>
<circle cx="50" cy="49" r="5" fill="#f77886"/><circle cx="68" cy="49" r="5" fill="#f4d06f"/><circle cx="86" cy="49" r="5" fill="#b7f36b"/>
${text(114, 54, 12, "#8aa59e", "bitrot.sh / data decay laboratory", 'letter-spacing="2"')}
${text(60, 188, 105, "#b7f36b", "BITROT", 'font-weight="900" letter-spacing="3"')}
<path d="M62 201H438" stroke="#b7f36b" stroke-width="3"/>
${text(60, 252, 28, "#f1f7f0", "Break a few bits. Learn what survives.", 'font-weight="700"')}
${text(60, 290, 18, "#a5bbb7", "Data decay · integrity lessons · files stay on your device")}
${text(60, 362, 12, "#67d7c7", "[ LOCAL-ONLY LAB ]", 'letter-spacing="2"')}
${text(899, 362, 12, "#a4adc3", "0100 → 0110", 'letter-spacing="5"')}${pixels}`,
  ),
);
const card = (x, num, label, line1, line2, color) =>
  `<rect x="${x}" y="30" width="340" height="156" rx="12" fill="#10232b" stroke="#28424b"/>${text(x + 22, 60, 12, color, num, 'font-weight="700" letter-spacing="2"')}${text(x + 22, 94, 24, "#edf7f4", label, 'font-weight="700"')}${text(x + 22, 130, 16, "#aec3c7", line1)}${text(x + 22, 154, 16, "#aec3c7", line2)}`;
await writeFile(
  new URL("architecture.svg", dir),
  svg(
    1200,
    270,
    "Local files, local experiments",
    "Local files stay in tab memory, a browser worker transforms a copy, and downloads save the result without uploading file data.",
    `
<rect width="1200" height="270" rx="16" fill="#0a171c"/>
${card(30, "01 / CHOOSE", "Local file", "Original held in tab memory", "No upload or cloud archive", "#b7f36b")}
${card(430, "02 / EXPERIMENT", "Browser worker", "Bounded transformations", "Your original stays unchanged", "#5ce1d2")}
${card(830, "03 / SAVE", "Download", "Save the original or result", "Close the page to clear the tab", "#bb8cff")}
<path d="M384 108H413m-8-7 8 7-8 7M784 108H813m-8-7 8 7-8 7" fill="none" stroke="#5ce1d2" stroke-width="2"/>
${text(600, 235, 16, "#94acae", "File contents and filenames never leave your browser.", 'text-anchor="middle"')}`,
  ),
);
console.log("Generated Bitrot README banner and architecture graphic.");
