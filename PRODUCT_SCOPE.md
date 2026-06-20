# PRODUCT SCOPE

## Project Title

**Sheilz POS: Development of a Mobile Point-of-Sale and Web-Based Admin Dashboard for Sheilz Coffee**

---

## 1. Scope Overview

Capstone I focuses on the design, development, and implementation of the core business operations for Sheilz Coffee through a dual-platform approach. The system digitizes order processing, inventory monitoring, team management, and sales reporting.

The architecture is split into a **Mobile Application (React Native + Expo)** dedicated to front-of-house Point-of-Sale (POS) operations with offline capabilities, and a **Web Application (Next.js)** dedicated to back-office administration and analytics. Both platforms will utilize Supabase for centralized cloud data storage and synchronization.

The primary objective is to deliver a fully functional Minimum Viable Product (MVP) capable of supporting the daily operational requirements of Sheilz Coffee, ensuring uninterrupted service even during network outages.

---

## 2. System Architecture

### Mobile Application (Front-End POS)

Built with React Native + Expo, this serves as the primary terminal for cashiers. It utilizes an offline-first architecture using SQLite for local storage, ensuring transaction processing can continue without internet access. Data is synced to the Supabase cloud database once the user initiates the sync or network connection is restored.

### Web Application (Back-Office Admin)

Built with Next.js (App Router), this serves as the centralized management hub for administrators and managers. It connects directly to Supabase to provide real-time insights, inventory control, and system configuration.

---

## 3. Mobile App Modules (Point-of-Sale)

The React Native mobile application focuses strictly on order execution, payment processing, and data synchronization.

### Order Processing Features

- Create customer orders and add drinks or pastries.
- Configure product variants (e.g., hot/iced, cup size).
- Modify order quantities and edit details before checkout.
- Remove items from orders or void transactions with manager authorization.

### Payment & Receipt Features

- Process standard payments.
- Generate digital receipts for transactions.
- Reprint receipts upon customer request.
- View locally cached completed transactions.

### Data Synchronization Features

- Store transaction data locally via SQLite during offline operation.
- Trigger manual or automatic data sync to Supabase storage when online.

---

## 4. Web App Modules (Admin & Backoffice)

The Next.js web application handles all administrative configurations, historical data viewing, and performance analytics. The features are structured according to the defined App Router wireframe.

### Dashboard & Core Layout (`/src/app`)

- Provide a high-level overview of daily operations.
- Utilize reusable layout components (`Sidebar` and `Header`) for seamless navigation.

### Sales Management (`/src/app/sales`)

- Search and view centralized transaction history.
- Monitor completed transactions synced from the mobile POS.
- Review detailed order breakdowns and payment statuses.

### Inventory Management (`/src/app/inventory`)

- Create inventory items and upload product images.
- Categorize records, configure units, and set minimum stock thresholds.
- Execute recipe-based inventory deduction (automatically deducting ingredient quantities based on synced POS sales).
- Record manual stock adjustments and maintain inventory history logs.

### Team Management (`/src/app/team`)

- Implement role-based access control (Administrator, Manager, Cashier).
- Manage staff accounts, credentials, and system access levels.
- Restrict specific actions (like transaction voiding) to authorized roles.

### Analytics Dashboard (`/src/app/analytics`)

- Monitor daily, weekly, monthly, and annual sales overviews.
- Identify best-selling drinks, pastries, and overall product revenue contributions.
- Track operational metrics such as peak sales hours, peak sales days, and average order value.
- Analyze inventory consumption trends to identify the most and least consumed ingredients.

### Audit Logs (`/src/app/audit`)

- Maintain immutable logs of critical system activities.
- Track transaction modifications, voids, and inventory adjustments.
- Monitor user login activities and team management actions.

---

## 5. Minimum Viable Product (MVP)

The Capstone I MVP shall strictly include:

- **Mobile POS App (React Native + Expo):** Offline-first transaction processing.
- **Local-to-Cloud Sync:** SQLite to Supabase data synchronization.
- **Web Admin Portal (Next.js):** Complete back-office management.
- **Automated Inventory:** Recipe-based ingredient deduction.
- **Analytics:** Comprehensive sales and inventory dashboards.
- **Security:** Role-based team management and audit trail logs.

---

## 6. Scope Limitations

The following features are explicitly excluded from the Capstone I scope:

- Multi-branch or franchise business support.
- Predictive analytics or automated inventory forecasting.
- Supplier management and purchase order tracking.
- Automated SMS or email notifications.
- Artificial intelligence features or machine learning models.
- Customer loyalty programs and Customer Relationship Management (CRM) features.
