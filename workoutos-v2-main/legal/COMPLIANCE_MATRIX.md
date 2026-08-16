# COMPLIANCE MATRIX

This matrix maps the application's actual data flows and technical implementation to major privacy frameworks.

| Requirement | Jurisdiction | Law/Rule | Applicable? | Evidence in App | Current Status | Gap / Missing | Required Change | Priority |
|-------------|--------------|----------|-------------|----------------|----------------|---------------|-----------------|----------|
| **Consent for Data Processing** | India | DPDPA 2023 | YES | Implicit sign-up. | Non-Compliant | No explicit AI data sharing consent. | Add explicit checkbox for 3rd party AI sharing. | P0 |
| **Notice (Privacy Policy)** | India | DPDPA 2023 | YES | Generic policy existed. | Partial | Needed alignment with actual AI / biometric data flows. | Update `privacy/page.tsx` with `/legal/PRIVACY_POLICY.md`. | P1 |
| **Data of Children** | India | DPDPA 2023 | YES (If <18) | Currently no age gate. | Non-Compliant | No DOB check. DPDP strictly forbids tracking <18. | Enforce strict 18+ block at Auth level. | P0 |
| **Right to Erasure** | Global | DPDPA / GDPR | YES | Cannot delete account in UI. | Non-Compliant | No UI for deletion; orphaned data in DB. | Build Account Deletion edge function & UI button. | P1 |
| **Data Portability** | EU/CA | GDPR / CCPA | POTENTIAL | Cannot export data. | Non-Compliant | No JSON/CSV export feature. | Build Data Export function. | P2 |
| **Security Safeguards** | India | IT Act (SPDI Rules) | YES | Supabase Auth + RLS. | Compliant | Good baseline, but needs periodic RLS auditing. | Maintain strict RLS policies on new tables. | ONGOING |
| **Consumer Protection (Ads/Claims)** | India | CPA 2019 | YES | "AI Copilot" claims. | Compliant | App makes no false medical claims in marketing. | Ensure UI text includes health disclaimers. | ONGOING |
| **Prohibited Content (NSFW/CSAM)** | India/US | IT Act / Hosting ToS | YES | `progress_photos` storage. | Non-Compliant | Users can upload anything. | Implement Cloud Vision NSFW scanning. | P0 |
