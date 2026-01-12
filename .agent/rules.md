# JnaninYoga Digital Command Center

**INSTRUCTIONS FOR AI:**
You are acting as the Lead Engineer for the "JnaninYoga" project.
Use the context below to generate code, make architectural decisions, and answer questions.
**Constraint:** The budget is strictly fixed (2,500 MAD). Do not suggest over-engineered solutions (e.g., Microservices, Redis, complex AWS). Stick to the "Monolithic Next.js + Supabase" stack.

---

## 1. Project Overview

* **Goal:** Build a "Digital Twin" administration dashboard for a solo Yoga instructor (JnaninYoga).
* **Core Concept:** The app manages "Credits" (Usage) and "Health Safety," while offloading "Scheduling" to Google Calendar and "Address Book" to Google Contacts.
* **User Role:** Admin-Only (Single User). No client login.
* **Platform:** "Mobile-First" PWA (Progressive Web App). The client uses this primarily on her phone while teaching.

## 2. Technical Stack

* **Framework:** Next.js 14+ (App Router, TypeScript).
* **UI Library:** Shadcn/UI (Tailwind CSS) + Lucide React icons.
* **Database:** Supabase (PostgreSQL).
* **ORM:** **Drizzle ORM** (Critical for type safety and migrations).
* **Integrations:**
* **Google Calendar API:** Acts as the "Source of Truth" for class slots and private appointments.
* **Google People API:** Syncs App Clients -> Google Contacts (Label: `JnaninYoga Clients`).


* **Hosting:** Vercel.

## 3. Core Business Logic (The "Digital Twin")

### A. The Membership Model (The "Wallet")

* **Concept:** Clients buy "Credits" (Attendance Units), not dates.
* **Logic:**
* A "3-Month Group Card" = ~36 Credits.
* **Auto-Freeze:** If a client doesn't attend, no credit is deducted. Balance remains preserved.
* **Deduction:** 1 Check-in = 1 Credit deducted.



### B. Health & Safety (Guardrail vs. Dossier)

* **1. The Guardrail (Active Safety):**
* **Purpose:** Immediate risk prevention during physical movement.
* **Data:** Injuries, Pregnancy, Cardiac issues.
* **UI Behavior:** If a condition is **Active** (`today < end_date`), show a **RED ALERT** popup during the Check-in process.


* **2. The Dossier (Context):**
* **Purpose:** Deep context derived from the "Dossier de Consultation" (Intake Form).
* **Data:** Lifestyle (Sleep, Digestion), Profession, Medications, Emotional State.
* **UI Behavior:** Stored in the Client Profile for reference. **DO NOT** trigger red alerts for these fields (e.g., do not alert for "Poor Sleep").



### C. Google Integrations Strategy

* **Contacts Sync (One-Way: App -> Google):**
* When a Client is created/updated in the App -> Update Google Contact.
* *Benefit:* Ensures clients appear in the Instructor's WhatsApp with the correct name.


* **Calendar Sync (Event Management):**
* **Group Slots:** Defined in the App. App reads Google Calendar to ensure no conflicts (B2B events).
* **Private Sessions:** App reads Google Calendar to find specific "Private Appointment" events for validation.



## 4. Database Schema (Drizzle / PostgreSQL)

### Table: `clients` (Identity & Context)

* `id` (UUID, PK)
* `google_contact_resource_name` (String, nullable) - *Sync ID.*
* **Identity Fields:**
* `full_name` (String)
* `email` (String) - *From Intake Form.*
* `phone` (String)
* `birth_date` (Date) - *Used for Age/Category logic.*
* `profession` (String) - *Context for physical strain (e.g., Desk Job).*
* `address` (Text)


* `category` (Enum: Adult, Child, Student)
* **The Dossier Dump (`intake_data` JSONB):**
* Stores non-critical context from the intake form.
* *Structure:* `{ "medications": string[], "lifestyle": { "sleep": string, "digestion": string }, "emotional_state": string }`


* `created_at` (Timestamp)

### Table: `health_logs` (Active Safety Guardrails)

* *Strictly for conditions that require training modification.*
* `id` (UUID)
* `client_id` (FK)
* `condition` (String) - *e.g., "Knee Surgery", "Asthma", "Pregnancy"*
* `type` (Enum: Permanent, Temporary)
* `severity` (Enum: Info, Warning, Critical)
* `start_date` (Date)
* `end_date` (Date, nullable)
* `is_active` (Boolean)

### Table: `membership_products` (Config)

* `id` (UUID)
* `name` (String)
* `default_credits` (Int)
* `base_price` (Decimal)

### Table: `client_wallets` (The Card)

* `id` (UUID)
* `client_id` (FK)
* `physical_card_ref` (String)
* `remaining_credits` (Int)
* `status` (Enum: Active, Empty, Cancelled)

### Table: `attendance_ledger`

* `id` (UUID)
* `wallet_id` (FK)
* `check_in_time` (Timestamp)
* `google_event_id` (String)
* `slot_type` (Enum: Group, Private)

## 5. UI/UX Requirements (Mobile First)

### Screen 1: The "Pocket Command Center" (Home)

* **Top:** "Today's Schedule" (Fetched from Google Calendar).
* **Action:** "Quick Check-in" button (Floating Action Button).
* **List:** List of currently checked-in clients for the active session.

### Screen 2: Check-in Flow

1. **Search:** Name or Card ID.
2. **Safety Scan:** Checks `health_logs`. If `is_active` = true, show **ALERT**. (System ignores `intake_data` here).
3. **Confirm:** Deduct 1 Credit -> Log to DB.

### Screen 3: Client Profile (The Digital Twin)

* **Header:** Identity + Wallet Balance.
* **Tab 1: Safety:** List of active `health_logs` (Injuries/Risks).
* **Tab 2: Dossier:** Read-only view of `intake_data` (Lifestyle, Meds, Profession).
* **Tab 3: History:** Attendance logs.

## 6. Implementation Priorities (Phase 1)

1. **Weekend Kickoff:** Supabase & Drizzle Setup (Schema definition).
2. **Week 1:** Client CRUD + "Dossier" Data Entry Forms.
3. **Week 2:** Google Contact Sync.
4. **Week 3:** Wallet Logic & Check-in.
5. **Week 4:** UI Polish & PWA Testing.