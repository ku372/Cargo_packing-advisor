# Cargo Packing Advisor

A Progressive Web App built with React, Vite, and Material UI for optimizing cargo loading and container packing.

## Features

- React 19 + TypeScript
- Material UI component library and theming
- PWA support with offline caching via `vite-plugin-pwa`
- Responsive layout with app shell (header + footer)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Production build         |
| `npm run preview` | Preview production build |
| `npm run lint`    | Run ESLint               |

## PWA

The app registers a service worker in production builds. After `npm run build` and `npm run preview`, you can install it from the browser and use it offline for cached assets.
