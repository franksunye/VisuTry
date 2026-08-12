# Reference Experience hero sources

These local assets are editorial presentation images for the reference pilot
experiences. They are not merchant-owned product photography and must remain
paired with the existing `referenceData` disclosure.

- `neutral-eyewear.jpg`: [Smiling man with glasses poses for a portrait](https://unsplash.com/photos/smiling-man-with-glasses-poses-for-a-portrait-trsE5rHBjvs), Unsplash License.
- `statement-eyewear.jpg`: [Fashion Portrait of Woman in Sunglasses](https://www.pexels.com/photo/fashion-portrait-of-woman-in-sunglasses-31719247/), Pexels page marked “Free to use”.
- `urban-eyewear.jpg`: [Stylish Urban Fashion Portrait with Sunglasses](https://www.pexels.com/photo/stylish-urban-fashion-portrait-with-sunglasses-32017776/), Pexels page marked “Free to use”.
- `editorial-eyewear.jpg`: [Modern Fashion Portrait of Woman with Sunglasses](https://www.pexels.com/photo/modern-fashion-portrait-of-woman-with-sunglasses-32192285/), Pexels page marked “Free to use”.

The images are checked into `public/experience-heroes/` so published routes do
not depend on a third-party image host. The reference pilot importer writes the
paths from each Experience config to `Experience.heroAssetUrl`.

Each file is pre-cropped to 1600×1000 with the subject's face and eyewear inside
the safe area. This keeps the default `object-cover` behavior from cutting
through the eyes when the same asset is used by Store (16:10) and Campaign
(16:9) presentation modes.
