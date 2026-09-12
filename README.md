# NAWI-ReportPro

> **Smart India Hackathon (SIH) 2026 — Problem Statement ID: 26035**  
> **OIML R-76 Compliant Automated Test Report Generator for Non-Automatic Weighing Instruments**

[![Test Suite](https://img.shields.io/badge/Test%20Suite-192%20%2F%20192%20Passing%20(100%25)-success?style=for-the-badge&logo=vitest&logoColor=white)](https://github.com)
[![Test Suites](https://img.shields.io/badge/Test%20Suites-29%20Suites%20Passing-blue?style=for-the-badge)](https://github.com)
[![Build Status](https://img.shields.io/badge/Build%20Status-Client%20%26%20Server%20Clean%20(0%20Errors)-brightgreen?style=for-the-badge&logo=checkmarx&logoColor=white)](https://github.com)
[![Standards](https://img.shields.io/badge/Standards-OIML%20R--76--1%3A2006%20%7C%20GIGW%203.0%20Draft%20%7C%20W3C%20WCAG%202.1%20AA-003366?style=for-the-badge)](https://github.com)
[![Security](https://img.shields.io/badge/Security-HMAC--SHA256%20QR%20Sealing%20%7C%20RBAC-navy?style=for-the-badge&logo=shield)](https://github.com)

---

## 🏛️ Executive Summary & Key Metrics

| Benchmark | Verified Metric / Standard | Status |
|:---|:---|:---:|
| **Automated Test Suite** | `192 / 192 Passing (100%) across 29 Test Suites` | ✅ PASS |
| **Build & Bundle Quality** | `Client & Server Clean (0 Errors, 0 Warnings)` | ✅ PASS |
| **Legal Metrology Standards** | `OIML R-76-1:2006 / OIML R-76-2:2007 Pattern Approval` | ✅ COMPLIANT |
| **Accessibility Compliance** | `GIGW 3.0 Draft (Guidelines for Indian Govt Websites) & W3C WCAG 2.1 AA` | ✅ COMPLIANT |
| **Document Integrity & Sealing** | `Cryptographic HMAC-SHA256 Digital Tamper-Proof QR Sealing` | ✅ SECURE |
| **Access Control (RBAC)** | `Multi-Tier Authentication: ADMIN, INSPECTOR, VIEWER` | ✅ ENFORCED |
| **Audit Remediation Score** | `100% Resolved (13 / 13 Defect Findings Remediated across 4 Streams)` | ✅ AUDITED |

---

## 📌 Overview

**NAWI-ReportPro** is an enterprise-grade digital legal metrology verification platform engineered in accordance with International Organization of Legal Metrology (**OIML R-76-1:2006 / R-76-2:2007**) regulations and Indian Legal Metrology (General) Rules.

Designed for State Legal Metrology Departments, Regional Reference Standard Laboratories, and certified verification officers, NAWI-ReportPro automates the entire lifecycle of industrial and commercial weighbridge inspections:

- **Metrological Calculation Engine**: Native precision arithmetic covering all Accuracy Classes (**Class I Special, Class II High, Class III Medium, and Class IIII Ordinary**).
- **Automated MPE & Error Boundary Analysis**: Eliminates rounding artifacts using turning-point delta load evaluation ($P = I + 0.5e - \Delta L$) and corrected error calculations ($E = P - L$, $E_c = E - E_0$).
- **6 Core OIML Standardized Procedures**: Weighing Performance (increasing/decreasing), Repeatability, Eccentricity (off-center loading), Temperature Effects, Stability/Warm-up, and Creep & Zero-Return.
- **Official Verification Certificates & Technical Datasheets**: High-resolution, vector-rendered bilingual (English/Hindi) PDF generation featuring cryptographically sealed HMAC-SHA256 QR codes.
- **Hardware Integration & Virtual Simulation**: Dual-mode RS-232 telemetry interface with transparent simulated virtual testing mode for offline inspector training.
- **Immutable Audit Trail & RBAC**: Tamper-evident logging of every metrological modification with granular role-based authorization.

---

## 🏆 Smart India Hackathon 2026 — Official Submission

- **Presentation PPTX**: [`NAWI-ReportPro-SIH2026-Submission.pptx`](./NAWI-ReportPro-SIH2026-Submission.pptx) (Standard SIH 6-slide executive presentation)
- **Submission PDF**: [`NAWI-ReportPro-SIH2026-Submission.pdf`](./NAWI-ReportPro-SIH2026-Submission.pdf) (High-resolution 940 KB SIH documentation package)
- **Automated Test Coverage**: **100% Pass Rate (192 / 192 tests passing across 29 test suites)**
- **Audit Remediation**: **100% Score (All 13 Stream A-D findings verified & cleared)**

### 📸 Slide Deck Previews
| Slide 1: Title | Slide 2: Proposed Solution | Slide 3: Technical Approach |
|:---:|:---:|:---:|
| ![Slide 1](./slide_previews/slide_1.png) | ![Slide 2](./slide_previews/slide_2.png) | ![Slide 3](./slide_previews/slide_3.png) |
| **Slide 4: Feasibility & Viability** | **Slide 5: Quantified Impact** | **Slide 6: Research & References** |
| ![Slide 4](./slide_previews/slide_4.png) | ![Slide 5](./slide_previews/slide_5.png) | ![Slide 6](./slide_previews/slide_6.png) |

---

## 🛡️ Audit Remediation Scorecard (100% Resolved)

During comprehensive pre-grand finale evaluation, 13 defects across 4 audit streams were identified and systematically remediated. All fixes have been validated with zero regressions.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        SIH 2026 AUDIT REMEDIATION SCORECARD                            │
├────────────────────────────┬─────────────────────────────┬───────────┬─────────────────┤
│ Stream                     │ Scope                       │ Findings  │ Status          │
├────────────────────────────┼─────────────────────────────┼───────────┼─────────────────┤
│ Stream A: Accessibility    │ GIGW 3.0 & WCAG 2.1 AA UI   │ 4 / 4     │ 100% RESOLVED   │
│ Stream B: Authenticity     │ National Symbols & SVG      │ 2 / 2     │ 100% RESOLVED   │
│ Stream C: Credibility      │ Telemetry & Error Boundary  │ 3 / 3     │ 100% RESOLVED   │
│ Stream D: Data Resilience  │ Backend ORM & Test Singletons│ 4 / 4     │ 100% RESOLVED   │
├────────────────────────────┴─────────────────────────────┴───────────┼─────────────────┤
│ TOTAL AUDIT DEFECTS RESOLVED                                          │ 13 / 13 (100%)  │
└───────────────────────────────────────────────────────────────────────┴─────────────────┘
```

### Detailed Remediation Breakdown

#### 🔹 Stream A: UI & GIGW 3.0 Accessibility (4 Defects Resolved)
1. **TopBar Notification Payload Key Alignment**: Fixed property mismatches by aligning notification rendering to consume canonical `notif.title` and `notif.message` keys.
2. **Tailwind Spacing Class Normalization**: Corrected erratic padding and border classes, standardizing on valid design tokens (`py-0.5`, `shadow-sm`).
3. **Keyboard Skip Navigation Target**: Added programmatic focus capability (`tabIndex="-1"` on `#main-content`) enabling direct skip-to-content navigation for screen readers.
4. **High-Contrast Graphical Fidelity**: Implemented `filter: none !important` rules for national emblems, certification stamps, and vector plots to prevent color inversion artifacts in GIGW high-contrast mode.

#### 🔹 Stream B: National Symbols & Cultural Authenticity (2 Defects Resolved)
5. **Authentic High-Resolution Ashoka Chakra Integration**: Replaced crude geometric procedural SVG spokes with the authentic 24-spoke high-resolution Ashoka Chakra asset (`/assets/ashoka-chakra.jpg`).
6. **SVG Filter ID Collision Elimination**: Upgraded `StateEmblem.jsx` with `React.useId()` to generate unique SVG filter identifiers, resolving document-level DOM rendering conflicts.

#### 🔹 Stream C: Credibility, Simulator Transparency & Error Boundaries (3 Defects Resolved)
7. **Transparent Prototype Attribution**: Replaced static visitor counts and unverified NIC infrastructure claims in the footer with honest SIH 2026 Prototype attribution, verified Ministry guidelines, and dynamic active session indicators.
8. **Telemetry Simulator Transparency**: Rebranded simulated serial feeds as *"Interactive RS-232 Weighbridge Simulator (Virtual Test Mode)"* accompanied by an amber advisory banner stating that readings are software-synthesized.
9. **ErrorBoundary Hardening & Production Safety**: Suppressed internal JavaScript stack traces in production builds behind `import.meta.env.DEV` flags and replaced destructive `window.location.reload()` with clean React state resets.

#### 🔹 Stream D: Backend Data Integrity & Resilience (4 Defects Resolved)
10. **Monotonic Certificate Numbering**: Refactored certificate sequence generation to query absolute database counts unconditionally, preventing sequence rollbacks or collisions.
11. **Prisma Multi-Interval Range Schema Support**: Extended the Prisma schema with `ranges Json?` to seamlessly store and validate multi-interval weighbridge verification steps.
12. **In-Memory Fallback Visibility**: Implemented high-visibility warning logging whenever the backend operates on the in-memory mock database fallback.
13. **Prisma Module Singleton Unification**: Enforced `globalThis.__PRISMA_SINGLETON__` across CJS and ESM boundaries to eliminate connection pool exhaustion during concurrent Vitest test runs.

---

## 🖼️ Visual UI & Feature Verification Gallery (15 Captured Views)

The following 15 views represent end-to-end user workflows and compliance safeguards captured directly from the automated verification suite (`./screenshots/`):

| # | View Name & Target | Core Capabilities & Legal Metrology Features | Verified Screenshot |
|:---:|:---|:---|:---:|
| **01** | **Authentication & National Emblem**<br>`screenshots/01_login_page.png` | Authentic Ashoka Chakra emblem, JWT authentication, role selection (Admin, Inspector, Viewer), and bilingual language switch. | [![01 Login Page](./screenshots/01_login_page.png)](./screenshots/01_login_page.png) |
| **02** | **Operations Dashboard**<br>`screenshots/02_dashboard.png` | Operational KPI metrics, active verification count, pass/fail ratios, recent calibration activities, and quick-action navigation. | [![02 Dashboard](./screenshots/02_dashboard.png)](./screenshots/02_dashboard.png) |
| **03** | **Instrument Registry**<br>`screenshots/03_instruments_list.png` | Comprehensive index of legal metrology weighbridges with search, filtering by accuracy class (I-IIII), and verification lifecycle status. | [![03 Instruments List](./screenshots/03_instruments_list.png)](./screenshots/03_instruments_list.png) |
| **04** | **Instrument Profile & Multi-Interval**<br>`screenshots/04_instrument_detail.png` | In-depth technical specifications, multi-interval verification ranges ($e_1, e_2$), load cell parameters, and historical test sessions. | [![04 Instrument Detail](./screenshots/04_instrument_detail.png)](./screenshots/04_instrument_detail.png) |
| **05** | **Test Sessions Hub**<br>`screenshots/05_test_sessions.png` | Central repository of all executed verification sessions with metrological status badges (Compliant, Defective, In Progress). | [![05 Test Sessions](./screenshots/05_test_sessions.png)](./screenshots/05_test_sessions.png) |
| **06** | **Test Execution Wizard**<br>`screenshots/06_new_test_form.png` | Step-by-step workflow covering the 6 OIML test procedures (Weighing, Eccentricity, Repeatability, Creep, etc.) with dynamic MPE evaluation. | [![06 Test Form](./screenshots/06_new_test_form.png)](./screenshots/06_new_test_form.png) |
| **07** | **Reports & Certificates Hub**<br>`screenshots/07_reports_hub.png` | Certificate and technical data sheet generation hub with direct PDF preview, digital download, and HMAC-SHA256 seal verification. | [![07 Reports Hub](./screenshots/07_reports_hub.png)](./screenshots/07_reports_hub.png) |
| **08** | **Rajbhasha Bilingual Localization**<br>`screenshots/08_hindi_bilingual.png` | Instant English-to-Hindi bilingual localization adhering to Official Language (Rajbhasha) requirements for Central & State departments. | [![08 Hindi Bilingual](./screenshots/08_hindi_bilingual.png)](./screenshots/08_hindi_bilingual.png) |
| **09** | **GIGW 3.0 High-Contrast Accessibility**<br>`screenshots/09_high_contrast_mode.png` | High-contrast visual theme compliant with W3C WCAG 2.1 AA with protected graphical assets and clear typography. | [![09 High Contrast](./screenshots/09_high_contrast_mode.png)](./screenshots/09_high_contrast_mode.png) |
| **10** | **Transparent Attribution Footer**<br>`screenshots/10_honest_footer.png` | Audit-remediated footer providing honest prototype attribution, verified metrology guidelines, and real-time active session indicators. | [![10 Honest Footer](./screenshots/10_honest_footer.png)](./screenshots/10_honest_footer.png) |
| **11** | **Public Verification Portal**<br>`screenshots/11_public_verification_portal.png` | Public verification portal for scanning certificate QR codes, cryptographic HMAC signature validation, and visual error envelope charts. | [![11 Public Verification](./screenshots/11_public_verification_portal.png)](./screenshots/11_public_verification_portal.png) |
| **12** | **RS-232 Telemetry Simulator**<br>`screenshots/12_telemetry_simulator.png` | Interactive virtual weighbridge indicator streaming live weight packets, tare, zero commands, and prominent virtual testing disclaimer. | [![12 Telemetry Simulator](./screenshots/12_telemetry_simulator.png)](./screenshots/12_telemetry_simulator.png) |
| **13** | **Immutable Metrological Audit Log**<br>`screenshots/13_audit_log.png` | Tamper-evident, chronological logging of all metrological calculations, user logins, instrument modifications, and report generation events. | [![13 Audit Log](./screenshots/13_audit_log.png)](./screenshots/13_audit_log.png) |
| **14** | **RBAC User Administration**<br>`screenshots/14_user_management.png` | Administrative console for provisioning, role assignments (Admin, Inspector, Viewer), and activity monitoring. | [![14 User Management](./screenshots/14_user_management.png)](./screenshots/14_user_management.png) |
| **15** | **System Configuration & Preferences**<br>`screenshots/15_settings_page.png` | Configurable metrological parameters, default tolerances, environment defaults, unit conversions, and network connectivity settings. | [![15 Settings Page](./screenshots/15_settings_page.png)](./screenshots/15_settings_page.png) |

---

## ⚡ Verification & Testing Commands

To verify the complete test suite, validate client build stability, or re-run automated browser verification:

```bash
# 1. Run the complete automated test suite (192 tests across 29 suites)
npm test

# 2. Build the client production bundle with zero warnings or errors
npm run build --workspace=client

# 3. Run automated end-to-end browser verification and capture all 15 gallery views
node scripts/verify_and_screenshot.mjs
```

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Axios, Chart.js
- **Backend**: Node.js, Express.js (ESM/CJS compatible)
- **Database & ORM**: PostgreSQL 14+, Prisma ORM
- **Testing & Verification**: Vitest, Supertest, Puppeteer Core
- **Document Generation**: PDFKit (vector-based bilingual certificates), QRCode
- **Security & Integrity**: HMAC-SHA256 Cryptographic Sealing, JWT, bcryptjs, Helmet, CORS, Morgan

---

## 📋 Prerequisites

Before running the application locally, ensure the following software is installed:
- **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
- **npm**: `v9.0.0` or higher
- **PostgreSQL**: `v14.0` or higher ([Download PostgreSQL](https://www.postgresql.org/download/))

---

## 🚀 Step-by-Step Setup & Installation

### 1. Clone or Open the Repository
```bash
git clone https://github.com/Princu-Babu/SIH.git
cd SIH
```

### 2. Configure Environment Variables
Copy `.env.example` to `server/.env` and configure your PostgreSQL database credentials:
```bash
cp .env.example server/.env
```

Ensure your `server/.env` contains valid configuration:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nawi_reportpro?schema=public"
JWT_SECRET="nawi_reportpro_super_secure_jwt_secret_key_2026"
PORT=5000
NODE_ENV=development
```

### 3. Database Initialization
Ensure PostgreSQL is active, then create the database:
```sql
CREATE DATABASE nawi_reportpro;
```

### 4. Install Dependencies, Run Migrations & Seed
Execute the automated setup script:
```bash
npm run setup
```
Or execute manually:
```bash
# Install root and workspace dependencies
npm install

# Initialize backend database and run seed data
cd server
npm install
npx prisma migrate dev --name init
npx prisma db seed
cd ..
```

### 5. Start the Application
Run both backend server and client concurrently in development mode:
```bash
npm run dev
```

- **Client Web Application**: `http://localhost:5173`
- **Backend API Server**: `http://localhost:5000`
- **Public Verification Portal**: `http://localhost:5173/verify`

---

## 📁 Folder Structure

```
SIH/
├── client/                     # React frontend application
│   ├── public/                 # Static assets (Ashoka Chakra, emblem, logos)
│   ├── src/
│   │   ├── components/         # GIGW-compliant UI components (TopBar, Footer, Emblem)
│   │   ├── context/            # Authentication & Localization contexts
│   │   ├── pages/              # Views (Dashboard, Instruments, TestWizard, Reports)
│   │   └── services/           # API clients & telemetry stream handlers
│   └── package.json
├── server/                     # Express.js REST API & Prisma backend
│   ├── prisma/
│   │   ├── schema.prisma       # Database models with multi-interval ranges
│   │   └── seed.js             # Metrological seed fixtures
│   ├── src/
│   │   ├── middleware/         # JWT Auth, RBAC guards, Audit trail logger
│   │   ├── routes/             # Authentication, Instruments, Tests, Reports, Dashboard
│   │   └── services/
│   │       ├── mpeCalculator.js# OIML R-76 Table 3 MPE & rounding engine
│   │       └── pdfGenerator.js # High-res vector PDF certificate generator
│   └── package.json
├── screenshots/                # 15 captured UI verification views
├── scripts/
│   └── verify_and_screenshot.mjs # Automated Puppeteer verification pipeline
├── slide_previews/             # SIH 2026 presentation slide previews
├── package.json                # Root workspace orchestration
└── README.md                   # Government-grade documentation
```

---

## 👥 User Roles & Default Credentials

When database seeding is executed, the following default credentials are provisioned:

| Role | Email | Password | Access Privileges |
|---|---|---|---|
| **ADMIN** | `admin@nawi.gov.in` | `Admin@123` | Full administrative control, user provisioning, system preferences, and immutable audit log review |
| **INSPECTOR** | `inspector@nawi.gov.in` | `Inspector@123` | Instrument registry, test wizard execution, MPE calculations, and PDF certificate generation |
| **VIEWER** | `viewer@nawi.gov.in` | `Viewer@123` | Read-only inspection of instrument records, past test results, and verified certificates |

---

## ⚖️ OIML R-76 Verification Engine Specifications

The calculation engine strictly enforces OIML R-76-1 Table 3 Maximum Permissible Errors (MPE) based on verification scale interval ($e$):

### Class I (Special Accuracy)
- $0 \le m \le 50\,000\,e$: $\pm 0.5\,e$
- $50\,000\,e < m \le 200\,000\,e$: $\pm 1.0\,e$
- $m > 200\,000\,e$: $\pm 1.5\,e$

### Class II (High Accuracy)
- $0 \le m \le 5\,000\,e$: $\pm 0.5\,e$
- $5\,000\,e < m \le 20\,000\,e$: $\pm 1.0\,e$
- $20\,000\,e < m \le 100\,000\,e$: $\pm 1.5\,e$

### Class III (Medium Accuracy — Standard Commercial Weighbridges)
- $0 \le m \le 500\,e$: $\pm 0.5\,e$
- $500\,e < m \le 2\,000\,e$: $\pm 1.0\,e$
- $2\,000\,e < m \le 10\,000\,e$: $\pm 1.5\,e$

### Class IIII (Ordinary Accuracy)
- $0 \le m \le 50\,e$: $\pm 0.5\,e$
- $50\,e < m \le 200\,e$: $\pm 1.0\,e$
- $200\,e < m \le 1\,000\,e$: $\pm 1.5\,e$

> **Note**: For initial verification, the tolerances listed above apply directly. For subsequent verification in-service, tolerances are doubled in compliance with OIML R-76 Clause 3.5.2.

---

## 📜 License

This project is licensed under the **MIT License**.
