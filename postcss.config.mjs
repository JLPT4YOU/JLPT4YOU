const config = {
  plugins: [
    "@tailwindcss/postcss",
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
