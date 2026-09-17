# 🍽️ BiteRush (FoodieHub) - Full-Stack Food Delivery Platform

Welcome to **BiteRush**, a premium full-stack food delivery web application built with **React 19**, **Spring Boot 3 (Java 17)**, and **MySQL / H2 Database**.

---

## 📌 Executive Summary & Architecture

BiteRush is an end-to-end food delivery ecosystem featuring a **Customer Application**, a **Restaurant Partner Portal**, and an **AI-driven Recommendation & Tracking Engine**.

### 🛠️ Technology Stack
- **Frontend**: React 19, React Router v7, Framer Motion, Leaflet Maps, Material UI Icons, Capacitor (Mobile Native Support)
- **Backend**: Java 17, Spring Boot 3.2.12, Spring Security (JWT Auth), Spring Data JPA, Hibernate
- **Database**: MySQL 8.x / H2 In-Memory Database (Development fallback)
- **Containerization & Deployment**: Docker, Docker Compose, Render (Backend + DB Blueprint), Vercel (Frontend SPA)

---

## ✨ Key Features & Capabilities

### 1. 🛒 Customer Portal
- **Cinematic Authentication**: Glassmorphic UI for user login and registration with JWT authentication.
- **Smart Restaurant Browsing**: Search by name, filter by cuisine (Indian, Italian, Chinese, Thai, etc.), price range, rating, or vegetarian preferences.
- **AI-Powered Premium Home (`/premium-home`)**: AI taste match scores, crave swipe card stack, and personalized recommendations.
- **Interactive Menu & Cart**: Add items with quantity controls, custom instructions, bill breakdown, eco-friendly delivery toggles, and driver tip support.
- **Delivery Address Manager**: Add, edit, set default, and manage multiple delivery addresses with landmark and pincode support.
- **Promo Code Engine**: Real-time coupon code validation and discount calculations.
- **Live Order Tracking**: Interactive Leaflet maps displaying real-time delivery rider simulation, polyline route, ETA countdown, and status badges (`PENDING`, `PREPARING`, `OUT_FOR_DELIVERY`, `DELIVERED`).
- **Green Impact Dashboard**: Track carbon footprint savings (CO₂e reduction) for eco-friendly deliveries.

### 2. 🏪 Restaurant Partner Portal (`/restaurant-login` & `/restaurant-dashboard`)
- **Partner Authentication**: Dedicated registration and login for restaurant owners.
- **Live Order Management**: Real-time order queue with status toggle buttons (`PREPARING`, `OUT_FOR_DELIVERY`, `DELIVERED`).
- **Menu Management**: Add new menu items, upload image URLs, edit pricing, toggle item availability, or delete items.
- **Revenue & Analytics**: Monitor daily orders, revenue statistics, average order value, and top-selling dishes.

---

## ⚡ End-to-End Dynamic Configuration & Production Enhancements

1. **Centralized Frontend API Engine (`frontend/src/config/apiConfig.js`)**:
   - Automatically detects `process.env.REACT_APP_API_URL` when deployed to Vercel.
   - Falls back gracefully to `http://localhost:8080/api` (Web) or `http://10.0.2.2:8080/api` (Android Capacitor emulator).
   - Eliminates all hardcoded `localhost:8080` strings across 18+ components and pages.

2. **Flexible Backend CORS Policy (`SecurityConfig.java`)**:
   - Reads `@Value("${cors.allowed-origins:*}")` dynamically from environment variables.
   - Supports production Vercel domains, wildcard origin patterns (`*`), and localhost development ports.

3. **Dynamic Spring Properties (`backend/src/main/resources/application.properties`)**:
   - Parameterized database connections: `${SPRING_DATASOURCE_URL}`, `${SPRING_DATASOURCE_USERNAME}`, `${SPRING_DATASOURCE_PASSWORD}`.
   - Configurable server port `${PORT:8080}` and `${JWT_SECRET}`.

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: v18+ and `npm`
- **Java JDK**: Version 17+
- **MySQL Server** (Optional for local persistent DB, H2 is supported as fallback)

### 2. Backend Setup
```bash
cd backend
./mvnw clean spring-boot:run
```
- Server starts on `http://localhost:8080`
- Test API endpoint: `http://localhost:8080/api/test`
- Data Initialization endpoint: `POST http://localhost:8080/api/init-data`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```
- App opens at `http://localhost:3000`

---

## 🌐 Production Deployment Guide

### Option 1: Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New > Project**.
2. Import repository `Yeshwanth-45/Full-Stack`.
3. Configure Project Settings:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
4. Add Environment Variable:
   - `REACT_APP_API_URL`: Set to your deployed Render backend URL (e.g., `https://foodiehub-backend.onrender.com/api`).
5. Click **Deploy**. SPA routing is pre-configured via `frontend/vercel.json`.

---

### Option 2: Deploy Backend & Database to Render

1. Go to [Render Dashboard](https://dashboard.render.com/) and select **New > Blueprint**.
2. Connect your GitHub repository `Yeshwanth-45/Full-Stack`.
3. Render automatically detects `render.yaml` and provisions:
   - **Web Service**: `foodiehub-backend` (using `backend/Dockerfile`)
   - **Environment Variables**:
     - `PORT`: `8080`
     - `CORS_ALLOWED_ORIGINS`: Set to your Vercel URL (e.g. `https://your-app.vercel.app`)
     - `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`
4. Click **Apply**.

---

### Option 3: Local/VPS Deployment with Docker Compose

Run the entire stack (MySQL Database + Backend API) using Docker:

```bash
docker-compose up -d --build
```

#### Services Spawned:
- **Backend API**: `http://localhost:8080`
- **MySQL Database**: `localhost:3306` (Database: `foodiehub`, User: `root`, Password: `rootpassword`)

---

## 📁 Repository Directory Structure

```
.
├── backend                     # Java Spring Boot 3 Backend
│   ├── Dockerfile              # Multi-stage Docker build container
│   ├── pom.xml                 # Maven dependencies (Java 17)
│   └── src                     # Controllers, Security, Entities, Services
├── frontend                    # React 19 Frontend Application
│   ├── public                  # HTML template & PWA manifest
│   ├── src
│   │   ├── components          # Reusable UI components & Live Order Tracking
│   │   ├── config/apiConfig.js # Centralized API environment resolver
│   │   ├── pages               # Customer & Partner application routes
│   │   └── services            # API & Auth services
│   ├── package.json
│   └── vercel.json             # Vercel SPA routing configuration
├── docker-compose.yml          # Local container orchestration
├── render.yaml                 # Render Infrastructure as Code Blueprint
└── README.md                   # Consolidated Master Documentation
```

---

## 📄 License & Credits
Built by **Yeshwanth-45** as a full-stack food delivery application.