/** @type {import('jest').Config} */
const config = {
    verbose: true,
    testEnvironment: "node",
    globalSetup: "./tests/utils/globalSetup.js",
    globalTeardown: "./tests/utils/globalTeardown.js",
    setupFilesAfterEnv: ["./tests/utils/setup.js"],
};

module.exports = config;
