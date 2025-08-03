function formatCodeBraces(input) {
  return (
    input
      // Put line break after opening braces
      .replace(/({)([^\s])/g, (_, brace, next) => `${brace}\n${next}`)
      // Put line break before closing braces
      .replace(/([^\s])(\})/g, (_, prev, brace) => `${prev}\n${brace}`)
      // Put closing brace on its own line if followed by else/catch/finally
      .replace(/\}\s*(else|catch|finally)/g, `}\n$1`)
      // Ensure braces are not spaced away from the block
      .replace(/\s*{\s*/g, " {\n")
      .replace(/\s*}\s*/g, "\n}\n")
      // Collapse extra line breaks
      .replace(/\n{2,}/g, "\n")
  );
}

function normalizeSpacing(code) {
  return (
    code
      // Space around binary operators
      .replace(/([^\s])([=+\-*/%<>!]=?=?)\s*/g, "$1 $2 ")
      .replace(/\s*([=+\-*/%<>!]=?=?)\s*([^\s])/g, " $1 $2")

      // Ensure one space after commas, none before
      .replace(/\s*,\s*/g, ", ")

      // Remove space before semicolon, ensure only one after
      .replace(/\s*;\s*/g, "; ")

      // Clean up extra spaces
      .replace(/[ ]{2,}/g, " ")
  );
}

export function formatCode(input) {
  let formatted = formatCodeBraces(input);
  formatted = normalizeSpacing(formatted);
  return formatted.trim();
}


