# BoardCraft 📌

**BoardCraft** is a minimalist, beautifully designed collaborative Kanban board with a corkboard aesthetic. It brings the tactile feel of sticky notes to a digital workspace, designed for real-time team collaboration, fluid animations, and a premium user experience.

---

## ✨ Features

* **Real-Time Collaboration**: Changes to workspaces, projects, tasks, and chats sync instantly across all connected users.
* **Workspaces & Projects**: Organize your workflows into distinct workspaces (Personal or Work) and break them down into individual projects.
* **Sticky Note Aesthetic**: Tasks look and feel like physical sticky notes. Choose from curated pastel colors and custom labels.
* **Live Presence & Chat**: See who is currently active on the board with the Floating Collaboration Orb, and communicate instantly via project-specific chat.
* **Activity Logging**: Track every action (created, moved, deleted) with an automatic audit trail.
* **Desktop App Support**: Can be run as a standard web app or compiled into a standalone Windows desktop executable using Electron.
* **Dark Mode**: A stunning, cozy dark mode that shifts the corkboard into a sleek nighttime aesthetic.

---

## 🏗️ How the Code Works

BoardCraft is built on a modern, robust tech stack:

### Tech Stack
* **Frontend Framework**: React 19 + TypeScript
* **Build Tool**: Vite
* **Styling**: Tailwind CSS v4 + Custom Vanilla CSS (`src/index.css`)
* **Animations**: Framer Motion (`motion`)
* **Backend / Database**: Firebase (Firestore, Authentication, Realtime Database)
* **Desktop Packaging**: Electron & Electron-Builder

### Architecture & Data Flow
1. **Data Layer (`src/firebaseDataService.ts`)**: 
   This file is the backbone of the application. It abstracts all Firebase logic (Firestore queries, snapshot listeners, Auth, and Presence) into simple, exported functions. 
   * **Real-time Sync**: We use Firebase's `onSnapshot` to listen to collections (e.g., `workspaces`, `projects`, `tasks`). When data changes in the cloud, the callback fires, and React state is updated instantly.
   * **Presence**: We track online users using a heartbeat system written to Firestore.

2. **Component Structure (`src/components/`)**:
   * **`App.tsx`**: The main entry point that manages global state (current user, active workspace, active project) and mounts the core layout.
   * **`Sidebar.tsx`**: Handles workspace navigation, project selection, and user presence display.
   * **`KanbanBoard.tsx`**: The core drag-and-drop interface. Renders columns and maps over the `tasks` array.
   * **`TaskCard.tsx`**: The individual sticky notes.
   * **`FloatingCollabOrb.tsx`**: A dynamic UI element that expands to show active collaborators and the project chat.

3. **Desktop Integration (`electron/`)**:
   Using `vite-plugin-electron`, the app can be seamlessly packaged as a desktop application. `electron/main.ts` sets up the native application window and loads the compiled Vite output.

---

## 🚀 How to Run Locally

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **Firebase Account** (for your own database)

### Setup Instructions

1. **Clone & Install**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   * Copy the example environment file:
     ```bash
     cp .env.example .env
     ```
   * Open `.env` and fill in your Firebase configuration keys (found in your Firebase Console Project Settings).

3. **Run Web App (Development)**
   Starts the Vite development server with hot-module replacement.
   ```bash
   npm run dev
   ```

4. **Build Web App (Production)**
   ```bash
   npm run build
   ```

5. **Build Desktop Installer (Windows .exe)**
   This command builds the Vite app, patches the HTML for Electron, and uses `electron-builder` to package an NSIS `.exe` installer into the `dist/` folder.
   ```bash
   npm run build:electron
   ```

---

## 🎨 Design Philosophy
BoardCraft shuns generic corporate UI in favor of a tactile, editorial aesthetic. Colors are carefully selected pastel shades, typography mixes sans-serif readability with handwritten flair (`Caveat` font for notes), and transitions are deliberately smoothed to create an app that feels "alive" and premium.
