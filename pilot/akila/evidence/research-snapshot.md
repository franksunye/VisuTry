# AKILA public-source research snapshot

Snapshot date: 2026-08-11

## Official sources

- Homepage: https://akila.la/
- All products: https://akila.la/collections/all
- All sunglasses: https://akila.la/collections/all-sunglasses
- Current collection: https://akila.la/collections/ss-2026
- Product JSON used to confirm current variant, price, availability, SKU and image mappings: https://akila.la/collections/ss-2026/products.json?limit=250
- Individual product pages are listed in `enrichment-review.csv` and are the canonical source for the selected row's product facts and dimensions.

## Selection method

The catalog contains 18 currently available variant-backed rows from the official SS26/current product structure. It intentionally favors visual decision diversity: rectangular, wrap, oval, aviator, teardrop, oversized, rounded, tapered, titanium and acetate examples, plus contrasting colorways. Unavailable variants, closeout-only products, ambiguous collaboration claims, and lifestyle-only assets were excluded.

The two Campaign Experiences are configuration subsets of the same Merchant Catalog:

- `statement-frames`: 9 frames for style-first discovery.
- `current-edit`: 9 frames from the current SS26 structure.

## Fact boundary

Source facts include product identity, canonical URL, selected variant/color, price/currency, current public availability at snapshot time, product image, product type, collection membership, and dimensions. Material is only populated where the official page or official collection statement supports it; Nomos optical is intentionally blank because the reviewed page did not state a material.

Shape normalization, relative width class, and style tags are operator enrichment based on official product descriptions, verified dimensions, and product-only imagery. They are not AKILA-authored taxonomy, fit guarantees, popularity claims, or performance claims.
