
# Project Masterfile: JnaninYoga Digital Command Center

## 1. Project Overview

**Goal:** Build a "Digital Twin" administration dashboard for a solo Yoga instructor (JnaninYoga).
**Core Concept:** The app manages "Credits" (Usage) and "Health Safety," while offloading "Scheduling" to Google Calendar and "Address Book" to Google Contacts.
**User Role:** Admin-Only (Single User). No client login.
**Budget/Constraint:** Low budget, fast delivery. "Mobile-First" PWA design.

## 2. Technical Stack

* **Framework:** Next.js 14+ (App Router, TypeScript).
* **UI Library:** Shadcn/UI (Tailwind CSS).
* **Database:** Supabase (PostgreSQL) - *Chosen for speed and built-in Auth.*
* **Integrations:**
* **Google Calendar API:** Acts as the "Source of Truth" for class slots and private appointments.
* **Google People API:** Syncs App Clients -> Google Contacts (Label: `JnaninYoga Clients`).

* **Hosting:** Vercel.

## 3. Core Business Logic (The "Digital Twin")

### A. The Membership Model (The "Wallet")

* **Concept:** Clients buy "Credits," not dates.
* **Logic:**
* A "3-Month Group Card" = ~36 Credits.
* **Auto-Freeze:** If a client doesn't attend, no credit is deducted. Balance remains.
* **Deduction:** 1 Check-in = 1 Credit deducted.

### B. Health & Safety (The Guardrail)

* **Critical Feature:** Visual alerts during check-in.
* **Data:**
* *Permanent:* Asthma, Past Injuries.
* *Temporary:* Pregnancy (Due Date), Surgery Recovery.

* **UI Behavior:** If a temporary condition is active (today < end_date), show a **RED ALERT** on the Check-in card.

### C. Google Integrations Strategy

* **Contacts Sync (One-Way: App -> Google):**
* When a Client is created in the App, the App sends a request to Google People API to create a Contact.
* *Tag/Label:* All created contacts are added to a specific Label Group "JnaninYoga Clients".
* *Benefit:* Ensures clients appear in the Instructor's WhatsApp automatically.


* **Calendar Sync (Event Management):**
* **Group Slots:** Defined in the App (e.g., Mon/Thu). App reads Google Calendar to ensure no conflicts (B2B).
* **Private Sessions:** App reads Google Calendar to find "Private Appointment" events.
* **B2B/Blocking:** If Instructor creates a "Blocker" event in Google Calendar, the App marks that time as "Closed".



## 4. Database Schema (PostgreSQL/Supabase)

### Table: `clients`

* `id` (UUID, PK)
* `google_contact_resource_name` (String, nullable) - *Stores the Google Contact ID for sync.*
* `full_name` (String)
* `phone` (String)
* `birth_date` (Date) - *Used for Kid/Student discount logic.*
* `category` (Enum: Adult, Child, Student)

### Table: `health_logs`

* `id` (UUID)
* `client_id` (FK)
* `condition_name` (String)
* `type` (Enum: Permanent, Temporary)
* `severity` (Enum: Info, Warning, Critical)
* `start_date` (Date)
* `end_date` (Date, nullable)

### Table: `membership_products` (Config)

* `id` (UUID)
* `name` (e.g., "Group 3 Months")
* `default_credits` (Int, e.g., 36)
* `base_price` (Decimal)

### Table: `client_wallets` (The "Card")

* `id` (UUID)
* `client_id` (FK)
* `physical_card_ref` (String) - *Printed ID on the physical card.*
* `remaining_credits` (Int) - *The "Balance".*
* `status` (Enum: Active, Empty, Cancelled)

### Table: `attendance_ledger`

* `id` (UUID)
* `wallet_id` (FK)
* `google_event_id` (String, nullable) - *Link to the specific Google Calendar event instance.*
* `check_in_time` (Timestamp)
* `slot_type` (Enum: Group, Private, Outdoor)

## 5. UI/UX Requirements (Mobile First)

### Screen 1: The "Pocket Command Center" (Home)

* **Top:** "Today's Schedule" (Fetched from Google Calendar).
* **Action:** "Quick Check-in" button (Floating Action Button).
* **List:** List of currently checked-in clients for the active session.

### Screen 2: Check-in Flow

1. Search Client.
2. **Guardrail Popup:** Show Health Alerts if active.
3. **Confirm:** Deduct 1 Credit -> Log to DB.

### Screen 3: Client Profile

* Edit Details -> Triggers Google Contact Update.
* View Wallet Balance.
* Add Health Log.

## 6. Implementation Priorities (Phase 1)

1. **Supabase Setup:** Tables & Auth.
2. **Google OAuth:** Setup GCP Project (Calendar & People Scopes).
3. **Core Sync:** Create a client in DB -> Appears in Google Contacts.
