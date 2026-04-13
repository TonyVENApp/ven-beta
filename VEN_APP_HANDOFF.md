# VEN App — Claude Handoff Document
Last updated: April 13, 2026
Branch: dashboard-recovery-safety

---

## ROLE / HOW TO RESPOND

I am new to coding.

You must help me in a beginner-safe way:
- one step at a time
- simple language
- tell me exactly what we are doing next
- tell me what that next change will do to the app before giving me the prompt
- tell me exactly which system to use: Claude Chat, Claude Code, Terminal, Expo Go, Supabase, or GitHub
- then give me the exact prompt or command
- then wait for my result

Do NOT include a section like "What result you should see" — that format is not helpful.

Keep responses clear, direct, and low fluff.
Use light emojis if helpful.
Do not use developer shorthand without explaining it plainly.

Always press r in the Expo terminal after every code change before checking Expo Go.

---

## TERMINAL SETUP

I have three terminals running at all times:
- Claude Code terminal (claude command)
- Expo terminal (expo start already running, auto-reloads on save)
- Computer terminal (for git commands)

Do NOT tell me to run "npx expo start" — Expo is already running.
Do NOT tell me to open Expo Go — I check it myself after every change.
Just say "check Expo Go" and I will.
Always say "press r in the Expo terminal to reload" before every Expo Go check.

---

## STRICT SAFETY / CHECKPOINT RULES

Before any risky code change, any multi-file change, any dashboard change,
any routing change, any auth/onboarding change, or any chat handoff:

1. Create a restore checkpoint first.
2. Make only ONE small change at a time.
3. After the code change, always run:
   npx tsc --noEmit
4. Then always say "press r in Expo terminal to reload, then check Expo Go" and wait for my result.
5. If Expo Go passes, tell me to checkpoint.

Required checkpoint workflow:

Use: Computer Terminal

Run:
cd "/Users/papi/Documents/Valore Empire/01 - VEN App/ven-app-new"
git add -A
git commit -m "checkpoint: [short description of the verified change]"
git push

Rules:
- Do not skip the checkpoint.
- Do not do broad rewrites.
- Do not rewrite App.tsx unless I explicitly ask.
- Do not rewrite VeteranDashboard.tsx broadly unless I explicitly ask.
- Do not touch unrelated files unless required for compile safety.
- Do not do cleanup or audit passes unless I explicitly ask.
- Do not stack multiple risky edits before Expo Go verification.
- If a change fails in Expo Go, stop and fix that exact issue before anything else.

Required build sequence:
1. Give me a paste-ready prompt
2. I paste it into Claude Code
3. Claude Code edits the code
4. Claude Code runs: npx tsc --noEmit
5. I paste the result back
6. You say "press r in Expo terminal to reload, then check Expo Go" and wait
7. I reply Passed or Failed
8. If Passed, tell me to accept edits and checkpoint

ALWAYS tell me to accept edits in Claude Code before moving to the next step.
I will forget if you don't remind me.

Mandatory handoff rule:
Do not tell me to move to a new chat unless all 4 happened:
- TypeScript passed
- Expo Go passed
- git commit completed
- git push completed

---

## PROJECT INFO

Project path:
"/Users/papi/Documents/Valore Empire/01 - VEN App/ven-app-new"

Current working branch:
dashboard-recovery-safety

Last confirmed commit:
add: FUTURE_BUILDS.md tracker for upcoming phases

Main stack:
- Claude Chat = product guidance and step planning
- Claude Code (Terminal) = code editing
- Computer Terminal = git commands
- Expo Go = testing on device
- Supabase = backend
- expo-secure-store = local sensitive data (SSN)
- AsyncStorage = form draft persistence

---

## IMPORTANT PRODUCT RULES

1. P&T must be explicit only.
   If VA data does not explicitly say Permanent & Total, do not treat it as P&T.

2. Dashboard modes are based on source-of-truth fields:
   - va_rating_level
   - va_is_pt
   - va_is_tdiu

3. Supported dashboard modes:
   - below_100
   - one_hundred_scheduler
   - one_hundred_pt
   - tdiu_unemployable

4. Do not drift back to old fields unless absolutely required for compile safety.

5. Keep Co-Sponsor in the Tools tab of the one_hundred_pt dashboard.
   It routes to Document Vault opening directly on the Trusted Person tab.

6. Keep Beta Feedback removed — it was intentionally removed.

7. State Benefits area exists and must be kept.

8. FIRM RULE: Never ask veterans about their VA disability percentage or rating
   in any VEN App content, forms, scripts, or documents.

---

## CURRENT APP STATE

All confirmed working as of April 13, 2026:

### Dashboard
- 100% P&T dashboard hero matches 70% layout style
- Centered rating display
- 3-column meta row: Region | Effective Date | P&T Status
- Teal P&T accent pill at top
- Effective Date pulls from Supabase field: effective_date (date format)
- Displays as: Nov 19, 2019
- PT hero does not fade on scroll (opacity fixed to 1 for one_hundred_pt)
- Beta Feedback removed from all dashboard modes

### Dependents & Family Screen
- Chapter 35 expandable sections with Form Workspace card (VA Form 22-5490)
- CHAMPVA section with Form Workspace card (VA Form 10-10d)
- DIC section with Form Workspace card (VA Form 21P-534EZ)
- Prepare for the Future:
  - DIC tab fully built
  - Preparing a Will tab fully built with expandable Before You Start + Step-by-Step Guide
  - Burial Preparation tab fully built:
    - Section 1: Plan Ahead (with Form Workspace card VA Form 40-10007)
    - Section 2: After Death — What the Family Does Next
    - Section 3: Family Reimbursement (with Form Workspace card VA Form 21P-530EZ)
    - Section 4: Other VA Memorial Items
    - Section 5: National Cemetery Administration (NCA)
    - Document Vault callout card
- Preparing a Will:
  - Form Workspace card VA Form 10-0137

### Form Workspace System
Foundation files:
- src/lib/formWorkspace.ts — types, draft save/load, computeCompletion
- src/components/FormWorkspaceCard.tsx — reusable card UI

All 6 VA forms wired:
- VA Form 40-10007 — Pre-Need Burial Eligibility (hybrid, mail)
- VA Form 21P-530EZ — Burial Benefits Claim (hybrid, online)
- VA Form 10-0137 — Health Care / Living Will (pdf, mail)
- VA Form 22-5490 — DEA / Fry Scholarship (online)
- VA Form 21P-534EZ — DIC Survivor Benefit (pdf, online)
- VA Form 10-10d — CHAMPVA Application (online)

Each form card has:
- Status badge (Not Started / In Progress / Ready to Review / Submitted)
- Live completion percentage (tracks required fields filled)
- "We filled this for you" section (profile prefill)
- "Fill in your information" expandable section (form-specific fields)
- Prefilled fields are hidden from fill-in section automatically
- Daily reminder toggle
- Save Draft button (persists to AsyncStorage)
- Continue on VA.gov button
- Last saved date

Profile prefill:
- Loads from Supabase profiles table on screen open
- Maps: full_name, branch_of_service, date_of_birth, service_date_from,
  service_date_to, discharge_character, preferred_cemetery
- Prefilled fields hidden from guided entry section
- If field not in profile → shows in fill-in section so Veteran doesn't miss it

SSN:
- Stored locally via expo-secure-store only
- Never uploaded to Supabase or any server
- Shows privacy notice in Profile screen
- Masked by default, Show/Hide toggle, Save to device, Clear buttons

### Profile Screen
Supabase fields:
full_name, address_line1, city, state, zip_code, phone_number, branch,
separation_year, va_rating_level, va_is_pt, va_is_tdiu,
date_of_birth, service_start_date, discharge_character, preferred_cemetery

Local only (SecureStore):
ssn

### Education Benefits Screen
All 3 tabs (Post-9/11, Montgomery, VR&E) use expandable sections pattern.
Each section collapses/expands on tap.

### User Profile Screen
- Notifications tab renamed: "VA policy updates" → "Official VA Updates"

### Supabase Profile Fetch
Includes:
full_name, branch, state, va_rating_level, va_is_pt, va_is_tdiu,
edu_app_draft_started, effective_date, date_of_birth, service_start_date,
discharge_character, preferred_cemetery

---

## RELEVANT FILES

- App.tsx
- src/screens/VeteranDashboard.tsx
- src/screens/DocumentVault.tsx
- src/screens/StateBenefitsScreen.tsx
- src/screens/VeteranNewsScreen.tsx
- src/screens/UserProfile.tsx
- src/screens/DependentsFamilyScreen.tsx
- src/screens/EducationBenefits.tsx
- src/lib/dashboardMode.ts
- src/lib/formWorkspace.ts
- src/components/FormWorkspaceCard.tsx
- FUTURE_BUILDS.md

---

## NEXT BUILD TARGET

Form Review Screen (Phase 3)

What it should do:
- Dedicated screen showing all form answers before going to VA.gov
- Show all prefilled fields with their values
- Show all user-filled fields with their values
- Highlight missing required fields in red
- Show "We prefilled what we could from your profile. Please review before submitting." notice
- Add "Open VA.gov to complete" button at bottom
- Add "Save & Come Back Later" option

After Form Review Screen:
- Share / Print summary (expo-sharing + expo-print)
- Benefits Intake API for direct upload (requires production API keys)

---

## FUTURE BUILDS FILE

FUTURE_BUILDS.md lives in the project root.
Update it at the end of every session with new items discovered.
Never delete completed items — mark them ✅ instead.

---

## HOW TO HELP ME RIGHT NOW

Read this entire document first.
Ask me what I want to build next.
Then follow the build sequence above exactly.
One step at a time.
Wait for my result before moving forward.
