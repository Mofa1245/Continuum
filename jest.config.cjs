/** Jest config. Uses ts-jest for TypeScript tests in tests/. */
module.exports = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts", "**/src/**/*.test.ts"],
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
  extensionsToTreatAsEsm: [".ts"],
};
