# ⚡ TaskFlow — Todo & Time Management Web Application

TaskFlow is a production-quality, responsive personal productivity, todo, and time-management web application. Built with modern React 19, Vite, and Zustand, it features offline-first local storage fallback, Vercel Serverless API sync support with MongoDB backend capability, Pomodoro timer, detailed statistics, calendar view, customizable themes, and drag-and-drop task organization.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: [React 19](https://react.dev/)
- **Build Tool / Bundler**: [Vite 6](https://vitejs.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **State Management**: [Zustand v5](https://zustand-demo.pmnd.rs/) (with persistent local storage and backend sync)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Vanilla CSS (Custom Design System with Design Tokens, Theme Variables & Micro-animations)
- **Typography**: Google Fonts (*Inter* & *JetBrains Mono*)

### **Backend / Serverless & Database**
- **Serverless API**: Vercel Serverless Functions (`/api/auth.js`, `/api/sync.js`, `/api/bootstrap.js`)
- **Database**: MongoDB (via Node.js official `mongodb` client driver)
- **Authentication**: JWT-based session tokens & `bcryptjs` password hashing
- **Local Dev Serverless Emulator**: Custom Vite middleware plugin (`vite-plugin-vercel-api.js`) for seamless offline & local backend development.

---

## ✨ Features

- **📊 Dashboard Overview**: Real-time completion rates, pending tasks, streak tracker, and quick task creation.
- **✅ Advanced Task Management**: 
  - Priority levels (Urgent, High, Medium, Low)
  - Categories & custom tags
  - Subtasks / checklists
  - Search, sorting, and multi-criteria filtering
- **⏱️ Integrated Pomodoro Timer**: Focus timer tied with session counters, customizable work/break intervals, and task linking.
- **📅 Interactive Calendar View**: Schedule visualization and task distribution across days.
- **📈 Productivity Analytics & Statistics**: Completion trends, category breakdown, focus time tracking.
- **🎨 Customization & Accessibility**: Light / Dark mode themes and customizable UI accent colors.
- **🔄 Local-First & Cloud Sync**: Operates offline using IndexedDB / LocalStorage, and automatically syncs with MongoDB when online.

---

## 🚀 Getting Started & How to Run

### **Prerequisites**
- **Node.js**: Version 18.x or higher installed.
- **npm**: (Included with Node.js) or `pnpm` / `yarn`.

---

### **1. Installation**

Clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd To-do\ FE
npm install
```

---

### **2. Development Mode**

To run the local development server (includes hot module replacement and local API routing):

```bash
npm run dev
```

The application will start locally at:
👉 **`http://localhost:3000`**

---

### **3. Environment Setup (Optional for Cloud Sync)**

By default, TaskFlow works seamlessly in **offline-first local mode** without any external setup.

If you wish to enable cloud sync with MongoDB:
1. Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/taskflow?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key
   ```
2. Restart `npm run dev`.

---

### **4. Building for Production**

To build the production bundle:

```bash
npm run build
```

The optimized static assets will be output to the `dist/` directory.

To preview the production build locally:

```bash
npm run preview
```

---

## 📁 Project Structure

```
To-do FE/
├── api/                        # Vercel serverless API handlers (Auth, Sync, DB)
├── assets/                     # Application static assets
├── public/                     # Public static files
├── favicon.svg                 # Application favicon
├── src/
│   ├── components/             # Reusable UI & layout components (Tasks, Timer, Calendar, UI)
│   ├── pages/                  # Top-level page views (Dashboard, Tasks, Analytics, Settings, Auth)
│   ├── repositories/           # Data access layer (Local Storage & API bridge)
│   ├── services/               # API client services
│   ├── stores/                 # Zustand state stores (Auth, Tasks, Timer, Theme)
│   ├── utils/                  # Helper utilities (Date formatting, validators)
│   ├── App.jsx                 # App root component with routing & auth guards
│   ├── index.css               # Core CSS design system & CSS variables
│   └── main.jsx                # App entry point
├── index.html                  # HTML entry template
├── vite.config.js              # Vite configuration & dev server plugins
└── package.json                # Dependencies and scripts
```

---

## 📄 License

MIT License. Free for personal and commercial use.
