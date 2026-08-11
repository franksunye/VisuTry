# Article One research snapshot

Snapshot date: 2026-08-11. Sources are official Article One pages only.

## Sources reviewed

- Homepage: https://www.articleoneeyewear.com/
- Sunglasses collection: https://www.articleoneeyewear.com/sunglasses/
- Optical collection checked for availability: https://www.articleoneeyewear.com/optical/
- Product pages are listed per row in `catalog.csv` and `enrichment-review.csv`.

The official sunglasses collection exposed the selected active product links and each selected page exposed public product name, price, availability, product image and A/B/ED/DBL/TMPL measurements in the reviewed product payload. The optical page did not expose active product links in the reviewed snapshot, so no optical rows were invented.

## Source facts

The catalog preserves the following as merchant/public source facts when the official page stated them: product name; canonical product URL; primary image URL; sunglasses collection membership; InStock availability at snapshot time; USD price; published dimensions; and material/lens/hinge/pad details where present in the official product detail text. A blank typed material means the reviewed official page did not state one; it is not an inference.

Article One pages use technical language such as cellulose acetate or hexetate, CR39 or TR18 polarized lenses, backside anti-reflective coating, spring hinges, adjustable nose pads and rubber temple tips. This package does not extend those statements into impact resistance, UV performance, sport suitability, prescription compatibility, sweat resistance, durability outcomes, medical benefit, or athletic performance.

## Operator enrichment

`shape`, `width_class`, and `style_tags` are normalized discovery metadata. Width class is a relative grouping from the published A measurement: narrow `<52mm`, regular `52–54mm`, and wide `>=55mm`; it is not a brand fit recommendation. Shape labels are normalized from the official descriptions where available and otherwise are visual/operator labels. No fit guarantee is implied.

The CSV `sku` values are internal stable catalog keys because the reviewed official pages do not expose a reliable unique variant SKU for this set. They are explicitly not presented as Article One source SKUs.

## Product gap

Important technical detail such as lens features is currently retained in `source_notes` because the shared catalog schema has no typed lens-feature field. This is a reusable product gap for future eyewear pilots; it does not block this pilot's route, recommendation, Try-On, Compare, or intent scope and is not expanded into schema work here.
