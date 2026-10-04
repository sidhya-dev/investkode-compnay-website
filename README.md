# InvestKode AI — Official Company Website

Welcome to the **InvestKode AI** company website codebase. This repository contains the static marketing, product presentation, pricing, and compliance/legal pages for [InvestKode AI](https://investkode.ai) (`https://investkodewebsite.z29.web.core.windows.net/`).

---

## 📑 Table of Contents

1. [Architecture & Tech Stack](#-architecture--tech-stack)
2. [Project & Directory Structure](#-project--directory-structure)
3. [Quick Start (Local Development)](#-quick-start-local-development)
4. [Design System & Theme Engine](#-design-system--theme-engine)
5. [Developer Guide: Making Modifications](#-developer-guide-making-modifications)
   - [Editing Page Content & Copy](#1-editing-page-content--copy)
   - [Updating Company & Merchant Information](#2-updating-company--merchant-information)
   - [Modifying Pricing & Plans](#3-modifying-pricing--plans)
   - [Customizing Brand Colors & Styles](#4-customizing-brand-colors--styles)
   - [Adding a New Page](#5-adding-a-new-page)
6. [Deployment Guide](#-deployment-guide)
   - [Azure Storage Static Website (Current Production)](#azure-storage-static-website-current-production)
   - [Azure App Service / IIS](#azure-app-service--iis)
   - [Alternative Static Hosts (Vercel, Netlify, Cloudflare Pages)](#alternative-static-hosts-vercel-netlify-cloudflare-pages)
7. [SEO, Favicons & PWA Standards](#-seo-favicons--pwa-standards)
8. [PayU & Regulatory Compliance Checklist](#-payu--regulatory-compliance-checklist)

---

## ⚡ Architecture & Tech Stack

This project is built intentionally with **Vanilla Web Technologies** for maximum performance, security, and simplicity:

- **HTML5**: Semantic, accessible structure (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`).
- **Vanilla CSS3**: Design system powered by CSS Custom Properties (variables) for zero-runtime theming, smooth micro-interactions, responsive flexbox/grid layouts, and glassmorphism.
- **Vanilla JavaScript**: Lightweight vanilla scripts for theme toggling, mobile drawer navigation, FAQ accordions, and header scroll effects.
- **Zero Build Step**: No `npm install`, Webpack, Vite, or Node compilation required. Every file can be edited directly and viewed instantly in any browser.
- **Lighthouse 100/100**: Sub-100ms first contentful paint (FCP), zero layout shift (CLS), pre-rendered critical `<head>` scripts.

---

## 📁 Project & Directory Structure

```text
investkode-compnay-website/
├── index.html              # Homepage: Hero, feature deep-dives, product preview, FAQ, CTA
├── pricing.html            # Pricing page: Tier cards (Free, Pro, Team), feature matrix, FAQ
├── about.html              # About page: Mission, leadership, security & AI governance
├── contact.html            # Contact page: Email channels, operating address, Grievance officer
├── terms.html              # Terms of Service: Account use, Google integration, billing terms
├── privacy.html            # Privacy Policy: Data collection, security, Google User Data compliance
├── refund-policy.html      # Cancellation & Refund Policy: 15-day trial, dispute terms, PayU info
├── public/                 # Brand assets, logos, and high-resolution icons
│   ├── logo-brand.png      # 512x512 Master high-resolution brand logo
│   ├── favicon-16x16.png   # 16x16 browser tab icon
│   ├── favicon-32x32.png   # 32x32 browser tab icon
│   ├── favicon-48x48.png   # 48x48 taskbar/bookmark icon
│   ├── icon-192.png        # 192x192 Android / PWA app icon
│   ├── icon-512.png        # 512x512 PWA splash / store icon
│   ├── apple-touch-icon.png# 180x180 iOS home screen icon
│   └── favicon.ico         # Legacy multi-resolution ICO file
├── favicon.ico             # Root favicon fallback
├── site.webmanifest        # PWA Web Manifest (installable web app metadata)
├── sitemap.xml             # Search engine sitemap with canonical URLs
├── robots.txt              # Search engine crawler instructions
├── web.config              # IIS / Azure Web App configuration (MIME types, security headers)
└── README.md               # Developer documentation (this file)
```

---

## 🚀 Quick Start (Local Development)

Because there are no heavy build tools, any local HTTP server can serve the project.

### Option 1: Python (Recommended)
```bash
# Python 3
python -m http.server 8080
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

### Option 2: Node.js (npx serve)
```bash
npx serve -p 8080 .
```

### Option 3: VS Code / IDE Extension
- Install the **Live Server** extension in VS Code.
- Right click `index.html` and click **"Open with Live Server"**.

---

## 🎨 Design System & Theme Engine

### Zero-Flicker Dark / Light Theming
The site features an institutional-grade dark & light mode switcher. To prevent any Flash of Unstyled Theme (FOUT), every HTML page includes an immediate inline script in `<head>`:

```javascript
(function() {
  try {
    var savedTheme = localStorage.getItem('ik-theme');
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
})();
```

### Theme CSS Variables
Tokens are defined in the `:root` and `:root[data-theme="dark"]` selectors:

| Token | Light Theme | Dark Theme | Purpose |
|---|---|---|---|
| `--bg` | `#ffffff` | `#111110` | Primary page background |
| `--bg2` | `#fafaf9` | `#1a1918` | Card & surface background |
| `--text` | `#0d0d0d` | `#f0ede8` | Primary body text |
| `--muted` | `#5a5a5a` | `#9a9690` | Secondary & subtext |
| `--border` | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.08)` | Card borders & dividers |
| `--accent` | `#f97316` (Warm Orange) | `#fb923c` | Primary brand accent & highlights |
| `--accent-d` | `#c2410c` (Deep Amber) | `#f97316` | Action buttons & badges |
| `--accent-glow` | `rgba(249,115,22,0.1)` | `rgba(251,146,60,0.15)` | Hover states & subtle pills |

### Theme Toggler Micro-Interaction
- Desktop navbar button: `#themeToggle`
- Mobile drawer button: `#themeToggleMobile`
- Both elements trigger `initThemeToggle()`, which flips between `light` and `dark`, updates the `data-theme` attribute on `<html>`, and stores the preference in `localStorage.setItem('ik-theme', next)`.

---

## 🛠️ Developer Guide: Making Modifications

### 1. Editing Page Content & Copy
Each HTML page is self-contained. Open the target page and search for the relevant section:
- **Hero Title & Subtitle**: Located inside `<header>` or `<section class="hero">`.
- **Feature Cards**: Located inside `.features-grid` or `<section id="features">`.
- **FAQ Accordion**: Located inside `.faq-item` in `index.html` or `pricing.html`.
- **Footer Links**: Located in `<footer>` or `.footer-inner` at the bottom of every page.

### 2. Updating Company & Merchant Information
For PayU gateway verification and regulatory compliance under Indian IT regulations, merchant details are displayed uniformly across all legal pages and the footer.

If the operating company or merchant changes (e.g. switching from `FinAI Global` to `Investcode Private Limited`):
1. **Search across all HTML files** for:
   - Entity Name: `FinAI Global`
   - Registered Address: `A171, Brookhaven, JVLR, Mumbai 400060, Maharashtra, India`
   - GSTIN: `27AALFF2002N1ZF`
   - Support Email: `support@investkode.ai`
   - IT / Privacy Email: `IT@investkode.ai`
   - Grievance Officer: `Biren Kumar, Chief Technology Officer`
2. Update the values in:
   - `contact.html` (Contact block & Grievance section)
   - `terms.html` (Section 1, Section 15, and Footer)
   - `privacy.html` (Section 1, Section 13, and Footer)
   - `refund-policy.html` (Section 1, Section 7, and Footer)
   - `index.html`, `pricing.html`, `about.html` (Footer legal disclosures)

### 3. Modifying Pricing & Plans
Pricing plans are listed on `pricing.html` and cross-referenced in `terms.html` (Section 12) and `refund-policy.html` (Section 2).

To change plan rates, discounts, or trial lengths:
1. Open [pricing.html](file:///pricing.html):
   - Locate `.pricing-card` elements for `Free`, `Pro`, and `Team`.
   - Update the price amount (`₹10,000 / month`), introductory discount tag (`80% off for first 3 months`), and feature checklist items (`.tier-feature`).
2. Update the corresponding copy in `terms.html` and `refund-policy.html` to maintain contractual consistency.

### 4. Customizing Brand Colors & Styles
All styling is written in vanilla CSS within `<style>` blocks in the `<head>` of each file.
- To modify the brand color, adjust `--accent` and `--accent-d` at the top of the `:root` rule in each page.
- Font styling uses Google Font **Space Grotesk** (`wght@300;500;700;800`). If changing fonts, update the `<link href="https://fonts.googleapis.com/css2?...">` tag.

### 5. Adding a New Page
When creating a new page (e.g. `careers.html` or `blog.html`):
1. Duplicate an existing lightweight page (such as `about.html`).
2. Keep the `<head>` section intact (viewport, favicon tags, theme detection script, font links, and CSS reset).
3. Keep the `<nav>` component and the mobile drawer (`.mobile-menu`) unchanged to preserve unified site navigation.
4. Replace the `<div class="container">` content with your new page content.
5. Add the new page link to:
   - `.nav-links` in all existing pages
   - `.mobile-nav-links` in all existing pages
   - `sitemap.xml`
6. Verify responsive behavior on both desktop and mobile viewports.

---

## ☁️ Deployment Guide

### Azure Storage Static Website (Current Production)
The live website is hosted on Azure Storage Static Web Hosting (`$web` container) on the storage account `investkodewebsite`.

#### Prerequisites
Install the [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) and log in:
```bash
az login
```

#### Uploading Changes
To sync all website files to the live `$web` container:

```bash
# Upload all HTML files with proper text/html MIME type
az storage blob upload-batch \
  --account-name investkodewebsite \
  --account-key "<STORAGE_ACCOUNT_KEY>" \
  -d '$web' \
  -s . \
  --pattern "*.html" \
  --content-type "text/html" \
  --overwrite

# Upload static assets (images, icons, manifest, sitemap)
az storage blob upload-batch \
  --account-name investkodewebsite \
  --account-key "<STORAGE_ACCOUNT_KEY>" \
  -d '$web' \
  -s . \
  --overwrite
```

**Live Production URL**: [https://investkodewebsite.z29.web.core.windows.net/](https://investkodewebsite.z29.web.core.windows.net/)

### Azure App Service / IIS
If deploying to an Azure Web App (Windows or IIS):
- `web.config` is already configured in the root directory.
- It automatically configures correct MIME types for `.svg`, `.webmanifest`, `.ico`, `.json`, `.woff`, `.woff2`, and adds security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`).

### Alternative Static Hosts (Vercel, Netlify, Cloudflare Pages)
Because this is pure static HTML/CSS/JS with zero build commands:
- **Build Command**: *(leave empty)*
- **Publish / Output Directory**: `.` (Root)

---

## 🔍 SEO, Favicons & PWA Standards

- **OpenGraph & Twitter Cards**: Every page includes full `og:title`, `og:description`, `og:image`, `og:url`, and `twitter:card` tags.
- **Sitemap**: Maintained at `sitemap.xml` with priority and change frequencies.
- **Robots.txt**: Points to the sitemap and allows full indexing.
- **Favicons & Brand Icons**: Complete favicon package configured in `public/` and linked with cache-busting version queries (`?v=2`) to guarantee immediate browser updates.
- **PWA Manifest**: Configured in `site.webmanifest` with theme colors, display modes, and high-resolution maskable icons.

---

## 🛡️ PayU & Regulatory Compliance Checklist

This website was built to pass strict payment gateway compliance audits (specifically PayU India and Indian IT Act regulations):

- [x] **Clear Merchant Identification**: Operating legal entity (`FinAI Global`), registered Mumbai address, and active GSTIN displayed in Contact Us and page footers.
- [x] **Transparent Pricing**: Detailed pricing tiers on `pricing.html` showing currency (INR), tax exclusion notes ("exclusive of 18% GST"), and renewal terms.
- [x] **15-Day Free Trial Disclosures**: Explicit terms detailing trial start, card authorization, automatic renewal, and how to cancel before being charged.
- [x] **Comprehensive Refund & Cancellation Policy**: Dedicated `refund-policy.html` detailing turnaround times, eligible dispute criteria, and cancellation flow.
- [x] **Google API & Calendar Privacy Compliance**: Specific disclosures on Google OAuth permissions, explicit statement that user calendar data is **never** used to train AI models, and instructions on how users can revoke access anytime.
- [x] **Grievance Officer Designation**: Appointed Grievance Officer with direct contact details and 48-hour response / 15-day resolution SLAs.

---

## 📞 Support & Contacts

- **Technical / IT Inquiries**: [IT@investkode.ai](mailto:IT@investkode.ai)
- **General & Billing Support**: [support@investkode.ai](mailto:support@investkode.ai)
- **Official Web App**: [https://app.investkode.ai](https://app.investkode.ai)