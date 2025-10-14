# Kaigai Career Log Web

A minimal website built with TypeScript and Astro for tracking international career journeys.

## 🚀 Quick Start

### Prerequisites

- Node.js 18.20.8+ or 20.3.0+ or 22.0.0+
- npm 9.6.5+

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The site will be available at `http://localhost:4321`

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🛠️ Tech Stack

- **Framework:** [Astro](https://astro.build) - Modern static site builder
- **Language:** TypeScript with strict mode
- **Styling:** Vanilla CSS with modern features
- **Build Tool:** Vite (via Astro)

## 📁 Project Structure

```
/
├── public/          # Static assets (favicon, images, etc.)
├── src/
│   ├── layouts/     # Reusable layout components
│   │   └── BaseLayout.astro
│   └── pages/       # File-based routing
│       └── index.astro
├── astro.config.mjs # Astro configuration
├── tsconfig.json    # TypeScript configuration (strict mode)
└── package.json     # Dependencies and scripts
```

## ✨ Features

- ⚡️ Fast build times with Astro
- 📱 Responsive design
- 🎨 Modern, clean UI with gradient effects
- 🌙 Dark mode support (automatic based on system preference)
- 📝 TypeScript with strict type checking
- 🔧 Minimal and maintainable codebase

## 📝 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run astro` - Run Astro CLI commands

## 📄 License

MIT
