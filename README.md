# 🛒 Blinkit Clone - Full-Stack Grocery Delivery Platform

A comprehensive, production-ready grocery delivery application built with React 19, Redux Toolkit, and Supabase. This project replicates Blinkit's core functionality with real-time order tracking, delivery agent management, and seamless user experience.

## 🌟 Key Features

### 🛍️ Customer Experience
- **Intuitive Shopping Interface** - Browse products by categories with smooth navigation
- **Smart Cart Management** - Real-time cart updates with local storage for guest users
- **Location-Based Services** - Google Maps integration for precise delivery locations
- **Real-Time Order Tracking** - Live GPS tracking of delivery agents
- **Secure Authentication** - Email/password authentication with role-based access
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices

### 🚚 Delivery Agent Features
- **Dedicated Agent Dashboard** - Comprehensive order management interface
- **Real-Time Order Notifications** - Instant alerts for new delivery opportunities
- **GPS Location Tracking** - Live location sharing with customers
- **Order Assignment System** - Manual order acceptance with status management
- **Performance Analytics** - Delivery statistics and earnings tracking
- **Route Optimization** - Google Maps integration for navigation

### 🔧 Technical Excellence
- **Real-Time Updates** - Supabase Realtime for live order and location tracking
- **Scalable Architecture** - Modular component design with Redux state management
- **Database Optimization** - PostgreSQL with PostGIS for location services
- **Security First** - Row Level Security (RLS) policies and secure authentication
- **Performance Optimized** - Caching, lazy loading, and efficient data fetching

## 🚀 Live Demo

**Customer Interface:** [View Demo](https://blinkitcloneaireactredux.vercel.app/)
**Delivery Dashboard:** [View Demo](https://blinkitcloneaireactredux.vercel.app/)

### Customer Interface
- **Homepage:** Product categories and featured items
- **Cart Management:** Real-time cart updates with pricing
- **Order Tracking:** Live GPS tracking with delivery status
- **Location Selection:** Google Maps integration for address selection

### Delivery Agent Dashboard
- **Order Management:** Available orders and assignment system
- **Live Tracking:** Real-time customer location tracking
- **Performance Stats:** Delivery metrics and earnings overview
- **Status Management:** Online/offline status with location sharing

## 🛠️ Tech Stack

### Frontend
- **React 19** - Latest React with concurrent features
- **Redux Toolkit** - State management with RTK Query
- **React Router v7** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **React Icons** - Comprehensive icon library
- **Vite** - Fast build tool and development server

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **PostGIS** - Geographic information system for location services
- **Row Level Security** - Database-level security policies
- **Real-time Subscriptions** - Live data updates

### External Services
- **Google Maps API** - Location services and mapping
- **Google Places API** - Address autocomplete and geocoding

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Supabase Account** - [Create free account](https://supabase.com)
- **Google Cloud Account** - For Maps API access
- **Git** - Version control

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/abhii08/blinkit-clone-ai-react-redux.git
cd blinkit-clone
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps API (Required)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Payment Gateways (Optional)
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# App Configuration
VITE_APP_NAME=Blinkit Clone
VITE_APP_VERSION=1.0.0
VITE_DEFAULT_DELIVERY_RADIUS=10
```

### 4. Database Setup

Execute the SQL scripts in your Supabase SQL Editor in this order:

```sql
-- 1. Create database schema
\i database/01-schema.sql

-- 2. Load sample data
\i database/02-seed-data.sql

-- 3. Apply migrations
\i database/03-migrations.sql

-- 4. Load utility functions
\i database/04-utilities.sql

-- 5. Final deployment verification
\i database/DEPLOY.sql
```

### 5. Configure Supabase

1. **Enable Realtime** for these tables:
   - `orders`
   - `delivery_agents`
   - `cart_items`
   - `notifications`

2. **Authentication Settings:**
   - Site URL: `http://localhost:5173`
   - Redirect URLs: `http://localhost:5173/**`
   - Email confirmation: Disabled (for development)

### 6. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see the application.

## 🗂️ Project Structure

```
src/
├── components/           # React components
│   ├── AuthModal.jsx            # User authentication modal
│   ├── CartSidebar.jsx          # Shopping cart sidebar
│   ├── CategoryGrid.jsx         # Product categories display
│   ├── DeliveryAgentDashboard.jsx # Agent management interface
│   ├── GoogleMapPicker.jsx      # Location selection map
│   ├── GoogleMapTracker.jsx     # Real-time tracking map
│   ├── HomePage.jsx             # Main landing page
│   ├── Navbar.jsx               # Navigation header
│   ├── OrderPlacement.jsx       # Order checkout process
│   ├── OrderTracking.jsx        # Live order tracking
│   ├── ProductCard.jsx          # Individual product display
│   ├── RoleSelection.jsx        # User/Agent role selection
│   └── UserLocationTracker.jsx  # Customer location sharing
├── hooks/                # Custom React hooks
│   ├── useAuthSession.js        # Authentication session management
│   ├── useLogout.js             # Logout functionality
│   └── useRoleBasedAuth.js      # Role-based authentication
├── lib/                  # External service integrations
│   └── supabase.js              # Supabase client and database helpers
├── utils/                # Utility functions
│   ├── authHelpers.js           # Authentication utilities
│   ├── cache.js                 # API response caching
│   ├── roleContext.js           # Role management
│   ├── tabAuthManager.js        # Tab-specific auth state
│   └── validation.js            # Form validation utilities
└── App.jsx               # Main application component

redux/                    # State management
├── slices/               # Redux slices
│   ├── authSlice.js             # Authentication state
│   ├── cartSlice.js             # Shopping cart state
│   ├── deliverySlice.js         # Delivery agent state
│   ├── locationSlice.js         # Location services state
│   ├── orderSlice.js            # Order management state
│   ├── productsSlice.js         # Product catalog state
│   └── uiSlice.js               # UI state management
├── hooks/                # Redux hooks
└── store.js              # Store configuration

database/                 # Database schema and migrations
├── 01-schema.sql               # Complete database schema
├── 02-seed-data.sql            # Sample data for development
├── 03-migrations.sql           # Database migrations
├── 04-utilities.sql            # Utility functions
└── DEPLOY.sql                  # Deployment verification
```

## 🔧 Configuration Guide

### Google Maps API Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project or select existing

2. **Enable Required APIs**
   - Maps JavaScript API
   - Places API (New)
   - Geocoding API
   - Geolocation API

3. **Create API Key**
   - Go to Credentials → Create Credentials → API Key
   - Restrict to your domain for security
   - Add to `.env` as `VITE_GOOGLE_MAPS_API_KEY`

### Supabase Configuration

1. **Create Supabase Project**
   - Sign up at [supabase.com](https://supabase.com)
   - Create new project
   - Note your Project URL and anon key

2. **Database Setup**
   - Run the SQL scripts in order (see Quick Start step 4)
   - Enable Realtime for required tables
   - Configure authentication settings

3. **Security Configuration**
   - RLS policies are automatically configured
   - Verify authentication settings match your domain

## 🎯 User Flows

### Customer Journey
1. **Role Selection** → Choose "Continue as User"
2. **Browse Products** → Explore categories and add items to cart
3. **Location Selection** → Choose delivery address via map or saved addresses
4. **Order Placement** → Review cart and place order
5. **Real-Time Tracking** → Track delivery agent location live
6. **Order Completion** → Receive delivery confirmation

### Delivery Agent Journey
1. **Role Selection** → Choose "Continue as Delivery Agent"
2. **Authentication** → Login or create delivery agent account
3. **Go Online** → Toggle online status to receive orders
4. **Order Management** → Accept available orders from dashboard
5. **Live Delivery** → Track customer location and update order status
6. **Order Completion** → Mark orders as delivered

## 🔄 Real-Time Features

### Order Management
- **Live Order Updates** - Real-time status changes via Supabase Realtime
- **Agent Notifications** - Instant alerts for new orders
- **Status Synchronization** - Multi-tab status consistency

### Location Tracking
- **GPS Integration** - High-accuracy location tracking
- **Live Map Updates** - Real-time agent and customer positions
- **Distance Calculations** - Haversine formula for accurate distances
- **Route Optimization** - Google Maps navigation integration

### Performance Optimizations
- **Efficient Subscriptions** - Selective database change listening
- **Location Throttling** - Optimized GPS update intervals
- **Memory Management** - Proper subscription cleanup
- **Caching Strategy** - API response caching for better performance

## 🧪 Testing

### Run Tests
```bash
npm run test
```

### Manual Testing Checklist

#### Customer Flow
- [ ] User registration and login
- [ ] Product browsing and search
- [ ] Cart management (add/remove/update)
- [ ] Location selection (current/map/saved)
- [ ] Order placement and confirmation
- [ ] Real-time order tracking
- [ ] Order history viewing

#### Delivery Agent Flow
- [ ] Agent registration and login
- [ ] Dashboard access and navigation
- [ ] Online/offline status toggle
- [ ] Order acceptance and management
- [ ] Location tracking and sharing
- [ ] Order status updates
- [ ] Performance metrics viewing

#### Real-Time Features
- [ ] Live order status updates
- [ ] Agent location broadcasting
- [ ] Customer location sharing
- [ ] Multi-tab synchronization
- [ ] Notification system

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Prepare Environment Variables**
   ```bash
   # Set all required environment variables in Vercel dashboard
   ```

2. **Deploy via Vercel CLI**
   ```bash
   npm i -g vercel
   vercel login
   vercel --prod
   ```

3. **Configure Domain**
   - Add custom domain in Vercel dashboard
   - Update Supabase authentication URLs

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Alternative Deployment Options
- **Netlify** - Static site hosting
- **Railway** - Full-stack deployment
- **DigitalOcean App Platform** - Container-based deployment

## 📊 Performance Metrics

### Core Web Vitals
- **First Contentful Paint (FCP)** - < 1.5s
- **Largest Contentful Paint (LCP)** - < 2.5s
- **Cumulative Layout Shift (CLS)** - < 0.1
- **First Input Delay (FID)** - < 100ms

### Application Performance
- **Initial Load Time** - < 3s on 3G
- **Route Transitions** - < 200ms
- **Real-time Updates** - < 2s latency
- **Location Accuracy** - < 10m precision

## 🔐 Security Features

### Authentication & Authorization
- **Secure Password Requirements** - Strong password validation
- **Rate Limiting** - Protection against brute force attacks
- **Session Management** - Secure token handling
- **Role-Based Access** - Separate user and agent permissions

### Data Protection
- **Row Level Security** - Database-level access control
- **Input Validation** - Comprehensive form validation
- **SQL Injection Prevention** - Parameterized queries
- **XSS Protection** - Content sanitization

### Privacy Compliance
- **Location Consent** - Explicit user permission for GPS tracking
- **Data Minimization** - Only collect necessary information
- **Secure Communication** - HTTPS enforcement
- **GDPR Considerations** - User data rights and deletion

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the Repository**
   ```bash
   git fork https://github.com/yourusername/blinkit-clone.git
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Commit Changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```

4. **Push to Branch**
   ```bash
   git push origin feature/amazing-feature
   ```

5. **Open Pull Request**
   - Provide clear description of changes
   - Include screenshots for UI changes
   - Ensure all tests pass

### Development Guidelines
- Follow React best practices and hooks patterns
- Use TypeScript for new components (migration in progress)
- Maintain responsive design principles
- Write comprehensive tests for new features
- Document complex logic and API integrations

## 📚 API Documentation

### Database Schema
The application uses a comprehensive PostgreSQL schema with the following key tables:

- **categories** - Product categorization
- **products** - Product catalog with pricing and details
- **orders** - Order management with status tracking
- **delivery_agents** - Agent profiles and location data
- **cart_items** - Shopping cart persistence
- **addresses** - User delivery addresses

For complete schema documentation, see [database/README.md](./database/README.md).

### Real-Time Subscriptions
```javascript
// Order status updates
const orderChannel = supabase
  .channel(`order_${orderId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    filter: `id=eq.${orderId}`
  }, handleOrderUpdate)
  .subscribe();

// Agent location tracking
const agentChannel = supabase
  .channel(`agent_${agentId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'delivery_agents',
    filter: `id=eq.${agentId}`
  }, handleLocationUpdate)
  .subscribe();
```

## 🔧 Environment Variables

### Required Variables
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Optional Variables
```env
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_APP_NAME=Blinkit Clone
VITE_APP_VERSION=1.0.0
VITE_DEFAULT_DELIVERY_RADIUS=10
```

## 🐛 Troubleshooting

### Common Issues

#### Google Maps Not Loading
```javascript
// Check API key configuration
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
if (!apiKey || apiKey === 'your_google_maps_api_key') {
  console.error('Google Maps API key not configured');
}
```

**Solutions:**
- Verify API key is valid and has proper permissions
- Ensure billing is enabled in Google Cloud Console
- Check that Maps JavaScript API is enabled
- Verify domain restrictions are properly configured

#### Supabase Connection Issues
**Solutions:**
- Verify Supabase URL and anon key are correct
- Check RLS policies are properly configured
- Ensure authentication settings match your domain
- Verify database schema is properly set up

#### Real-time Features Not Working
**Solutions:**
- Verify Supabase Realtime is enabled for required tables
- Check RLS policies allow realtime access
- Ensure proper channel subscription cleanup
- Verify network connectivity and firewall settings

#### Location Permission Denied
**Solutions:**
- Enable location permissions in browser settings
- Use HTTPS for location services (required by browsers)
- Provide clear user instructions for permission granting
- Implement fallback for manual address entry

### Performance Optimization

#### Bundle Size Optimization
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist
```

#### Database Query Optimization
- Use appropriate indexes for frequent queries
- Implement pagination for large datasets
- Cache frequently accessed data
- Use database functions for complex operations

## 📈 Roadmap

### Phase 1 (Current)
- [x] Core shopping functionality
- [x] Real-time order tracking
- [x] Delivery agent dashboard
- [x] Location services integration
- [x] Basic authentication system

### Phase 2 (Planned)
- [ ] Payment gateway integration
- [ ] Push notifications
- [ ] Advanced search and filters
- [ ] Inventory management system
- [ ] Customer reviews and ratings

### Phase 3 (Future)
- [ ] Multi-vendor support
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] AI-powered recommendations
- [ ] Subscription services


## 🙏 Acknowledgments

- **Blinkit** - Original design inspiration
- **Supabase** - Backend infrastructure
- **Google Maps** - Location services
- **Tailwind CSS** - UI framework
- **React Community** - Open source ecosystem

## 📞 Support

### Documentation
- [Setup Guide](./DEPLOYMENT.md)
- [Database Documentation](./database/README.md)
- [Real-Time Features Guide](./REAL_TIME_ORDER_FLOW.md)
- [Delivery Setup Guide](./DELIVERY_SETUP.md)

### Community
- **Email** - abhinavsharma392@gmail.com

### Professional Support
For enterprise support, custom development, or consulting services, please contact us at https://portfolio-snowy-beta-24.vercel.app/.

*This project is for educational purposes. Blinkit is a trademark of Blink Commerce Private Limited.*
