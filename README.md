# 3D Model Search Aggregator

A Next.js application that aggregates 3D model search results from multiple platforms, providing a unified search experience for users looking for 3D models.

## Features

- **Unified Search**: Search across multiple 3D model platforms from a single interface
- **Filtering**: Filter results by source, price, and other criteria
- **Responsive Design**: Works on desktop and mobile devices
- **User Authentication**: Register, login, and manage your account
- **Admin Dashboard**: Manage users, roles, and import data (for administrators)
- **CSV Import**: Import 3D model data from CSV files
- **Web Scraping**: Configure and run scraping jobs to collect 3D model data

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js
- **Database**: Supabase
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/stubbs41/Virtual_RC.git
cd Virtual_RC
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory with the following variables:

```
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Other API keys as needed
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── (admin)/          # Admin routes (dashboard, users, import)
│   ├── api/              # API routes
│   └── auth/             # Authentication routes
├── components/           # React components
├── lib/                  # Utility functions and services
├── types/                # TypeScript type definitions
└── styles/               # Global styles
```

## Deployment

### Vercel Deployment

The application is deployed on Vercel. Due to a specific build issue with the route groups, follow these steps for a successful deployment:

1. Fork this repository to your own GitHub account
2. Create a new project on Vercel and connect it to your forked repository
3. In the Vercel project settings, override the build command with:
   ```
   npm run build || true && node build-fix.js
   ```
4. Set the output directory to `.next`
5. Deploy the project

### Alternative Deployment Methods

#### Static Export
For a static export that can be deployed to any static hosting service:

1. Add the following to your next.config.js:
   ```js
   output: 'export',
   ```
2. Run `npm run build`
3. The static files will be in the `out` directory
4. Deploy these files to any static hosting service

#### Self-Hosting
To self-host the application:

1. Clone the repository
2. Install dependencies with `npm install`
3. Build the application with `npm run build`
4. Start the server with `npm start`
5. The application will be available at http://localhost:3000

## License

This project is licensed under the MIT License - see the LICENSE file for details.
