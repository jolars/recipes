# Copilot Instructions for recept.cx

## Repository Overview

This is a **Swedish recipe website** built with Jekyll 4.3.4 and deployed to GitHub Pages. The site contains ~48 recipes with responsive images, category filtering, and search functionality. Repository size: ~856MB (mostly images), ~4,200 files total.

**Primary Language:** Swedish (all recipe content, UI text)
**Stack:** Jekyll (Ruby 3.3.6), Bootstrap 5.3.2, Fuse.js for search
**Build System:** Bundler 2.5.22, Nix flake for environment

## Environment Setup

This repository uses **Nix flakes** for environment management with direnv.

**Required system dependencies:**
- Ruby 3.3.6 (via Nix)
- Bundler 2.5.22 (via Nix)
- libvips 8.16.0 (for image processing - critical dependency)
- libwebp (for WebP image generation)
- Python 3.12+ with packages: `openai`, `requests` (for optional image generation script)

**Setup steps:**
1. If using Nix: `direnv allow` will automatically load the flake environment
2. **Always run `bundle install` first** before any Jekyll commands
3. The first `bundle install` installs to `~/.gem` (not local `vendor/`)

## Build & Development Commands

### Building the Site

```bash
# Clean build artifacts (recommended before builds)
bundle exec jekyll clean

# Build the site (takes ~20-25 seconds on clean build)
bundle exec jekyll build

# Build generates images via jekyll_picture_tag plugin
# First build generates many WebP/PNG variants (200, 400, 800, 1024px widths)
# Subsequent builds are incremental and much faster
```

**Important build notes:**
- Build time: ~1-2 seconds (incremental), ~20-25 seconds (clean build)
- The build process generates responsive images in `_site/assets/img/` with multiple formats and sizes
- Expect warnings about `csv` and `base64` gems from Ruby 3.3 - these are harmless
- Image generation is automatic via `jekyll_picture_tag` plugin when `{% picture %}` tags are used

### Running Development Server

```bash
# Serve site locally (default: http://localhost:4000)
bundle exec jekyll serve

# Serve with live reload and incremental builds
bundle exec jekyll serve --watch --incremental

# To stop: Ctrl+C
```

### Testing & Validation

**No automated tests exist in this repository.** Validation is manual:

1. Build the site: `bundle exec jekyll build`
2. Check for build errors in output
3. Serve locally: `bundle exec jekyll serve`
4. Manually verify pages render correctly

**Prettier is available** but Jekyll templates contain Liquid syntax that causes parsing errors:
```bash
prettier --check "**/*.{js,css,scss,yml,yaml,md}"
```
Known prettier errors with `_includes/*.html` and `_layouts/*.html` due to Liquid template syntax - these can be ignored.

## CI/CD Pipeline

**GitHub Actions workflow:** `.github/workflows/jekyll.yml`

The workflow runs on:
- Push to `main` branch
- Manual workflow dispatch

**Build steps:**
1. Checkout code
2. Install system dependencies: `libvips`, `libvips-dev`, `libjpeg-dev`, `libwebp-dev` (critical!)
3. Setup Ruby 3.2 with bundler-cache enabled
4. Build: `bundle exec jekyll build --baseurl "${{ steps.pages.outputs.base_path }}"`
5. Deploy to GitHub Pages

**Critical for CI success:**
- libvips and libwebp **must** be installed before bundle install
- Ruby version in CI is 3.2 (local dev uses 3.3.6 - both work)
- Environment variable `JEKYLL_ENV=production` is set during CI build

## Project Structure

### Key Files & Directories

```
├── _config.yml                 # Jekyll configuration
├── _recipes/                   # Recipe markdown files (collections)
│   └── *.md                    # Individual recipes with YAML frontmatter
├── _layouts/
│   ├── base.html              # Base template (Bootstrap, scripts)
│   ├── recipe.html            # Recipe page template with schema.org markup
│   └── page.html              # Generic page template
├── _includes/
│   ├── head.html              # HTML head with meta tags, Bootstrap CDN
│   └── header.html            # Navigation header
├── _plugins/
│   └── iso_time_converter.rb  # Liquid filter for ISO 8601 duration conversion
├── _sass/
│   └── main.scss              # Custom recipe page styles
├── _data/
│   ├── picture.yml            # Image generation presets for jekyll_picture_tag
│   └── navigation.yml         # Site navigation (currently empty)
├── assets/
│   ├── css/styles.scss        # Main stylesheet (imports _sass/main.scss)
│   ├── js/
│   │   ├── main.js            # Recipe servings calculator, search, filtering
│   │   └── mealplan.js        # Meal planner functionality
│   ├── data/
│   │   └── recipes.json       # Generated JSON API with all recipes data
│   └── img/                   # Recipe images (PNG or WebP source files)
├── scripts/
│   └── generate-image.py      # OpenAI image generation script (optional)
├── pages/
│   ├── 404.html               # Error page
│   └── mealplan.html          # Meal planner page
├── index.html                 # Homepage with recipe grid and search
├── Gemfile                    # Ruby dependencies
├── flake.nix                  # Nix development environment
└── .prettierrc.yaml           # Prettier config (proseWrap: always)
```

### Recipe File Format

Recipes are in `_recipes/*.md` with this structure:

```yaml
---
layout: recipe
title: "Recipe Title"
excerpt: "Short description"
categories: vegetariskt  # Or: basrecept, etc.
tags: gryta, vegetariskt
img: assets/img/recipe-name.png  # Required for display (can be .png or .webp)
servings: 4 portioner
cook_time: PT30M  # ISO 8601 duration format
prep_time: PT15M  # Optional
ingredients:
  main:  # Default section name
    - ingredient with amount
    - 500g flour
  "section name":  # Optional grouped sections
    - more ingredients
---

1. Step one
2. Step two
```

**Important recipe conventions:**
- `cook_time` and `prep_time` use ISO 8601 duration format (e.g., PT30M = 30 minutes)
- Custom Liquid filter `convert_iso_to_swedish` displays times in Swedish
- Ingredients can be simple strings or structured with amount/name/link
- Schema.org Recipe markup is automatically generated in `recipe.html` layout

### JavaScript Functionality

**assets/js/main.js:**
- **Servings calculator:** Dynamically adjusts ingredient amounts using `data-ingredient` attributes
- **Fuzzy search:** Uses Fuse.js to search recipes by title and ingredients
- **Category filtering:** Bootstrap dropdowns filter by recipe categories

**assets/js/mealplan.js:**
- **Meal planning:** Weekly meal planner with recipe selection and drag-and-drop reordering
- **Servings adjustment:** Per-recipe servings control with +/- buttons
- **Shopping list generation:** Aggregates ingredients from selected recipes with adjusted amounts
- **Shareable links:** URL encoding/decoding via Base64 for sharing meal plans
- **LocalStorage persistence:** Saves meal plan across page reloads
- **Bring! integration:** Deeplink API integration to add recipes to Bring! shopping lists
- **Print function:** Generates printer-friendly view with recipes and shopping list

### Meal Planner Feature

**Location:** `/mealplan/` (pages/mealplan.html)

**Workflow:**
1. Users browse recipes and click "Lägg till i veckomeny" button on recipe pages
2. Recipes automatically added to first available day slot (Monday → Sunday)
3. Meal planner page (`/mealplan/`) displays all selected recipes with:
   - Recipe images, titles, excerpts
   - Servings adjustment controls
   - Drag-and-drop reordering (desktop)
   - Remove button per recipe
4. Actions available:
   - **Generate shareable link:** URL-encoded meal plan for sharing
   - **Show shopping list:** Aggregated ingredients with adjusted amounts
   - **Add to Bring!:** Opens Bring! app with recipes via deeplink API
   - **Print:** Opens printer-friendly formatted view

**Data flow:**
- Recipe data loaded from `/assets/data/recipes.json` (generated during Jekyll build)
- JSON includes: slug, title, excerpt, url, img, servings, ingredients, instructions
- Meal plan state stored in localStorage and optionally in URL query parameter

**Print feature:**
- Two-column layout: ingredients on left, instructions on right
- Recipe header with image, title, excerpt, servings
- Numbered instruction steps preserved from markdown
- Shopping list on separate page with ingredients grouped by recipe

### Image Processing (jekyll_picture_tag plugin)

Configuration in `_data/picture.yml`:

**Presets:**
- `default`: Generates 200, 400, 800, 1024px WebP images
- `grid`: Generates 200, 400, 800, 1000px WebP for recipe cards
- `og`: Generates 1024px PNG for Open Graph images with 1.91:1 crop

Usage in templates:
```liquid
{% picture grid "assets/img/recipe.png" 1:1 --alt Title --img class="card-img-top" %}
```

### Custom Jekyll Plugin

`_plugins/iso_time_converter.rb` provides `convert_iso_to_swedish` Liquid filter to convert ISO 8601 durations (PT30M) to Swedish text (30 minuter).

## Making Changes

### Adding a New Recipe

1. Create `_recipes/recipe-name.md` with YAML frontmatter (see format above)
2. Add recipe image to `assets/img/recipe-name.png` or `.webp` (square aspect ratio recommended)
3. Build site: `bundle exec jekyll build` (responsive images will be auto-generated)
4. Verify locally: `bundle exec jekyll serve`

**Note:** New recipes automatically appear in:
- Homepage recipe grid with search/filter
- Meal planner recipe selection dropdown
- Generated `/assets/data/recipes.json` API endpoint

### Modifying Layouts or Styles

- HTML templates: `_layouts/*.html`, `_includes/*.html`
- Styles: `_sass/main.scss` (imported by `assets/css/styles.scss`)
- JavaScript: `assets/js/main.js` (homepage), `assets/js/mealplan.js` (meal planner)
- After changes: `bundle exec jekyll build` and verify with `bundle exec jekyll serve`

### Working with Meal Planner

**Files to modify:**
- `pages/mealplan.html` - Meal planner page structure
- `assets/js/mealplan.js` - Meal planner logic
- `assets/data/recipes.json` - Recipe data API (auto-generated from `_recipes/*.md`)
- `_layouts/recipe.html` - "Add to meal plan" button on recipe pages

**Important:**
- Meal plan state uses localStorage for persistence
- Drag-and-drop uses HTML5 Drag API (desktop only)
- Mobile users can remove/re-add recipes to rearrange
- Bring! integration uses `https://api.getbring.com/rest/bringrecipes/deeplink` API

### Updating Dependencies

```bash
# Update gems
bundle update

# Gemfile.lock will be modified - commit this change
```

Dependabot is configured (`.github/dependabot.yml`) to automatically update:
- GitHub Actions weekly
- Bundler dependencies weekly

## Common Issues & Workarounds

### Issue: Image generation fails during build
**Cause:** Missing libvips or libwebp dependencies  
**Solution:** Install via system package manager or Nix flake
```bash
# Ubuntu/Debian
sudo apt-get install libvips libvips-dev libwebp-dev

# Or use Nix flake (direnv allow)
```

### Issue: Build takes very long (>60 seconds)
**Cause:** Full image regeneration on every build  
**Solution:** Use `--incremental` flag or avoid `jekyll clean` between builds
```bash
bundle exec jekyll serve --incremental
```

### Issue: Ruby gem warnings about csv/base64
**Cause:** Ruby 3.4 will remove these from standard library  
**Solution:** These are just warnings - safe to ignore for now. Gems will need updating before Ruby 3.4.

### Issue: Prettier fails on template files
**Cause:** Liquid template syntax not recognized by prettier  
**Solution:** This is expected - prettier works for JS/CSS/Markdown but not Jekyll templates. Focus prettier checks on `assets/` and `_recipes/`.

## Workflow Tips

1. **Always run `bundle install`** after pulling changes to Gemfile/Gemfile.lock
2. **Don't commit `_site/` or `.jekyll-cache/`** (already in .gitignore)
3. **Test builds locally** before pushing - CI build is slower and costs Actions minutes
4. **Use incremental builds** during development for faster iteration
5. **Recipe content is in Swedish** - respect language conventions in all content changes
6. **Image files can be PNG or WebP format** in `assets/img/` - responsive variants are auto-generated

## Trust These Instructions

These instructions are verified and complete. Only search the codebase if:
- You need to understand specific implementation details not covered here
- The instructions appear to be outdated (verify with file timestamps)
- You encounter errors that aren't documented in "Common Issues"

For routine tasks (adding recipes, building, serving), follow these instructions exactly.
