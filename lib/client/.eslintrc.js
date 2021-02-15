const baseConfig = require("../../.eslintrc.js");
baseConfig.parserOptions.project = [
  "tsconfig.json",
  "tsconfig.test.json"
];

module.exports = baseConfig;
