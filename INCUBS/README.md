# Tinder for Startups & Investors

A React Native mobile application built with Expo that connects startups with investors, featuring profile management, fundraising campaigns, and comprehensive matching capabilities.

---

## 🚀 Project Overview

This platform enables:
- **Startups** to create profiles, browse investors, and launch fundraising campaigns
- **Investors** to discover startups, view detailed profiles, and express investment interest
- **Admins** to manage users and monitor platform activity

---

## 📱 Tech Stack

- **Frontend**: React Native (Expo SDK), TypeScript
- **Navigation**: React Navigation v6 (Stack Navigator)
- **Backend**: Supabase (PostgreSQL + Authentication)
- **State Management**: React Context API (AuthContext)
- **UI Components**: React Native built-in components

---

## 🏗️ Architecture

### Database Schema

#### Core Tables
- **users** - Authentication and role management (startup/investor/admin/super_admin)
- **startups** - Comprehensive startup profiles with 24+ fields
- **investors** - Investor profiles with investment preferences
- **fundraising_campaigns** - Active fundraising rounds
- **campaign_updates** - Campaign progress updates
- **campaign_interests** - Investor expressions of interest
- **campaign_documents** - Pitch decks and business plans
- **investments** - Investment tracking (legacy)

#### Key Features
- Row Level Security (RLS) - **Currently DISABLED** for development
- Database triggers for auto user creation
- UUID primary keys throughout
- Foreign key relationships with CASCADE deletes

---

## 📂 Project Structure

```
mobile/
├── src/
│   ├── components/
│   │   └── SimpleDropdown.tsx          # Reusable dropdown component
│   ├── context/
│   │   └── AuthContext.tsx             # Authentication state management
│   ├── navigation/
│   │   └── RootNavigator.tsx           # Role-based navigation logic
│   ├── screens/
│   │   ├── LoginScreen.tsx             # Login with error handling
│   │   ├── SignupScreen.tsx            # Signup with auto-signin
│   │   ├── RoleSelectionScreen.tsx     # Choose startup/investor role
│   │   ├── StartupHome.tsx             # Browse investors (startup view)
│   │   ├── InvestorHome.tsx            # Browse startups (investor view)
│   │   ├── StartupDetail.tsx           # Detailed startup profile view
│   │   ├── InvestorDetail.tsx          # Detailed investor profile view
│   │   ├── StartupProfileForm.tsx      # 24-field startup profile editor
│   │   ├── InvestorProfileForm.tsx     # Comprehensive investor profile
│   │   ├── StartupDashboard.tsx        # Startup profile display
│   │   ├── InvestorDashboard.tsx       # Investor profile display
│   │   ├── FundraisingCampaignForm.tsx # Create fundraising campaigns
│   │   ├── FundraisingDashboard.tsx    # Manage campaigns (startup)
│   │   ├── FundraisingBrowse.tsx       # Browse campaigns (investor)
│   │   ├── FundraisingCampaignDetail.tsx # Campaign details
│   │   ├── AdminDashboard.tsx          # Admin management screen
│   │   ├── SuperAdminDashboard.tsx     # Super admin controls
│   │   ├── UserManagement.tsx          # User administration
│   │   ├── StartupManagement.tsx       # Startup admin view
│   │   └── InvestorManagement.tsx      # Investor admin view
│   └── utils/
│       └── auditLog.ts                 # Logging utility
├── supabaseClient.ts                   # Supabase client configuration
├── apiMode.ts                          # API configuration
└── App.tsx                             # Root component

db/
├── create_users_table.sql              # Users table schema
├── create_startups_table.sql           # Startups base table
├── create_investors_table.sql          # Investors base table
├── create_investments_table.sql        # Investments tracking
├── add_startup_profile_columns.sql     # Comprehensive startup fields
├── add_interested_industries.sql       # Investor preferences
├── fundraising_system.sql              # Complete fundraising schema
├── rls_policies.sql                    # Row Level Security policies
└── COMPLETE_SETUP.sql                  # Full database setup script
```

---

## 🛠️ GitHub Setup & Workflow

- Install Git (Windows: `winget install --id Git.Git -e`), then initialize in repo root: `git init`.
- First commit: `.gitignore`, `README.md`, `.env.example` (no secrets). Create GitHub repo (private recommended) with license (MIT/Apache-2.0) and set remote.
- Branch model: `main` (protected), `dev` (integration), feature branches `feat/*`, fixes `fix/*`; merge via PR with checks.
- Secrets: never commit `.env`; keep real values in GitHub/CI secrets. `.env.example` documents required keys.
- Push flow: `git checkout -b feat/<name>` → commit → PR into `dev` → after checks/review, PR `dev` → `main`.

---

## 🎯 Key Features

### Authentication & Roles
- Email/password authentication via Supabase Auth
- Role selection: `startup`, `investor`, `admin`, `super_admin`
- Auto-creation of user records via database trigger
- Role-based navigation and access control

### Startup Features
- **Home Page**: Browse all registered investors
  - Search by name, company, or industry
  - View investment capacity and preferences
  - Click for detailed investor profiles
- **Profile Management**: 24 comprehensive fields
  - Basic info: Company name, tagline, location, website
  - Legal: Company type, GST, PAN, registration numbers
  - Team: Founder info, team size, directors
  - Business: Industry, model, target market, competition
  - Financials: Revenue, funding stage, monthly burn
- **Fundraising**: Create and manage campaigns
  - Set funding goals and equity offered
  - Add pitch decks and business plans
  - Track campaign progress and investor interest
- **Investor Discovery**: View detailed investor profiles
  - Investment capacity and stage preferences
  - Interested industries
  - LinkedIn and social profiles

### Investor Features
- **Home Page**: Browse all registered startups
  - Search by name, industry, or location
  - View company taglines and founding year
  - Quick access to startup websites
- **Profile Management**: Comprehensive investor profile
  - Name, company, location
  - Investment range (min/max)
  - Interested industries (multi-select)
  - LinkedIn, Twitter, website links
- **Startup Discovery**: Detailed startup profiles
  - Business model and target market
  - Team information and leadership
  - Financial snapshot (revenue)
  - **Excludes sensitive data** (GST, PAN, registration)
- **Fundraising Campaigns**: Browse and express interest
  - Filter by campaign type (equity/debt/convertible)
  - View funding progress and terms
  - Submit investment interest with proposed amount

### Admin Features
- **Admin Dashboard**: View statistics and manage users
- **User Management**: View/edit all user accounts
- **Startup Management**: Monitor registered startups
- **Investor Management**: Monitor registered investors
- **Super Admin**: Additional controls for admin management

---

## 🔑 Environment Variables

Create a `.env` file in the `mobile` directory:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- Android Studio (for Android) or Xcode (for iOS)

### Steps

1. **Clone the repository**
```bash
cd mobile
npm install
```

2. **Configure Supabase**
   - Create a Supabase project
   - Copy your project URL and anon key to `.env`
   - Execute SQL scripts in this order:
     ```sql
     -- Run in Supabase SQL Editor
     db/create_users_table.sql
     db/create_startups_table.sql
     db/create_investors_table.sql
     db/add_startup_profile_columns.sql
     db/add_interested_industries.sql
     db/create_investments_table.sql
     db/fundraising_system.sql
     ```
   - **Note**: RLS policies are currently disabled for development

3. **Start the development server**
```bash
npm start
```

4. **Run on device**
   - Scan QR code with Expo Go app (Android/iOS)
   - Or press `a` for Android emulator
   - Or press `i` for iOS simulator
   - Or press `w` for web browser

---

## 📊 Database Setup Instructions

### Required SQL Migrations

Execute these in your Supabase SQL Editor in order:

1. **Users table** - Base authentication
2. **Startups table** - Company profiles
3. **Investors table** - Investor profiles
4. **Startup columns** - Extended profile fields (24 new columns)
5. **Investor columns** - Investment preferences
6. **Fundraising system** - Campaign tables and triggers
7. **RLS policies** - Security rules (currently disabled)

### Database Trigger

The `handle_new_user()` trigger automatically creates a user record when someone signs up via Supabase Auth.

---

## 🚧 Current Development Status

### ✅ Completed
- Authentication flow with error handling
- Role-based navigation system
- Comprehensive profile forms (startup & investor)
- Home pages with search and browse functionality
- Detail pages with clickable links
- Fundraising campaign system
- Admin management interface
- Database schema with all relationships

### ⚠️ Known Issues
- **RLS is DISABLED** - Must be re-enabled before production
- Some TypeScript navigation types use `as any` workarounds
- Profile forms don't have image upload capability
- No real-time updates (needs Supabase subscriptions)

### 🔜 Planned Features
- Document upload for pitch decks
- Investment commitment tracking
- In-app messaging between startups and investors
- Email notifications for campaign updates
- Advanced search filters
- User analytics dashboard
- Image upload for logos and profile pictures

---

## 🎨 UI/UX Design

### Navigation Pattern
- **Home (🏠)**: Default landing page showing browse view
- **Profile (👤)**: Edit your profile information
- **Logout (🚪)**: Sign out and return to login

### Screen Hierarchy

**Startups**:
```
StartupHome (Browse Investors)
├── InvestorDetail
└── StartupProfileForm
    └── StartupDashboard (deprecated)

FundraisingDashboard
├── FundraisingCampaignForm
└── FundraisingCampaignDetail
```

**Investors**:
```
InvestorHome (Browse Startups)
├── StartupDetail
└── InvestorProfileForm
    └── InvestorDashboard (deprecated)

FundraisingBrowse
└── FundraisingCampaignDetail
```

---

## 🔐 Security Considerations

### Current State (Development)
- RLS policies are **DISABLED** for easier development
- All tables are publicly readable/writable
- Auth checks happen only in the application layer

### Production Requirements
- **Enable RLS** on all tables
- Implement proper policies:
  - Users can only edit their own profiles
  - Admins have elevated privileges
  - Campaign data restricted to relevant parties
- Add service role operations where needed
- Implement rate limiting
- Add input validation and sanitization

---

## 📝 Code Conventions

- **TypeScript** strict mode enabled
- **Functional components** with hooks
- **Async/await** for all Supabase operations
- **Error handling** with try/catch and Alert
- **Navigation** uses `(navigation as any)` for cross-stack routing
- **Styling** with StyleSheet, avoid inline styles

---

## 🐛 Troubleshooting

### Common Issues

**Column not found errors**
- Run all SQL migration scripts in order
- Check column names match between code and database

**Navigation type errors**
- Using `(navigation as any).navigate()` as temporary workaround
- Proper typing requires shared navigation params across stacks

**Profile not loading**
- Ensure you've created a profile first
- Check user.role matches the expected value
- Verify database columns exist

**RLS blocking queries**
- Confirm RLS is disabled: `ALTER TABLE tablename DISABLE ROW LEVEL SECURITY;`
- Check Supabase dashboard for active policies

---

## 👥 User Roles Explained

| Role | Access Level | Capabilities |
|------|-------------|--------------|
| **startup** | Standard user | Create profile, browse investors, launch campaigns |
| **investor** | Standard user | Create profile, browse startups, express interest |
| **admin** | Elevated | View all users, manage startups/investors |
| **super_admin** | Full access | Manage admins, full platform control |

---

## 📄 License

This project is private and proprietary.

---

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

---

## 📞 Support

For technical support or questions:
- Check the troubleshooting section above
- Review Supabase logs for database errors
- Ensure all environment variables are set correctly

---

## 🔄 Recent Updates

### Latest Changes (December 27, 2025)
- ✅ Added home pages for both startups and investors
- ✅ Implemented detailed profile view screens
- ✅ Added logout button to home page headers
- ✅ Fixed investor table column name mismatches
- ✅ Made home page the default landing screen (not profile form)
- ✅ Added search functionality on browse pages
- ✅ Excluded sensitive data (GST, PAN) from public startup views
- ✅ Added clickable website links in detail views

---

## 📚 Additional Documentation

- **Supabase Docs**: https://supabase.com/docs
- **React Navigation**: https://reactnavigation.org/
- **Expo Documentation**: https://docs.expo.dev/
- **TypeScript**: https://www.typescriptlang.org/docs/

---

**Built with ❤️ for the startup ecosystem**
