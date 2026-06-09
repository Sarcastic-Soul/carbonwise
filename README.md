# 🌍 CarbonWise — Carbon Footprint Awareness Platform

An AI-powered platform that helps individuals understand, track, and reduce their carbon footprint through personalized insights and science-based calculations.

## 📚 Technical Documentation

For in-depth analyses of our engineering decisions and evaluation compliance, refer to the dedicated guides:

*   [System Architecture Guide](docs/architecture.md) — Codebase layout, data flows, and configuration immutability.
*   [Security Design & Threat Modeling](docs/security.md) — OWASP Top 10 mitigation matrix, CSP, rate-limiting, and XSS sanitizers.
*   [Performance & Efficiency Engineering](docs/efficiency.md) — LRU cache mechanics, lazy-loading services, and host configurations.
*   [Testing Strategy & Mocks](docs/testing.md) — Jest unit & integration runners, mock architectures, and execution scripts.
*   [WCAG 2.1 AA Compliance Checklist](docs/accessibility.md) — Keyboard navigation guides, ARIA status landmarks, and contrast policies.

## Chosen Vertical

**Carbon Footprint Awareness Platform** — Designed to help individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights.

## Approach and Logic

### Architecture

CarbonWise follows a **layered, modular architecture** with strict separation of concerns:

```
┌─────────────────────────────────┐
│        Frontend (SPA)           │
│  Vanilla HTML + CSS + ES Modules│
├─────────────────────────────────┤
│        API Layer (Express)      │
│  Routes → Validation → Services │
├─────────────────────────────────┤
│       Service Layer             │
│  Gemini AI │ Carbon Calc │ Cache│
├─────────────────────────────────┤
│       Middleware Stack          │
│  Security │ Rate Limit │ Errors │
└─────────────────────────────────┘
```

### Design Decisions

1. **Layered Architecture**: Routes handle HTTP, services contain business logic, middleware handles cross-cutting concerns. This makes the code highly testable and maintainable.

2. **Science-Based Emission Factors**: All carbon calculations use peer-reviewed emission factors from EPA (US), DEFRA (UK), and IPCC, ensuring accuracy and credibility.

3. **AI-Powered Chat**: Google Gemini AI provides conversational guidance with a carefully engineered system prompt focused on carbon expertise, actionable advice, and encouragement.

4. **LRU Response Caching**: An in-memory LRU cache reduces redundant Gemini API calls for similar queries, improving response times and reducing costs.

5. **Security-First**: Helmet with strict CSP, input validation on every endpoint (express-validator), rate limiting, and XSS prevention at both server and client levels.

6. **ES Modules**: The entire codebase uses native ES Modules (`"type": "module"`) — no CommonJS, no global scope pollution.

## How the Solution Works

### Features

| Feature | Description |
|:---|:---|
| **AI Carbon Assistant** | Conversational AI (Gemini) that answers sustainability questions, explains emissions, and provides personalized guidance |
| **Carbon Calculator** | Multi-category calculator (Transport, Energy, Diet, Shopping) with validated inputs and real-time results |
| **Personal Dashboard** | Visual breakdown of emissions with bar charts, equivalencies (trees, flights), and global benchmark comparisons |
| **Smart Eco Tips** | AI-generated personalized recommendations based on the user's highest-emission categories |

### User Flow

1. **Calculate**: User enters daily activities in the Carbon Calculator (transport, energy, diet, shopping)
2. **View**: Dashboard updates with annual footprint, category breakdown, equivalencies, and benchmark comparison
3. **Learn**: AI Assistant answers questions about carbon footprints and sustainability
4. **Act**: Personalized Eco Tips provide specific, actionable steps to reduce emissions

### API Endpoints

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/chat` | Send message to AI assistant |
| `POST` | `/api/calculator` | Calculate carbon footprint |
| `GET` | `/api/calculator/factors` | Get available emission factors |
| `POST` | `/api/tips` | Generate personalized eco tips |
| `GET` | `/api/health` | Health check endpoint |

## Tech Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| Backend | Node.js + Express | REST API server |
| AI Engine | Google Gemini API | Conversational AI |
| Frontend | HTML5 + CSS3 + JS (ES Modules) | Accessible single-page application |
| Security | Helmet + CORS + express-rate-limit | HTTP hardening |
| Validation | express-validator | Input sanitization |
| Testing | Jest + Supertest | Unit & integration tests |
| Deployment | Docker + Google Cloud Run | Containerized hosting |

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm
- A Gemini API key ([Get one here](https://aistudio.google.com/apikey))

### Installation

```bash
git clone <repository-url>
cd prompt-wars
npm install
```

### Configuration

```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### Running Locally

```bash
npm run dev       # Development with auto-reload
npm start         # Production mode
```

The app will be available at `http://localhost:8080`.

## Testing

```bash
npm test              # Run all 66 tests
npm run test:unit     # Unit tests only
npm run test:integration  # Integration tests only
npm run test:coverage # Generate coverage report
```

### Test Coverage

- **Unit Tests**: Carbon calculations, cache service, Gemini service (mocked), helpers/validators
- **Integration Tests**: Calculator API endpoints, security headers verification, input validation, error handling

## Security Measures

| Measure | Implementation |
|:---|:---|
| **CSP Headers** | Strict Content-Security-Policy via Helmet |
| **HSTS** | HTTP Strict Transport Security enabled |
| **Rate Limiting** | 100 req/15min general, 50 req/15min for AI |
| **Input Validation** | express-validator on all POST endpoints |
| **XSS Prevention** | HTML entity escaping on both server and client |
| **API Key Security** | Environment variables only, never committed |
| **Body Size Limit** | 10kb JSON body limit |
| **Security Headers** | X-Content-Type-Options, X-Frame-Options, Referrer-Policy |
| **Non-Root Docker** | Container runs as `node` user |

## Accessibility

The platform follows **WCAG 2.1 AA** guidelines:

- Semantic HTML5 elements (`<main>`, `<nav>`, `<header>`, `<footer>`, `<section>`)
- Skip navigation link for keyboard users
- ARIA labels on all interactive and dynamic elements
- `aria-live` regions for dynamic content updates
- Keyboard navigable with visible focus indicators
- Form labels associated with inputs via `for`/`id`
- `aria-describedby` for form help text
- `role` attributes on all major sections
- `prefers-reduced-motion` media query support
- Minimum 4.5:1 color contrast ratio
- Responsive design for all screen sizes

## Assumptions

1. **Individual Focus**: The platform targets individual carbon footprint awareness, not enterprise/corporate use.
2. **Emission Factors**: Global average emission factors are used. Regional factors may vary (e.g., electricity grid intensity).
3. **Simplified Categories**: The calculator covers the 4 highest-impact lifestyle categories: Transport, Energy, Diet, and Shopping.
4. **Client-Side Persistence**: User calculation history is stored in `localStorage` for simplicity (no database required).
5. **Single Currency**: All emissions are expressed in kg/tonnes CO₂ equivalent (CO₂e).

## Project Structure

```
├── server/                    # Backend
│   ├── config/environment.js  # Centralized configuration
│   ├── middleware/            # Security, rate limiting, validation, errors
│   ├── routes/                # API route handlers
│   ├── services/              # Business logic (Gemini, Carbon, Cache)
│   ├── utils/                 # Logger, constants, helpers
│   └── index.js               # Express app entry point
├── public/                    # Frontend
│   ├── index.html             # Semantic HTML5 SPA shell
│   ├── css/                   # Design system + component styles
│   └── js/                    # ES Modules (app, chat, calculator, dashboard, tips)
├── tests/                     # Test suite
│   ├── unit/                  # Unit tests (4 files)
│   └── integration/           # Integration tests (2 files)
├── Dockerfile                 # Production container
├── package.json               # Dependencies & scripts
└── README.md                  # This file
```

## Future Enhancements

- Multi-language support for global accessibility
- Database-backed user accounts for persistent tracking
- Monthly/yearly trend charts with historical data
- Community features for collective impact tracking
- Integration with smart home APIs for automated energy tracking
- Carbon offset marketplace integration
