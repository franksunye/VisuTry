# G1-F Merchant RC: First Value + Campaign only

This new scoped CI workflow executes two real Chromium Merchant journeys against
an ephemeral isolated local PostgreSQL service. This is 2/4 of the existing
foundation scenario list, not G1-F, G2, G3 or G4 certification.

The workflow runs for explicit dispatch or scoped Merchant PRs, not every
routine change. It checks the actual LOCAL DB marker before and after browser
tests, seeds synthetic identities, and never uses production credentials.
Retries are disabled and skip/missing/failure results fail the executable
scenario ledger. The three-day artifact contains only the ledger; browser
cookies, traces, screenshots and server logs are excluded.

CI provides an actual runner wall-time observation, not a made-up baseline.
Provider requests/cost are operator-reported zero, not independently measured.
URL/CSV full Catalog, native real Blob uploads, Brand Kit, Result/Kiosk,
six Journey variants and G2 commercial acceptance remain NOT TESTED.

## Third executed scenario: native Catalog photo

A real Chromium browser selects a file and submits the upload request.
Only the external storage response is mocked via Playwright routing; the
merchant login, creation, Catalog inspection, approval, durable import, and
tenant readback all run against the isolated LOCAL PostgreSQL instance.
A staged image MUST NOT create a Catalog row before explicit approval.
Editing SKU invalidates the previous inspection proposal. No real Vercel
Blob write, image delivery guarantee, provider charge, or Production write is
claimed. The original 4-case foundation manifest still has unexecuted
URL/CSV and Kiosk paths; the extra native-photo scenario does not replace them.
