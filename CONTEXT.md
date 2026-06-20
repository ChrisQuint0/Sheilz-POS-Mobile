# AI Agent Context: Sheilz POS Mobile

This document provides necessary context for AI coding assistants working on the `sheilz-pos-mobile` repository.

## Project Background
This is the mobile Point-of-Sale (POS) application for Sheilz Coffee, serving as the primary terminal for cashiers. 
For the full product scope and MVP requirements, refer to `PRODUCT_SCOPE.md`.

**CRITICAL DISCREPANCY**: `PRODUCT_SCOPE.md` originally states that the mobile app is built with Flutter. **This is no longer accurate for this repository.** This project is built using **React Native and Expo**. Always write TypeScript/React Native code, not Dart/Flutter.

## Tech Stack & Architecture
- **Framework**: React Native with Expo SDK 54.
  - *Rule*: Read `AGENTS.md` and ensure you reference the exact Expo v54 docs (https://docs.expo.dev/versions/v54.0.0/) before writing any Expo-specific code.
- **Navigation**: `@react-navigation/native` and `@react-navigation/native-stack`. We are using React Navigation, NOT Expo Router.
- **State Management**: `zustand` for global state.
- **Form Handling**: `react-hook-form` paired with `zod` for schema validation.
- **Backend**: `@supabase/supabase-js` for cloud database synchronization.

### File Structure
The project follows a standard React Native `src/` directory structure:
- `src/components/`: Reusable UI components.
- `src/constants/`: App-wide constants (colors, config, etc.).
- `src/hooks/`: Custom React hooks.
- `src/navigation/`: React Navigation setup and route definitions.
- `src/screens/`: Full-screen components (Login, Dashboard, POS, etc.).
- `src/services/`: API calls and Supabase integration logic.
- `src/store/`: Zustand state management slices.
- `src/types/`: TypeScript interfaces and type definitions.

## Core Objectives (MVP)
The Capstone MVP requires this mobile POS to focus strictly on:
1. **Order Processing**: Create orders, add drinks/pastries, modify quantities, and handle variants.
2. **Payment & Receipts**: Process payments and generate receipts.
3. **Offline-First Capabilities**: The app must support offline mode. Transactions should be stored locally (e.g., via SQLite) and synced when the network is restored.
4. **Data Synchronization**: Push local transactions to Supabase so they reflect on the separate Next.js Web Admin Dashboard.

## Codebase Guidelines
1. **Types**: Use strict TypeScript. Define interfaces/types for all models (Products, Orders, Transactions).
2. **Components**: Build reusable, modular functional components. 
3. **State & Sync**: Keep the offline-first architecture in mind when designing state and API interactions. Operations should generally update local state/DB first, then queue for Supabase sync.
4. **Scope Exclusions**: Read `PRODUCT_SCOPE.md` for features explicitly excluded from the MVP (e.g., multi-branch, CRM, automated SMS) so you do not over-engineer.
