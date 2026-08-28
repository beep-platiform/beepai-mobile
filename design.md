# BeepAI Mobile Interface Design

## Product Intent

BeepAI is a privacy-first automation companion for professional work. The mobile product emphasizes **clarity, local control, and quick action**: a customer can see their automations, run a workflow, understand its permissions, and review outcomes without needing technical automation knowledge. The interface is designed for portrait phones at a 9:16 ratio, with principal controls reachable from the lower half of the screen.

## Screen List

| Screen | Primary Content and Functionality |
|---|---|
| Home | Greeting, privacy status, quick operational summary, currently active automation, recent runs, and a prominent create-automation entry point. |
| Automations | Searchable, filterable automation list with active/inactive state, next schedule, permission needs, and one-tap run controls. |
| Automation Detail | Workflow progress, status, input/output summary, toggle to activate, run now action, and entry points to workflow, permissions, and activity. |
| Create Automation | Guided natural-language request composer with example prompts, selected tools, cadence options, and a review-to-create flow. |
| Workflow Builder | Read-only-friendly vertical workflow stack first, with clearly separated trigger, processing, output, and notification steps. The future editable workflow model remains data-driven. |
| Plans | Free, Personal, Professional, and Business subscriptions presented as concise mobile cards, with plan benefits, current-plan state, and selection feedback. |
| Permission Center | Permission explanations by automation with explicit allowed and pending state. Users can review purpose before changing a permission. |
| Activity | Filterable run history, success/failure state, duration, date, and a short execution summary. |
| Profile & Settings | Privacy statement, offline execution explanation, local-data controls, support access, and app preferences. |

## Navigation Model

The bottom tab bar contains four high-frequency destinations: **Home**, **Automations**, **Activity**, and **Profile**. Creation flows, workflow detail, plans, and permission screens open as stack screens above the tab bar. This keeps the highest-frequency actions one tap away while preserving a native iOS-style hierarchy.

## Key User Flows

| User Goal | Flow |
|---|---|
| Run a known workflow | Home or Automations → select an automation → tap **Run now** → observe processing feedback → review result in Activity. |
| Request a new automation | Home → tap **Create automation** → describe the repetitive task → select involved tools and frequency → review proposal → tap **Create request** → return to Automations. |
| Review permissions | Automation Detail → tap **Permissions** → read purpose and data scope → allow or defer optional permissions → return to the automation. |
| Change subscription | Profile → tap **Plans & billing** → compare plan cards → choose a plan → view confirmation state. |
| Investigate a failed run | Activity → select failed run → view failure context and suggested retry action → return to the automation detail. |

## Visual Direction

The visual language combines a deep ink background with vivid BeepAI violet for technical confidence, retaining the bright and approachable character of the supplied desktop references. The interface uses large text, soft radii, fine translucent borders, concise labels, and card-based grouping. Body text always maintains legible contrast; color alone is never used to communicate success or error.

| Token | Hex | Intended Use |
|---|---:|---|
| Ink | `#090B16` | Primary application background and dark surfaces. |
| Violet | `#7C3AED` | Primary actions, active navigation, and brand emphasis. |
| Electric Blue | `#2563EB` | Secondary highlights, personal plan, and informational states. |
| Mint | `#22C55E` | Privacy, success, allowed permissions, and completed runs. |
| Amber | `#F59E0B` | Warnings, advanced capacity, and attention states. |
| Coral | `#F97316` | Business plan accent and high-impact actions. |
| Cloud | `#F7F7FB` | Light card interior and high-contrast foreground surface. |
| Slate | `#64748B` | Secondary labels and supportive copy. |

## Interaction Principles

Primary actions are full-width controls with subtle press feedback and restrained haptics. Automation status is always reinforced with a textual label and icon. Screens retain generous vertical spacing and use a bottom-sheet feel for selection or confirmation actions, allowing one-handed operation while avoiding dense desktop-like layouts. Real workflow and plan content will be represented by structured local data rather than individual conditional screen implementations.
