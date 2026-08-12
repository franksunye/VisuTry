# Framed EWE research snapshot

Snapshot date: 2026-08-12. Sources reviewed were official Framed EWE pages and the official Shopify product JSON exposed by `framedewe.com`.

## Sources reviewed

- Homepage: https://framedewe.com/
- About: https://framedewe.com/pages/who-we-are
- All products: https://framedewe.com/collections/all
- Collections: https://framedewe.com/collections
- Framed EWE collection: https://framedewe.com/collections/framed-ewe-eyewear
- Product JSON snapshot: https://framedewe.com/products.json?limit=250

The retailer presents itself as an independent eyewear retailer and exposes a multi-brand catalog. The reviewed product feed exposed product title, vendor, handle, product type, tags, variant price, public availability state and official Shopify image URLs for the selected rows. Every destination remains a Framed EWE retailer product URL.

## Selected catalog

Twenty active rows were selected across five source product brands: Akila, RIGARDS, LOOL, Kuboraum and AHLEM. The Store uses all 20. `find-your-frames` uses 11 rows across all five brands. `sunglasses-edit` uses 12 sunglasses across all five brands.

## Source facts

The catalog preserves facts only when exposed by the reviewed Framed EWE source: product title; vendor/product brand; canonical retailer product URL; primary product image; product type; selected variant label; displayed variant price; public availability state at snapshot time; published dimensions; and material or technical details where the product body or tags stated them. A blank typed field means the reviewed source did not provide a safe value or the source format was not compatible with the shared integer schema.

This package does not claim inventory quantity, exclusivity, authorization, popularity, performance outcome, or a fit guarantee. Product brand is not merchant identity: all selected frames are Framed EWE MerchantFrame rows and the shopper boundary remains merchant/Experience scope.

## Operator enrichment

`shape`, `width_class` and `style_tags` are normalized discovery metadata from official tags, descriptions, measurements and product naming. Width class is a relative grouping for discovery, not a fit recommendation. Decimal or ambiguous measurements are not coerced into the current integer fields. LOOL source rows exposing `Temple: 0mm` intentionally leave temple length blank rather than importing an implausible physical dimension.

The CSV `sku` and `external_id` values are internal stable catalog keys made from the public Shopify product and selected variant IDs. They are not presented as retailer source SKUs.

## Reusable gap

The shared catalog schema now carries the source `brand` as a nullable typed `MerchantFrame` field, while technical details remain in `source_notes`. Product brand is explicit catalog metadata, not a merchant or tenant boundary; lens-feature and decimal-dimension fields remain outside this A1 correction.
