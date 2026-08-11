# Lowercase NYC Public-Source Research Snapshot

Snapshot date: 2026-08-11  
Research status: operator-reviewed public source facts for a Reference Pilot / Simulation.

## Sources

- Homepage: https://lowercasenyc.com/
- All products: https://lowercasenyc.com/collections/all
- Optical collection: https://lowercasenyc.com/collections/opticals
- Sunglasses collection: https://lowercasenyc.com/collections/sunglasses
- Collections index: https://lowercasenyc.com/collections
- Brand story / materials: https://lowercasenyc.com/pages/our-story
- Structured public catalog endpoint reviewed for product and variant identity: https://lowercasenyc.com/products.json?limit=250

## Verified source facts

- Lowercase presents itself as an independent eyewear brand born in Brooklyn.
- The public catalog exposes optical and sunglasses product structures.
- Product pages expose model name, variant/color, current displayed price, product image, product URL and—on the selected rows—Lens / Bridge / Temple dimensions.
- Product pages identify acetate and, for sunglasses, Carl Zeiss sun lenses / 100% UVA/UVB protection on the reviewed source copy.
- The public collections page reported 61 products at the snapshot; this pilot intentionally selects 20 representative variant rows rather than importing the full catalog.

## Selection policy

- 10 optical rows and 10 sunglasses rows.
- One currently available public variant per selected model where possible.
- Shape and width class are operator enrichment, not merchant claims.
- Width class is relative to this 20-row pilot and is not a fit guarantee.
- `frame_width_mm` is blank because the reviewed public pages did not provide a verified full-frame width field.
- Half-millimeter source dimensions are preserved in `source_notes`; they are not rounded into the integer-only importer fields.
- Gift Card, lifestyle-only assets and models whose reviewed variants were unavailable were excluded.

## Legal / positioning boundary

Public facts and imagery are used for internal reference delivery and QA. This package does not claim endorsement, authorization, customer status or performance outcomes for Lowercase NYC.
