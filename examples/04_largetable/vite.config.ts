import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    /*
    jsxFactory: '_jsx',
    jsxFragment: '_Fragment',
    jsxInject: `import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime"`
    */
    jsxInject: `import React from "react"`,
  },
});
