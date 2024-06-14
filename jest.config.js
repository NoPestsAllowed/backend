/** @type {import('jest').Config} */
const config = {
    verbose: true,
    testEnvironment: "node",
    globalSetup: "./utils/globalSetup.js",
    globalTeardown: "./utils/globalTeardown.js",
    setupFilesAfterEnv: ["./utils/setup.js"],
};

module.exports = config;
