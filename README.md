<div align="center">

# 🌐 Sipat
### *See Your Community Clearly.*

**The modern civic-tech platform empowering citizens through radical transparency.**

Sipat bridges the gap between local government data and everyday citizens — transforming opaque public spending and infrastructure planning into an engaging, interactive community experience.

<br/>

<br/>

**Frontend**

[![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite_5-B73BFE?style=flat-square&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)

**Backend**

[![PHP](https://img.shields.io/badge/PHP_8.1-777BB4?style=flat-square&logo=php&logoColor=white)](https://www.php.net/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white)](https://cloudinary.com/)

**AI**

[![Google AI](https://img.shields.io/badge/Google_AI-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google/)
[![Gemini](https://img.shields.io/badge/Gemini_1.5-8E75B2?style=flat-square&logo=googlebard&logoColor=white)](https://deepmind.google/technologies/gemini/)

<br/>

<br/>

### 🔗 [Live Demo → lite-ops-sipatv2-idwe.vercel.app](https://lite-ops-sipatv2-idwe.vercel.app/login)

> Deployed on Vercel. No install required — just open and explore.

</div>

---

## 📌 Table of Contents

- [The Problem](#-the-problem)
- [Screenshots](#-screenshots)
- [Core Features](#-core-features)
- [Design Philosophy](#-design-philosophy)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Social Impact](#-social-impact)
- [Contributing](#-contributing)

---

## 🔍 The Problem

Apathy and corruption thrive in the dark.

Municipal data — where your taxes go, what projects are planned in your neighborhood, how contracts are awarded is routinely buried in dense PDFs, unstyled government portals, or not published at all. Citizens are left disengaged, uninformed, and unable to hold officials accountable.

**Sipat changes that.** By treating the citizen as a premium user, we make civic engagement not just accessible, but genuinely desirable.

---

## 📸 Screenshots

> Sipat supports **dark mode** out of the box and is fully optimized for **mobile access** — so citizens can check on their community anytime, anywhere.

### 🏛️ Admin Dashboard
![Admin Dashboard](sipat-frontend/public/web_admin.jpg)

### 🏢 Agency Dashboard
![Agency Dashboard](sipat-frontend/public/web_agency.jpg)

### 📱 Citizen View — Mobile
![Citizen Mobile View](sipat-frontend/public/mobile_citizen.jpg)

---

## ✨ Core Features

| Feature | Description |
|---|---|
| 🗺️ **Community Explorer** | Discover local initiatives and infrastructure plans mapped accurately to your district and neighborhood. |
| 🛡️ **Verified Reports** | Access citizen-audited reports on public spending, contract allocations, and local budgets. |
| 📈 **Live Project Tracker** | Monitor construction milestones, timelines, and real-time budget utilization through an interactive visual dashboard. |
| 👥 **Citizen Dashboard** | A personalized feed of town halls, public polls, and vital updates relevant to your area. |
| 🤖 **AI-Powered Summaries** | Complex municipal data translated into plain language by Google Gemini — no policy degree required. |

---

## 🎨 Design Philosophy

Sipat was built with a relentless focus on UX/UI, deliberately breaking away from the traditionally clunky "gov-tech" aesthetic.

- **Premium SaaS Aesthetic** — Inspired by Linear and Notion: light-mode-first design, soft slate tones, indigo-blue accent gradients, and deep glassmorphism layering.
- **Dark Mode Support** — A fully-themed dark mode that flips the palette to deep navy and charcoal tones, reducing eye strain without sacrificing visual hierarchy.
- **Micro-Interactions & Motion** — The platform feels *alive* through subtle floating animations, SVG dash-array data lines, pulsating map nodes, and layered radial gradients.
- **Zero-Dependency Visuals** — Complex effects (glowing geographic nodes, animated topographic backgrounds) are executed purely in CSS and inline SVGs, keeping the bundle lightweight and framerates high.
- **Mobile-First & Responsive** — Fully optimized for mobile access, so citizens can monitor projects, check updates, and engage with their community from any device, anywhere.

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React + TypeScript |
| **Styling** | Tailwind CSS v4 (custom keyframes, arbitrary values, background masking) |
| **Build Tool** | Vite (HMR + optimized production builds) |
| **Backend** | PHP (routing, database, API logic) |
| **AI / ML** | Google AI & Gemini (municipal data processing + accessible summaries) |
| **Auth & DB** | Firebase |
| **File & Media Storage** | Cloudinary (image and file uploads via PHP backend) |


---

## 📁 Project Structure

```
sipat/
├── sipat-frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route-level views
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # Utilities and API clients
│   ├── public/
│   └── package.json
│
└── sipat-backend/           # PHP API server
    ├── routes/              # API route definitions
    ├── controllers/         # Business logic
    ├── models/              # Data models
    ├── .env.example
    └── composer.json
```

---

## 🚀 Getting Started

### Prerequisites

- PHP `>=8.1` + Composer
- Node.js `>=18` + npm

### 1. Backend Setup (PHP)

```bash
# Navigate to the backend folder
cd sipat-backend

# Install PHP dependencies
composer install

# Set up your environment file
# NOTE: A pre-filled '.env.txt' file is included in the repo.
# Just rename it to '.env' before running the server.
cp .env.txt .env
# → Your credentials are already inside — no need to fill anything in manually.
```

### 2. Frontend Setup (React + Vite)

Open a **new terminal tab** so both servers run simultaneously.

```bash
# Navigate to the frontend folder
cd sipat-frontend

# Install dependencies
npm install

# Install Firebase
npm install firebase

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173` by default.

### 3. Environment Variables

Create a `.env` file in `sipat-frontend/` and add your Firebase and Google AI credentials:

```env
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_domain_here
VITE_GOOGLE_AI_API_KEY=your_key_here
```

> ⚠️ **Never commit your `.env` file.** Make sure it's listed in `.gitignore`.

---

## 🌍 Social Impact

Sipat directly addresses three interconnected civic problems:

1. **Accountability** — Contractors and local officials are held to publicly visible timelines and budgets.
2. **Empowerment** — Residents have the data they need to ask informed questions at town halls and community meetings.
3. **Trust** — Transparent, verified reporting actively repairs the trust deficit between citizens and local governance.

> *Transparency isn't just a feature — it's the foundation of a better community.*

---



<div align="center">

Built with ❤️ for DevKada Hackathon 2026.

*Sipat — See Your Community Clearly.*

</div>
