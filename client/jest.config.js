module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'babel-jest',
  },
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
};
