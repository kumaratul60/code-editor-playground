export function formatCode(input) {
  if (window.prettier && window.prettierPlugins) {
    try {
      return window.prettier.format(input, {
        parser: "babel",
        plugins: window.prettierPlugins,
        semi: true,
        singleQuote: true,
        tabWidth: 2,
      });
    } catch (e) {
      // If formatting fails, return original code
      return input;
    }
  }
  // Fallback: return original code if Prettier not loaded
  return input;
}