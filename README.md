# 🚀 Horizon IT – Complete IT Asset & Helpdesk Management Suite

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Horizon IT** is a modern, blazing-fast, and comprehensive IT service management (ITSM) platform built entirely on Next.js 15, Neon Postgres, and Tailwind CSS. It is designed to act as a central hub for all IT operations: tracking tickets, resolving user issues, managing assets, maintaining SLAs, and discovering critical infrastructure intelligence.

![Horizon IT Cover Image](https://via.placeholder.com/1200x600?text=Horizon+IT+Management+Suite) *(Placeholder for a hero screenshot)*

---

## 🌟 Key Features

### 🎫 Intelligent Ticketing System
- **Omnichannel Views:** Toggle between Kanban Board, List View, or Calendar View depending on your team's workflow.
- **SLA Management:** Real-time SLA monitors flag high-priority or breaching tickets instantly.
- **Checklists & Tasks:** Break down complex resolutions into actionable checklists.
- **Activity & Audit Trails:** Every modification (status change, date change, new comment) is tracked relentlessly in a unified audit log.

### 💻 IT Asset Management (ITAM)
- **Asset Lifecycle Management:** Track hardware, software, and licenses from purchase to retirement.
- **Assignment & Traceability:** Link physical servers or laptops directly to users and network locations.
- **Secure File Attachments:** Directly securely upload attachments (diagnostic logs, serial number photos) via **Vercel Blob Storage**.

### 🔐 Next-Generation Authentication
- **Self-Hosted Data Security:** Users, sessions, and security roles are managed directly in your PostgreSQL (Neon) database.
- **Role-Based Access Control (RBAC):** Distinct `ADMIN` and `STAFF` roles ensure granular permission structures throughout the application.
- **Secure JWT Implementation:** Cookies are strictly `httpOnly` limiting attack vectors like XSS.

### ⚡ Performance & Usability
- **Premium Interface:** Glassmorphism aesthetics, dynamic dark mode, and seamless micro-interactions using Framer Motion.
- **Density Controls:** Users can switch between "Compact", "Comfortable", and "Spacious" UI themes instantly.
- **Instant Global Search:** Hit the search bar at any point to query tickets and assets globally.

---

## 🛠️ Technology Stack

| Technology       | Role                                    | Why?                                                                         |
|------------------|-----------------------------------------|------------------------------------------------------------------------------|
| **Next.js 15**   | Full-Stack Framework (App Router)      | Provides seamless Server Actions, App Router caching, and optimized builds.     |
| **Neon**         | Serverless PostgreSQL Database          | Branching, instant scaling, and auto-suspending free tiers.                    |
| **Prisma ORM**   | Database interactions                   | Type-safe queries mapped perfectly to our highly relational schema.             |
| **Vercel Blob**  | Blob Storage                            | Rapid, edge-compatible file uploads directly tied to the Vercel architecture.   |
| **Tailwind CSS** | Styling & Utility                       | Unmatched iteration speed with extensive dark mode support.                     |

---

## 📋 Prerequisites & Setup

Getting Horizon IT running in your environment is simple. 

### 1. Requirements
- **Node.js**: v18+ (v20+ Recommended)
- **NPM** or **Yarn**: Latest versions.
- **Git**

### 2. External Services Required
To run Horizon IT successfully, you'll need the following free accounts:
1. **[Neon Database](https://neon.tech/)**: For the standard PostgreSQL Database.
2. **[Vercel](https://vercel.com/)**: For deployments and Blob Storage configuration. 

---

## 🚀 Installation & Local Development

### Step 1: Clone the Repository
\`\`\`bash
git clone https://github.com/anurag-mallick/IT-Project-Management.git
cd IT-Project-Management/app
\`\`\`

### Step 2: Install Dependencies
\`\`\`bash
npm install
\`\`\`

### Step 3: Configure Environment Variables
Copy the example environment securely.
\`\`\`bash
cp .env.example .env.local
\`\`\`

Open `.env.local` and populate the fields:
\`\`\`env
# 1. Database Connections
# Grab these from your Neon Dashboard -> Project -> Connection Details
DATABASE_URL="postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require"

# 2. Security
# A random strictly generated 64-character hash for JWT signing
JWT_SECRET="generate-a-super-secure-random-string-here"

# 3. Application Metadata
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# 4. Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
\`\`\`

### Step 4: Provision & Migrate the Database
Ensure your database tables match the schema perfectly:
\`\`\`bash
npx prisma generate
npx prisma db push
\`\`\`

*(Optional)* If you want to view the database through an interface locally:
\`\`\`bash
npx prisma studio
\`\`\`

### Step 5: Start the Local Server
\`\`\`bash
npm run dev
\`\`\`
Horizon IT will now be accessible at `http://localhost:3000`.

---

## 📦 Deploying to Vercel

Horizon IT was strictly built with **Vercel** architecture in mind.

1. Publish your cloned codebase to your GitHub/GitLab account.
2. Go to your [Vercel Dashboard](https://vercel.com/new) and import the repository.
3. Vercel will auto-detect the Next.js framework in the `app` directory.
4. Go to **Environment Variables** and paste all values from your `.env.local` exactly as they are.
5. In **Vercel -> Storage**, create a new **Vercel Blob** and link it to this project. Vercel will instantly auto-inject the `BLOB_READ_WRITE_TOKEN` variable into your environment.
6. **Click Deploy**.

***Post-Deployment Step***: Once deployed, update your `NEXT_PUBLIC_APP_URL` variable in Vercel to match your new `.vercel.app` production domain name!

---

## 🗂️ Directory Architecture

\`\`\`
├── app/
│   ├── prisma/                # Database schema (schema.prisma)
│   ├── public/                # Static public files (images, favicons)
│   ├── src/
│   │   ├── app/               # 🚦 Next.js Routing & API Endpoints
│   │   │   ├── api/           # Backend REST API definitions
│   │   │   ├── admin/         # Authenticated admin panel configurations
│   │   │   ├── assets/        # Asset display UI pages
│   │   │   └── login/         # Front-facing login screens
│   │   ├── components/        # 🧩 Reusable UI layout & rendering components
│   │   │   ├── dashboards/    # Specialized analytical views
│   │   │   ├── metrics/       # Progress graphs, stats
│   │   │   └── ui/            # Buttons, modals, tooltips
│   │   ├── context/           # Global React Context providers
│   │   ├── lib/               # 🔧 Utilities (auth logic, storage adaptors)
│   │   └── types/             # Centralized TypeScript strict definitions
│   ├── .env.example           # Secure template layout
│   ├── next.config.ts         # Next.js configurations
│   ├── package.json           # Node.js dependencies
│   └── tailwind.config.ts     # CSS Styling configuration
\`\`\`

---

## 🛡️ Default Administrator First Access

Since the authentication database starts empty, you can initialize your first secure user utilizing the platform's API endpoints or directly via the database. It is highly recommended to run a seed script to create your superuser account first.

If a default user is provided during installation, their details are:

- **Username**: `admin@it-management.com`
- **Password**: `AdminPassword123!@#`

*(Important: Change your superuser password immediately after logging in for the first time)*

---

## 📝 License

This project is licensed under the **MIT License**.

See the [LICENSE](LICENSE) file for more information.

---

Made with ❤️ by internal developers and external open-source professionals.
