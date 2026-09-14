import {
  parseLevel,
  parseMode,
  parseSeed,
  type DecayMode,
} from "./local-decay";

export const SAMPLES = [
  {
    id: "lunar",
    name: "Lunar archive",
    filename: "lunar.png",
    path: "/samples/lunar.png",
    type: "PNG IMAGE",
    mode: "color-drain",
  },
  {
    id: "transmission",
    name: "Deep-space transmission",
    filename: "transmission.txt",
    path: "/samples/transmission.txt",
    type: "ASCII TEXT",
    mode: "ascii-shuffle",
  },
] as const;
export type SampleId = (typeof SAMPLES)[number]["id"];
export interface Recipe {
  v: 1;
  mode: DecayMode;
  level: number;
  seed: string;
  sample?: SampleId;
}
export const PRESETS: { name: string; description: string; recipe: Recipe }[] =
  [
    {
      name: "Fading photograph",
      description: "Watch the lunar archive lose its light.",
      recipe: {
        v: 1,
        sample: "lunar",
        mode: "color-drain",
        level: 5,
        seed: "apollo",
      },
    },
    {
      name: "Scrambled transmission",
      description: "The right characters. The wrong places.",
      recipe: {
        v: 1,
        sample: "transmission",
        mode: "ascii-shuffle",
        level: 7,
        seed: "voyager",
      },
    },
    {
      name: "One noisy channel",
      description: "Small bit changes, unpredictable damage.",
      recipe: {
        v: 1,
        sample: "transmission",
        mode: "bit-flip",
        level: 3,
        seed: "signal",
      },
    },
  ];
export function parseRecipe(search: string): Recipe | null {
  const params = new URLSearchParams(search);
  if (!params.has("v")) {
    if (["sample", "mode", "level", "seed"].some((key) => params.has(key)))
      throw new Error(
        "This recipe is missing its version. Choose a preset to start again.",
      );
    return null;
  }
  if (params.get("v") !== "1")
    throw new Error(
      "This experiment version is not supported. Choose a preset to start again.",
    );
  const sample = SAMPLES.find((item) => item.id === params.get("sample"));
  if (!sample) throw new Error("Shared recipes must use a bundled sample.");
  return {
    v: 1,
    sample: sample.id,
    mode: parseMode(params.get("mode")),
    level: parseLevel(params.get("level")),
    seed: parseSeed(params.get("seed")),
  };
}
export function recipeSearch(recipe: Recipe): string {
  if (!SAMPLES.some((item) => item.id === recipe.sample))
    throw new Error(
      "Only bundled sample recipes can be shared. Your local files stay private.",
    );
  if (recipe.v !== 1) throw new Error("Unsupported recipe version.");
  return new URLSearchParams({
    v: "1",
    sample: recipe.sample!,
    mode: parseMode(recipe.mode),
    level: String(parseLevel(String(recipe.level))),
    seed: parseSeed(recipe.seed),
  }).toString();
}
