# LEGAL RISK REGISTER

This document tracks the highest severity legal and compliance risks associated with Workout OS's actual product architecture. It must be reviewed regularly.

| RISK ID | CATEGORY | DESCRIPTION | LIKELIHOOD | SEVERITY | LEGAL BASIS | CURRENT MITIGATION | MISSING MITIGATION | PRODUCT CHANGE REQ | STATUS |
|---------|----------|-------------|------------|----------|-------------|--------------------|--------------------|--------------------|--------|
| LR-01 | Health/AI | AI provides dangerous medical/diet advice, leading to user injury or eating disorder. | Medium | Critical | Tort / Consumer Protection | General ToS disclaimer. | AI prompt hardcoded refusal rules. | Update API prompt to refuse medical requests. | P0 |
| LR-02 | Privacy (Minors) | Under-18 users access app, AI collects/profiles health data violating DPDP Act/COPPA. | High | Critical | DPDPA 2023 / COPPA | None (Implicit assumed age). | Strict DOB Age Gate during auth. | Add DOB picker to signup, block < 18. | P0 |
| LR-03 | Privacy (AI) | User inputs (voice/images) sent to 3rd party LLMs without explicit consent. | High | High | DPDPA 2023 / GDPR | Buried in old Privacy Policy. | Explicit Un-ticked Checkbox in UI. | Add consent toggle on signup flow. | P0 |
| LR-04 | Security (Images) | Users upload illegal/explicit images (CSAM/NSFW) to `progress_photos`. | Low | Critical | IT Act / Hosting ToS | Relying on user goodwill. | Automated NSFW AI screening. | Pre-upload image screening API integration. | P0 |
| LR-05 | Privacy (Data Rights) | Users cannot easily export or delete their profile/data/AI memories. | High | Medium | DPDPA 2023 / GDPR | None in UI. | In-app 1-click export/delete buttons. | Add Delete Account button + cascade logic. | P1 |
| LR-06 | Security (Leakage) | RLS policies fail, allowing User A to query User B's AI chats or photos. | Low | Critical | General Privacy Law | RLS is enabled on most tables. | Periodic automated RLS auditing. | Run security audit on all Supabase tables. | P1 |
| LR-07 | Contractual | ToS lacks enforceability for future subscriptions or AI hallucination waivers. | Medium | Medium | Contract Law | None (ToS was previously generic). | Comprehensive Terms of Service implementation. | (Completed in `/legal/` folder). | GREEN |
