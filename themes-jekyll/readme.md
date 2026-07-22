# Jekyll-Themes

This repository serves as a centralized theme vault. 

You can consume these themes in your documentation/content repositories (e.g., `pulgasari/poo`) while keeping your content folders 100% clean and free of theme files.

Choose **Option 1** if you prefer keeping themes organized in subfolders (`themes-jekyll/zombie`), or **Option 2** if you prefer using branches (`zombie`).

---

## Option 1: GitHub Actions Workflow (Recommended for Folder-Based Themes)

This approach uses a temporary GitHub Actions runner to merge your content (`/docs`) with the selected theme (`themes-jekyll/zombie`) at build time. No theme files or Git submodules will ever touch your content repository.

### Folder Structure in `pulgasari/aufbau`
```text
themes-jekyll/
└── zombie/
    ├── _layouts/
    │   └── default.html
    └── assets/
        └── style.css
```

### Setup Steps in Your Content Repo (e.g., `pulgasari/poo`)

1. Go to **Settings $\rightarrow$ Pages** in your content repository and change **Source** to **GitHub Actions**.
2. Create a workflow file at `.github/workflows/deploy-pages.yml` with the following content:

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches: ["main"]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      # 1. Checkout content repo
      - name: Checkout Docs
        uses: actions/checkout@v4

      # 2. Checkout theme repo
      - name: Checkout Theme Repository
        uses: actions/checkout@v4
        with:
          repository: 'pulgasari/aufbau'
          path: 'theme-temp'

      # 3. Merge docs content and theme into a temporary build folder
      - name: Merge Content and Selected Theme
        run: |
          mkdir site_build
          # Copy your documentation files
          cp -r docs/* site_build/
          # Copy the selected theme over it
          cp -r theme-temp/themes-jekyll/zombie/* site_build/

      # 4. Build site with Jekyll
      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Build with Jekyll
        uses: actions/jekyll-build-pages@v1
        with:
          source: ./site_build
          destination: ./_site

      - name: Upload Artifact
        uses: actions/upload-pages-artifact@v3

      # 5. Deploy to GitHub Pages
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## Option 2: Native Jekyll Remote Theme (Branch-Based Themes)

If you prefer native GitHub Pages builds without custom GitHub Actions workflow files, you can use GitHub's built-in `jekyll-remote-theme` plugin. This requires each theme to live on its own dedicated branch inside `pulgasari/aufbau`.

### Branch Structure in `pulgasari/aufbau`
Instead of folders, create a branch named after the theme (e.g., branch `zombie`) where the theme files reside at the root level:
```text
(branch: zombie)
├── _layouts/
│   └── default.html
└── assets/
    └── style.css
```

### Setup Steps in Your Content Repo (e.g., `pulgasari/poo`)

1. Go to **Settings $\rightarrow$ Pages** in your content repository and ensure **Source** is set to **Deploy from a branch** (Branch: `main`, Folder: `/docs`).
2. Add a `docs/_config.yml` file to your content repository:

```yaml
title: "My Documentation"

# Enable GitHub's remote theme plugin
plugins:
  - jekyll-remote-theme

# Syntax: USERNAME/REPO@BRANCH
remote_theme: pulgasari/aufbau@zombie
```
