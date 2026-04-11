# VEN App — Project Status Report
**Veteran Education Network | Valore Empire LLC**
**As of: April 8, 2026**

---

## Active Project Boundary

- Active app folder: `01 - VEN App/ven-app-new`
- Legacy app folder: `01 - VEN App/ven-app`
- Source of truth for all future app work: `ven-app-new`
- Do not make future app edits in `ven-app` unless a task explicitly calls for legacy review or migration work

---

## Overview

VEN App is a mobile-first React Native/Expo application that helps US military veterans navigate the VA benefits system in plain English. Built for Android (beta live) and iOS (pending Apple Developer enrollment).

---

## Screens — 100% Built and Wired

| Screen | File | Purpose |
|---|---|---|
| Login | `src/screens/LoginScreen.tsx` | Email/password sign-in via Supabase Auth |
| Sign Up | `src/screens/SignupScreen.tsx` | New account creation via Supabase Auth |
| Forgot Password | `src/screens/ForgotPasswordScreen.tsx` | Password reset email via Supabase Auth |
| Veteran Dashboard | `src/screens/VeteranDashboard.tsx` | Main hub — rating ring, claims list, alerts, quick-action buttons |
| Walkthrough Engine | `src/screens/WalkthroughEngine.tsx` | Step-by-step 21-526EZ claim filing guide |
| Document Vault | `src/screens/DocumentVault.tsx` | Camera capture, file upload, document categories, trusted-person share |
| CP Exam Prep | `src/screens/CPExamPrep.tsx` | 14-day countdown, condition guides, mock Q&A practice cards |
| Nexus Navigator | `src/screens/NexusNavigator.tsx` | Nexus letter templates, secondary conditions, doctor guide |
| VA Rating Calculator | `src/screens/VARatingCalculator.tsx` | Live combined-ratings math, examples, strategy guide |
| User Profile | `src/screens/UserProfile.tsx` | Display name, branch of service, claim status, email change, sign out |

**Navigation pattern:** `App.tsx` manages a `screen` state string. No React Navigation library — intentionally simple. Auth guard routes unauthenticated users to Login.

---

## Core Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React Native | 0.81.5 |
| Build toolchain | Expo (managed workflow) | ~54.0.0 |
| Language | TypeScript | ~5.9.2 |
| Auth + Backend | Supabase | ^2.101.1 |
| Secure session storage | expo-secure-store | ~15.0.8 |
| Build/distribution | EAS Build (Expo Application Services) | — |
| Package manager | npm | — |

**EAS Build profiles:** `development` (internal dev client) | `preview` (beta APK) | `production` (app store)

---

## Database Schema (Supabase)

**Tables in use:**

| Table | Source | Purpose |
|---|---|---|
| `auth.users` | Supabase built-in | Stores email, hashed password, session tokens |
| `profiles` | Custom (manually created) | Stores veteran profile info linked to `auth.users.id` |

**`profiles` table columns:**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key — matches `auth.users.id` |
| `full_name` | text | Veteran's display name |
| `address_line1` | text | Street address |
| `city` | text | City |
| `state` | text | State |
| `zip_code` | text | ZIP code |
| `phone_number` | text | Phone number |

All document storage is on-device (Document Vault). Branch of service, separation year, and claim status are still held in component state — not yet in the `profiles` table.

**Next database work required:**
- Wire `UserProfile.tsx` to read/write the `profiles` table
- `documents` table — if/when Document Vault moves from on-device to cloud storage

---

## Next 3 Features in Build Queue

| Priority | Feature | Description |
|---|---|---|
| 1 | **Wire UserProfile to `profiles` table** | Table exists in Supabase. Need to connect `UserProfile.tsx` to read/write full_name, address_line1, city, state, zip_code, phone_number on save/load |
| 2 | **Onboarding Flow** | First-launch screen collecting branch of service and basic profile — feeds into Dashboard and Profile. No disability percentage — ever. |
| 3 | **Education Benefits Screen** | GI Bill (Ch. 33 Post-9/11, Ch. 30 Montgomery) and VR&E (Ch. 31) plain-English navigation module |

---

## Current Build Status

| Platform | Status | Notes |
|---|---|---|
| Android | Beta live | APK distributed via Expo dashboard; beta landing page on GitHub Pages |
| iOS | Pending | Waiting on Apple Developer Program enrollment ($99/year) |

---

## Hard Rules (Non-Negotiable)

1. **Never ask veterans their VA disability percentage or rating** — not in any screen, form, or prompt.
2. **Plain English everywhere** — no government jargon without plain-language explanation.
3. All document storage is on-device and local — no server uploads in beta.

---

*This file is the single source of truth for handoff to any AI or team member. Update it whenever a screen ships or the build queue changes.*
