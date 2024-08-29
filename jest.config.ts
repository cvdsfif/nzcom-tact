import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    collectCoverage: true,
    collectCoverageFrom: ['!tests/*', '!**/dist/**/*', '!tests/**/*', '!wrappers/**/*', '!**/*.config.ts', '!doc/**/*', '!scripts/**/*',],
    coverageReporters: ['json-summary', 'text'],
}

export default config;
