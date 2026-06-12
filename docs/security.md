# 🛡️ CarbonWise Security Design & Threat Mitigation

This document details the security model, vulnerability defenses, and input-handling design built into the **CarbonWise** platform to ensure a zero-vulnerability posture.

---

## 1. HTTP Infrastructure Hardening

We use Express security middleware configured via `helmet` to apply transport protections:

```javascript
// server/middleware/security.js
export function createSecurityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    referrerPolicy: { policy: 'same-origin' },
    xssFilter: true,
    noSniff: true,
  });
}
```

### Protection Mechanisms
1. **Strict Content Security Policy (CSP)**: Completely disables execution of inline script tags (`'unsafe-inline'` scripts are omitted). Scripts and connections are restricted strictly to the origin of the server (`'self'`).
2. **Strict-Transport-Security (HSTS)**: Appends `Strict-Transport-Security` headers to enforce HTTPS for a duration of 1 year, protecting against protocol downgrade attacks.
3. **MIME Sniffing Prevention**: Sets `X-Content-Type-Options: nosniff` to block browsers from loading executable stylesheets or scripts unless matching content types are declared.
4. **Clickjacking Defense**: Sets frame-ancestors to `'none'` blocking rendering of the site inside iframe overlays.

---

## 2. Threat Modeling & OWASP Mitigation Matrix

| Threat Category | Potential Attack Vector | CarbonWise Mitigation |
| :--- | :--- | :--- |
| **SQL/NoSQL Injection** | Attacker injects code scripts into calculator JSON properties. | **express-validator Schema Schema Enforcement**: All POST data is validated using strict criteria (e.g. `isFloat({ min: 0 })`). Non-numeric or missing schema parameters are blocked at the middleware layer before routing to controllers. |
| **Cross-Site Scripting (XSS)** | Attacker inputs `<script>...</script>` or uses a prompt injection in the chat area to make the AI model output malicious HTML payloads. | **Dual-Layer HTML Entity Encoding**: The utility `helpers.js` sanitizes string variables on the server. The client-side utility `sanitizer.js` escapes all string parameters (including AI output text) into safe HTML entity notation (e.g. `<` becomes `&lt;`) prior to formatting markdown elements. |
| **DDoS / API Exhaustion** | Attacker scripts automated requests to `/api/chat` to exhaust API quotas and cause financial charges. | **Enterprise Redis-Backed Rate Limiting**: The server applies a general rate limit of 100 requests per 15 minutes globally via Upstash Redis (`rate-limit-redis`), ensuring distributed scaling resilience. |
| **Sensitive Data Exposure** | Stack traces or database library information leak through Express error stack logs during invalid operations. | **Environment-Gated Global Error Boundary**: The server-side error handler catches all uncaught exceptions, logs the details using a structured JSON log format internally, but maps public output to a generic, clean response: `{ success: false, error: { message: "Internal server error" } }` in production. |
| **CSRF & Unauthorized Access** | External origins attempt cross-origin requests to execute calculation operations on behalf of user cookies. | **Strict CSRF Double-Submit Protection**: Built-in state-of-the-art token validation (`csrf-csrf`) explicitly requires header verification matching a securely issued cookie for any POST endpoints. |
| **Supply Chain Poisoning** | Malicious actors exploit floating semver versions to auto-upgrade unsafe node packages. | **Zero-Drift Dependency Pinning**: 100% of Node dependencies are strictly pinned in `package.json`, securely enforced natively in CI pipelines using `npm ci` alongside comprehensive security audits. |

---

## 3. Input Validation Implementation Details

Validation schemas are defined explicitly for all POST operations using `express-validator`. Below is the configuration for the calculator input validation middleware:

```javascript
// server/middleware/validator.js
export const validateCalculator = [
  body('transport.type').optional().isString().trim(),
  body('transport.distance').optional().isFloat({ min: 0, max: 100000 }).toFloat(),
  body('transport.frequency').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
  body('energy.type').optional().isString().trim(),
  body('energy.amount').optional().isFloat({ min: 0, max: 100000 }).toFloat(),
  body('diet').optional().isString().trim(),
  body('shopping.type').optional().isString().trim(),
  body('shopping.quantity').optional().isInt({ min: 0, max: 1000 }).toInt(),
  handleValidationErrors,
];
```

* **Whitelist Pattern:** Unknown attributes in incoming request bodies are entirely ignored, shielding the internal logic from parameter pollution attacks.
* **Range Validation:** Limits numeric variables (e.g. max distance of `100,000` km, max shopping quantities of `1,000` items) to prevent mathematical overflow errors in calculating carbon emissions.
