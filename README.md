# Indirex Household Recruitment Panel - Frontend Application

**Indirex Household Recruitment Panel** is an enterprise Household Panel Recruitment & Management System frontend built using Next.js App Router, TypeScript, and Tailwind CSS.

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Forms & Validation**: React Hook Form, Zod
- **Data Visualization**: Recharts
- **API Communication**: REST API client connecting exclusively to `hh-recruitment-backend`

## Directory Structure

```text
hh-recruitment-frontend/
├── public/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   ├── lib/
│   └── types/
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## Getting Started

### 1. Environment Setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Configure `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:4000/api/v1`).

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

The frontend application will be accessible at: `http://localhost:3000`.

### 4. Build for Production

```bash
npm run build
npm run start
```
