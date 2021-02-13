module.exports = {
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
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
};
