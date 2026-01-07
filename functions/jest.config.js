module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts'
  ],
  setupFiles: ['<rootDir>/test/setup.ts'],
  testTimeout: 180000, // 3 minutes for AI provider calls
  verbose: true,
  transform: {
    '^.+\\.ts$': 'ts-jest'
  }
};