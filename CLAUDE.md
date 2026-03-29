# CLAUDE.md — VEN App Project Brain
# Veteran Education Network | Valore Empire LLC
# Last Updated: March 2026

---

## WHO I AM

**Tony** — Founder, Veteran Education Network (VEN) and Valore Empire LLC.
- 6 years of personal experience fighting through the VA system
- Based in Philippines (Dumanjug, Cebu) — timezone: Asia/Manila (PHT, UTC+8)
- No formal coding background — explain every command before asking me to run it
- Communication style: direct, no fluff, simplest solution first, dry wit welcome
- Email: tony@myven.us | Handle: @popuptony

---

## THE MISSION

Build the VEN App — a mobile-first React Native/Expo application that helps US military veterans and their families navigate the VA benefits system in plain English, without needing a lawyer, a VSO, or prior knowledge of government bureaucracy.

VEN exists because the VA system is opaque, intimidating, and actively hostile to people who deserve better. Tony has lived that. The app is his answer to it.

---

## NON-NEGOTIABLE RULES (Read These First — Every Session)

1. **NEVER ask veterans about their VA disability percentage or rating.** Not in forms, UI, prompts, scripts, voice, documentation, or any output. No exceptions. Ever.
2. **Plain English always.** If a veteran needs a dictionary to read it, rewrite it.
3. **Two-layer information model:**
   - Layer 1 — Official: What the VA says should happen (VA.gov, eCFR, official forms)
   - Layer 2 — Real: What actually happens (Reddit r/Veterans, Facebook veteran groups, X/Twitter)
4. **Search before stating any fact that could have changed.** Label every claim: [SEARCHED TODAY] | [TRAINING DATA] | [INFERENCE] | [ESTIMATE]
5. **Never give version numbers, VA policy details, or platform rules from training memory.** Always search for current versions first.
6. **Explain every terminal command before asking Tony to run it.** He has no coding background.
7. **Flag problems upfront.** Don't bury issues at the end of a response.
8. **Simplest solution first.** Don't over-engineer.
9. **All deliverables (prompts, strategy docs, creative documents) export as .docx files**, not markdown or plain text.
10. **All clickable links in documents must use proper anchor tags** — never plain text URLs.

---

## COMPANY STRUCTURE

- **Valore Empire LLC** — Holding company (multi-series structure)
- **Individual Series LLCs** — Separate business lines under Valore Empire
- **VEN (Veteran Education Network)** — Operates under Valore Empire LLC
- Accounting system: 19-tab Excel workbook with VBA automation and Microsoft Graph API integration (built to Big Four standards)

---

## VEN APP — TECHNICAL STACK

| Item | Detail |
|---|---|
| Framework | React Native with Expo (managed workflow) |
| Build System | EAS Build (Expo Application Services) |
| Expo Account | tonyapp2026 |
| Project Name | ven-app-new |
| Local Path (Mac) | ~/Desktop/VEN/ven-app-new |
| Language | JavaScript / JSX |
| Package Manager | npm |
| Android Package | com.venapp.app |

### EAS Build Profiles (eas.json)
- `development` — developmentClient: true, distribution: internal
- `preview` — distribution: internal (used for beta APK)
- `production` — default (app store submission)

### Current Build Status (March 2026)
- **Android:** First distributable APK completed via EAS Build ✅
  - Build URL: https://expo.dev/accounts/tonyapp2026/projects/ven-app-new/builds/f60f3ac5-d209-4e63-982f-055b0a249985
  - Beta landing page: ven-beta.html hosted via GitHub Pages (repo: ven-beta)
  - Beta feedback: Google Form (setup in progress)
- **iOS:** Pending Apple Developer Program enrollment ($99/year, in progress as of March 2026) ⏳
- **Distribution:** Direct APK link via Expo dashboard; TestFlight for iOS (pending)

### Backend / APIs
- No dedicated backend server as of beta — app is primarily client-side
- VA Data Aggregator: Separate Python-based project (not yet integrated into app)
- Planned: VA.gov API, benefits eligibility endpoints, document upload processing
- Future AI layer: Claude API (Anthropic) for personalized guidance, ElevenLabs for voice, Whisper for speech input

### Data Sources
- **Official:** VA.gov, eCFR, official VA forms (21-526EZ, 21-0781, etc.)
- **Community:** Reddit (r/Veterans, r/VeteransBenefits), Facebook veteran groups, X/Twitter
- **Academic:** Google Scholar for veteran outcome research
- **News:** Google News for current VA policy changes

---

## APP NAVIGATION FLOW (Intended)

1. Onboarding → branch of service, basic profile (NO disability % ever asked)
2. Dashboard → main hub with benefit category tiles
3. Claim Walkthrough → 21-526EZ step-by-step with plain-English guidance
4. Education Benefits → GI Bill, VR&E (planned)
5. Home Loans → VA loan process (planned)
6. Document Vault → DD214 upload and parsing (planned)
7. Settings / Profile

---

## TARGET USERS

- **Primary:** US military veterans at any stage of their VA benefits journey
- **Secondary:** Veteran family members helping a veteran navigate benefits
- **Tertiary:** VSOs, veteran advocates, and community support workers
- **All branches:** Army, Navy, Air Force, Marines, Coast Guard, National Guard

---

## UI/UX DESIGN PHILOSOPHY

- Mobile-first — designed for phone use, not desktop
- Plain English everywhere
- Clean, uncluttered layouts — veterans navigating the VA are already overwhelmed
- Empathetic tone — trusted friend, not a government portal
- No disability percentage inputs anywhere — ever

---

## PRODUCT ROADMAP

| Phase | Status | Description |
|---|---|---|
| Phase 1 | 🔄 Active | Android beta — core disability claim walkthrough, beta feedback loop |
| Phase 2 | Planned | iOS launch, education benefits module, VA home loan module |
| Phase 3 | Planned | AI eligibility checker, DD214 document parsing, personalized benefit recommendations |
| Phase 4 | Planned | Community layer, peer connections, veteran mentor matching |
| Phase 5 | Planned | B2B licensing to VSOs, legal firms, state veteran agencies |

---

## MONETIZATION

- **Freemium:** Core navigation free; premium features (AI guidance, document processing) paid
- **B2B Licensing:** VSOs, veteran legal firms, state agencies license VEN's navigation layer
- **Investor Path:** Dan Martell Angel Investor Framework document prepared; SAFE notes structure for early rounds
- **Key Metrics:** MRR, ARR, CAC, LTV

---

## VEN YOUTUBE CHANNEL

- **URL:** VEN YouTube (Veteran Education Network)
- **Subscribers:** 785 (as of March 2026)
- **Videos:** 33
- **Strongest content:** DD214 walkthrough, VA ID card walkthrough
- **Target lane:** GI Bill / VR&E education benefits (underserved vs. saturated disability rating content)
- **Content rule:** NEVER ask veterans about their disability rating in any video, script, or thumbnail

---

## @POPUPTONY TRAVEL CHANNEL

- Budget scooter travel in Cebu, Philippines
- Bike: Kymco Downtown 350i
- Gear: GoPro 13, DJI Osmo Pocket 3, DJI Mini 5 Pro drone
- Scripts: English only — Philippine proper nouns and untranslatable food/place names are the only exceptions (bangus, halo-halo, carinderia, puso, sinangag, etc.)
- Active series: Dumanjug Budget Scooter Series (12-video plan)

---

## AI WORKFLOW STACK (March 2026)

| Role | Tool |
|---|---|
| Brain + Strategy + Memory | Claude Chat (claude.ai) |
| Coding + Building | Claude Code (terminal) |
| Automation / Desktop Tasks | Claude Cowork |
| Command Center | Slack (Claude MCP connected) |
| Research Layer | Web search (built into Claude) + Google AI Studio / Gemini as feeder |
| Beta Distribution | Expo EAS (Android APK) → TestFlight (iOS, pending) |

---

## CALENDAR & CONTACTS

- **Calendar tool:** Always use Google Calendar (gcal tools) — never local calendar tools
- **Gladys Campana:** gladyscampana143@gmail.com (recurring guest on calendar events)
- **Timezone:** Asia/Manila (PHT, UTC+8)

---

## TONY BRAIN (Future)

J.A.R.V.I.S.-inspired personal AI assistant (in design phase):
- Stack: Claude API + ElevenLabs + Whisper + Mem0/Supabase (pgvector) + FastAPI + React Native
- Goal: Persistent voice-enabled AI that knows all Tony's projects, context, and preferences

---

## TRUTH PROTOCOL (Active Every Session)

- Flag uncertainty before giving any answer
- Label sources: [SEARCHED TODAY] | [TRAINING DATA] | [INFERENCE] | [ESTIMATE] | [WIDELY ACCEPTED]
- Separate fact from inference
- Acknowledge conflicting sources
- Fix errors immediately when caught
- Say "I don't know" when unsure — never fabricate

---

## RESEARCH PROTOCOL (Active Every Session)

For all VEN-related research tasks, always search:
1. Official VA sources (va.gov, eCFR) — "what should happen"
2. Reddit, Facebook, X/Twitter veteran communities — "what actually happens"
3. Google Search + Google Scholar + Google News

Never rely on training data for VA policy specifics, form numbers, or benefit rules.

---

## PLATFORM GUIDANCE (For Claude Code Sessions)

- **Claude Chat** → Strategy, documents, content, research, calendar, planning
- **Claude Code** → Terminal-based coding, EAS builds, GitHub, file operations
- **Claude Cowork** → File management, automation, desktop task execution

When in doubt about which Claude product to use for a task, say so upfront and recommend the right one.

---
*This file is the persistent brain for all VEN App sessions. Keep it updated as the project evolves.*
