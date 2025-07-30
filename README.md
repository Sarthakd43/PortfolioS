# Portfolio Management System

A single-user portfolio management web application for tracking personal investments including stocks, bonds, and cash flow.

## Tech Stack

### Backend
- **Node.js** with **Express.js** - REST API server
- **MySQL** - Database for storing portfolio data
- **Joi** - Data validation

### Frontend
- **React.js** - User interface
- **Material-UI (MUI)** - Component library and design system
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Chart.js** - Data visualization

## Features

### 📈 Stock Management
- Add, edit, and delete stock holdings
- Track purchase prices and current values
- Real-time gain/loss calculations
- Sector-based organization

### 🏦 Bond Management
- Manage government, corporate, and municipal bonds
- Track maturity dates and coupon rates
- Monitor upcoming maturities
- Calculate annual income from bonds

### 💰 Cash Flow Tracking
- Record income and expenses
- Categorize transactions
- Recurring transaction support
- Monthly, quarterly, and yearly summaries

### 📊 Portfolio Analytics
- Comprehensive dashboard with key metrics
- Asset allocation visualization
- Performance tracking over time
- Automated alerts and notifications

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

### Quick Setup

Run the automated setup script:
```powershell
.\setup.ps1
```

### Manual Setup

#### Database Setup

1. Install MySQL and create a database:
```sql
CREATE DATABASE portfolio_db;
```

2. Run the database schema:
```sql
mysql -u root -p portfolio_db < database/schema.sql
```

3. Configure your database connection in `backend/.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=portfolio_db
```

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Copy the environment template:
```bash
copy .env.example .env
```

3. Update the `.env` file with your configuration:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=portfolio_db
```

4. Install dependencies:
```bash
npm install
```

5. Start the server:
```bash
npm run dev
```

The backend will be available at `http://localhost:5000`

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `GET /api/auth/verify` - Mock verify endpoint (returns default user)

### Stocks
- `GET /api/stocks` - Get all stocks
- `POST /api/stocks` - Add new stock
- `PUT /api/stocks/:id` - Update stock
- `DELETE /api/stocks/:id` - Delete stock
- `GET /api/stocks/summary` - Get stocks summary

### Bonds
- `GET /api/bonds` - Get all bonds
- `POST /api/bonds` - Add new bond
- `PUT /api/bonds/:id` - Update bond
- `DELETE /api/bonds/:id` - Delete bond
- `GET /api/bonds/summary` - Get bonds summary
- `GET /api/bonds/upcoming-maturities` - Get upcoming bond maturities

### Cash Flow
- `GET /api/cashflow` - Get cash flow entries
- `POST /api/cashflow` - Add new cash flow entry
- `PUT /api/cashflow/:id` - Update cash flow entry
- `DELETE /api/cashflow/:id` - Delete cash flow entry
- `GET /api/cashflow/summary` - Get cash flow summary
- `GET /api/cashflow/categories` - Get categories with totals

### Portfolio
- `GET /api/portfolio/overview` - Get portfolio overview
- `GET /api/portfolio/performance` - Get performance metrics
- `GET /api/portfolio/allocation` - Get asset allocation
- `GET /api/portfolio/alerts` - Get portfolio alerts

## Project Structure

```
portfolio/
├── backend/                 # Express.js API server
│   ├── routes/             # API route handlers
│   ├── middleware/         # Custom middleware (unused in single-user mode)
│   ├── server.js          # Main server file
│   └── package.json       # Backend dependencies
├── frontend/               # React.js application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   └── App.js        # Main app component
│   └── package.json      # Frontend dependencies
├── database/              # Database schema and migrations
│   └── schema.sql        # MySQL database schema
└── README.md             # Project documentation
```

## Single-User Design

This application is designed for personal use by a single user:
- No user registration or login required
- All data belongs to one default user (ID: 1)
- Simplified authentication model
- Direct access to all portfolio features

## Development

### Running in Development Mode

Backend (with auto-restart):
```bash
cd backend
npm run dev
```

Frontend (with hot reload):
```bash
cd frontend
npm start
```

### Using NPM Scripts from Root

Install all dependencies:
```bash
npm run install-all
```

Start backend:
```bash
npm run dev-backend
```

Start frontend:
```bash
npm run dev-frontend
```

## Deployment

### Backend Deployment
1. Set production environment variables
2. Use PM2 or similar process manager
3. Configure reverse proxy (nginx)
4. Set up SSL certificates

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Serve static files through a web server
3. Configure routing for single-page application

## License

This project is licensed under the ISC License.
