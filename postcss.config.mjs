const config = {
  plugins: [
    ["@tailwindcss/postcss", {
      base: null,
      content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
      ],
    }],
    // CSS optimization plugins
    ...(process.env.NODE_ENV === 'production' ? [
      'autoprefixer',
      ['cssnano', {
        preset: ['default', {
          discardComments: { removeAll: true },
          normalizeWhitespace: true,
          minifySelectors: true,
          minifyFontValues: true,
        }]
      }]
    ] : [])
  ],
};

export default config;
