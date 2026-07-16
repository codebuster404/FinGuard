# 🛡️ FinGuard

**Real-Time Anti-Money Laundering (AML) & Transaction Fraud Graph Analyzer**

FinGuard is a modern financial fraud detection platform designed to identify suspicious banking transactions in real time using machine learning and graph-based transaction visualization. It combines anomaly detection techniques with an interactive dashboard to help compliance teams detect potential money laundering activities and fraudulent transaction patterns.

---

## 📌 Features

* 🔍 Real-time transaction monitoring
* 🤖 AI-powered fraud risk scoring
* 🌐 Interactive transaction graph visualization
* 📊 Financial compliance dashboard
* 🌙 Modern dark mode interface
* ⚡ Fast and responsive React application

---

## 🧠 Problem Statement

Traditional rule-based fraud detection systems struggle to identify sophisticated money laundering techniques involving multiple accounts and layered transactions.

FinGuard addresses this challenge by analyzing transaction behavior, assigning fraud risk scores, and visualizing suspicious account relationships, enabling investigators to identify complex laundering patterns more effectively.

---

## 🚀 Tech Stack

### Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS
* React Flow (Graph Visualization)
* Lucide React

### Backend (Proposed Architecture)

* FastAPI
* Python AsyncIO

### Machine Learning (Proposed)

* Isolation Forest
* Autoencoder Neural Network (PyTorch)

### Database (Proposed)

* MongoDB

---

## 🏗️ System Architecture

```text
                    Transaction Stream
                           │
                           ▼
                  Feature Extraction
                           │
                           ▼
        Isolation Forest + Autoencoder
                           │
                    Fraud Risk Score
                           │
          ┌────────────────┴───────────────┐
          ▼                                ▼
   Transaction Database          Graph Builder
          │                                │
          └──────────────┬─────────────────┘
                         ▼
              Financial Compliance Dashboard
```

---

## 🎯 Key Functionalities

* Monitor financial transactions in real time
* Detect abnormal transaction behavior
* Assign dynamic fraud risk scores
* Visualize account-to-account transfers
* Highlight suspicious transaction chains
* Support AML investigation workflows

---

## 📂 Project Structure

```text
FinGuard/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── assets/
│   ├── hooks/
│   ├── lib/
│   └── main.tsx
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## ⚙️ Installation

Clone the repository

```bash
git clone https://github.com/<your-username>/FinGuard.git
```

Navigate into the project

```bash
cd FinGuard
```

Install dependencies

```bash
npm install
```

Start the development server

```bash
npm run dev
```

Open your browser and visit

```text
http://localhost:5173
```

---


## 🔮 Future Improvements

* Live transaction streaming using WebSockets
* Real MongoDB integration
* FastAPI backend implementation
* Real PyTorch fraud detection model
* Graph Neural Networks (GNNs)
* User authentication
* Role-based access control
* Case management for investigators
* Alert notification system
* Transaction history analytics

---

## 📚 Learning Outcomes

This project demonstrates knowledge of:

* Modern React Development
* TypeScript
* Component-based UI Design
* Financial Fraud Detection Concepts
* AML (Anti-Money Laundering)
* Graph-based Data Visualization
* Machine Learning Workflow Design
* Dashboard Development
