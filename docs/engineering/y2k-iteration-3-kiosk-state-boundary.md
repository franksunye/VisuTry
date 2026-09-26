# Y2K Iteration 3 — Kiosk State and Privacy Boundary

**Status:** Active
**Owner:** Store Product Engineering

Kiosk is an opt-in Delivery Profile of an existing Store or Campaign Experience. It does not change Journey stages, create a new Experience type, or change the ordinary Web profile. `deliveryPolicy` is separate from `journeyPolicy`; legacy/null configuration resolves to Web-only. A kiosk request is honored only when the Experience enables it.

## State cleanup contract

| State location | Kiosk behavior | Reset behavior |
| --- | --- | --- |
| React Store workspace | Contains the current preview, face/fit analysis, recommendations, selection, Result token and transient session identifiers. | Clear all workspace state; unmount the Try-On/Compare subtree and show a privacy-safe clean start. |
| Try-On/Compare component | Keeps tiles, task references, favorites, comparison state and inquiry fields in component state. | Unmount on reset, stopping poll loops and dropping component-local references. |
| `sessionStorage` | Web may use `vt_store_session:{merchant}:{experience}` and the Merchant Runtime Continuation key to support same-tab continuation. Kiosk neither restores nor writes these values. | Remove both exact merchant/experience keys. No broad storage clearing. |
| `localStorage` / Cache Storage | Store shopper continuation does not write photo, face, selection, Try-On or Result state to either location. Browser HTTP cache remains browser-managed and is not used as an authorization mechanism. | No application entry is created or removed. Capability-protected photo assets are inaccessible after server reset. |
| Photo bytes and preview | File input holds the file only while processing; preview is a transient data URL. Image compression's temporary object URL is revoked in its `finally` path. | Clear preview/analysis React state. Server transaction detaches the raw photo asset from the session, expires the session, then requests asset deletion. |
| HttpOnly cookies | `vt_store_cap` authorizes the private Store session; `vt_store_visitor` is a long-lived anonymous attribution identity. | Expire both cookies after a confirmed reset. Kiosk cannot persist a replacement session in browser storage. |
| Session/canonical Result identifiers | Session ID remains React-only in Kiosk. Decision Result bearer token exists in the current Result URL and QR handoff URL. | Replace the current shared-device URL with the clean Kiosk route. Expire the MerchantSession, but do not revoke the independent Result share token; the clean phone continuation remains valid until its normal expiry/revocation. |
| Browser history / BFCache | The current Kiosk URL may briefly contain a Result token before reset. Earlier same-tab Store entries may be restored by browser back/forward cache. | Replace the current entry; on BFCache restoration hide the restored document and reload the cleaned Kiosk URL. Kiosk never restores shopper continuation from URL/session storage. |

The server reset endpoints require either the session's HttpOnly capability or a live canonical Decision Result share token, and both verify that the associated Experience has Kiosk enabled. Session reset is idempotent, detaches the original photo before storage deletion, and leaves completed Try-On result assets available through the separately authorized canonical Result for the phone handoff.

## Delivery policy

- `kioskEnabled`: opt-in, default `false`.
- `kioskIdleTimeoutSeconds`: integer from 30 through 900; default 120 seconds.
- Unsupported/malformed persisted policy falls closed to Web-only.
- Kiosk entry requires `?deliveryProfile=kiosk`; an unconfigured or disabled request resolves to Web.
- The Result QR/copy URL intentionally omits the Kiosk profile so a phone opens the canonical Result in a clean Web context.
