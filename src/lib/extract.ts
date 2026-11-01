import { extensionOf } from "./files";

export type ExtractedDocument = {
  text: string;
  warning: string | null;
};

export async function extractDocument(
  filename: string,
  bytes: Uint8Array,
): Promise<ExtractedDocument> {
  const ext = extensionOf(filename);

  if (ext === ".txt" || ext === ".md") {
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes).trim();
    if (!text) {
      return { text: "", warning: "That text file is empty." };
    }
    return { text, warning: null };
  }

  if (ext === ".pdf") {
    return extractPdf(copyBytes(bytes));
  }

  throw new Error("Use a PDF or a .txt file.");
}

function copyBytes(bytes: Uint8Array): Uint8Array {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy;
}

async function extractPdf(bytes: Uint8Array): Promise<ExtractedDocument> {
  const { extractText } = await import("unpdf");
  const result = await extractText(bytes, { mergePages: true });
  const raw = result.text;
  const text = normalizeExtractedText(Array.isArray(raw) ? raw.join("\n") : raw);

  if (!text) {
    return {
      text: "",
      warning:
        "No selectable text in this PDF. It may be a scan. Paste the text or use a text-based PDF.",
    };
  }

  return { text, warning: null };
}

const SUPERSCRIPT: Record<string, string> = {
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
  "⁺": "+",
  "⁻": "-",
};

export function normalizeExtractedText(value: string): string {
  return value
    .replace(/\u0000/g, "")
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g, (run) =>
      `^${[...run].map((character) => SUPERSCRIPT[character] ?? character).join("")}`,
    )
    .replace(/[−–—]/g, "-")
    .trim();
}
