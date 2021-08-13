import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  verbose: true,
  moduleFileExtensions: ["js", "jsx", "json", "ts", "tsx", "node"],
  testMatch: ["**/tests/**/(*.test|*.spec).ts"],
  testPathIgnorePatterns: ["/node_modules/", "/plugins/"],
  collectCoverage: true,
  collectCoverageFrom: ["src/**/!(*.spec|*.test|*.enum|index).ts"],
  coverageThreshold: {
    global: {
      statements: 75,
      branches: 75,
      functions: 75,
      lines: 75,
    },
  },
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
};

export default config;
