const INDENT_SIZE = 2;
const INDENT_UNIT = " ".repeat(INDENT_SIZE);

export function formatCode(input = "") {
  const normalized = input
    .replace(/\t/g, INDENT_UNIT)
    .replace(/\r\n?/g, "\n");

  const lines = normalized.split("\n");
  let indentLevel = 0;
  const formatted = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return "";
    }

    const shouldOutdent = /^(?:[)\]}]|case\b|default\b)/.test(trimmed);
    if (shouldOutdent) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    const padding = INDENT_UNIT.repeat(indentLevel);
    const resultLine = padding + trimmed;

    if (/[{[(]$/.test(trimmed) || /=>\s*{$/.test(trimmed)) {
      indentLevel += 1;
    }

    if (/^case\b.*:/.test(trimmed)) {
      indentLevel += 1;
    }

    return resultLine;
  });

  return formatted.join("\n").trimEnd();
}
