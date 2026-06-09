/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: [],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/index.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 85,
      lines: 75,
      statements: 75,
    },
  },
  verbose: true,
};
