# Odyssey - Frontend

A modern travel planning application built with React, Vite, TypeScript, and Tailwind CSS.

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Supabase** - Authentication and backend services
- **Axios** - HTTP client

## Project Structure

```
client/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── context/        # React context providers
│   ├── lib/            # Utility libraries and configs
│   └── main.tsx        # Application entry point
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `client` directory:
```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_API_BASE_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features

- ✅ Landing page
- ✅ Authentication (Login/Signup) with Supabase
- ✅ Protected routes
- ✅ Dashboard
- ✅ Trip Planner
- ✅ Story Mode with Passport Badge
- ✅ Responsive design with Tailwind CSS

## Next Steps

1. Set up your Supabase project and add credentials to `.env`
2. Configure backend API endpoints
3. Implement full functionality for each feature
4. Add map integration (Google Maps/Mapbox) to MapView component

