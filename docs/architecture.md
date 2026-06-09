# 🏗️ CarbonWise System Architecture

This document describes the architectural design, codebase structure, and system workflows of the **CarbonWise** platform.

---

## 1. Directory Structure

The project is structured to enforce a strict separation of concerns, dividing code into backend server logic and frontend client resources.

```
prompt-wars/
├── docs/                      # Technical documentation
│   ├── architecture.md        # System architecture and workflow (This file)
│   ├── security.md            # Threat modeling and security design
│   ├── testing.md             # Testing architecture and strategy
│   ├── efficiency.md          # Cache & performance engineering
│   └── accessibility.md       # WCAG 2.1 AA compliance guide
├── server/                    # Node.js Backend Application
│   ├── config/
│   │   └── environment.js    # Immutable configuration loader
│   ├── middleware/            # Express request interceptors
│   │   ├── errorHandler.js   # Global boundary exceptions
│   │   ├── rateLimiter.js     # DDoS and API limiting
│   │   ├── security.js       # CORS and Helmet CSP headers
│   │   └── validator.js      # Input schemas & validation
│   ├── routes/                # REST endpoints
│   │   ├── calculator.routes.js
│   │   ├── chat.routes.js
│   │   └── tips.routes.js
│   ├── services/              # Core business layers
│   │   ├── cache.service.js  # LRU request-response caching
│   │   ├── carbon.service.js # Science-based calculations
│   │   └── gemini.service.js # Lazy-loaded AI integration
│   ├── utils/                 # Shared utilities
│   │   ├── constants.js      # EPA & DEFRA factors
│   │   ├── helpers.js        # Data formatters
│   │   └── logger.js         # Structured JSON logging
│   └── index.js               # Application entry point
├── public/                    # Single-Page Application (SPA) Frontend
│   ├── css/
│   │   ├── design-system.css # Base styling tokens & WCAG colors
│   │   └── styles.css        # Layouts and component classes
│   ├── js/
│   │   ├── modules/          # Client-side domain controllers
│   │   │   ├── accessibility.js
│   │   │   ├── calculator.js
│   │   │   ├── chat.js
│   │   │   ├── dashboard.js
│   │   │   └── tips.js
│   │   ├── utils/            # Helper modules
│   │   │   ├── api.js        # Native HTTP client
│   │   │   └── sanitizer.js  # XSS escaping & Markdown compiler
│   │   └── app.js            # Main application bootstrapper
│   └── index.html             # Semantic SPA HTML shell
├── tests/                     # Jest Test Suite
│   ├── integration/
│   │   ├── calculator.routes.test.js
│   │   └── security.test.js
│   └── unit/
│       ├── cache.service.test.js
│       ├── carbon.service.test.js
│       ├── gemini.service.test.js
│       └── validator.test.js
├── Dockerfile                 # Optimized multi-stage Docker build
├── package.json               # Dependencies and scripts
└── EVALUATION.md              # 5-Pillar evaluation checklist
```

---

## 2. Core Architectural Design Principles

### Layered Code Pattern
The backend is structured as a unidirectional pipeline. Requests progress through discrete layers, ensuring that business logic is completely insulated from HTTP transport specifics:

```
[HTTP Request] 
      │
      ▼
[Security Middleware] ──► (Validates CSP, CORS, and Limits Requests)
      │
      ▼
[Validation Middleware] ──► (Validates payload schemas using express-validator)
      │
      ▼
[Router] ──► (Selects endpoint route controller)
      │
      ▼
[Services Layer] ──► (Calculates Carbon factors or contacts Gemini API)
      │
      ▼
[Response Helper] ──► (Sends uniform JSON structure to Client)
```

### Encapsulation and Native ES Modules
We configure `"type": "module"` in `package.json` to leverage native ECMAScript Modules (ESM). 
* **Benefit:** Eliminates global scope pollution entirely. Every module resides in its own isolated scope, and dependencies are loaded statically.
* **Benefit:** Native dynamic imports are used for tests to prevent port binding leaks and resource issues during concurrent test runner threads.

### Centralized Config Lifecycle
All server configurations are concentrated inside `server/config/environment.js`:
* Environment variables are parsed once during runtime startup.
* Essential variables like `GEMINI_API_KEY` are validated explicitly before starting the server.
* The configuration structure is exported as a deep-frozen object (`Object.freeze`) preventing runtime changes to configuration variables.

---

## 3. Data Flow & Component Workflows

### Scenario 1: Carbon Footprint Calculation
1. The user fills out the HTML5 form under `section-calculator`.
2. The client-side `calculator.js` gathers the form inputs, structure-maps them, and initiates an API request via the native fetch client in `api.js`.
3. The server router `/api/calculator` executes the validator schema matching calculations parameters.
4. `CarbonService` runs the math on activities using science-based emission factors (EPA, DEFRA, IPCC) stored in `constants.js`.
5. The result contains category breakdowns, equivalencies (such as trees needed to offset), and benchmark comparisons.
6. The REST JSON response is returned. The frontend updates both the local results panel, clears tips cache, updates the visual dashboard (`dashboard.js`), and persists the latest calculation to the browser's `localStorage` for page reload resilience.

### Scenario 2: Smart Eco Tips Generation
1. When the user navigates to the Eco Tips tab, the application check `getLastCalculation() || loadLatestFromStorage()`. If a calculation is present, it shows the "Generate My Tips" action.
2. Clicking the action sends the calculation metrics to `/api/tips`.
3. The server checks the in-memory LRU Cache. If recommendations have already been generated for this specific emissions payload, the cached content is served immediately.
4. If it's a cache miss, the `GeminiService` prepares a targeted system prompt passing the user's specific highest-emission categories.
5. The Gemini client calls `gemini-3.1-flash-lite` to retrieve highly personalized, actionable reduction tips.
6. The response is cached, returned to the client, sanitized against XSS, compiled into structured HTML on the client, and saved in `localStorage` for offline persistence across page reloads.
