/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { jsx: "react-jsx", strict: true, ignoreDeprecations: "6.0", moduleResolution: "bundler" } }],
  },
  moduleNameMapper: {
    "^obsidian$": "<rootDir>/tests/__mocks__/obsidian.ts",
  },
  testMatch: ["**/tests/**/*.test.ts", "**/tests/**/*.test.tsx"],
};
