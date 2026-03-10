# IT Project Management Tool 🖥️

A modern, full-stack **IT helpdesk and project management system** built for internal IT teams. Supports ticket creation, assignment, priority management, Kanban/List views, real-time analytics, and public ticket submission.

---

## ✨ Features

| Feature                   | Description                                                                      |
| ------------------------- | -------------------------------------------------------------------------------- |
| 🎫 **Ticket Management**  | Create, view, update, and close tickets from a Kanban board or List view         |
| 📊 **Live Reports**       | Dynamic dashboard with ticket counts by status/priority, and recent ticket table |
| 👤 **User Management**    | Admin-only CRUD for staff accounts with role support (ADMIN / STAFF)             |
| 🔐 **JWT Authentication** | Secure login; all internal routes are protected                                  |
| 🎯 **Priority Control**   | Any logged-in user can update ticket priority (LOW → URGENT) inline              |
| 📋 **Assignment**         | Assign tickets to staff members from the ticket detail panel                     |
| 💬 **Comments**           | Thread-based comments on every ticket with Ctrl+Enter to send                    |
| 🌐 **Public Submit Form** | Anonymous external ticket submission (no login required)                         |
| 🏷️ **Status Workflow**    | TODO → IN_PROGRESS → AWAITING_USER → RESOLVED → CLOSED                           |

---

## 🏗️ Tech Stack

### Backend (`backend-traditional/`)

- **Node.js + Express** — REST API
- **Prisma ORM** — type-safe database access
- **SQLite** — lightweight embedded database
- **JWT** — stateless authentication
- **bcryptjs** — password hashing
- **Socket.IO** — real-time eventing foundation
- **Helmet + CORS** — security headers

### Frontend (`frontend/`)

- **Next.js 15** (App Router)
- **React 18**
- **Tailwind CSS v4**
- **Framer Motion** — animations
- **lucide-react** — icons

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### 1 · Clone the repo

```bash
git clone https://github.com/anurag-mallick/IT-Project-Mangement.git
cd "IT-Project-Mangement"
```

### 2 · Start the Backend

```bash
cd backend-traditional
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js        # seeds the default admin user
npm start
# → Listening on http://localhost:4000
```

**Backend `.env`**

```
PORT=4000
JWT_SECRET=your_super_secret_key_here
```

### 3 · Start the Frontend

```bash
cd frontend
npm install
npm run dev
# → Available on http://localhost:3000
```

**Frontend `.env.local`**

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

## 🔑 Default Credentials

| Username | Password   | Role  |
| -------- | ---------- | ----- |
| `admin`  | `admin123` | ADMIN |

---

## 📂 Project Structure

```
├── backend-traditional/
│   ├── middleware/       # JWT auth + role guards
│   ├── prisma/           # Schema, migrations, seed
│   ├── routes/           # ticketRoutes, userRoutes
│   ├── utils/            # auth helpers, prisma client
│   └── server.js         # Express entry point
│
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx          # Main dashboard
        │   ├── login/            # Login page
        │   ├── submit/           # Public ticket form
        │   └── admin/users/      # User management (ADMIN only)
        ├── components/
        │   ├── DashboardSidebar  # Navigation + New Ticket CTA
        │   ├── KanbanBoard       # Drag-and-drop board
        │   ├── ListBoard         # Sortable table with click-through
        │   ├── NewTicketModal    # Create ticket with assignment
        │   ├── TicketDetailModal # View/edit ticket (status, priority, assignee)
        │   └── ReportsView       # Live analytics dashboard
        └── context/
            └── AuthContext       # JWT auth state
```

---

## 📡 API Overview

| Method  | Endpoint                    | Auth     | Description                                |
| ------- | --------------------------- | -------- | ------------------------------------------ |
| `POST`  | `/api/login`                | ❌       | Get JWT token                              |
| `GET`   | `/api/tickets`              | ✅       | List all tickets                           |
| `POST`  | `/api/tickets`              | ✅       | Create internal ticket                     |
| `PATCH` | `/api/tickets/:id`          | ✅       | Update ticket (status, priority, assignee) |
| `GET`   | `/api/tickets/:id/comments` | ✅       | Get ticket comments                        |
| `POST`  | `/api/tickets/:id/comments` | ✅       | Add comment                                |
| `GET`   | `/api/users`                | ✅ ADMIN | List users                                 |
| `POST`  | `/api/users`                | ✅ ADMIN | Create user                                |
| `PATCH` | `/api/users/:id/deactivate` | ✅ ADMIN | Deactivate user                            |
| `POST`  | `/api/public/tickets`       | ❌       | Anonymous ticket submission                |

---

## 🛡️ Roles & Permissions

| Action                            | STAFF | ADMIN |
| --------------------------------- | ----- | ----- |
| Create / view tickets             | ✅    | ✅    |
| Change status, priority, assignee | ✅    | ✅    |
| Add comments                      | ✅    | ✅    |
| Submit public form                | ✅    | ✅    |
| Manage users                      | ❌    | ✅    |

---

## 📝 License

MIT
