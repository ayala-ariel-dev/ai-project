export default {
    testEnvironment: "jest-environment-jsdom",
    transform: {
        "^.+\\.jsx?$": "babel-jest",
    },
    transformIgnorePatterns: [
        "node_modules/(?!(react-markdown|remark-gfm)/)"
    ],
    moduleFileExtensions: ["js", "jsx", "json"],
    setupFiles: ["<rootDir>/jest.setup.js"], // <-- הוסף כאן
    setupFilesAfterEnv: ["@testing-library/jest-dom"],
    moduleNameMapper: {
        "^.+\\.(css|less|scss|sass)$": "identity-obj-proxy",
        "^.+\\.(jpg|jpeg|png|gif|mp3|svg)$": "<rootDir>/__mocks__/fileMock.js"
    },
    collectCoverage: true,
    collectCoverageFrom: ["src/**/*.{js,jsx}"],
    coverageDirectory: "coverage",
};
