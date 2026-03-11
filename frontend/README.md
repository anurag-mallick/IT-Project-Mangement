# 🚀 Horizon IT – Project Frontend

This directory contains the Next.js frontend for the **Horizon IT** management suite.

## 🏗️ Technical Architecture

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4 + Vanilla CSS for custom Glassmorphism effects.
- **State Management**: React Context API for Authentication.
- **Realtime**: Supabase JS Client for live ticket subscriptions.
- **Icons**: Lucide React.
- **Type Safety**: TypeScript 5.x.

## 📁 Key Directories

- `src/app`: Page components and API routes (Next.js App Router).
- `src/components`: UI components (Kanban, List, Modals, ITAM cards).
- `src/context`: Authentication and global state providers.
- `src/lib`: Shared utility functions (Supabase client, search helpers).
- `src/types`: Centralized TypeScript interfaces.

## 🛠️ Local Development

1.  **Configure Environment**: Ensure you have a `.env.local` file with Supabase and Database credentials (see root README for details).
2.  **Install Dependencies**: `npm install`
3.  **Launch**: `npm run dev`

## 🎨 Design Principles

The Horizon IT interface follows a **Premium Dark** aesthetic:
- **Glassmorphism**: Backdrop blurs and semi-transparent layers for depth.
- **Fluid Motion**: Framer Motion for non-blocking transitions.
- **Unified Search**: Instant, cross-module discovery via the global NavHeader.

---
For the full system setup and backend configuration, please refer to the **[Root README](../README.md)**.
