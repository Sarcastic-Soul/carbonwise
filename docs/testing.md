# 🧪 CarbonWise Testing Strategy & Verification Guide

This document details the test automation design, mock patterns, and verification procedures utilized in the **CarbonWise** platform to ensure reliability and maintainability.

---

## 1. Test Architecture Overview

The testing suite contains **66 automated tests** structured to target specific levels of the application:

```
[Tests Execution Suite]
   │
   ├──► Unit Tests (Mocked environment variables and external service wrappers)
   │     ├── cache.service.test.js     # LRU key normalization and eviction
   │     ├── carbon.service.test.js    # Emission factors and mathematical equations
   │     ├── gemini.service.test.js    # AI models response and prompt flows (Mocked SDK)
   │     ├── validator.test.js         # Input sanitization and helper validations
   │     └── calculator.frontend.test.js # Pure ES Module frontend logic using JSDOM
   │
   ├──► Integration Tests (Using Supertest to spin up HTTP router stacks)
   │     ├── calculator.routes.test.js # End-to-end calculations endpoint
   │     └── security.test.js          # Security header checks and rate limiting
   │
   └──► E2E & Accessibility Tests (Using Playwright & Axe-Core)
         └── accessibility.spec.js     # Fully automated browser WCAG 2.1 AA audits
```

We utilize **Jest** as the core test runner because it supports modern mock capabilities, combined with **Supertest** to execute REST lifecycle validations. The test execution avoids experimental ESM flags by employing a robust **Babel configuration** for fully-stable ES Module compilation, and relies on **Playwright** for enterprise-grade frontend interaction and axe-core assertions.

---

## 2. Mocking Strategy (Avoiding Flaky API Calls)

To evaluate logic correctly without exhausting API rate limits or requiring active internet connections during build pipelines, we mock the `@google/generative-ai` SDK client statically.

```javascript
// tests/unit/gemini.service.test.js
jest.unstable_mockModule('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      startChat: jest.fn().mockReturnValue({
        sendMessage: jest.fn().mockResolvedValue({
          response: { text: () => 'Mocked AI response about carbon footprint' },
        }),
      }),
      generateContent: jest.fn().mockResolvedValue({
        response: { text: () => 'Mocked personalized tips' },
      }),
    }),
  })),
}));
```

### Advantages of this approach:
1. **Zero External Latency:** Service logic resolves in milliseconds, preventing test runner timeouts.
2. **Determinism:** Tests verify string manipulation, caching behavior, and error boundaries against predictable responses.
3. **No Key Dependency:** The unit test suite can run in standard offline environments without requiring an active `GEMINI_API_KEY`.

---

## 3. How to Execute Tests and Coverage

### Commands Matrix

Run the following commands in the root of the workspace directory:

```bash
# Run the entire test suite (66 tests across 6 files)
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests and generate coverage report
npm run test:coverage
```

### Coverage Goals
The project enforces a target of **>85% coverage** across all core business services. To review the interactive coverage report:

1. Run `npm run test:coverage`.
2. Open the file `coverage/lcov-report/index.html` in your web browser.
