import {
  downloadFile,
  loadSample,
  localFiles,
  transformFile,
} from "./local-files";
import { safeText } from "./local-decay";
import { PRESETS, recipeSearch, SAMPLES } from "./recipes";
import lessons from "../generated/lessons.json";
export interface CommandIO {
  print: (line: string) => void;
  chooseFile: () => void;
  clear: () => void;
  navigate: (path: string) => void;
  matrix: () => void;
  art: (name: string) => Promise<void>;
}
export const COMMAND_HELP: Record<string, string> = {
  help: "Show commands",
  load: "Choose a local file (5 MiB maximum)",
  upload: "Alias for load; never uploads",
  list: "List files in this tab",
  "select <id>": "Select a file in the visual workbench",
  "rot <id> --level N [--mode M] [--seed S]":
    "Run decay and update the workbench",
  "view <id> [level]": "Download original (0) or latest result",
  "forget <id>": "Remove a file from this tab",
  "freeze <id>": "Explain on-demand decay",
  "sample <lunar|transmission>": "Choose a bundled sample",
  "preset <1|2|3>": "Run a named experiment",
  "replay <id> <run-number>": "Recompute a previous run from the original",
  "recipe <id>": "Get a share link for the latest bundled-sample run",
  "lessons [list|lesson-id]": "Read lessons; /learn has interactive challenges",
  clear: "Clear terminal",
  exit: "Return home",
  matrix: "A familiar distraction; any key stops it",
  cow: "Moo",
  doge: "Such wow",
  parrot: "Party time",
  xyzzy: "A hollow voice",
  id10t: "Report a user error",
  "sudo make me a sandwich": "Ask nicely",
};
export const COMMAND_NAMES = Object.keys(COMMAND_HELP).map(
  (key) => key.split(" ")[0],
);
export async function executeCommand(
  line: string,
  io: CommandIO,
): Promise<void> {
  const [command, ...args] = line.trim().split(/\s+/);
  const print = (text: string) => io.print(text);
  const id = () => {
    if (!args[0]) throw new Error(`Usage: ${command} <file-id>`);
    return args[0];
  };
  switch (command) {
    case "":
      return;
    case "help":
      print("BITROT / COMMAND REFERENCE");
      for (const [usage, description] of Object.entries(COMMAND_HELP))
        print(`${usage}\n  ${description}`);
      return;
    case "load":
    case "upload":
      io.chooseFile();
      return;
    case "clear":
      io.clear();
      return;
    case "exit":
      io.navigate("/");
      return;
    case "list":
      print(
        `${localFiles.list().length} local files. Reloading clears this tab.`,
      );
      for (const file of localFiles.list())
        print(
          `${file.id}\n  ${safeText(file.filename)} · ${(file.size / 1024).toFixed(1)} KiB · level ${file.currentLevel}`,
        );
      return;
    case "select":
      localFiles.select(id());
      print("Selected in workbench.");
      return;
    case "rot": {
      const fileId = id();
      const flags: Record<string, string> = {};
      for (let i = 1; i < args.length; i += 2) {
        if (
          !["--level", "--mode", "--seed"].includes(args[i]) ||
          !args[i + 1] ||
          Object.hasOwn(flags, args[i])
        )
          throw new Error(
            "Use rot <id> --level 0–10 [--mode bit-flip|ascii-shuffle|color-drain] [--seed value].",
          );
        flags[args[i]] = args[i + 1];
      }
      print("Processing locally…");
      const run = await transformFile(
        fileId,
        flags["--level"],
        flags["--mode"],
        flags["--seed"],
      );
      print(
        `${run.metrics.changed.toLocaleString()} bytes changed. Level ${run.recipe.level}, seed ${run.recipe.seed}.\nWorkbench updated. Use view ${fileId} to download.`,
      );
      return;
    }
    case "view":
      print(`Download prepared: ${safeText(downloadFile(id(), args[1]))}`);
      return;
    case "forget":
      localFiles.forget(id());
      print("Removed from this tab. Your original on disk is untouched.");
      return;
    case "freeze":
      localFiles.get(id());
      print(
        "Local files never decay automatically. Every experiment transforms a copy of the original. Freeze does not create a backup.",
      );
      return;
    case "sample": {
      const sample = SAMPLES.find((item) => item.id === args[0]);
      if (!sample) throw new Error("Use sample lunar or sample transmission.");
      const file = await loadSample(sample.id);
      localFiles.select(file.id);
      print(`${sample.name}\nID: ${file.id}`);
      return;
    }
    case "preset": {
      const preset = /^[1-3]$/.test(args[0])
        ? PRESETS[Number(args[0]) - 1]
        : undefined;
      if (!preset) throw new Error("Use preset 1, 2 or 3.");
      const file = await loadSample(preset.recipe.sample!);
      await transformFile(
        file.id,
        String(preset.recipe.level),
        preset.recipe.mode,
        preset.recipe.seed,
      );
      print(`${preset.name}\nID: ${file.id}`);
      return;
    }
    case "replay": {
      const file = localFiles.get(id());
      const previous = /^[1-9][0-9]?$/.test(args[1])
        ? file.history[Number(args[1]) - 1]
        : undefined;
      if (!previous)
        throw new Error(
          "Choose a run number from the file’s current timeline.",
        );
      const { level, mode, seed } = previous.recipe;
      await transformFile(file.id, String(level), mode, seed);
      print("Replayed from the original. Workbench updated.");
      return;
    }
    case "recipe": {
      const file = localFiles.get(id());
      if (!file.run) throw new Error("Run an experiment first.");
      print(`${location.origin}/lab?${recipeSearch(file.run.recipe)}`);
      return;
    }
    case "lessons": {
      if (!args[0] || args[0] === "list") {
        lessons.forEach((lesson) => print(`${lesson.id} — ${lesson.title}`));
        print("Open /learn for the interactive challenges.");
        return;
      }
      const lesson = lessons.find((item) => item.id === args[0]);
      if (!lesson) throw new Error("Unknown lesson. Use lessons list.");
      print(`${lesson.title}\n\n${lesson.body}`);
      return;
    }
    case "cow":
    case "doge":
    case "parrot":
      await io.art(command);
      return;
    case "matrix":
      io.matrix();
      return;
    case "xyzzy":
      print("Nothing happens.");
      return;
    case "id10t":
      print("User fault detected between keyboard and chair.");
      return;
    case "sudo":
      print(
        args.join(" ") === "make me a sandwich"
          ? "Okay, Jim."
          : "Did you mean: sudo make me a sandwich?",
      );
      return;
    default:
      throw new Error(
        `Command not found: ${safeText(command)}. Type help for commands.`,
      );
  }
}
