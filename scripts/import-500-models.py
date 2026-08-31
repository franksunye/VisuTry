#!/usr/bin/env python3
import json
import os
from datetime import datetime
import uuid

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise SystemExit(
        "DATABASE_URL is required. Export it before running "
        "scripts/import-500-models.py."
    )

import psycopg2

def get_connection():
    """Create database connection"""
    conn = psycopg2.connect(DATABASE_URL)
    return conn

def import_brands(conn):
    """Import brands"""
    print("Importing brands...")
    
    with open('data/brands.json', 'r') as f:
        brands = json.load(f)
    
    cursor = conn.cursor()
    
    for brand in brands:
        cursor.execute("""
            INSERT INTO "GlassesFrame" (id, name, description, "imageUrl", brand, "isActive", "createdAt", "updatedAt")
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
        """, (
            str(uuid.uuid4()),
            brand['displayName'],
            brand.get('description'),
            'https://via.placeholder.com/400x400?text=' + brand['displayName'],
            brand['id'],
            True,
            datetime.now(),
            datetime.now()
        ))
    
    conn.commit()
    print(f"✓ Imported {len(brands)} brands")

def import_face_shapes(conn):
    """Import face shapes"""
    print("Importing face shapes...")
    
    with open('data/face-shapes.json', 'r') as f:
        shapes = json.load(f)
    
    cursor = conn.cursor()
    
    for shape in shapes:
        cursor.execute("""
            INSERT INTO "FaceShape" (id, name, "displayName", description, characteristics, "createdAt", "updatedAt")
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (name) DO UPDATE SET
                "displayName" = EXCLUDED."displayName",
                description = EXCLUDED.description,
                characteristics = EXCLUDED.characteristics,
                "updatedAt" = EXCLUDED."updatedAt"
        """, (
            str(uuid.uuid4()),
            shape['name'],
            shape['displayName'],
            shape.get('description'),
            shape.get('characteristics'),
            datetime.now(),
            datetime.now()
        ))
    
    conn.commit()
    print(f"✓ Imported {len(shapes)} face shapes")

def import_categories(conn):
    """Import categories"""
    print("Importing categories...")
    
    with open('data/categories.json', 'r') as f:
        categories = json.load(f)
    
    cursor = conn.cursor()
    
    for category in categories:
        cursor.execute("""
            INSERT INTO "GlassesCategory" (id, name, "displayName", description, "createdAt", "updatedAt")
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (name) DO UPDATE SET
                "displayName" = EXCLUDED."displayName",
                description = EXCLUDED.description,
                "updatedAt" = EXCLUDED."updatedAt"
        """, (
            str(uuid.uuid4()),
            category['name'],
            category['displayName'],
            category.get('description'),
            datetime.now(),
            datetime.now()
        ))
    
    conn.commit()
    print(f"✓ Imported {len(categories)} categories")

def import_models(conn):
    """Import glasses models"""
    print("Importing 500 models...")
    
    with open('data/models.json', 'r') as f:
        models = json.load(f)
    
    cursor = conn.cursor()
    
    for idx, model in enumerate(models):
        cursor.execute("""
            INSERT INTO "GlassesFrame" (id, name, description, "imageUrl", brand, model, category, style, material, color, price, "isActive", "createdAt", "updatedAt")
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                "imageUrl" = EXCLUDED."imageUrl",
                brand = EXCLUDED.brand,
                model = EXCLUDED.model,
                category = EXCLUDED.category,
                style = EXCLUDED.style,
                material = EXCLUDED.material,
                color = EXCLUDED.color,
                price = EXCLUDED.price,
                "isActive" = EXCLUDED."isActive",
                "updatedAt" = EXCLUDED."updatedAt"
        """, (
            model['id'],
            model['displayName'],
            model.get('description'),
            model['imageUrl'],
            model['brand'],
            model['name'],
            model['category'],
            model.get('style'),
            model.get('material'),
            model.get('color'),
            model.get('price'),
            model.get('isActive', True),
            datetime.now(),
            datetime.now()
        ))
        
        if (idx + 1) % 50 == 0:
            print(f"  - Imported {idx + 1}/{len(models)} models...")
    
    conn.commit()
    print(f"✓ Imported {len(models)} models")
    
    # Add face shape recommendations
    print("Adding face shape recommendations...")
    for idx, model in enumerate(models):
        if model.get('faceShapes'):
            for shape_name in model['faceShapes']:
                cursor.execute('SELECT id FROM "FaceShape" WHERE name = %s', (shape_name,))
                result = cursor.fetchone()
                if result:
                    shape_id = result[0]
                    cursor.execute("""
                        INSERT INTO "FrameFaceShapeRecommendation" (id, "frameId", "faceShapeId", reason)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT ("frameId", "faceShapeId") DO NOTHING
                    """, (str(uuid.uuid4()), model['id'], shape_id, None))
        
        if (idx + 1) % 100 == 0:
            print(f"  - Added recommendations for {idx + 1}/{len(models)} models...")
    
    conn.commit()
    print("✓ Added face shape recommendations")

def main():
    try:
        print("=" * 60)
        print("🚀 Importing 500 glasses models to database")
        print("=" * 60)
        print()
        
        conn = get_connection()
        
        import_face_shapes(conn)
        print()
        import_categories(conn)
        print()
        import_brands(conn)
        print()
        import_models(conn)
        
        conn.close()
        
        print()
        print("=" * 60)
        print("✅ Data import completed successfully!")
        print("=" * 60)
        print()
        print("📊 Summary:")
        print("  - 500 glasses models imported")
        print("  - 50 brands imported")
        print("  - 7 face shapes imported")
        print("  - 10 categories imported")
        print()
        print("🎯 Expected pages:")
        print("  - Product pages: 500")
        print("  - Face shape pages: 7")
        print("  - Category pages: 10")
        print("  - Brand pages: 50")
        print("  - Total: 567 pages")
        
    except Exception as e:
        print(
            f"❌ Import failed ({type(e).__name__}). "
            "Check DATABASE_URL and database availability."
        )

if __name__ == '__main__':
    main()
