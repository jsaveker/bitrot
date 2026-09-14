import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import {
  compareBytes,
  decayBytes,
  parseSeed,
  seededRandom,
} from "../src/lib/local-decay";
import { parseRecipe, recipeSearch, PRESETS } from "../src/lib/recipes";
import { LocalFiles, type ExperimentRun } from "../src/lib/local-files";
import { sha256, flipOneBit } from "../src/lib/integrity";
import { executeCommand, type CommandIO } from "../src/lib/commands";
import lessons from "../src/generated/lessons.json";
import { onRequestGet } from "../functions/lessons";

test("version 1 byte experiments have a stable golden result and preserve the original", () => {
  const bytes = new TextEncoder().encode("0123456789".repeat(10));
  const result = decayBytes(bytes, "bit-flip", 5, seededRandom("fixture-v1"));
  assert.equal(
    Buffer.from(result).toString("hex"),
    "30313233343536373839303132333435363738393031323334353637383930313233343536373839303132b31435367738393031323334353637383930313233343536373839303132333435363738383031323334353637383930313232343536373839",
  );
  assert.deepEqual(
    result,
    decayBytes(bytes, "bit-flip", 5, seededRandom("fixture-v1")),
  );
  assert.notDeepEqual(
    result,
    decayBytes(bytes, "bit-flip", 5, seededRandom("another-seed")),
  );
  assert.equal(new TextDecoder().decode(bytes), "0123456789".repeat(10));
  const shuffled = decayBytes(
    bytes,
    "ascii-shuffle",
    10,
    seededRandom("voyager"),
  );
  assert.deepEqual(shuffled.slice().sort(), bytes.slice().sort());
  assert.deepEqual(
    shuffled,
    decayBytes(bytes, "ascii-shuffle", 10, seededRandom("voyager")),
  );
});

test("measured changes count actual differences, including repeated flips and length changes", () => {
  assert.deepEqual(
    compareBytes(new Uint8Array([0, 255]), new Uint8Array([1, 0])).bits,
    9,
  );
  const original = new Uint8Array([65]);
  const output = decayBytes(original, "bit-flip", 10, () => 0);
  assert.equal(compareBytes(original, output).changed, 1);
  const growth = compareBytes(new Uint8Array([1]), new Uint8Array([1, 2]));
  assert.equal(growth.total, 2);
  assert.equal(growth.changed, 1);
  assert.equal(growth.bits, 8);
  assert.ok(growth.buckets.every((value) => value >= 0 && value <= 1));
});

test("share recipes round-trip presets, reject unsupported versions and never serialize file metadata", () => {
  for (const preset of PRESETS)
    assert.deepEqual(parseRecipe(recipeSearch(preset.recipe)), preset.recipe);
  assert.equal(parseRecipe(""), null);
  for (const query of [
    "v=2&sample=lunar",
    "v=1&sample=private.txt",
    "sample=lunar",
    "v=1&sample=lunar&mode=color-drain&level=999&seed=x",
    "v=1&sample=lunar&mode=color-drain&level=1&seed=%3Cscript%3E",
  ])
    assert.throws(() => parseRecipe(query));
  assert.throws(() =>
    recipeSearch({ v: 1, level: 1, mode: "bit-flip", seed: "x" }),
  );
  const query = recipeSearch({
    ...PRESETS[0].recipe,
    filename: "private.txt",
    bytes: "secret",
  } as never);
  assert.ok(!query.includes("private") && !query.includes("secret"));
  for (const seed of ["", "x".repeat(33), "hello world", "\u001b[2J", 123])
    assert.throws(() => parseSeed(seed));
});

test("local history is bounded metadata, replay cannot replace the original, and subscribers update", () => {
  const store = new LocalFiles();
  let notifications = 0;
  const stop = store.subscribe(() => notifications++);
  const file = store.add("test.txt", new Uint8Array([65]));
  for (let i = 0; i < 15; i++) {
    const run: ExperimentRun = {
      id: String(i),
      recipe: { v: 1, mode: "bit-flip", level: 1, seed: "x" },
      metrics: compareBytes(file.original, new Uint8Array([64])),
    };
    store.saveResult(file.id, 1, new Uint8Array([64]), run);
  }
  assert.equal(file.history.length, 12);
  assert.equal(file.history[0].id, "3");
  assert.equal(file.original[0], 65);
  assert.equal(file.latest[0], 64);
  assert.equal(notifications, 16);
  assert.ok(file.history.every((run) => !Object.hasOwn(run, "bytes")));
  store.processing = true;
  assert.throws(() => store.forget(file.id));
  store.processing = false;
  stop();
  store.forget(file.id);
  assert.equal(notifications, 16);
  assert.equal(store.selectedId, null);
});

test("integrity challenges use SHA-256 and a real single-bit mutation", async () => {
  const input = new TextEncoder().encode("abc");
  assert.equal(
    await sha256(input),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  const backup = input.slice(),
    damaged = flipOneBit(input, 0);
  assert.equal(compareBytes(input, damaged).bits, 1);
  assert.notEqual(await sha256(damaged), await sha256(input));
  assert.equal(await sha256(backup), await sha256(input));
  assert.throws(() => flipOneBit(input, 9));
});

test("terminal lessons and compatibility endpoint use generated content without fetching", async () => {
  const output: string[] = [];
  const forbidden = () => {
    throw new Error("Unexpected side effect");
  };
  const io: CommandIO = {
    print: (text) => output.push(text),
    chooseFile: forbidden,
    clear: forbidden,
    navigate: forbidden,
    matrix: forbidden,
    art: async () => forbidden(),
  };
  await executeCommand("lessons 2-backups", io);
  assert.ok(output.join("\n").includes("does not create a backup"));
  await assert.rejects(() => executeCommand("__proto__", io));
  await assert.rejects(() =>
    executeCommand("rot fake --level 2 --unknown x", io),
  );
  const response = await onRequestGet({} as never);
  assert.deepEqual(
    await response.json(),
    lessons.map(({ id, title }) => ({ id, title })),
  );
  for (const lesson of lessons) {
    const source = JSON.parse(
      await readFile(
        new URL(`../content/lessons/${lesson.id}.json`, import.meta.url),
        "utf8",
      ),
    );
    assert.deepEqual(lesson, source);
  }
});

test('local file loading validates before reading and preserves literal markup as bytes', async () => {
  const { loadLocalFile, localFiles } = await import('../src/lib/local-files');
  const markup = '<script>document.title="UNSAFE PREVIEW"</script>';
  const file = await loadLocalFile(new File([markup], 'inert.html'));
  assert.equal(new TextDecoder().decode(file.original), markup);
  assert.equal(file.sample, undefined);
  assert.throws(() => recipeSearch({ v: 1, level: 1, mode: 'bit-flip', seed: 'x', sample: file.id } as never));
  localFiles.forget(file.id);
  await assert.rejects(() => loadLocalFile(new File([], 'empty.txt')));
  let read = false;
  await assert.rejects(() => loadLocalFile({ size: 5 * 1024 * 1024 + 1, arrayBuffer: () => { read = true; throw new Error('Must not read'); } } as never));
  assert.equal(read, false);
});
