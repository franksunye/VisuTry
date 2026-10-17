# VisuTry Demo Access Register

Last verified: 2026-10-17. This register contains operational identity and
access instructions only. It does not authorize future role changes,
Production tests, billing changes, or Provider calls.

## Accounts and merchants

Authentication identifies a User through Auth0. MerchantMembership grants
that User a role for a Merchant. A Demo merchant does not require a separate
Auth0 account or a separate password.

The existing Product Owner account has display name `franksunye`, redacted
login address `f***@hotmail.com`, and Auth0 authentication. Its full login
address is kept in the Owner's private access note; credentials should be
kept in the Owner's password manager. No new Auth0 account, password reset,
credential rotation, or password-manager entry was created for this repair.

| Environment / merchant | Identity and access | Entry point |
| --- | --- | --- |
| Production official Demo | `VisuTry Demo Optical`; slug `visutry-demo-optical`; merchant ID `bde10238-b0ec-485c-baf6-cb3b8dd71810`; existing Product Owner account has OWNER | [Official Demo workspace](https://www.visutry.com/en/merchant?merchantId=bde10238-b0ec-485c-baf6-cb3b8dd71810) |
| Production historical Canary | `VisuTry Demo`; slug `visutry-demo`; merchant ID `cmsq1vcg3000049fy2ngsqplk`; same existing Product Owner account retains OWNER | [Historical Canary workspace](https://www.visutry.com/en/merchant?merchantId=cmsq1vcg3000049fy2ngsqplk) |
| Local official Demo | `visutry-demo-optical`; existing Local fixture User `mock-user-1`; mock authentication | [Local Demo Runtime Contract](../engineering/local-demo-runtime-contract.md) |

The official Demo remains `ACTIVE`, `TEST / DEMO / VISUTRY_DEMO`, with no
BillingAccount. The historical Canary remains a distinct `REAL / LIVE`
merchant with its existing billing and shopper history. Follow the
[Demo Environment Contract](./visutry-demo-environment-contract.md) for the
operating boundary. Guest access to the public Store does not require an
Owner login and does not prove Merchant workspace access.

## Open the official Demo

1. Open the official Demo workspace link above. If prompted, complete the
   normal Auth0 login using the existing Product Owner account.
2. Confirm the workspace selector says **VisuTry Demo Optical** and the role
   says **Owner**. Confirm the URL contains the exact official merchant ID.
3. Refresh once and confirm the same merchant and role persist. The
   historical **VisuTry Demo** may also appear in the selector; it is a
   different merchant and must not be selected for ordinary Demo QA.

## Verified repair and evidence

The [Production database investigation](https://github.com/franksunye/VisuTry/issues/414#issuecomment-6233827695)
found zero memberships of any role for the official Demo. The problem was
missing access provisioning, not a forgotten Demo password.

The Owner then explicitly authorized binding the existing account. A guarded
Serializable transaction created one OWNER membership for the exact existing
User and official TEST merchant. A fresh read verified one membership and one
matching OWNER. Hash comparisons confirmed that both Merchant rows, their
catalogs, Experiences, BillingAccounts, and the Canary's memberships were
unchanged. No Auth0 User or credential was created or changed.

The existing Chrome session opened official Demo Home with the correct
merchant ID and Owner role, retained access after refresh, opened the Canary
independently, and returned to the official Demo. This verifies account
access only; it does not sign off the remaining G4 tests or Commercial-Ready.
The operation receipt is maintained in [Issue #414](https://github.com/franksunye/VisuTry/issues/414).

## Credential storage and access recovery

Use an account-holder-controlled password-manager item named
**VisuTry / Production / Product Owner**. Record its login address, normal
sign-in URL, MFA/recovery custodian, and the official Demo merchant slug.
Passwords and recovery codes stay in the password manager. No credential
vault entry or monitoring ownership is asserted by this document.

If access is lost, first inspect the exact MerchantMembership -> User ->
Account provider relationship through an authorized read-only database
connection. Select identifiers and provider names only; do not select access
tokens, refresh tokens, ID tokens, Session tokens, or password material.
Verify the Production environment marker and all three Demo TEST markers.
An empty membership result means access was not provisioned; repeated login
attempts cannot fix it.

A role repair requires explicit Owner authorization for the exact existing
User, Merchant, and role. Never reuse the Local mock identity in Production.
Before any cleanup or rollback, read back the exact membership and obtain
authorization for the scope; never delete all memberships or remove the last
Owner as routine cleanup.
