<div align="center">

<img src="assets/banner.png" alt="Power Shuttle — AI-powered used-car transparency for the Egyptian market" width="100%" />

*Punch in a VIN. Get the truth about the car — mileage history, repair timeline, and an unbiased AI appraisal that protects buyers from fraud.*

[![Live Demo](https://img.shields.io/badge/demo-power--shuttle.vercel.app-2ea44f?style=for-the-badge)](https://power-shuttle.vercel.app)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](./LICENSE)
[![React](https://img.shields.io/badge/frontend-React%20%2B%20Vite-149eca?style=for-the-badge&logo=react)](./frontend)
[![Node](https://img.shields.io/badge/backend-Node%20%2B%20Express-3c873a?style=for-the-badge&logo=node.js)](./backend)

</div>

---

## 📽️ Demo

**Watch the full walkthrough:** [Power Shuttle — Demo Video](https://drive.google.com/file/d/1g8nHpPozcCxwAcz7pB19hO1GoNO65DBd/view?usp=drive_link)

The clip below walks through the two sides of the platform: a **service center** logging a repair (before photo → after photo → invoice) and a **buyer** pulling that car's full history by VIN, including the AI's read on the damage and a fair-value estimate in EGP.

### Resources used in the demo

<p align="center">
  <img src="assets/demo/before-after.png" alt="Car before and after maintenance" width="100%" />
</p>

<p align="center">
  <img src="assets/demo/invoice-card.png" alt="Repair invoice used by the AI" width="60%" />
</p>

These are exactly the files that get uploaded through the **Service Center** portal for a single repair record — the backend feeds them straight to the AI model, which turns them into the structured timeline entry and damage diagram a buyer sees on the other end.

---

## ✨ What it does

- **VIN lookup for buyers** — enter a 17-character VIN and get a full, chronological history of the vehicle: every logged repair, an odometer/mileage graph over time, and a top-down damage diagram per incident.
- **AI-generated verdict** — an AI vision model plays a "street-smart Egyptian automotive appraiser," reading the before/after photos and the invoice to flag inflated invoices, estimate a fair resale value in EGP, and write a plain-language opinion a non-mechanic can trust.
- **Repair logging for service centers** — a structured intake form (VIN, odometer, service type, insurance claim, notes) with photo/invoice upload, so every repair a shop performs becomes a permanent, tamper-resistant record tied to that VIN.
- **Light/dark mode**, fully responsive, built as small reusable components rather than a hackathon throwaway.

## 🏗️ Architecture

```mermaid
flowchart LR
    subgraph Client["Frontend — React + Vite"]
        Buyer["Buyer Portal\nVIN search · timeline · mileage graph"]
        Service["Service Portal\nrepair intake form · uploads"]
    end

    subgraph Server["Backend — Node.js + Express"]
        API["/api/v1 routes"]
        DB[("SQLite\nbetter-sqlite3")]
        Uploads[("Uploaded photos\n& invoices")]
    end

    AI["AI Vision Model\n(qwen3-vl-32b-instruct)\n'Egyptian appraiser' persona"]

    Service -- "POST /service-records\n(photos + form data)" --> API
    API -- "store record" --> DB
    API -- "save files" --> Uploads
    API -- "analyze before/after/invoice" --> AI
    AI -- "structured verdict\n(items, cost, damage zones, value)" --> API
    Buyer -- "GET /vehicles/:vin/history" --> API
    API -- "history + AI verdict" --> Buyer
```

**Frontend** — React (functional components + hooks), plain CSS per component (no Tailwind/CSS-in-JS), served by Vite, deployed on Vercel.
**Backend** — Express REST API, SQLite via `better-sqlite3` for storage, `multer` for photo/invoice uploads, `sharp` for image processing.
**AI layer** — an OpenAI-compatible client calls a vision-capable model to read the before/after photos and invoice, then returns strict structured JSON (repaired items, affected components, damage zones, repair date, estimated value, and a written opinion) that the frontend renders as a timeline and damage diagram.

## 🧩 Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, `lucide-react` |
| Backend | Node.js, Express, `better-sqlite3`, `multer`, `sharp` |
| AI | OpenAI-compatible SDK → vision model, custom appraiser system prompt |
| Deployment | Vercel (frontend) |

## 🚀 Getting started

```bash
git clone https://github.com/youssefelganini/Power_shuttle.git
cd Power_shuttle

# Backend
cd backend
npm install
cp .env.example .env   # add your AI API key + FRONTEND_ORIGIN
npm run dev

# Frontend (in a second terminal)
cd ../frontend
npm install
npm run dev
```

The frontend runs on Vite's dev server (default `http://localhost:5173`) and talks to the backend at `http://localhost:3000/api/v1`.

## 📡 API overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/service-records` | Logs a new repair (VIN, odometer, service type, before/after photos, invoice). Kicks off AI analysis in the background. |
| `GET` | `/api/v1/vehicles/:vin/history` | Returns the full history for a VIN: mileage graph data, repair timeline, and the AI's overview/opinion/estimated value. |

## 📁 Project structure

```
Power_shuttle/
├── backend/          # Express API, SQLite schema, AI service
│   ├── routes.js
│   ├── aiService.js
│   ├── database.js
│   └── schema.sql
└── frontend/         # React app
    └── src/
        ├── components/   # Navbar, Landing, BuyerPortal, ServicePortal, CarDashboard, MileageGraph, DamageIndicator...
        └── App.jsx
```

## 🗺️ Roadmap

- [ ] Persistent auth for buyers and service centers
- [ ] Public API rate limiting
- [ ] Multi-language support (Arabic / English)

## 📄 License

MIT — see [LICENSE](./LICENSE).

## 👤 Author

Built by **Youssef Elganini** as a 24-hour hackathon project.
