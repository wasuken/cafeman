import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  preset: 'ts-jest',
  testMatch: ['**/__tests__/**/*.test.tsx'],
  collectCoverageFrom: [
    'src/app/components/**/*.{ts,tsx}',
    'src/hooks/**/*.{ts,tsx}',
    'src/context/**/*.{ts,tsx}',
    '!src/app/components/**/*.test.{ts,tsx}',
    '!src/app/components/**/*.stories.{ts,tsx}',
  ],
  coverageDirectory: 'coverage/ui',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

export default createJestConfig(config)
