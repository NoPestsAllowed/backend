/** @type {import('jest').Config} */
const config = {
    verbose: true,
    testEnvironment: "node",
    rootDir: "../",
    globalSetup: "<rootDir>/__tests__/utils/globalSetup.js",
    globalTeardown: "<rootDir>/__tests__/utils/globalTeardown.js",
    setupFilesAfterEnv: ["<rootDir>/__tests__/utils/setup.js"],
};

module.exports = config;
