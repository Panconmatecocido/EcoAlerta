module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/admin-*.test.ts',
    '<rootDir>/src/**/__tests__/denuncias.citizen.test.ts',
    '<rootDir>/src/**/__tests__/geo.test.ts',
  ],
  clearMocks: true,
};
