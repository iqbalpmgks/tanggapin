# Tanggapin - Instagram Auto Reply System

Instagram Auto Reply System for SMEs and Content Creators to automatically respond to comments and direct messages based on keyword detection.

## Quick Start

### 1. Install Dependencies

```bash
# Install all dependencies for both frontend and backend
npm run install:all
```

### 2. Environment Setup

Configure your environment variables:

```bash
# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend environment  
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your configuration
```

### 3. Start Development Servers

```bash
# Start backend server
npm run dev:backend

# Start frontend server (in another terminal)
npm run dev:frontend
```

### 4. Setup Ngrok for Webhook Testing

```bash
# Smart ngrok setup (automatically detects backend port)
npm run ngrok

# Alternative: Simple ngrok on port 3000
npm run ngrok:simple

# Backend-specific ngrok
npm run ngrok:backend
```

## Available Scripts

### Main Project Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:backend` | Start backend development server |
| `npm run dev:frontend` | Start frontend development server |
| `npm run ngrok` | **Smart ngrok tunnel (auto-detects port)** |
| `npm run ngrok:simple` | Basic ngrok tunnel on port 3000 |
| `npm run ngrok:backend` | Use backend workspace ngrok setup |
| `npm run install:all` | Install dependencies for all workspaces |
| `npm run test:backend` | Run backend tests |
| `npm run test:frontend` | Run frontend tests |
| `npm run lint` | Run linting for all workspaces |
| `npm run clean` | Clean all workspaces |

### Backend Scripts

```bash
cd backend

# Development
npm run dev              # Start with nodemon
npm run dev:debug        # Start with debugger
npm run start            # Production start

# Ngrok & Webhooks
npm run ngrok            # Automated ngrok setup
npm run ngrok:simple     # Basic tunnel
npm run webhook:test     # Test webhook endpoints

# Database
npm run db:seed          # Seed database
npm run db:reset         # Reset database
npm run admin:create     # Create admin user

# Testing & Quality
npm run test             # Run tests
npm run test:coverage    # Run with coverage
npm run lint:fix         # Fix linting issues
npm run format           # Format code

# Production
npm run pm2:start        # Start with PM2
npm run pm2:logs         # View PM2 logs
```

### Frontend Scripts

```bash
cd frontend

# Development
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing & Quality
npm run test             # Run Vitest tests
npm run test:ui          # Run tests with UI
npm run lint:fix         # Fix linting issues
npm run format           # Format code
```

## Ngrok Setup for Instagram Webhooks

### Prerequisites

1. **Ngrok Account**: Sign up at [ngrok.com](https://ngrok.com)
2. **Auth Token**: Get from [ngrok dashboard](https://dashboard.ngrok.com/get-started/your-authtoken)
3. **Backend Server**: Must be running before starting ngrok

### Quick Setup

1. **Add auth token to environment**:
   ```bash
   # Add to backend/.env
   NGROK_AUTH_TOKEN=your_ngrok_auth_token_here
   ```

2. **Start backend server**:
   ```bash
   npm run dev:backend
   ```

3. **Start ngrok tunnel**:
   ```bash
   # Smart detection (recommended)
   npm run ngrok
   
   # Or specify port manually
   ngrok http 3001  # if backend runs on different port
   ```

4. **Update webhook URL**:
   - Copy the HTTPS URL from ngrok output
   - Update `WEBHOOK_BASE_URL` in `backend/.env`
   - Configure in Meta Developer Console

### Smart Port Detection

The `npm run ngrok` command automatically:
- ✅ Detects if backend server is running
- ✅ Finds the correct port (handles port conflicts)
- ✅ Verifies it's the Tanggapin backend
- ✅ Configures auth token automatically
- ✅ Provides helpful next steps

### Troubleshooting

**Backend not found?**
```bash
# Make sure backend is running first
npm run dev:backend

# Then start ngrok
npm run ngrok
```

**Port 3000 busy?**
- The smart script automatically detects alternative ports
- Backend server will use next available port (3001, 3002, etc.)
- Ngrok will tunnel to the correct port automatically

**Auth token issues?**
```bash
# Verify token
