module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'babel-jest',
  },
  testMatch: [
    '<rootDir>/src/services/**/__tests__/**/*.test.ts',
    '<rootDir>/src/utils/**/__tests__/imageCompressor.test.ts',
    '<rootDir>/src/utils/**/__tests__/citizenNotifications.test.ts',
  ],
};
