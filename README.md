# JK Stavby Dashboard

Construction project management dashboard built with React, TypeScript, Tailwind CSS, and Supabase.

##  Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_SUPABASE_URL=https://gwmqhwjctrqzmypmegwi.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📦 Vercel Deployment

### Option 1: GitHub Integration (Recommended)

1. Push code to GitHub repository
2. Import project in Vercel Dashboard
3. Configure environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deploy
vercel --prod
```

### Build Settings for Vercel

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 🗄️ Supabase Database Schema

```sql
-- Users table (handled by Supabase Auth + profiles)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN DEFAULT true,
  phone TEXT,
  position TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
  planned_budget NUMERIC DEFAULT 0,
  notes TEXT,
  project_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  project_id UUID REFERENCES projects(id),
  supplier_name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  date_issue DATE NOT NULL,
  date_due DATE,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'overdue')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget changes audit log
CREATE TABLE budget_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  changed_by UUID REFERENCES user_profiles(id) NOT NULL,
  old_value NUMERIC NOT NULL,
  new_value NUMERIC NOT NULL,
  change_amount NUMERIC NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project dashboard view (for optimized queries)
CREATE OR REPLACE VIEW project_dashboard AS
SELECT 
  p.id,
  p.name,
  p.code,
  p.status,
  p.planned_budget,
  p.notes,
  p.project_year,
  COALESCE(SUM(i.total_amount), 0) as total_costs,
  COUNT(i.id) as invoice_count,
  CASE 
    WHEN p.planned_budget > 0 
    THEN ROUND((COALESCE(SUM(i.total_amount), 0) / p.planned_budget * 100)::numeric, 2)
    ELSE 0 
  END as budget_usage_percent
FROM projects p
LEFT JOIN invoices i ON i.project_id = p.id
GROUP BY p.id;

-- Project invoices view
CREATE OR REPLACE VIEW project_invoices AS
SELECT 
  i.*,
  p.name as project_name
FROM invoices i
LEFT JOIN projects p ON p.id = i.project_id;
```

## 🎨 Tech Stack

- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Backend**: Supabase (Auth + Database)
- **Charts**: Recharts
- **Icons**: Lucide React

## 📁 Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── BottomNav.tsx
│   ├── BudgetHistory.tsx
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── Toast.tsx
├── contexts/         # React contexts
│   └── AuthContext.tsx
├── lib/              # Services and utilities
│   ├── supabase.ts
│   └── userService.ts
├── pages/            # Page components
│   ├── Admin.tsx
│   ├── Dashboard.tsx
│   ├── ForgotPassword.tsx
│   ├── Invoices.tsx
│   ├── Login.tsx
│   ├── ProjectDetail.tsx
│   ├── Projects.tsx
│   ├── Reports.tsx
│   └── Settings.tsx
├── App.tsx           # Main app component
├── constants.ts      # Colors and formatters
├── index.css         # Global styles
├── main.tsx          # Entry point
└── types.ts          # TypeScript interfaces
```

© 2026 JK Stavební spol. s r.o. | Created by [vilim.one](https://vilim.one)
