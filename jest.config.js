/** @type {import('jest').Config} */
const config = {
    verbose: true,
    testEnvironment: "node",
    globalSetup: "./__tests__/utils/globalSetup.js",
    globalTeardown: "./__tests__/utils/globalTeardown.js",
    setupFilesAfterEnv: ["./__tests__/utils/setup.js"],
    // roots: ["./"],
};

module.exports = config;
