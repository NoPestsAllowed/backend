/** @type {import('jest').Config} */
const config = {
    verbose: true,
    testEnvironment: "node",
    rootDir: process.cwd(),
    roots: ["<rootDir>, <rootDir>/../, <rootDir>/backend"],
    globalSetup: "<rootDir>/__tests__/utils/globalSetup.js",
    globalTeardown: "<rootDir>/__tests__/utils/globalTeardown.js",
    setupFilesAfterEnv: ["<rootDir>/__tests__/utils/setup.js"],
};

module.exports = config;
