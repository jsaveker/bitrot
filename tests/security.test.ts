import assert from "node:assert/strict";
import { test } from "node:test";
import { onRequest as upload } from "../functions/upload";
import { onRequest as list } from "../functions/list";
import { onRequest as rot } from "../functions/rot";
import { onRequest as freeze } from "../functions/freeze";
import { onRequest as view } from "../functions/view/[[path]]";
import { onRequest as middleware } from "../functions/_middleware";
import { scheduled } from "../functions/cron-decay";
import { isRetiredFilePath } from "../server/retired-files";
import { LocalFiles } from "../src/lib/local-files";
import {
  decayBytes,
  parseLevel,
  parseMode,
  pngDimensions,
  MAX_FILE_BYTES,
  safeText,
  downloadName,
} from "../src/lib/local-decay";

const forbidden = new Proxy(
  {},
  {
    get() {
      throw new Error(
        "Retired handlers must never read request data or storage.",
      );
    },
  },
);

for (const [name, handler] of Object.entries({
  upload,
  list,
  rot,
  freeze,
  view,
})) {
  test(`${name}: all methods fail closed before touching input or storage`, async () => {
    for (const method of [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
      "HEAD",
    ]) {
      const response = await handler({
        request: forbidden,
        env: forbidden,
        params: forbidden,
        data: forbidden,
      } as never);
      assert.equal(response.status, 410, method);
      assert.match(response.headers.get("content-type")!, /^application\/json/);
      assert.equal(response.headers.get("x-content-type-options"), "nosniff");
      assert.match(response.headers.get("cache-control")!, /no-store/);
      assert.match(
        response.headers.get("content-security-policy")!,
        /default-src 'none'/,
      );
      assert.equal(
        ((await response.json()) as { code: string }).code,
        "CLOUD_FILES_RETIRED",
      );
    }
  });
}

test("middleware blocks bare, nested, encoded and mixed-case legacy paths", async () => {
  for (const path of [
    "/upload",
    "/upload/extra",
    "/view",
    "/view/id/0",
    "/list/",
    "/rot",
    "/freeze",
    "/UPLOAD",
    "/%76iew/id",
  ]) {
    const response = await middleware({
      request: new Request(`https://test.invalid${path}`),
      next: () => {
        throw new Error("Must not fall through");
      },
    } as never);
    assert.equal(response.status, 410, path);
  }
  for (const path of ["/lab", "/lessons", "/assets/view.js", "/listening"])
    assert.equal(isRetiredFilePath(path), false);
  const response = await middleware({
    request: new Request("https://test.invalid/lessons"),
    next: async () => new Response("lesson"),
  } as never);
  assert.equal(await response.text(), "lesson");
});

test("old scheduled entry point cannot touch stored files", async () => {
  await scheduled(forbidden as never, forbidden as never, forbidden as never);
});

test("strict level and mode validation rejects pathological inputs", () => {
  for (const value of [
    "-1",
    "11",
    "1000000",
    "Infinity",
    "NaN",
    "1e3",
    "1.5",
    "1junk",
    "01",
    "",
    true,
    undefined,
  ])
    assert.throws(() => parseLevel(value));
  for (const value of ["0", "1", "10"])
    assert.equal(parseLevel(value), Number(value));
  assert.throws(() => parseMode("jpeg-glitch"));
  assert.equal(parseMode(undefined), "bit-flip");
});

test("transformations preserve the original and use bounded work", () => {
  const original = new Uint8Array([65, 66, 67, 68]);
  assert.deepEqual(decayBytes(original, "bit-flip", 0), original);
  assert.notDeepEqual(
    decayBytes(original, "bit-flip", 1, () => 0),
    original,
  );
  assert.deepEqual(original, new Uint8Array([65, 66, 67, 68]));
  assert.deepEqual(
    decayBytes(original, "ascii-shuffle", 1, () => 0),
    new Uint8Array([66, 65, 67, 68]),
  );
  assert.throws(() => decayBytes(new Uint8Array([255]), "ascii-shuffle", 1));
  let calls = 0;
  decayBytes(new Uint8Array(MAX_FILE_BYTES), "bit-flip", 10, () => {
    calls++;
    return 0.5;
  });
  assert.ok(calls <= 2_000_000);
});

test("PNG dimensions are checked before decoding", () => {
  const bytes = new Uint8Array(33);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  bytes.set([73, 72, 68, 82], 12);
  const data = new DataView(bytes.buffer);
  data.setUint32(16, 100);
  data.setUint32(20, 100);
  assert.deepEqual(pngDimensions(bytes), { width: 100, height: 100 });
  data.setUint32(16, 100000);
  assert.throws(() => pngDimensions(bytes));
  assert.throws(() => pngDimensions(new TextEncoder().encode("<svg/>")));
});

test("local stores are isolated and enforce file-count and byte budgets", () => {
  const first = new LocalFiles(),
    other = new LocalFiles();
  const file = first.add("sample.txt", new Uint8Array([65, 66]));
  assert.equal(other.list().length, 0);
  assert.throws(() => other.get(file.id));
  first.saveResult(file.id, 1, new Uint8Array([67, 68]));
  assert.deepEqual(first.get(file.id).original, new Uint8Array([65, 66]));
  assert.throws(() => first.add("empty", new Uint8Array()));
  assert.throws(() => first.add("large", new Uint8Array(MAX_FILE_BYTES + 1)));
  first.forget(file.id);
  assert.throws(() => first.get(file.id));
  for (let i = 0; i < 10; i++) first.add("small", new Uint8Array([65]));
  assert.throws(() => first.add("extra", new Uint8Array([65])));
  for (let i = 0; i < 4; i++) other.add("big", new Uint8Array(MAX_FILE_BYTES));
  assert.throws(() => other.add("extra", new Uint8Array([65])));
});

test("labels cannot inject terminal controls and download names retain extensions", () => {
  assert.equal(safeText("evil\x1b[2J\r\n\u202efile.txt"), "evil[2Jfile.txt");
  assert.equal(downloadName("example.txt", 2), "example_level2.txt");
  assert.equal(
    downloadName("folder/evil\n.html", 0),
    "folder_evil_level0.html",
  );
});
