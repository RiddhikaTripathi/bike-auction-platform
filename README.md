# Motorcycle Auction Platform

A production-ready, full-stack motorcycle auction platform built with React (Vite, TypeScript, Tailwind CSS) and Supabase (PostgreSQL, Auth, Realtime).


## Features

### Core Features
- **User Authentication** - Email/password signup and login with Supabase Auth
- **Auction Management** - Create, edit, and manage motorcycle auctions
- **Real-time Bidding** - Live bid updates with Supabase Realtime subscriptions
- **Countdown Timer** - Live countdown with color-coded urgency indicators
- **Bid History** - Complete history of all bids with highest bidder tracking
- **Automatic Auction Closing** - Edge function for scheduled auction finalization
- **Winner Selection** - Automatic winner determination with bid validation

### Admin Features
- **Admin Dashboard** - Manage all auctions, users, and platform statistics
- **Auction Status Control** - Activate, suspend, or cancel auctions
- **Winner Selection** - Manually select winners for auctions
- **User Management** - View all platform users and their roles

### Design & UX
- **Responsive Design** - Mobile-first, works on all devices
- **Modern UI** - Professional design with emerald/slate color scheme
- **Real-time Updates** - Live bid notifications without page refresh
- **Loading States** - Smooth transitions and feedback indicators
- **Toast Notifications** - User feedback for all actions

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, PostCSS |
| Backend | Supabase (PostgreSQL, Auth, Realtime) |
| Edge Functions | Deno, Supabase Edge Runtime |
| Deployment | Docker, Vercel, Render |

## Project Structure

```
bike-auction-platform/
├── src/
│   ├── components/
│   │   ├── auth/           # Login and Register pages
│   │   ├── auction/        # Auction detail and bike cards
│   │   ├── layout/         # Header, Footer, Layout
│   │   └── ui/             # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and Supabase client
│   ├── pages/              # Page components
│   ├── types/              # TypeScript type definitions
│   ├── App.tsx             # Main app with routing
│   ├── index.css           # Global styles
│   └── main.tsx            # Entry point
├── supabase/
│   └── functions/
│       └── close-auctions/ # Edge function for auto-closing
├── Dockerfile              # Docker production build
├── docker-compose.yml      # Docker compose configuration
├── nginx.conf              # Nginx server configuration
├── vercel.json             # Vercel deployment config
├── render.yaml             # Render deployment config
└── README.md               # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bike-auction-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:5173`

### Database Setup

The database schema is automatically applied via Supabase migrations when you deploy. For development, the schema includes:

- **profiles** - User profiles with admin flags
- **categories** - Motorcycle categories (Sports, Cruiser, Adventure, Electric...)
- **bikes** - Motorcycle auction listings with pricing and status
- **bids** - Bid history with winning bid tracking

### Edge Function Deployment

The auto-close function is deployed to Supabase Edge Functions:

```bash
# The function is already deployed via Supabase MCP
# To trigger it manually:
curl -X POST "${SUPABASE_URL}/functions/v1/close-auctions" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

## Deployment

### Docker

Build and run with Docker:

```bash
# Build the image
docker build -t bike-auction .

# Run the container
docker run -p 3000:80 bike-auction

# Or use docker-compose
docker-compose up
```

### Vercel

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Render

1. Create a new Web Service on Render
2. Connect your repository
3. Set environment variables
4. Deploy with the provided `render.yaml`

## API Reference

### REST Endpoints

The application uses Supabase's auto-generated REST API:

| Table | Operations | Description |
|-------|------------|-------------|
| `bikes` | CRUD | Auction listings |
| `bids` | CR | Bid history |
| `profiles` | CRU | User profiles |
| `categories` | R | Motorcycle categories |

### Real-time Subscriptions

```typescript
// Subscribe to new bids
supabase
  .channel('bids')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'bids',
    filter: `bike_id=eq.${bikeId}`
  }, (payload) => {
    console.log('New bid:', payload.new);
  })
  .subscribe();
```

## Database Schema

### Profiles
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, references auth.users |
| display_name | text | User's display name |
| avatar_url | text | Optional avatar URL |
| is_admin | boolean | Admin role flag |

### Bikes (Auctions)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| title | text | Auction title |
| brand | text | Bike brand |
| starting_price | decimal | Starting bid amount |
| current_price | decimal | Current highest bid |
| status | enum | draft, active, closed, cancelled |
| end_time | timestamptz | Auction end datetime |

### Bids
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| bike_id | uuid | References bikes |
| bidder_id | uuid | References profiles |
| amount | decimal | Bid amount |
| is_winning | boolean | Current highest bid flag |

## Row Level Security

All tables implement Row Level Security:

- **Profiles**: Users can read all profiles, update only their own
- **Bikes**: Users can read all auctions, create/update own listings
- **Bids**: Users can read all bids, create own bids
- **Categories**: Public read access

## Assumptions & Trade-offs

- Payments are outside the MVP scope.
- Public image URLs are used for demo listings.
- Supabase provides authentication, PostgreSQL, and realtime features.
- The `bikes` database table stores motorcycle listings to avoid unnecessary schema changes.

## Future Enhancements

- Payment gateway integration (Stripe/Razorpay)
- Email and push notifications
- AI-based motorcycle price estimation
- Watchlist/Favorites
- Advanced filtering and sorting
- Admin analytics dashboard

## Architecture

### System Architecture

```text
                    ┌───────────────────────────┐
                    │      React + Vite UI      │
                    │   (TypeScript, Tailwind)  │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │    Supabase Authentication │
                    │      (JWT, User Auth)      │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │     PostgreSQL Database    │
                    │ (Auctions, Users, Bids)    │
                    └─────────────┬─────────────┘
                                  │
                     ┌────────────┴────────────┐
                     ▼                         ▼
        ┌──────────────────────┐   ┌──────────────────────┐
        │ Realtime Subscriptions│   │ Supabase Edge Functions │
        │   (Live Bidding)      │   │ (Auction Auto-Close) │
        └──────────────────────┘   └──────────────────────┘
```

### Design Overview

The application follows a modern serverless architecture using **React**, **TypeScript**, and **Supabase**. React provides a responsive user interface, while Supabase manages authentication, PostgreSQL database operations, real-time bid synchronization, and server-side auction lifecycle management.

Real-time bidding is implemented using **Supabase Realtime**, allowing all connected users to receive instant bid updates without refreshing the page. Automatic auction closing and winner selection are handled through **Supabase Edge Functions**, while Row Level Security (RLS) policies ensure secure access to user data and auction records.

## Testing

```bash
# Run TypeScript type checking
npm run typecheck

# Run ESLint
npm run lint

# Build for production
npm run build
```
## Demo Credentials

### Admin

Email: admin@gmail.com
Password: @Admin_pass1

### User

Email: user@gmail.com
Password: @User_pass1


## Acknowledgments

- [Supabase](https://supabase.com/) for the backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide](https://lucide.dev/) for icons
- [Pexels](https://pexels.com/) for stock photos

---

Built with modern web technologies and clean engineering practices.
