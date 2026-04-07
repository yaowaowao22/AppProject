# ReCallKit UX Maximization Deep Dive

You are a mobile UX expert with deep knowledge of spaced repetition apps (Anki, Quizlet, RemNote, Mochi, Readwise, Orbit). Analyze the current state of this app and provide concrete, actionable UX improvement proposals.

**Output language: 日本語 (Japanese)**

---

## App Overview

**ReCallKit** — A URL-to-flashcard iOS app (React Native + Expo)

### Core Value Proposition
Users paste a URL → AI auto-generates Q&A flashcards → SM-2 algorithm schedules optimal review timing. Zero manual card creation.

### User Behavior Cycle
```
Discover (find article/URL)
  → Ingest (paste URL)
    → AI Analysis (auto-generate Q&A pairs)
      → Save (add to library)
        → Review (SM-2 scheduled spaced repetition)
          → Retention (long-term memory consolidation)
```

### Target Users
- Tech learners: engineers, PMs, designers
- Primary use case: retain key points from technical articles & documentation
- Differentiator vs competitors: URL-based auto-generation (zero manual card creation friction)

---

## Current Screen Architecture (18 screens)

### Navigation Structure
```
RootNavigator
├── Onboarding (first-time setup)
└── DrawerNavigator (main app)
    ├── Home Stack (today's dashboard)
    ├── Library Stack (all items + URL import)
    ├── Review Stack (spaced repetition drills)
    ├── Map Stack (knowledge graph visualization)
    ├── Journal Stack (learning notes)
    ├── Settings Stack (config + AI models)
    ├── Tasks Stack (background jobs)
    └── History Stack (learning history)
```

### Screen Inventory with Known Issues
| Screen | Role | Current Issue |
|---|---|---|
| HomeScreen | Today's review CTA + StreakRing + URL add card + Journal card | Low information density. No learning overview. No mastery visibility |
| URLAnalysisScreen | URL input + validation | Navigates to a separate screen after submission |
| URLImportListScreen | Background processing + progress tracking | No pathway to preview/confirm generated Q&A after completion |
| QAPreviewScreen | Preview generated Q&A before saving | Exists but is NOT integrated into the main import flow (orphaned screen) |
| AddItemScreen | Manual card creation | — |
| ReviewSelectScreen | Choose today's review or pick group | 3 taps required to start a review session |
| ReviewScreen | Full-screen card flip + 4-level rating + swipe gestures | Already polished |
| QuizScreen | Quiz mode variant | — |
| LibraryScreen | All items list + tag/category filters + date grouping | List-only display. No card-style UI for a flashcard app |
| ItemDetailScreen | Single item detail view | — |
| KnowledgeMapScreen | Knowledge graph visualization | — |
| JournalScreen | Date-grouped learning notes | — |
| TaskScreen | Background job progress + results | — |
| SettingsScreen | Theme, notifications, data management | — |
| AIModelScreen | Local AI model selection/download | — |
| HistoryScreen | Learning history | — |
| OnboardingScreen | Welcome screen | — |
| ReviewGroupCreateScreen | Collection creation | — |

---

## Data Model

### items (flashcards)
- id, type('url'|'text'|'screenshot'), title(question), content(answer)
- source_url, excerpt(summary), category
- archived(0/1), flagged(0/1)
- created_at, updated_at

### reviews (SM-2 state per item)
- item_id, repetitions (consecutive correct count), easiness_factor (EF, default 2.5, min 1.3)
- interval_days (days until next review), next_review_at (ISO datetime, indexed)
- quality_history (JSON array of past ratings)

### tags / item_tags (categories, many-to-many)
### review_groups / review_group_items (custom collections)
### url_import_jobs (job queue: pending → processing → done/failed)
### journals (learning notes linked to items)
### point_events (gamification: earn/spend with reason tracking)
### app_settings (KVS: theme, notifications, daily_review_count, etc.)

---

## Existing UX Patterns & Interactions

### Card Interactions
- **3D Card Flip**: Y-axis rotation, 480ms cubic-out, scale lift 1.0→1.03→1.0, shadow deepens during flip (radius 8→18px, opacity 0.1→0.22), 1200px perspective
- **Swipe Gestures** (only on flipped/back side):
  - Left → "again" (red, heavy haptic)
  - Right → "perfect" (green, success haptic)
  - Up → "good" (blue, light haptic)
  - Down → "hard" (orange, medium haptic)
  - Threshold: 80px before commit, spring snap-back below threshold
  - Exit animation: 500px distance, 250ms, opacity fade
- **Flash Overlay**: Full-screen color flash on rating (opacity 0→0.3→0)
- **Haptics**: Varies by rating level (Heavy/Medium/Light/Success notification)

### Visual Design
- **StreakRing**: SVG circular progress (7-day cycle, color shifts at 14/30 days: Amber→Indigo→Purple)
- **Theme**: Light/Dark (system-following + manual override), Amber accent color
- **Typography**: Apple HIG type scale (Large Title 34pt → Caption2 11pt)
- **Shadows**: Light mode only, card elevation via shadow
- **Filter Chips**: Accent-tinted background, horizontal ScrollView

### Navigation Patterns
- Drawer navigation (slide-in, 280px width)
- Full-screen modals for ReviewScreen/QuizScreen (gestures disabled during review)
- Stack navigation with fade transitions

---

## Technical Constraints
- Platform: iOS only (React Native + Expo)
- Local AI: llama.rn + Gemma 4 (on-device inference, privacy-focused)
- Cloud AI: AWS Lambda + Bedrock Claude 3 Haiku (requires Cognito auth)
- Free tier: 3 AI analyses per day (unlockable via rewarded ads)
- Database: SQLite (offline-first, mandatory)
- Schema version: v7 with migration support

---

## Analysis Axes

For each axis below, provide: **current friction analysis**, **competitor comparison**, and **concrete improvement proposals** with Before/After step-count comparisons.

### Axis 1: URL Ingestion → Learning Start — Friction Reduction
- How many steps and screen transitions does it take from pasting a URL to starting a review of the generated cards?
- What is the ideal minimum-friction flow?
- How should the "review immediately after import" pathway be designed?
- Should progress display be on a separate screen, inline, or via background notification?
- How should the orphaned QAPreviewScreen be integrated into the main flow?
- What happens when AI analysis fails? How should error recovery work without losing context?

### Axis 2: Home Screen — Information Architecture
- What role should a flashcard app's home screen serve? (Include comparative analysis with Anki, Quizlet, RemNote, Readwise, Orbit)
- How to balance three pillars: "What to do today" / "Learning overview" / "Growth feedback"?
- What is the ideal tap count from home to each key action?
- How should the home screen adapt across states: empty (0 cards), sparse (1-10), moderate (11-100), heavy (100+)?
- What progressive disclosure strategy makes sense as the user's library grows?

### Axis 3: Review Experience — Session Optimization
- Reducing step count to start a review session
- In-session feedback design (progress bar, accuracy rate, estimated time remaining)
- "Mini review" mode (3-5 cards only) — entry points and flow
- Post-session summary design (what to show, next action suggestions)
- How to handle mixed difficulty levels within a single session (overdue + new + flagged)

### Axis 4: Progress Visualization & Motivation
- Quantitative definition of "mastery rate" (propose specific thresholds using SM-2 data: repetitions, EF, interval)
- Daily/weekly/monthly learning activity heatmap design
- Per-category mastery visualization
- Gamification elements beyond streaks (levels, badges, milestones, social proof)
- How to make the point_events system more visible and motivating

### Axis 5: Library — Browsability & Management
- List vs Card vs Grid display — when to use each
- Search, filter, sort UX patterns (what combinations matter for a flashcard library?)
- Bulk operations (multi-select → tag, group, archive, delete)
- Inline card editing vs detail screen — which interactions warrant which?
- How to surface "needs attention" cards (low EF, high fail rate, flagged)

### Axis 6: Notification & Re-engagement Strategy
- Optimal review reminder timing and frequency (based on spaced repetition research)
- How to express urgency of overdue cards without causing anxiety
- Import completion notification format
- Re-engagement nudges for lapsed users (3-day, 7-day, 14-day absence patterns)
- How notifications should interact with the daily free tier limit (3 analyses/day)

### Axis 7: Onboarding & Empty States
- Shortest path to the user's first "aha moment" (what is that moment for ReCallKit?)
- Sample data vs tutorial vs guided first-import — which approach and why?
- Empty state design for each screen (message copy, CTA, visual treatment)
- How to teach swipe gestures and the 4-rating system without a tutorial overlay
- First-week retention strategy (what should happen on day 1, 2, 3, 7?)

---

## Output Format

For each axis, structure your output as follows:

```
## Axis N: [Title]

### Current Friction Analysis
- Step count: N
- Screen transitions: N
- Cognitive load: [Low/Medium/High] — reason
- Key friction point: [specific description]

### Competitor Comparison
| App | Approach | Strength | Weakness |
|---|---|---|---|

### Improvement Proposals (priority-ordered)

#### Proposal 1: [Title]
- Before: [current flow description] (N steps)
- After: [improved flow description] (N steps)
- Reduction: steps -N, screen transitions -N
- Implementation complexity: [Low/Medium/High]
- Key components affected: [specific screen/component names]
- Risk/tradeoff: [what is lost or complicated by this change]

### Warnings & Tradeoffs
- [What the improvement sacrifices, side effects, edge cases]
```

---

## Competitor Reference

| App | Strength | Weakness | What to steal |
|---|---|---|---|
| Anki | Extreme customizability, proven SM-2, massive community | Dated UI, steep learning curve, no URL import | Algorithm transparency, deck organization |
| Quizlet | Social features, polished UI, multiple study modes | Student-focused, no spaced repetition by default, subscription-heavy | Study mode variety, empty state onboarding |
| RemNote | Note-taking + SR integration, bidirectional links | Complex, slow, overwhelming for simple flashcard use | Knowledge graph, inline card creation |
| Mochi | Markdown support, clean design, developer-friendly | Small community, limited mobile experience | Minimal UI philosophy, template system |
| Readwise Reader | Highlight-to-card pipeline, spaced repetition for reading | Not a flashcard app per se, expensive | Content ingestion UX, daily review email |
| Orbit | Embedded in articles, frictionless card encounter | No standalone app, limited to supported content | In-context review, progressive memory model |

---

## Additional Context

- The app uses a "Ma no Kozo" (Structure of In-Between) design philosophy — invisible structure, minimal chrome, content-first
- Accent color system: Amber warm tones
- The app has an iOS widget that syncs Q&A data for at-a-glance review
- Share extension exists for receiving URLs from other apps
- The knowledge map feature visualizes relationships between learned concepts
