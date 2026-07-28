// process.env.API_BASE_URL is substituted at build time by webpack's DefinePlugin
// (see webpack.config.js) - there is no real `process` global in the browser.

declare const process: {
  env: {
    API_BASE_URL?: string;
  };
};
