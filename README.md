# 💻 Horizon IT – Enterprise Management Suite

**Horizon IT** is a high-performance, enterprise-grade IT Management and Helpdesk solution designed for velocity, transparency, and advanced operations. It combines ticket management, asset tracking, and process automation into a unified, high-performance web experience.

🌍 **Live Application:** [it-project-mangement.vercel.app](https://it-project-mangement.vercel.app)

---

## 📖 Table of Contents
- [✨ Core Pillars](#-core-pillars)
  - [🎫 Advanced Helpdesk](#-advanced-helpdesk)
  - [🖥️ IT Asset Management (ITAM)](#-it-asset-management-itam)
  - [🤖 Rule-Based Automations](#-rule-based-automations)
  - [🔍 Unified Search](#-unified-search)
- [🛠️ Technical Stack](#-technical-stack)
- [🏗️ Architectural Overview](#-architectural-overview)
- [🚀 Quality & Design](#-quality--design)
- [🏁 Getting Started](#-getting-started)
- [🔐 Access Control](#-access-control)
- [📂 File Structure](#-file-structure)

---

## ✨ Core Pillars

### 🎫 Advanced Helpdesk
The helpdesk is the heart of Horizon IT, designed to handle high ticket volumes with a focus on speed and clarity.
*   **Dynamic Kanban Board**: A fluid, drag-and-drop interface for real-time ticket triage. Movement across stages (TODO → IN_PROGRESS → RESOLVED) triggers automatic activity logs.
*   **Granular Ticket Details**: Every ticket contains a rich context layer, including:
    *   **Threaded Comments**: Markdown support for technical documentation within tickets.
    *   **Checklists**: Sub-task tracking to ensure complex issues are resolved step-by-step.
    *   **File Attachments**: Direct integration with Supabase Storage for screenshots and logs.
    *   **SLA Compliance**: Visual indicators for P0, P1, and P2 priority response times.

### 🖥️ IT Asset Management (ITAM)
Horizon IT moves beyond simple lists to provide a full lifecycle management system for hardware and software.
*   **Infrastructure Inventory**: Track Laptops, Servers, Monitors, and Mobile devices with dedicated icons and custom fields.
*   **Procurement Audit**: Log purchase dates, costs, and warranty expiration to plan for future refreshes.
*   **Technical Specifications**: A flexible JSON-based 'specs' field captures RAM, CPU, Storage, and specific OS versions without rigid schema constraints.
*   **Geographic Tracking**: Assign assets to specific offices or remote locations.
*   **Staff Linkage**: Maintain a clear "Chain of Custody" by linking assets directly to staff users.

### 🤖 Rule-Based Automations
Reduce operational overhead with the Horizon Automation Engine.
*   **Trigger-Action Logic**: Automatically take actions when tickets are created or updated.
*   **Smart Triage**: Route critical P0 tickets to senior administrators or assign hardware tickets to the inventory team based on tags.
*   **Auto-Escalation**: Ensure no ticket sits idle by automatically bumping priority if a response time is exceeded.
*   **Self-Service Security**: Users can now securely update their own passwords directly through the **Security Settings** panel.

### 🔍 Unified Search
A powerful, instant-discovery engine built into the top navigation.
*   **Cross-Module Search**: Scans across Ticket IDs, titles, descriptions, asset serial numbers, and manufacturers in real-time.
*   **Client-Side Performance**: Results update instantly as you type, filtering the underlying Kanban or List views without a server round-trip.

---

## 🛠️ Technical Stack

Horizon IT is built on a modern, type-safe stack designed for horizontal scale and developer experience.

| Layer | Technology |
| :--- | :--- |
| **Frontend** | [Next.js 15 (App Router)](https://nextjs.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) & Vanilla CSS |
| **Database** | [PostgreSQL (Supabase)](https://supabase.com/) |
| **ORM** | [Prisma](https://www.prisma.io/) |
| **Authentication** | JWT with Role-Based Access Control (RBAC) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Email** | [Resend](https://resend.com/) |

---

## 🏗️ Architectural Overview

Horizon IT utilizes a **Hybrid Architecture** that combines the speed of an SPA with the reliability of a server-rendered application.

1.  **State Management**: Uses React Context API for low-frequency global state (Auth) and heavily leverages local state + URL params for high-frequency UI updates.
2.  **Real-time Layer**: Supabase Broadcast & Presence ensures that if user A moves a ticket on the Kanban board, user B sees the move instantly without a page refresh.
3.  **Security**: 
    *   All API routes (except public submission) require a valid JWT.
    *   Sensitive credentials (like DB passwords) are never exposed to the client.
    *   Role-based guards prevent staff from accessing administrative settings.

---

## 🚀 Quality & Design

The interface follows a **Premium Dark** aesthetic, utilizing modern design trends:
- **Glassmorphism**: Backdrop blurs and semi-transparent layers provide a sense of hierarchy and depth.
- **Micro-animations**: Subtle transitions on button hovers and modal openings enhance user engagement.
- **Responsive Layout**: Designed to work seamlessly on large ultra-wide monitors used by IT teams.

---

## 🏁 Getting Started

### 1. Prerequisites
- **Node.js** ≥ 18.x
- **NPM** ≥ 9.x
- A **Supabase** project for PostgreSQL and Auth.

### 2. Deployment & Local Setup
Clone the repository:
```bash
git clone https://github.com/anurag-mallick/IT-Project-Mangement.git
cd IT-Project-Mangement/frontend
```

Configure your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Database connection
DATABASE_URL="postgresql://postgres.[ID]:[PWD]@db.[ID].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ID]:[PWD]@db.[ID].supabase.co:5432/postgres"
```

Install and run:
```bash
npm install
npx prisma generate
npx prisma db push --skip-generate
npm run dev
```

---

## 🔐 Access Control

| Username | Password | Role |
| :--- | :--- | :--- |
| `admin@it-management.com` | `Password1!` | **ADMIN** |
| (Any created staff user) | (Set by Admin) | **STAFF** |

---

## 📂 File Structure

```text
├── src/
│   ├── app/                # App Router: Pages & API handlers
│   │   ├── api/            # Server-side REST endpoints
│   │   ├── assets/         # ITAM Module logic
│   │   ├── admin/          # Administrative dashboards
│   │   └── login/          # Auth entry point
│   ├── components/         # Reusable Atoms, Molecules & Organisms
│   │   ├── KanbanBoard     # Core drag-and-drop logic
│   │   ├── ListBoard       # High-density data table
│   │   └── NavHeader       # Global search & navigation
│   ├── context/            # Global Auth & Theme context
│   ├── lib/                # Database clients (Prisma, Supabase)
│   └── types/              # Centralized TypeScript interfaces
├── prisma/                 # Single source of truth for DB Schema
└── public/                 # Static branding assets
```

---

---

## 👨‍💻 Developed By

**Anurag Mallick**  
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/anurag-mallick)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/anuragmallick901/)

Distributed under the MIT License. See `LICENSE` for more information.

