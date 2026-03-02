---
stepsCompleted:
  [
    step-01-init,
    step-02-discovery,
    step-02b-vision,
    step-02c-executive-summary,
    step-03-success,
    step-04-journeys,
    step-05-domain,
    step-06-innovation,
    step-07-project-type,
    step-08-scoping,
    step-09-functional,
    step-10-nonfunctional,
    step-11-polish,
  ]
inputDocuments: []
workflowType: "prd"
briefCount: 0
researchCount: 0
brainstormingCount: 0
projectDocsCount: 0
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: greenfield
---

# Product Requirements Document — MotivaTodo

**Author:** Nearformer
**Date:** 2026-02-27

---

## Executive Summary

**MotivaTodo** is a zero-friction, speed-first task management web application targeting high-stakes professionals — lawyers, consultants, and anyone managing a high volume of micro-tasks with real consequences for forgetting them. The core problem: existing TODO apps are abandoned not because users dislike them, but because capturing a task takes too long. Every second of friction between "I need to remember this" and "it's captured" is a task lost.

The app loads instantly on first access — no registration, no login, no configuration. Users land directly on their task list. On the first API request, the backend silently assigns a temporary user ID — tasks are persisted server-side immediately with no user action required. Tasks are sorted by insert date (newest first) with older tasks progressively highlighted to surface neglected items. Completing a task triggers a motivational quote, reinforcing the capture-and-clear habit loop.

**Core features (MVP):**

- View todo list (insert date DESC, loads on arrival)
- Add a todo item (optimized for speed — single input)
- Mark a todo as done (triggers motivational quote)
- Delete a todo permanently
- Backend persistence — anonymous user ID assigned by server on first request, no login required
- Optional registration (post-MVP) to claim anonymous identity and enable cross-device access

### What Makes This Special

Every competing tool requires investment before value: create an account, configure categories, choose a workspace. MotivaTodo inverts this — value is delivered before a single decision is made. The core insight: **the best TODO app is the one users actually open when they have 10 seconds between meetings**. Speed of capture is the product. The motivational quote on completion transforms a mundane checkbox into positive reinforcement, turning task management into a habit.

### Project Classification

| Attribute           | Value                  |
| ------------------- | ---------------------- |
| **Project Type**    | Web Application (SPA)  |
| **Domain**          | General / Productivity |
| **Complexity**      | Low                    |
| **Project Context** | Greenfield             |

---

## Success Criteria

### User Success

The primary indicator of user success is **task creation growth over time** — todos created per user per session trending upward signals genuine habit formation. Secondary signal: low deletion rate of uncompleted tasks (users complete rather than abandon).

### Business Success

**Voluntary registration rate** — the percentage of active users who choose to register without being prompted. A user who registers has committed: they want their data to survive beyond the current device. Target: meaningful and growing share of active users registering within 30 days of first use.

### Measurable Outcomes

| Metric                                          | Target                        |
| ----------------------------------------------- | ----------------------------- |
| Initial load time                               | < 400ms                       |
| API response time (CRUD)                        | < 200ms p95                   |
| Todos created per active user (week 1 → week 4) | Increasing trend              |
| Voluntary registration rate                     | Key business health indicator |

---

## User Journeys

### Journey 1 — Marco's Morning (Primary User, Success Path)

**Persona:** Marco, 38, corporate lawyer at a mid-sized firm. He manages 40+ active client matters simultaneously. He's tried Notion, Todoist, Apple Reminders — all abandoned within two weeks because "adding a task took longer than just remembering it."

**Opening Scene:** 8:47am. Marco is between a client call and a court appearance at 9:15. A thought hits him: _"I need to send the amended contract to Rossi by Thursday."_ He has 90 seconds.

**Rising Action:** He opens MotivaTodo on his phone. The app loads under 400ms — his list is already there. He sees 6 open tasks, the oldest glowing amber. He taps the input, types "Send amended contract to Rossi — Thursday", hits enter. Done. 8 seconds total.

**Climax:** Thursday afternoon. He opens the app, finds the task, sends the contract, marks it done. A motivational quote appears: _"The secret of getting ahead is getting started."_ He closes the app.

**Resolution:** Three weeks in, Marco's task count per session is growing. Last week he registered — not because anyone asked, but because he switched phones and didn't want to lose his list.

**Requirements revealed:** instant load, add task (single input), list view sorted by insert date DESC, age-based color highlighting, mark as done, motivational quote on completion, optional registration to claim anonymous identity.

---

### Journey 2 — Marco Between Meetings (Returning User, Speed Test)

**Persona:** Same Marco. Standing outside a meeting room, 3 minutes before his next call.

**Opening Scene:** A partner just mentioned a deliverable verbally in the corridor. Marco has 60 seconds before he's back in a meeting.

**Rising Action:** He opens MotivaTodo. The app loads — his list is there, fetched from the backend. He types "Prepare summary memo for Bianchi — by EOD Friday" and hits enter. Task appears at the top.

**Climax:** Under 10 seconds. He pockets his phone and walks in. The task is on the server.

**Resolution:** Three days later, "Prepare summary memo for Bianchi" is still there, now glowing amber. He writes the memo, marks it done. A motivational quote appears. He moves on.

**Requirements revealed:** fast load with server-fetched data, responsive API (< 200ms), add task with immediate UI feedback, age-based highlighting on returning visits, mark as done + motivational quote.

---

### Journey 3 — Elena's First Visit (New User, First Experience)

**Persona:** Elena, 31, junior associate at Marco's firm. She's skeptical — she's quit three other apps.

**Opening Scene:** Elena opens the URL during her lunch break.

**Rising Action:** The app loads under 400ms. No "sign up to get started." No onboarding wizard. Just a clean, empty task list and an input field. The call to action is obvious: _add something_.

**Climax:** Elena types "Review Martinelli lease agreement." It appears on the list. _That's it?_ She adds two more tasks in 30 seconds. A temporary ID has been silently assigned — her tasks are already on the backend.

**Resolution:** She returns the next morning. Her three tasks are still there. Two weeks in, she hasn't thought about registering — but her data is safe either way.

**Requirements revealed:** no auth wall on first visit, empty state with clear affordance to add, immediate task persistence without login, silent anonymous ID assignment by backend, tasks survive browser close/reopen via server-side storage.

---

### Journey Requirements Summary

| Capability                                         | Required By            |
| -------------------------------------------------- | ---------------------- |
| < 400ms initial load                               | All journeys           |
| Backend API < 200ms p95                            | Journey 2              |
| Add task (single action)                           | Journey 1, 2, 3        |
| List view, sorted by insert date DESC              | Journey 1, 2, 3        |
| Age-based color highlighting                       | Journey 1, 2           |
| Mark as done + motivational quote                  | Journey 1, 2           |
| Delete task                                        | Implied by all         |
| Backend-persisted data (online-only)               | All journeys           |
| Backend assigns anonymous user ID on first request | Journey 3              |
| No auth wall on first visit                        | Journey 3              |
| Tasks survive browser close/reopen (server-side)   | Journey 3              |
| Optional registration (post-MVP)                   | Journey 1 (resolution) |

---

## Innovation & Novel Patterns

### Zero-Decision Identity Model

MotivaTodo eliminates the traditional guest-vs-registered binary. On first request, the backend assigns a temporary user ID and returns it to the client — tasks are persisted immediately with no user decision required. Optional registration is the act of _claiming_ an existing backend identity, not creating a new one. This removes the single biggest drop-off point in productivity app onboarding.

**Validation:** Measure anonymous-to-registered conversion rate. Near-zero signals users don't trust persistence without registration.

### Passive Prioritization via Visual Aging

Task urgency is communicated through progressive color highlighting based on relative insert age — no labels, no manual sorting, no priority fields. The list organizes itself over time.

The graduation is **relative and list-aware** — intensity adapts to the actual age distribution of the current list:

| Position by age      | Highlight      | State                           |
| -------------------- | -------------- | ------------------------------- |
| Newest (fresh batch) | None           | Normal                          |
| Aging                | 10% → 100%     | Urgency increasing              |
| Peak                 | 100%           | Maximum urgency                 |
| Staleness threshold  | 80% → 60% + ⚠️ | _"Is this task still ongoing?"_ |

The staleness warning distinguishes _urgently pending_ from _potentially abandoned_ tasks.

**Validation:** Track task completion rate by age bracket. Higher completion rates for highlighted tasks confirms the signal is working.

**Risk:** Anonymous ID stored in localStorage — if cleared before registration, backend ID is lost. Mitigation: non-intrusive registration nudge after 3–5 tasks added.

---

## Technical Architecture

### Architecture Overview

- **SPA** — single HTML shell, client-side routing, all core logic in the browser
- **Online-only** — no offline mode, no service worker, no local data caching
- **Backend as single source of truth** — all task data persisted server-side, read/written via REST API
- **Anonymous identity** — on the first API request, the backend creates an anonymous user record, assigns a cryptographically random user ID, and returns it in the response; the client stores it in localStorage and sends it with every subsequent request; registration promotes that ID to a full account

### REST API Surface (MVP)

| Method   | Endpoint     | Purpose                                    |
| -------- | ------------ | ------------------------------------------ |
| `GET`    | `/todos`     | Retrieve all todos for the requesting user |
| `POST`   | `/todos`     | Create a new todo                          |
| `PATCH`  | `/todos/:id` | Update a todo (e.g., mark as done)         |
| `DELETE` | `/todos/:id` | Delete a todo                              |

First-request handshake: if no user ID is present in the request, the backend creates an anonymous user and returns the assigned ID; the client persists it in localStorage.

### Browser Support

| Browser                                         | Support       |
| ----------------------------------------------- | ------------- |
| Chrome, Firefox, Safari, Edge (last 2 versions) | Full          |
| Mobile Safari (iOS), Chrome for Android         | Full          |
| Legacy / IE                                     | Not supported |

### Responsive Design

- Mobile-first — primary use case is one-handed phone access in time-constrained moments
- Full functionality on desktop (secondary use case)
- Touch targets minimum 44×44px; input field always visible without scrolling

---

## Product Scope & Phased Development

### MVP Philosophy

**Experience MVP** — deliver a complete, delightful core experience that proves the speed-and-simplicity value proposition from day one. The MVP must feel _finished_, not provisional. Every excluded feature was omitted because it would add friction, complexity, or delay — not because it isn't valuable.

### Phase 1 — MVP

| Capability                                              | Rationale                                 |
| ------------------------------------------------------- | ----------------------------------------- |
| View todo list (insert date DESC)                       | Core value delivery                       |
| Add todo (single action, < 50ms perceived response)     | Primary differentiator — speed of capture |
| Mark todo as done + motivational quote                  | Habit reinforcement loop                  |
| Delete todo                                             | Basic list hygiene                        |
| Age-based color highlighting (relative graduated scale) | Passive urgency surfacing                 |
| Backend assigns anonymous user ID on first request      | Frictionless persistence                  |
| Tasks survive browser close/reopen (server-side)        | Trust foundation                          |
| REST API (GET/POST/PATCH/DELETE /todos)                 | Backend backbone                          |
| < 400ms initial load                                    | Core performance promise                  |
| Zero critical WCAG violations                           | Accessibility floor                       |

### Phase 2 — Growth (Post-MVP)

- Optional user registration and login
- Anonymous ID promotion to full account (no data migration required)
- Cross-device access for registered users
- Account management (email, password)

### Phase 3 — Expansion

- Smart priority inference (deadline detection from task text)
- Team/shared lists for professional contexts
- Native mobile apps (iOS/Android)
- Calendar and email integrations

### Risk Summary

| Risk                                          | Mitigation                                                       |
| --------------------------------------------- | ---------------------------------------------------------------- |
| Visual aging delivers noise instead of signal | Relative, list-aware graduated scale + staleness warning pattern |
| Anonymous ID lost on localStorage clear       | Non-intrusive registration nudge after 3–5 tasks                 |
| Adoption blocked by entrenched habits         | Zero switching cost — triable in 30 seconds, no account required |
| Motivational quotes feel repetitive           | Large, varied, curated quote library                             |

---

## Functional Requirements

### Task Management

- **FR1:** A user can add a new todo item with a single text input action
- **FR2:** A user can view their full list of todo items
- **FR3:** A user can mark a todo item as done
- **FR4:** A user can delete a todo item permanently
- **FR5:** Marking a todo as done immediately presents the user with a motivational quote
- **FR6:** The motivational quote library contains sufficient variety to avoid repetition in normal usage

### Task List Display

- **FR7:** The todo list is sorted by insertion date, descending (newest first)
- **FR8:** Each todo item displays a visual highlight intensity proportional to its relative age within the current list
- **FR9:** Highlight graduation is relative and list-aware — intensity increases progressively across the age distribution from no highlight (newest) to peak urgency, then decreases for tasks crossing the staleness threshold
- **FR10:** Todo items crossing the staleness threshold display reduced highlight intensity and a contextual prompt: _"Is this task still ongoing?"_
- **FR11:** An empty todo list displays a clear affordance to add the first item

### Identity & Session Management

- **FR12:** On the first API request from a new client, the backend assigns a temporary anonymous user ID with no user action required
- **FR13:** The client persists the anonymous user ID across browser sessions so the todo list is available on return visits
- **FR14:** All todo data is stored server-side and associated with the user's anonymous or registered ID
- **FR15:** After a user adds a meaningful number of tasks, the app displays a non-intrusive prompt to register
- **FR16:** The application is fully functional without any login, registration, or configuration step

### Backend API

- **FR17:** The system exposes an endpoint to retrieve all todos for a given user
- **FR18:** The system exposes an endpoint to create a new todo for a given user
- **FR19:** The system exposes an endpoint to update an existing todo
- **FR20:** The system exposes an endpoint to delete a todo for a given user
- **FR21:** When a request arrives with no existing user identity, the system creates an anonymous user record and returns the assigned user ID

### Application Experience

- **FR22:** The application is interactive within 400ms of initial load
- **FR23:** The application layout supports one-handed mobile interaction
- **FR24:** The application layout is fully functional on desktop
- **FR25:** All interactive elements are operable via keyboard navigation
- **FR26:** All interactive elements meet color contrast requirements, including all visual aging highlight tiers
- **FR27:** All interactive elements are compatible with screen readers

---

## Non-Functional Requirements

### Performance

- **NFR1:** Initial application load (cold start) completes within 400ms on a standard broadband connection
- **NFR2:** The application reaches interactive state within 400ms of load
- **NFR3:** All CRUD API operations respond within 200ms at p95 under normal load
- **NFR4:** Task add, complete, and delete interactions provide perceived UI feedback within 50ms via optimistic updates

### Security

- **NFR5:** All API communication is over HTTPS — no unencrypted data in transit
- **NFR6:** Anonymous user IDs are cryptographically random and non-enumerable
- **NFR7:** No PII is collected or stored in MVP — tasks contain only user-entered text; no name, email, or device ID stored without registration
- **NFR8:** Each user can access only their own todo data — no cross-user data leakage

### Scalability

- **NFR9:** The backend architecture supports horizontal scaling without re-architecture
- **NFR10:** A 10x increase in concurrent users produces less than 20% degradation in API response times

### Accessibility

- **NFR11:** Zero critical WCAG 2.1 violations
- **NFR12:** All interactive elements are keyboard-navigable with visible focus indicators
- **NFR13:** All color contrast ratios meet WCAG 2.1 AA, including all tiers of the age-based highlight graduation
- **NFR14:** All interactive elements carry appropriate labels for screen reader compatibility

### Reliability

- **NFR15:** Backend API targets 99.5% monthly uptime
- **NFR16:** When the backend is unavailable, the app displays a clear, non-technical error state
- **NFR17:** Data confirmed by a successful API response is durable — no task data lost after write confirmation
