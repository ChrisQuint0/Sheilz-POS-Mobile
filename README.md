# Sheilz POS Mobile

The mobile Point-of-Sale (POS) application for Sheilz Coffee, providing a front-of-house terminal for cashiers.

## Overview

This project is part of a dual-platform system for Sheilz Coffee, focusing on the mobile POS interface. It is designed to handle order processing, payment processing, and offline-first data synchronization.

> **Note**: While the original `PRODUCT_SCOPE.md` mentions Flutter, this repository is actually built using **React Native** and **Expo**.

## Tech Stack

- **Framework**: React Native with Expo (v54)
- **Navigation**: React Navigation
- **State Management**: Zustand
- **Forms & Validation**: React Hook Form + Zod
- **Backend & Sync**: Supabase

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the Expo development server:
   ```bash
   npm start
   ```

### Running on a Physical Device (Expo Go)

1. Download the **Expo Go** app from the [App Store (iOS)](https://apps.apple.com/us/app/expo-go/id982107779) or [Google Play Store (Android)](https://play.google.com/store/apps/details?id=host.exp.exponent).
2. Ensure your phone and your development computer are connected to the same Wi-Fi network.
3. Start the development server (`npm start`).
4. A QR code will appear in your terminal.
5. **On Android**: Open the Expo Go app and tap "Scan QR Code".
   **On iOS**: Open your default Camera app, scan the QR code, and tap the prompt to open it in Expo Go.

## File Structure

```text
sheilz-pos-mobile/
├── assets/                  # Images, fonts, and other static assets
├── src/                     # Main source code directory
│   ├── components/          # Reusable UI components
│   │   ├── pos/             # POS-specific components
│   │   └── ui/              # Generic UI components (buttons, inputs, etc.)
│   ├── constants/           # App-wide constants (colors, config, etc.)
│   ├── hooks/               # Custom React hooks
│   ├── navigation/          # React Navigation setup and route definitions
│   │   └── AppNavigator.tsx # Main application navigator
│   ├── screens/             # Full-screen components
│   │   ├── auth/            # Authentication screens (e.g., LoginScreen.tsx)
│   │   ├── pos/             # Point-of-Sale operation screens
│   │   ├── settings/        # App configuration screens
│   │   ├── sync/            # Offline-to-cloud data sync screens
│   │   └── transactions/    # Transaction history screens
│   ├── services/            # API calls and Supabase integration logic
│   ├── store/               # Zustand state management slices
│   └── types/               # TypeScript interfaces and type definitions
├── app.json                 # Expo configuration
├── package.json             # Project dependencies and scripts
└── ...
```

## Documentation & AI Guidelines

- **Product Scope**: See `PRODUCT_SCOPE.md` for MVP requirements.
- **AI Context**: See `CONTEXT.md` for architectural decisions and tech stack notes.
- **Framework Rules**: See `AGENTS.md` for critical Expo versioning rules.
