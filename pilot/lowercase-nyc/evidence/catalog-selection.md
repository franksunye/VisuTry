# Lowercase NYC Catalog and Experience Selection

## Merchant catalog

| Scope | Count | Notes |
| --- | ---: | --- |
| Merchant catalog | 20 | 10 optical + 10 sunglasses; all `ACTIVE` in package. |
| Store `default` | 20 | `ALL_ACTIVE`. |
| Campaign `find-your-frame` | 10 | 5 optical + 5 sunglasses across shape/width classes. |
| Campaign `sunglasses-edit` | 10 | Sun-only subset spanning narrow, regular and wide relative classes. |

All selections use the variant external IDs from `catalog.csv`; no Experience duplicates MerchantFrame identity.

## Public routes

- `/en/store/lowercase-nyc`
- `/en/c/lowercase-nyc/find-your-frame`
- `/en/c/lowercase-nyc/sunglasses-edit`

## Expected attribution

| Experience | defaultSource | defaultCampaign |
| --- | --- | --- |
| Store | `visutry-reference-pilot` | `lowercase-nyc` |
| Find Your Frame | `visutry-reference-pilot` | `find-your-frame` |
| Sunglasses Edit | `visutry-reference-pilot` | `sunglasses-edit` |
