# Security Specification - Ethiopian Reinsurance S.C. Inventory System

This document outlines the security invariants, threat model, and specific adversarial scenarios designed to test our Firestore rules against illegal access, identity theft, or privilege escalation.

## Data Invariants
1. **Self-Consistency**: A user can only create or update their own user document under `/users/{userId}`. They cannot alter their security role or assigned department once registered without authorized intervention.
2. **Read Access control**: General staff can read their own user profile. Administrators can read all user profiles. Departments can be read by any authenticated user.
3. **Data Integrity**: Department details (`/departments/{departmentId}`) can only be mutated (create, update, delete) by authenticated accounts with the explicit system role of `System Admin` as validated against their Firestore user document.

---

## The "Dirty Dozen" Payloads (Threat Matrix)

### Scenario 1: Identity Hijack
*   **Target**: `/users/legit-user-id`
*   **Attack Payload**: Creating a profile for `legit-user-id` with `request.auth.uid = attacker-id`.
*   **Invariant**: Only allow creation of profiles where document ID equals `request.auth.uid`.
*   **Expected Response**: `PERMISSION_DENIED`

### Scenario 2: Privilege Escalation
*   **Target**: `/users/attacker-id`
*   **Attack Payload**: Registering as `role = "System Admin"` without system-level vetting.
*   **Invariant**: For users creating their own initial profile, we can restrict setting high-level roles unless done by an admin, or require self-assigned roles to default safely or match standard policies.
*   **Expected Response**: `PERMISSION_DENIED` (if self-assigning `System Admin`)

### Scenario 3: PII Leak - Unauthorized Reads
*   **Target**: `/users/victim-id`
*   **Attack Payload**: Attacker requesting `get` on a specific user profile `/users/victim-id`.
*   **Invariant**: General staff profiles are private to themselves unless the requester is an administrator or has specific enterprise clearance.
*   **Expected Response**: `PERMISSION_DENIED`

### Scenario 4: Rogue Department Creation
*   **Target**: `/departments/rogue-dept`
*   **Attack Payload**: Non-admin user tries to create a custom department.
*   **Invariant**: Only verified System Admin accounts can create departments.
*   **Expected Response**: `PERMISSION_DENIED`

### Scenario 5: Department Metadata Injection
*   **Target**: `/departments/dept-claims`
*   **Attack Payload**: Attacker injecting massive 2MB strings into code fields to cause Denial of Wallet (DoW).
*   **Invariant**: Strictly enforce size limits on strings (e.g., department code <= 32 chars).
*   **Expected Response**: `PERMISSION_DENIED`

### Scenario 6: ID Poisoning (Path Variable Junk)
*   **Target**: `/users/attacker-id-with-junk-unicode-and-extremely-long-string-representing-buffer-overflow-payload`
*   **Attack Payload**: Attempting write to an invalid, over-length user ID document.
*   **Invariant**: `isValidId` restricts ID length to <= 128 characters and restricts characters to standard alphanumeric, dashes, and underscores.
*   **Expected Response**: `PERMISSION_DENIED`

### Scenario 7: Time-Travel Updates
*   **Target**: `/users/attacker-id`
*   **Attack Payload**: Updating profile setting `createdAt` to a date in 2020 or a client-fabricated timestamp.
*   **Invariant**: `createdAt` is immutable; `updatedAt` must equal `request.time`.
*   **Expected Response**: `PERMISSION_DENIED`

### Scenario 8: Ghost Field Insertion (Shadow Update)
*   **Target**: `/users/attacker-id`
*   **Attack Payload**: Modifying profile while inserting unmapped properties (e.g., `isVerifiedAdmin: true`).
*   **Invariant**: Use strict schema key list size and whitelist tracking.
*   **Expected Response**: `PERMISSION_DENIED`

### Scenario 9: Blanket Directory Scraping
*   **Target**: `/users`
*   **Attack Payload**: Running an unrestricted collection query: `db.collection('users').get()`.
*   **Invariant**: Blanket queries are forbidden. Requesters must query specifically for their own document, or be signed-in admins.
*   **Expected Response**: `PERMISSION_DENIED`

### Scenario 10: Department Hijacking
*   **Target**: `/departments/dept-claims`
*   **Attack Payload**: Standard user updating department's `headUid` to themselves.
*   **Invariant**: Department collection is entirely read-only to non-admins.
*   **Expected Response**: `PERMISSION_DENIED`

### Scenario 11: Spoofed Email Domain
*   **Target**: `/users/attacker-id`
*   **Attack Payload**: Attacker signing up with `claims.head@ethiore.com` but without email verification.
*   **Invariant**: Access rules must verify email verification state if required, or strictly prevent role-based operations unless verified.
*   **Expected Response**: `PERMISSION_DENIED`

### Scenario 12: Orphaned Department References
*   **Target**: `/users/attacker-id`
*   **Attack Payload**: Creating a profile pointing to a non-existent department `department: "Ghost Dept"`.
*   **Invariant**: Check department existence before registration.
*   **Expected Response**: `PERMISSION_DENIED`

---

## Test Verification
The ruleset will be deployed and checked against these scenarios using unit-test paradigms and local emulator flows where available.
