/** @type {import('jest').Config} */
const config = {
    verbose: true,
    testEnvironment: "node",
    globalSetup: "<rootDir>/tests/utils/globalSetup.js",
    globalTeardown: "<rootDir>/tests/utils/globalTeardown.js",
    setupFilesAfterEnv: ["<rootDir>/tests/utils/setup.js"],
};

module.exports = config;
