# Hotel Management System (HMS)

A modern, production-grade Hotel Management System built with **Next.js 14**, **Tailwind CSS**, and **Supabase**.

## 🚀 Features

*   **Dashboard**: Real-time KPI tracking (Revenue, Occupancy, Check-ins/outs).
*   **Booking Management**: Create, edit, and cancel bookings with a 4-step wizard.
*   **Room Management**: Manage room inventory, categories, and cleaning status.
*   **Guest Management**: Secure guest database with search and history.
*   **Financials**: Invoice generation, GST calculation (India-specific slabs), and payment tracking.
*   **Active Stays**: Monitor in-house guests, add charges (food, laundry), and express checkout.
*   **Authentication**: Secure login/signup via Supabase Auth.
*   **Optimized Performance**: Turbopack-powered development, optimized builds.

## 🛠️ Tech Stack

*   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS + Shadcn/UI (Radix UI)
*   **State Management**: Zustand
*   **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL)
*   **Validation**: Zod + React Hook Form
*   **Icons**: Lucide React

## 📦 Project Structure

```
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # Reusable UI components
│   ├── lib/           # Utilities, hooks, and helpers
│   ├── store/         # Zustand global state stores
│   ├── types/         # TypeScript interfaces
│   └── database/      # SQL migration scripts
├── public/            # Static assets
└── supabase/          # Supabase configuration (optional)
```

## 💻 Local Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/hotel-management-system.git
    cd hotel-management-system
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Copy `.env.example` to `.env.local` and add your Supabase credentials:
    ```bash
    cp .env.example .env.local
    ```
    Update `.env.local`:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open `http://localhost:3000`.

## 🚀 Production Deployment (Vercel)

This project is optimized for deployment on [Vercel](https://vercel.com/).

### Quick Deploy

1.  Push this code to a GitHub/GitLab/Bitbucket repository.
2.  Import the repository into Vercel.
3.  Add the Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel Dashboard settings.
4.  Click **Deploy**.

For a detailed walkthrough, see [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md).

## ⚠️ Troubleshooting

**Build Errors**: 
*   Ensure all dependencies are installed (`npm ci`).
*   Check for TypeScript errors (`npm run type-check`).

**Supabase Connection**:
*   Verify your `NEXT_PUBLIC_SUPABASE_URL` is correct.
*   Ensure Row Level Security (RLS) policies allow access (or create necessary policies).

**Styling Issues**:
*   If styles are missing, check `tailwind.config.ts` content path configuration.

**Database Migrations**:
*   Run SQL scripts from `src/database/` in the Supabase SQL Editor if you encounter missing tables or columns.

## 📄 License

Private / Proprietary.
