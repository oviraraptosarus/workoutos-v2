# SECURITY & PRIVACY INCIDENT RESPONSE POLICY

**Last Updated:** August 2026

Workout OS employs a defensive security architecture utilizing Supabase for authentication, PostgreSQL for data storage, and Vercel for frontend hosting. This document outlines our security posture and incident response protocols.

## 1. Security Posture

### A. Authentication & Authorization
- **Supabase Auth:** All user sessions are managed via Supabase's secure JWT token architecture. We do not store plaintext passwords.
- **Row Level Security (RLS):** Every table in the PostgreSQL database is protected by RLS. This ensures at the database kernel level that User A can mathematically never read, write, or modify the health, financial, or AI data of User B.
- **API Security:** Backend serverless routes (`/api/*`) strictly verify the user's JWT token before orchestrating third-party API calls (e.g., to Google GenAI). 

### B. Third-Party Integrations
- We do not expose third-party API keys (e.g., LLM provider keys) to the client browser. All AI orchestration occurs server-side.
- AI provider configurations are strictly monitored to ensure adherence to our zero-retention requests, though we cannot cryptographically guarantee third-party internal compliance.

## 2. Incident Response Protocol
In the event of a suspected or confirmed data breach (e.g., unauthorized access to the database, a leak of progress photos, or exposure of AI chat logs), Workout OS will execute the following protocol:

### Step 1: Containment
- The affected systems will be immediately isolated. If a vulnerability is found in an API route or RLS policy, the application may be taken offline ("Maintenance Mode") to prevent further data leakage.
- Any compromised third-party API keys will be immediately rotated.

### Step 2: Assessment
- We will analyze our telemetry and Supabase audit logs to determine the exact scope of the breach: what data was accessed, how many users were affected, and the vulnerability vector.

### Step 3: Notification
- **User Notification:** If your personal, health, or financial data was reasonably likely to have been compromised, we will notify you via the email address associated with your account within 72 hours of confirming the breach scope.
- **Regulatory Notification:** In compliance with the Information Technology Act (India) and CERT-In directives, critical cybersecurity incidents will be reported to the relevant authorities within 6 hours of discovery. If applicable under GDPR/UK GDPR, the relevant supervisory authorities will also be notified within 72 hours.

## 4. Reporting a Vulnerability
If you discover a security vulnerability in Workout OS, please do not disclose it publicly. Contact our security team immediately at [Security Email Address]. We investigate all legitimate vulnerability reports.
