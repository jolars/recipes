# Repository Guidelines

## Project Structure & Module Organization

This is a Swedish recipe site built with Jekyll. Recipes live in `_recipes/*.md`; each file has YAML front matter followed by Markdown instructions. Shared page templates are in `_layouts/` and `_includes/`, site data is in `_data/`, and the custom Liquid filter is in `_plugins/`. The homepage is `index.html`, other pages are in `pages/`, and styles, scripts, images, and the Liquid-generated recipe JSON are in `assets/`. Jekyll writes the built site to `_site/`; do not edit generated files there.

## Build, Test, and Development Commands

- `bundle install` installs the Ruby dependencies from `Gemfile.lock`.
- `task serve` (or `bundle exec jekyll serve`) starts the local site at `http://localhost:4000`.
- `bundle exec jekyll build` builds the site and responsive recipe images into `_site/`.
- `bundle exec jekyll clean` removes generated output and caches when a fresh build is needed.
- `new-recipe` in the devenv shell runs the interactive recipe scaffold; `scripts/new-recipe.sh` is the underlying script.

The `devenv.nix` environment provides Ruby, Task, and image-processing dependencies, including libvips. GitHub Actions builds and deploys the site on pushes to `main`.

## Coding Style & Naming Conventions

Keep recipe and interface text in Swedish. Name recipe files with lowercase, hyphen-separated slugs, and use the same slug for their images, for example `_recipes/morotssoppa-med-linser.md` and `assets/img/morotssoppa-med-linser.webp`. Follow the YAML front matter and ingredient-group format of nearby recipes; express preparation and cooking times as ISO 8601 durations such as `PT30M`. Match the existing two-space indentation in JavaScript, SCSS, and YAML. No formatter or linter is currently configured.

## Testing Guidelines

There is no automated test suite or coverage target. Before submitting changes, run `bundle exec jekyll build` and check the affected pages with `task serve`. For recipe changes, confirm the page, image, and generated `/assets/data/recipes.json`; for interface changes, exercise the affected browser behavior.

## Commit & Pull Request Guidelines

Recent history uses short Swedish imperative messages for recipe edits and Conventional Commit prefixes for maintenance or code changes, such as `chore: update devenv lockfile` and `feat: change url`. Keep commits focused. In pull requests, describe the change, link any relevant issue, report build and manual checks, and include screenshots for visible layout changes.
