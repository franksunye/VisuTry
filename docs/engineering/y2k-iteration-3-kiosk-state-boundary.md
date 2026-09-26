# Y2K Iteration 3 — Kiosk State and Privacy Boundary

**Status:** Active
**Owner:** Store Product Engineering

Kiosk is an opt-in Delivery Profile of an existing Store or Campaign Experience. It does not change Journey stages, create a new Experience type, or change the ordinary Web profile. `deliveryPolicy` is separate from `journeyPolicy`; legacy/null configuration resolves to Web-only. A Kiosk route is admitted only when the Experience enables it.

## State cleanup contract

| State location | Kiosk behavior | Reset behavior |
| --- | --- | --- |
| React Store workspace | Contains the current preview, face/fit analysis, recommendations, selection, Result token and transient session identifiers. | Clear all workspace state; unmount the Try-On/Compare subtree and show a privacy-safe clean start. |
| Try-On/Compare component | Keeps tiles, task references, favorites, comparison state and inquiry fields in component state. | Unmount on reset, stopping poll loops and dropping component-local references. |
| `sessionStorage` | Web may use `vt_store_session:{merchant}:{experience}` and the Merchant Runtime Continuation key to support same-tab continuation. Kiosk neither restores nor writes these values. | Remove both exact merchant/experience keys. No broad storage clearing. |
| `localStorage` / Cache Storage | Store shopper continuation does not write photo, face, selection, Try-On or Result state to either location. Browser HTTP cache remains browser-managed and is not used as an authorization mechanism. | No application entry is created or removed. Capability-protected photo assets are inaccessible after server reset. |
| Photo bytes and preview | File input holds the file only while processing; preview is a transient data URL. Image compression's temporary object URL is revoked in its `finally` path. | Clear preview/analysis React state. Server transaction detaches the raw photo asset from the session, expires the session, then requests asset deletion. |
| HttpOnly cookies | `vt_store_cap` authorizes the private Store session; `vt_store_visitor` is the anonymous attribution identity. | Expire both cookies after a confirmed reset. A reloaded Kiosk must confirm cleanup of any cookie-bound prior session before creating a fresh session. |
| Session/canonical Result identifiers | Session ID remains React-only in Kiosk. Decision Result bearer token exists in the current Result URL and QR handoff URL. | Expire the MerchantSession, but do not revoke the independent Result share token; the clean phone continuation remains valid until its normal expiry/revocation. |
| Browser history / BFCache | The shared Kiosk can visit a Result URL during the journey. | A successful Store reset performs a fresh document navigation to the clean Kiosk route so prior Result entries cannot remain reachable through Forward history; BFCache restoration is guarded. |

## Reset authorization

The Result bearer token is **read/continuation authority only**. It is not shared-device mutation authority.

- Session-side Kiosk reset requires the matching `vt_store_cap` capability when a prior MerchantSession exists.
- Result-side Kiosk reset requires both a live canonical Result token **and** the matching MerchantSession `vt_store_cap` capability.
- A clean phone that has only the Result URL can continue reading the Result but cannot reset or mutate the shared Kiosk session.
- Reset verifies that the associated Experience has Kiosk enabled, expires the session, detaches/deletes the raw shopper photo, and leaves completed Try-On Result assets available through the independently authorized canonical Result.
- After a reload, the Kiosk start action performs/awaits orphan-session cleanup before creating another MerchantSession; cleanup failure remains fail-closed.

## Delivery policy

- `kioskEnabled`: opt-in, default `false`.
- `kioskIdleTimeoutSeconds`: integer from 30 through 900; default 120 seconds.
- Unsupported/malformed persisted policy falls closed to Web-only.
- Dedicated entry routes are `/{locale}/store/{merchantSlug}/kiosk` and `/{locale}/c/{merchantSlug}/{experienceSlug}/kiosk`; disabled Kiosk policy resolves to 404.
- Kiosk ISR artifacts are invalidated through the same public-discovery write boundary as their Store/Campaign Experience.
- The Result QR/copy URL intentionally omits Kiosk mode so a phone opens the canonical Result in a clean Web context.
