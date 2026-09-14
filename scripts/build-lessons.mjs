import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
const directory = new URL("../content/lessons/", import.meta.url);
const names = (await readdir(directory))
  .filter((name) => name.endsWith(".json"))
  .sort();
const lessons = await Promise.all(
  names.map(async (name) => {
    const lesson = JSON.parse(await readFile(new URL(name, directory), "utf8"));
    if (
      !/^[a-z0-9-]+$/.test(lesson.id) ||
      !["checksum", "backup"].includes(lesson.kind) ||
      !["title", "summary", "body"].every(
        (key) => typeof lesson[key] === "string" && lesson[key].trim(),
      )
    )
      throw new Error(`Invalid lesson: ${name}`);
    return lesson;
  }),
);
if (new Set(lessons.map((lesson) => lesson.id)).size !== lessons.length)
  throw new Error("Duplicate lesson IDs");
await mkdir(new URL("../src/generated/", import.meta.url), { recursive: true });
await writeFile(
  new URL("../src/generated/lessons.json", import.meta.url),
  JSON.stringify(lessons, null, 2) + "\n",
);
for (const lesson of lessons)
  await writeFile(
    new URL(`../public/lessons/${lesson.id}.txt`, import.meta.url),
    `${lesson.title}\n${"=".repeat(lesson.title.length)}\n\n${lesson.body}\n\nOpen /learn for the interactive challenge.\n`,
  );
console.log(`Generated ${lessons.length} lessons from content/lessons.`);
