#!/usr/bin/env bash
set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Skapa nytt recept ===${NC}\n"

# Function to slugify text (Swedish-aware)
slugify() {
    echo "$1" | iconv -t ascii//TRANSLIT | sed -E 's/[^a-zA-Z0-9]+/-/g' | sed -E 's/^-+\|-+$//g' | tr A-Z a-z
}

# Prompt for recipe details
read -p "Recepttitel: " title
if [[ -z "$title" ]]; then
    echo "Titel krävs!"
    exit 1
fi

read -p "Beskrivning (excerpt): " excerpt
read -p "Kategori (t.ex. basrecept, vegetariskt, röra): " category
read -p "Taggar (kommaseparerade, t.ex. 'gryta, vegetariskt'): " tags
read -p "Antal portioner (t.ex. '4 portioner'): " servings
read -p "Tillagningstid i ISO 8601 format (t.ex. PT30M för 30 min): " cook_time
read -p "Förberedelsetid (valfritt, t.ex. PT15M): " prep_time

# Generate filename slug
slug=$(slugify "$title")
recipe_file="_recipes/${slug}.md"

# Check if file already exists
if [[ -f "$recipe_file" ]]; then
    echo -e "${YELLOW}Varning: Filen ${recipe_file} finns redan!${NC}"
    read -p "Vill du skriva över den? (j/N): " overwrite
    if [[ ! "$overwrite" =~ ^[jJ]$ ]]; then
        echo "Avbryter."
        exit 0
    fi
fi

# Create the recipe file
cat > "$recipe_file" << EOF
---
title: ${title}
excerpt: ${excerpt}
categories: ${category:-basrecept}
tags: "${tags}"
img: assets/img/${slug}.webp
servings: ${servings:-4 portioner}
cook_time: ${cook_time:-PT30M}
EOF

if [[ -n "$prep_time" ]]; then
    echo "prep_time: ${prep_time}" >> "$recipe_file"
fi

cat >> "$recipe_file" << 'EOF'
ingredients:
  main:
    - ingredient 1
---

1. Steg 1 i instruktionerna
EOF

echo -e "${GREEN}✓ Receptfil skapad: ${recipe_file}${NC}"

# Create a placeholder image for every new recipe.
img_file="assets/img/${slug}.webp"
if [[ ! -f "$img_file" ]]; then
    if command -v magick &> /dev/null; then
        image_command=magick
    elif command -v convert &> /dev/null; then
        image_command=convert
    else
        echo "ImageMagick krävs för att skapa ${img_file}." >&2
        exit 1
    fi

    "$image_command" -size 1024x1024 xc:lightgray -gravity center -pointsize 48 \
        -annotate +0+0 "$title" "$img_file"
    echo -e "${GREEN}✓ Platshållarbild skapad: ${img_file}${NC}"
fi

# Summary
echo -e "\n${BLUE}=== Sammanfattning ===${NC}"
echo "Receptfil: ${recipe_file}"
echo "Bild: assets/img/${slug}.webp"
echo ""
echo "Nästa steg:"
echo "  1. Redigera ${recipe_file} och fyll i ingredienser och instruktioner"
echo "  2. Lägg till en riktig bild i assets/img/${slug}.webp"
echo "  3. Kör 'bundle exec jekyll serve' för att förhandsgranska"
echo "  4. Kör 'bundle exec jekyll build' för att generera responsiva bilder"
echo ""
echo -e "${GREEN}Klart!${NC}"
