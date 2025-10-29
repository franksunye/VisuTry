#!/usr/bin/env python3
"""
Generate 500 glasses models for programmatic SEO
"""

import json
import uuid
from typing import List, Dict

# Brand data
BRANDS = [
    # Premium brands (15)
    {"id": "rayban", "name": "Ray-Ban", "category": "premium"},
    {"id": "oliver-peoples", "name": "Oliver Peoples", "category": "premium"},
    {"id": "tom-ford", "name": "Tom Ford", "category": "premium"},
    {"id": "gucci", "name": "Gucci", "category": "premium"},
    {"id": "prada", "name": "Prada", "category": "premium"},
    {"id": "burberry", "name": "Burberry", "category": "premium"},
    {"id": "versace", "name": "Versace", "category": "premium"},
    {"id": "dior", "name": "Dior", "category": "premium"},
    {"id": "fendi", "name": "Fendi", "category": "premium"},
    {"id": "celine", "name": "Celine", "category": "premium"},
    {"id": "cartier", "name": "Cartier", "category": "premium"},
    {"id": "rolex", "name": "Rolex", "category": "premium"},
    {"id": "patek-philippe", "name": "Patek Philippe", "category": "premium"},
    {"id": "audemars-piguet", "name": "Audemars Piguet", "category": "premium"},
    {"id": "chopard", "name": "Chopard", "category": "premium"},
    
    # Mid-range brands (25)
    {"id": "warby-parker", "name": "Warby Parker", "category": "midrange"},
    {"id": "zenni", "name": "Zenni", "category": "midrange"},
    {"id": "coastal", "name": "Coastal", "category": "midrange"},
    {"id": "clearly", "name": "Clearly", "category": "midrange"},
    {"id": "specsavers", "name": "Specsavers", "category": "midrange"},
    {"id": "boots-opticians", "name": "Boots Opticians", "category": "midrange"},
    {"id": "lenscrafters", "name": "LensCrafters", "category": "midrange"},
    {"id": "pearle-vision", "name": "Pearle Vision", "category": "midrange"},
    {"id": "visionworks", "name": "Visionworks", "category": "midrange"},
    {"id": "eyemart-express", "name": "EyeMart Express", "category": "midrange"},
    {"id": "america-best", "name": "America's Best", "category": "midrange"},
    {"id": "walmart-vision", "name": "Walmart Vision", "category": "midrange"},
    {"id": "costco-optical", "name": "Costco Optical", "category": "midrange"},
    {"id": "target-optical", "name": "Target Optical", "category": "midrange"},
    {"id": "jins", "name": "JINS", "category": "midrange"},
    {"id": "owndays", "name": "OWNDAYS", "category": "midrange"},
    {"id": "eyeglasses-com", "name": "Eyeglasses.com", "category": "midrange"},
    {"id": "zoff", "name": "Zoff", "category": "midrange"},
    {"id": "bonlook", "name": "Bonlook", "category": "midrange"},
    {"id": "firmoo", "name": "Firmoo", "category": "midrange"},
    {"id": "eyebuydirect", "name": "EyeBuyDirect", "category": "midrange"},
    {"id": "goggles4u", "name": "Goggles4U", "category": "midrange"},
    {"id": "39dollarglasses", "name": "39DollarGlasses", "category": "midrange"},
    {"id": "glassesusa", "name": "GlassesUSA", "category": "midrange"},
    {"id": "zennioptical", "name": "Zenni Optical", "category": "midrange"},
    
    # Sports brands (10)
    {"id": "oakley", "name": "Oakley", "category": "sports"},
    {"id": "adidas", "name": "Adidas", "category": "sports"},
    {"id": "nike", "name": "Nike", "category": "sports"},
    {"id": "puma", "name": "Puma", "category": "sports"},
    {"id": "under-armour", "name": "Under Armour", "category": "sports"},
    {"id": "smith-optics", "name": "Smith Optics", "category": "sports"},
    {"id": "bolle", "name": "Bolle", "category": "sports"},
    {"id": "rudy-project", "name": "Rudy Project", "category": "sports"},
    {"id": "uvex", "name": "Uvex", "category": "sports"},
    {"id": "scott", "name": "Scott", "category": "sports"},
]

# Styles
STYLES = [
    "clubmaster", "browline", "round", "aviator", "wayfarer",
    "cat-eye", "oversized", "geometric", "retro", "modern",
    "rectangular", "square", "oval", "hexagon", "shield",
    "wrap-around", "half-rim", "rimless", "keyhole", "butterfly"
]

# Materials
MATERIALS = [
    "acetate", "metal", "plastic", "titanium", "stainless-steel",
    "aluminum", "wood", "bamboo", "mixed", "carbon-fiber"
]

# Colors
COLORS = [
    "black", "brown", "tortoise", "gold", "silver",
    "rose-gold", "copper", "red", "blue", "green",
    "purple", "pink", "white", "gray", "clear"
]

# Categories
CATEGORIES = [
    "prescription", "sunglasses", "reading", "computer",
    "sports", "fashion", "vintage", "designer", "budget", "premium"
]

# Face shapes
FACE_SHAPES = [
    "round", "square", "oval", "heart", "diamond", "oblong", "triangle"
]

def generate_models(count: int = 500) -> List[Dict]:
    """Generate models data"""
    models = []
    model_id = 0

    for brand_idx, brand in enumerate(BRANDS):
        # Each brand gets 10 models to reach 500 total
        models_per_brand = 10

        for model_idx in range(models_per_brand):
            if len(models) >= count:
                break

            model_id += 1
            style = STYLES[(model_idx + brand_idx) % len(STYLES)]
            material = MATERIALS[(model_idx + brand_idx) % len(MATERIALS)]
            color = COLORS[(model_idx + brand_idx) % len(COLORS)]
            category = CATEGORIES[(model_idx + brand_idx) % len(CATEGORIES)]

            # Select 2-3 random face shapes
            face_shapes = FACE_SHAPES[(model_idx + brand_idx) % len(FACE_SHAPES):][:3]

            model = {
                "id": f"{brand['id']}-{style}-{model_idx:02d}",
                "brand": brand["id"],
                "name": f"{style.title()} {model_idx:02d}",
                "displayName": f"{brand['name']} {style.title()} {model_idx:02d}",
                "description": f"{brand['name']} {style.title()} glasses in {color} {material}. Perfect for {', '.join(face_shapes)} face shapes.",
                "imageUrl": f"https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop&q=80",
                "category": category,
                "style": style,
                "material": material,
                "color": color,
                "price": round(50 + (model_idx * 15 + brand_idx * 5) % 400, 2),
                "faceShapes": face_shapes,
                "isActive": True
            }
            models.append(model)

        if len(models) >= count:
            break

    return models[:count]

def generate_brands(brand_list: List[Dict]) -> List[Dict]:
    """Generate brands data"""
    brands = []
    for brand in brand_list:
        brands.append({
            "id": brand["id"],
            "name": brand["id"],
            "displayName": brand["name"],
            "description": f"{brand['name']} - Premium eyewear brand offering high-quality glasses for all face shapes.",
            "website": f"https://www.{brand['id'].replace('-', '')}.com",
            "isActive": True
        })
    return brands

def generate_face_shapes() -> List[Dict]:
    """Generate face shapes data"""
    face_shapes = [
        {
            "id": "round",
            "name": "round",
            "displayName": "Round Face",
            "description": "Round faces have soft, curved features with equal width and length.",
            "characteristics": "Soft curves, equal width and length, full cheeks",
            "recommendedStyles": ["clubmaster", "browline", "angular"],
            "avoidStyles": ["round", "oversized"],
            "isActive": True
        },
        {
            "id": "square",
            "name": "square",
            "displayName": "Square Face",
            "description": "Square faces have strong jawlines and equal width and length.",
            "characteristics": "Strong jawline, equal width and length, angular features",
            "recommendedStyles": ["round", "oval", "cat-eye"],
            "avoidStyles": ["square", "geometric"],
            "isActive": True
        },
        {
            "id": "oval",
            "name": "oval",
            "displayName": "Oval Face",
            "description": "Oval faces are longer than they are wide with balanced proportions.",
            "characteristics": "Longer than wide, balanced proportions, tapered chin",
            "recommendedStyles": ["any", "clubmaster", "aviator"],
            "avoidStyles": [],
            "isActive": True
        },
        {
            "id": "heart",
            "name": "heart",
            "displayName": "Heart Face",
            "description": "Heart faces are wider at the forehead and narrower at the chin.",
            "characteristics": "Wider forehead, narrower chin, pointed features",
            "recommendedStyles": ["cat-eye", "oversized", "bottom-heavy"],
            "avoidStyles": ["top-heavy"],
            "isActive": True
        },
        {
            "id": "diamond",
            "name": "diamond",
            "displayName": "Diamond Face",
            "description": "Diamond faces are wider at the cheekbones with narrow forehead and chin.",
            "characteristics": "Wide cheekbones, narrow forehead and chin, angular",
            "recommendedStyles": ["oval", "cat-eye", "browline"],
            "avoidStyles": ["narrow"],
            "isActive": True
        },
        {
            "id": "oblong",
            "name": "oblong",
            "displayName": "Oblong Face",
            "description": "Oblong faces are longer than they are wide with a narrow chin.",
            "characteristics": "Longer than wide, narrow chin, elongated features",
            "recommendedStyles": ["oversized", "cat-eye", "browline"],
            "avoidStyles": ["narrow"],
            "isActive": True
        },
        {
            "id": "triangle",
            "name": "triangle",
            "displayName": "Triangle Face",
            "description": "Triangle faces are wider at the jawline and narrower at the forehead.",
            "characteristics": "Wider jawline, narrower forehead, pointed chin",
            "recommendedStyles": ["top-heavy", "oversized", "browline"],
            "avoidStyles": ["bottom-heavy"],
            "isActive": True
        }
    ]
    return face_shapes

def generate_categories() -> List[Dict]:
    """Generate categories data"""
    categories = [
        {
            "id": "prescription",
            "name": "prescription",
            "displayName": "Prescription Glasses",
            "description": "Prescription glasses for vision correction",
            "isActive": True
        },
        {
            "id": "sunglasses",
            "name": "sunglasses",
            "displayName": "Sunglasses",
            "description": "Sunglasses for sun protection and style",
            "isActive": True
        },
        {
            "id": "reading",
            "name": "reading",
            "displayName": "Reading Glasses",
            "description": "Reading glasses for close-up vision",
            "isActive": True
        },
        {
            "id": "computer",
            "name": "computer",
            "displayName": "Computer Glasses",
            "description": "Computer glasses for screen time",
            "isActive": True
        },
        {
            "id": "sports",
            "name": "sports",
            "displayName": "Sports Glasses",
            "description": "Sports glasses for active lifestyle",
            "isActive": True
        },
        {
            "id": "fashion",
            "name": "fashion",
            "displayName": "Fashion Glasses",
            "description": "Fashion glasses for style",
            "isActive": True
        },
        {
            "id": "vintage",
            "name": "vintage",
            "displayName": "Vintage Glasses",
            "description": "Vintage style glasses",
            "isActive": True
        },
        {
            "id": "designer",
            "name": "designer",
            "displayName": "Designer Glasses",
            "description": "Designer brand glasses",
            "isActive": True
        },
        {
            "id": "budget",
            "name": "budget",
            "displayName": "Budget Glasses",
            "description": "Affordable glasses",
            "isActive": True
        },
        {
            "id": "premium",
            "name": "premium",
            "displayName": "Premium Glasses",
            "description": "Premium quality glasses",
            "isActive": True
        }
    ]
    return categories

def main():
    print("🔄 Generating 500 glasses models...")
    
    # Generate data
    models = generate_models(500)
    brands = generate_brands(BRANDS)
    face_shapes = generate_face_shapes()
    categories = generate_categories()
    
    # Save to files
    print(f"💾 Saving {len(models)} models to data/models.json...")
    with open("data/models.json", "w") as f:
        json.dump(models, f, indent=2)
    
    print(f"💾 Saving {len(brands)} brands to data/brands.json...")
    with open("data/brands.json", "w") as f:
        json.dump(brands, f, indent=2)
    
    print(f"💾 Saving {len(face_shapes)} face shapes to data/face-shapes.json...")
    with open("data/face-shapes.json", "w") as f:
        json.dump(face_shapes, f, indent=2)
    
    print(f"💾 Saving {len(categories)} categories to data/categories.json...")
    with open("data/categories.json", "w") as f:
        json.dump(categories, f, indent=2)
    
    # Print statistics
    print("\n✅ Data generation complete!")
    print(f"\n📊 Statistics:")
    print(f"  - Models: {len(models)}")
    print(f"  - Brands: {len(brands)}")
    print(f"  - Face Shapes: {len(face_shapes)}")
    print(f"  - Categories: {len(categories)}")
    print(f"\n🎯 Expected pages:")
    print(f"  - Product pages: {len(models)}")
    print(f"  - Face shape pages: {len(face_shapes)}")
    print(f"  - Category pages: {len(categories)}")
    print(f"  - Brand pages: {len(brands)}")
    print(f"  - Total: {len(models) + len(face_shapes) + len(categories) + len(brands)}")

if __name__ == "__main__":
    main()

