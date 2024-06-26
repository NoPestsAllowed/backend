const fs = require("node:fs");
/** @type {import('jest').Config} */
const config = {
    verbose: true,
    testEnvironment: "node",
    modulePathIgnorePatterns: ["__tests__/utils/*"],
    globalSetup: "./__tests__/utils/globalSetup.js",
    globalTeardown: "./__tests__/utils/globalTeardown.js",
    setupFilesAfterEnv: ["./__tests__/utils/setup.js"],
};

module.exports = config;
