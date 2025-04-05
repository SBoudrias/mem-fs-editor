/** @type {import("prettier").Config} */
const config = {
  endOfLine: 'auto',
  singleQuote: true,
  printWidth: 120,
  overrides: [
    {
      files: ['tsconfig.json'],
      options: {
        trailingComma: 'none',
      },
    },
  ],
};

export default config;
