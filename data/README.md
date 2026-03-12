# Legal Data Sources

This directory contains the verified legal source material used by NyayaSetu.

**Every piece of data in this directory must be traceable to a primary legal source.**

## Directory Structure

```
data/
├── bare-acts/          # Full text of Indian Acts (IPC, CrPC, MV Act, etc.)
├── state-rules/        # State-specific amendments and rules
│   ├── west-bengal/    # WB Premises Tenancy Act, WB Excise Act, etc.
│   └── jharkhand/      # Jharkhand Rent Control Act, Excise Act, etc.
└── cases/              # Landmark Supreme Court and High Court judgments
```

## MVP Scope

For the initial prototype, we cover:

### Bare Acts
- Indian Penal Code (IPC) / Bharatiya Nyaya Sanhita (BNS)
- Code of Criminal Procedure (CrPC) / Bharatiya Nagarik Suraksha Sanhita (BNSS)
- Motor Vehicles Act, 1988

### States
- West Bengal
- Jharkhand

### Cases
- 5-10 landmark Supreme Court judgments on:
  - Police powers (seizure, arrest, search)
  - Tenant rights
  - Motor vehicle regulations

## Data Format

Each source document should be accompanied by a metadata JSON file:

```json
{
  "title": "Code of Criminal Procedure, 1973",
  "shortName": "CrPC",
  "jurisdiction": { "scope": "central" },
  "sourceUrl": "https://indiankanoon.org/doc/...",
  "lastVerified": "2025-01-01",
  "sections": ["1-484"]
}
```

## Adding New Data

1. Place raw text/PDF in the appropriate directory
2. Create accompanying metadata JSON
3. Run the ingestion pipeline: `pnpm --filter @nyayasetu/api ingest`
4. Verify chunks were created correctly in the vector database

## Verification Requirements

- Every chunk must link to a source URL
- Section numbers must match the original document
- State-specific variations must be tagged with jurisdiction
- Data must be re-verified when amendments are published
