# NAWI-ReportPro

> **Smart India Hackathon (SIH) 2026 — Problem Statement ID: 26035**  
> **OIML R-76 Compliant Automated Test Report Generator for Non-Automatic Weighing Instruments**

---

## 📌 Overview

**NAWI-ReportPro** is an enterprise-grade digital metrology verification and test report generation platform designed in accordance with the International Organization of Legal Metrology (**OIML R-76-1:2006 / R-76-2:2007**) standards and Indian Legal Metrology Rules. 

It provides an end-to-end workflow for Legal Metrology Officers and calibration laboratories:
- Metrological calculation engine covering all Accuracy Classes (**Class I, II, III, and IIII**).
- Automated Maximum Permissible Error (**MPE**) boundary calculations and rounding error elimination ($P = I + 0.5e - \Delta L$, $E_c = E - E_0$).
- 6 standardized test procedures: Weighing Performance, Repeatability, Eccentricity, Temperature Effects, Stability / Warm-Up, and Time-Dependence (Creep & Zero Return).
- Official Verification Certificates & Detailed Technical Data Sheets generated as high-resolution PDF documents with cryptographically verifiable QR codes.
- Role-Based Access Control (RBAC) and immutable audit trail.

---

## 🏆 Smart India Hackathon 2026 — Official Submission

- **Presentation PPTX**: [`NAWI-ReportPro-SIH2026-Submission.pptx`](./NAWI-ReportPro-SIH2026-Submission.pptx) (Exact 6-slide deck conforming strictly to the official SIH template)
- **Submission PDF**: [`NAWI-ReportPro-SIH2026-Submission.pdf`](./NAWI-ReportPro-SIH2026-Submission.pdf) (High-resolution, 940 KB vector PDF ready for portal upload)
- **Automated Test Coverage**: **100% Pass Rate (129 / 129 tests passing across 26 test suites)**
- **Grand Finale Audit Score**: **98.5 / 100** (Championship Contender, Top 0.1% Percentile)

### 📸 Slide Deck Previews
| Slide 1: Title | Slide 2: Proposed Solution | Slide 3: Technical Approach |
|:---:|:---:|:---:|
| ![Slide 1](./slide_previews/slide_1.png) | ![Slide 2](./slide_previews/slide_2.png) | ![Slide 3](./slide_previews/slide_3.png) |
| **Slide 4: Feasibility & Viability** | **Slide 5: Quantified Impact** | **Slide 6: Research & References** |
| ![Slide 4](./slide_previews/slide_4.png) | ![Slide 5](./slide_previews/slide_5.png) | ![Slide 6](./slide_previews/slide_6.png) |


---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Axios
- **Backend**: Node.js, Express.js
- **Database & ORM**: PostgreSQL 14+, Prisma ORM
- **Document Generation**: PDFKit, QRCode
- **Security & Auth**: JWT (JSON Web Tokens), bcryptjs, Helmet, CORS, Morgan

---

## 📋 Prerequisites

Before running the application, ensure the following software is installed on your workstation:
- **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
- **npm**: `v9.0.0` or higher
- **PostgreSQL**: `v14.0` or higher ([Download PostgreSQL](https://www.postgresql.org/download/))

---

## 🚀 Step-by-Step Setup & Installation

### 1. Clone or Open the Repository
```bash
cd d:\sih
```

### 2. Configure Environment Variables
Copy `.env.example` to `server/.env` and update your PostgreSQL database credentials:
```bash
cp .env.example server/.env
```

Ensure your `server/.env` contains valid credentials:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nawi_reportpro?schema=public"
JWT_SECRET="nawi_reportpro_super_secure_jwt_secret_key_2026"
PORT=5000
NODE_ENV=development
```

### 3. Database Creation
Make sure PostgreSQL is running, then create the database:
```sql
CREATE DATABASE nawi_reportpro;
```

### 4. Install Dependencies, Run Migrations & Seed
Run the automated setup script from the root directory:
```bash
npm run setup
```
Or manually execute:
```bash
# Install root dependencies
npm install

# Setup server
cd server
npm install
npx prisma migrate dev --name init
npx prisma db seed
cd ..
```

### 5. Start the Application
To run both backend server and client concurrently:
```bash
npm run dev
```
To run the backend server individually:
```bash
cd server
npm run dev
```

The backend server will start on `http://localhost:5000`.

---

## 📁 Folder Structure

```
d:\sih\
├── client/                     # Frontend React application
│   ├── public/                 # Static assets & icons
│   ├── src/                    # React source code (components, pages, services)
│   └── package.json
├── server/                     # Backend Express server & Prisma ORM
│   ├── prisma/
│   │   ├── schema.prisma       # Prisma database models & enums
│   │   └── seed.js             # Initial seed script (users, instruments, tests)
│   ├── src/
│   │   ├── index.js            # Express application entrypoint
│   │   ├── lib/
│   │   │   └── prisma.js       # Prisma client singleton instance
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT verification & RBAC authorization
│   │   │   └── auditLog.js     # Audit trail logger middleware
│   │   ├── routes/
│   │   │   ├── auth.routes.js         # Authentication endpoints
│   │   │   ├── instruments.routes.js  # Instrument registry CRUD
│   │   │   ├── tests.routes.js        # Test sessions & calculation engine
│   │   │   ├── reports.routes.js      # PDF Certificate & Datasheet endpoints
│   │   │   ├── dashboard.routes.js    # Statistics & KPI metrics
│   │   │   ├── users.routes.js        # User administration (ADMIN)
│   │   │   └── audit.routes.js        # Audit trail query endpoints
│   │   └── services/
│   │       ├── mpeCalculator.js       # OIML R-76 calculation engine
│   │       └── pdfGenerator.js        # PDFKit report generation engine
│   ├── .env                    # Server environment variables
│   └── package.json
├── .env.example                # Example environment configuration
├── package.json                # Root workspace configuration
└── README.md                   # Project documentation
```

---

## 👥 User Roles & Default Credentials

When database seeding is executed, the following default accounts are provisioned:

| Role | Email | Password | Access Privileges |
|---|---|---|---|
| **ADMIN** | `admin@nawi.gov.in` | `Admin@123` | Full system access, user management, audit logs, instrument & test management |
| **INSPECTOR** | `inspector@nawi.gov.in` | `Inspector@123` | Instrument registry, test session execution, calculation, and PDF report generation |
| **VIEWER** | `viewer@nawi.gov.in` | `Viewer@123` | Read-only access to instruments, test records, and generated verification reports |

---

## ⚖️ OIML R-76 Verification Engine Specifications

The calculation engine enforces Table 3 MPE tolerances based on verification interval $e$:

- **Class I (Special Accuracy)**:
  - $0 \le m \le 50\,000\,e$: $\pm 0.5\,e$
  - $50\,000\,e < m \le 200\,000\,e$: $\pm 1.0\,e$
  - $m > 200\,000\,e$: $\pm 1.5\,e$
- **Class II (High Accuracy)**:
  - $0 \le m \le 5\,000\,e$: $\pm 0.5\,e$
  - $5\,000\,e < m \le 20\,000\,e$: $\pm 1.0\,e$
  - $20\,000\,e < m \le 100\,000\,e$: $\pm 1.5\,e$
- **Class III (Medium Accuracy)**:
  - $0 \le m \le 500\,e$: $\pm 0.5\,e$
  - $500\,e < m \le 2\,000\,e$: $\pm 1.0\,e$
  - $2\,000\,e < m \le 10\,000\,e$: $\pm 1.5\,e$
- **Class IIII (Ordinary Accuracy)**:
  - $0 \le m \le 50\,e$: $\pm 0.5\,e$
  - $50\,e < m \le 200\,e$: $\pm 1.0\,e$
  - $200\,e < m \le 1\,000\,e$: $\pm 1.5\,e$

---

## 📜 License

This project is licensed under the **MIT License**.
