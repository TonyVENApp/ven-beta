# VEN App — Future Builds Tracker
Last updated: April 13, 2026
Branch: dashboard-recovery-safety

---

## HOW TO USE THIS FILE
This file tracks confirmed future build items for VEN App.
Update it after every session with new items discovered.
Never delete completed items — mark them ✅ instead.
Group items by phase and priority.

---

## PHASE 3 — FORM WORKSPACE (In Progress)

### Form Review Screen
- [ ] Build a dedicated Form Review Screen for each VA form
- [ ] Show all prefilled fields with their values
- [ ] Show all user-filled fields with their values
- [ ] Highlight missing required fields in red
- [ ] Show a checklist to review before going to VA.gov
- [ ] Add "We prefilled what we could from your profile. Please review before submitting." notice
- [ ] Add "Open VA.gov to complete" button at bottom
- [ ] Add "Save & Come Back Later" option

### Share / Print Summary (Phase 3 - After Review Screen)
- [ ] Generate a plain-text or PDF summary of the Veteran's answers
- [ ] Add Share button (uses expo-sharing)
- [ ] Add Print button (uses expo-print)
- [ ] Format summary clearly for mailing or faxing to VA
- [ ] Include form name, version date, and VA mailing address on summary

---

## PHASE 4 — BENEFITS INTAKE API (Requires Production API Keys)

### Direct VA Document Upload
- [ ] Integrate VA Benefits Intake API for direct PDF upload to VA
- [ ] Requires production API key approval from developer.va.gov (already applied)
- [ ] Requires Veteran identity verification via Login.gov or ID.me OAuth
- [ ] PDF must meet VA format requirements
- [ ] Add upload status tracking (submitted, processing, accepted, rejected)
- [ ] Add upload confirmation screen
- [ ] Never auto-submit — always require final Veteran review and tap to confirm

---

## PHASE 5 — FORM WORKSPACE EXPANSION

### New Forms to Wire (when screens are built)
- [ ] VA Form 21-2680 — Exam for Housebound Status (hybrid)
- [ ] VA Form 21-0779 — Request for Nursing Home Info (online + PDF)

### Guided Field Entry Improvements
- [ ] Add date picker UI for date fields (currently plain text input)
- [ ] Add input masking for SSN field (XXX-XX-XXXX format)
- [ ] Add input masking for phone number fields
- [ ] Add address autocomplete if feasible

---

## PHASE 6 — PROFILE EXPANSION

### Additional Common Fields (add when needed by specific forms)
- [ ] Legal first / middle / last name (split from full_name)
- [ ] Suffix
- [ ] VA file number
- [ ] Service number
- [ ] Marital status
- [ ] Mobile phone
- [ ] Home phone
- [ ] Mailing address (full)
- [ ] Residential address (if different)
- [ ] Direct deposit / banking info (masked)
- [ ] Spouse info
- [ ] Dependent children info
- [ ] VSO / representative info
- [ ] Health insurance providers
- [ ] Medicare / Medicaid status
- [ ] Claimant / survivor fields (for DIC and burial forms)
- [ ] Prefill settings (let Veteran choose which sections prefill)

---

## PHASE 7 — NEXUS NAVIGATOR API CONNECTIONS
- [ ] Complete Nexus Navigator API connections (already partially built)
- [ ] Wire remaining sandbox API endpoints
- [ ] Register for production API at developer.va.gov (active priority)

---

## PHASE 8 — USER PROFILE SCREEN (iOS / Android)
- [ ] User Profile screen (Philippine data privacy compliance research first)
- [ ] Review data privacy requirements before building

---

## PHASE 9 — @POPUPTONY / CONTENT CHANNEL
- [ ] 12-video Dumanjug Budget Scooter Series
- [ ] DD-214 walkthrough content
- [ ] VA ID card walkthrough content
- [ ] VR&E / GI Bill education benefits content (identified as underserved gap)

---

## PHASE 10 — OTHER VENTURES (Valore Empire)
- [ ] Forge & Valor Coffee — Shopify store build
- [ ] TikTok Shop PH — BIR/DTI registration (key bottleneck)
- [ ] Budget Travel Philippines App — build
- [ ] Travel Agent App — build

---

## KNOWN ISSUES / TECH DEBT
- [ ] VA Forms API — Forms API only returns download URL, cannot pre-fill VA PDFs directly
- [ ] PDF injection — VA PDFs use Adobe XFA format, not reliably writable on mobile
- [ ] Expand header alignment fix applied to burial section — audit other screens for same issue
- [ ] DependentsFamilyScreen.tsx is large (2000+ lines) — consider splitting into sub-screens in future

---

## COMPLETED ✅
- ✅ VEN App Android APK build via EAS Build (preview profile)
- ✅ Apple Developer Program enrollment started
- ✅ Beta tester materials (invite letter, feedback questionnaire, Google Form)
- ✅ VA sandbox API keys obtained (VA Forms, Benefits Reference Data, Benefits Claims, Veteran Confirmation)
- ✅ Login system (Supabase Auth, session persistence, route guard)
- ✅ VA Rating Calculator
- ✅ C&P Exam Prep (8 conditions, 2026 policy warnings)
- ✅ Claim Walkthrough with 4 live VA sandbox API connections
- ✅ Content Integrity Guardian (6-screen system, Cowork scheduled monitoring)
- ✅ Form Workspace foundation (formWorkspace.ts + FormWorkspaceCard.tsx)
- ✅ AsyncStorage installed and wired
- ✅ 6 VA forms wired with workspace cards (40-10007, 21P-530EZ, 10-0137, 22-5490, 21P-534EZ, 10-10d)
- ✅ Profile prefill wired to all 6 forms
- ✅ Guided field entry with completion percentage
- ✅ SSN stored locally via expo-secure-store (never uploaded)
- ✅ Profile expanded with DOB, service start date, discharge character, preferred cemetery
- ✅ Duplicate prefilled fields hidden from fill-in section
- ✅ Burial Preparation full build (3 sections + NCA)
- ✅ Preparing a Will full build
- ✅ Education Benefits expandable sections pattern
- ✅ Expand header alignment fix (flex: 1, paddingRight: 8)
- ✅ DIC section form workspace card repositioned
- ✅ CHAMPVA form workspace card repositioned
