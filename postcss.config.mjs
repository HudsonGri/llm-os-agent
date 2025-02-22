/** @type {import('postcss-load-config').Config} */
const config = {
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            'code::before': {
              content: '""'
            },
            'code::after': {
              content: '""'
            }
          }
        }
      },
    },
  },
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
