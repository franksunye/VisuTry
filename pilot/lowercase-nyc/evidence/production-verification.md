# Lowercase NYC Production Verification

Verification date: 2026-08-11  
No real AI provider was called and no synthetic analytics events were generated.

## Data

- Merchant: `cmsor0lvi00006wi81kr12rkw`
- Active MerchantFrame rows: 20
- `default` STORE: `cmsor128k000m6wi8uwrobdzm`, 20 selected frames
- `find-your-frame` CAMPAIGN: `cmsor10da000l6wi8kp01ujgr`, 10 selected frames
- `sunglasses-edit` CAMPAIGN: `cmsor143x000n6wi8k95tcrb9`, 10 selected frames
- All three Experiences: `ACTIVE`, `referenceData=true`

## Public route results

| Route | HTTP | Visible result |
| --- | ---: | --- |
| `https://www.visutry.com/en/store/lowercase-nyc` | 200 | Lowercase NYC; 20 frames; Store headline; Reference Pilot / Simulation. |
| `https://www.visutry.com/en/c/lowercase-nyc/find-your-frame` | 200 | Find Your Frame; 10 frames; Reference Pilot / Simulation. |
| `https://www.visutry.com/en/c/lowercase-nyc/sunglasses-edit` | 200 | Sunglasses Edit; 10 frames; Reference Pilot / Simulation. |

Each route passed desktop and 390px mobile browser smoke. No application error or console error was observed. The only failed requests were Google Analytics collection requests from the headless smoke environment.

## Admin result

The production workspace query returned:

- Merchant Catalog: 20 active frames.
- Experience counts: Store 20, Find Your Frame 10, Sunglasses Edit 10.
- Independent metrics groups for each Experience.
- `Legacy / Unassigned` row.

The four Admin browser routes correctly redirect unauthenticated requests to Auth0. An authenticated Admin screenshot was not captured because no Admin session was available in this run.
