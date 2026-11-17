import { describe, expect, it } from "vitest";
import { MESSAGES } from "./index";

// Every app source file as text (tests excluded), so we can find each t("…") / msg("…") call.
const sources = import.meta.glob(
  ["/src/**/*.{ts,tsx}", "!/src/**/*.test.{ts,tsx}", "!/src/test/**"],
  {
    query: "?raw",
    import: "default",
    eager: true,
  },
) as Record<string, string>;

const CALL = /\b(?:t|msg)\(\s*"((?:[^"\\]|\\.)*)"/g;

function wrappedStrings() {
  const found = new Map<string, string>();
  for (const [file, text] of Object.entries(sources)) {
    for (const match of text.matchAll(CALL)) {
      const value = JSON.parse(`"${match[1]}"`) as string;
      if (!found.has(value)) found.set(value, file);
    }
  }
  return found;
}

const placeholders = (s: string) =>
  [...s.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1])
    .sort()
    .join(",");

describe("translations", () => {
  const strings = wrappedStrings();

  it("finds the wrapped UI strings", () => {
    expect(strings.size).toBeGreaterThan(100);
  });

  for (const locale of Object.keys(MESSAGES) as Array<keyof typeof MESSAGES>) {
    it(`has a ${locale} translation for every wrapped string`, () => {
      const missing = [...strings]
        .filter(([text]) => !MESSAGES[locale][text])
        .map(([text, file]) => `${file}: ${text}`);
      expect(missing).toEqual([]);
    });

    it(`keeps {placeholders} intact in ${locale}`, () => {
      const broken = Object.entries(MESSAGES[locale])
        .filter(([source, target]) => placeholders(source) !== placeholders(target))
        .map(([source]) => source);
      expect(broken).toEqual([]);
    });
  }
});
