# Blinkit Clone - Database Setup

This directory contains all the database files organized into logical sections for easy management and deployment.

## File Structure

### 📋 Core Files

| File | Purpose | Run Order |
|------|---------|-----------|
| `01-schema.sql` | Complete database schema with tables, indexes, functions, and triggers | **1st** |
| `02-seed-data.sql` | Sample data for categories, products, stores, and inventory | **2nd** |
| `03-migrations.sql` | Database migration scripts for updates and fixes | **3rd** |
| `04-utilities.sql` | Utility functions for development and maintenance | **4th** |

### 🗂️ Legacy Files (Archived)

The following files have been consolidated into the organized structure above:

- `complete-schema.sql` → Merged into `01-schema.sql`
- `seed-data.sql` → Renamed to `02-seed-data.sql`
- `add-total-price-column.sql` → Merged into `03-migrations.sql`
- `complete-delivery-agent-setup.sql` → Merged into `01-schema.sql`
- `create-agent-notifications-table.sql` → Merged into `01-schema.sql`
- `create-delivery-agents-table.sql` → Merged into `01-schema.sql`
- `delivery-agent-schema.sql` → Merged into `01-schema.sql`
- `disable-rls-test.sql` → Merged into `03-migrations.sql`
- `emergency-fix.sql` → Merged into `03-migrations.sql`
- `fix-delivery-agent-rls.sql` → Merged into `03-migrations.sql`
- `user-app-schema.sql` → Merged into `01-schema.sql`

## 🚀 Quick Setup

### For New Installation

```sql
-- 1. Create database and enable extensions
\c your_database_name

-- 2. Run schema setup
\i 01-schema.sql

-- 3. Load sample data
\i 02-seed-data.sql

-- 4. Apply any necessary migrations
\i 03-migrations.sql

-- 5. Load utility functions
\i 04-utilities.sql
```

### For Existing Installation

```sql
-- Only run migrations and utilities
\i 03-migrations.sql
\i 04-utilities.sql
```

## 📊 Database Schema Overview

### Core Tables

#### Product Catalog
- `categories` - Product categories with images and sorting
- `products` - Complete product catalog with pricing and details
- `stores` - Store locations with operating hours and delivery radius
- `inventory` - Stock management per store with reserved quantities

#### User Management
- `addresses` - User delivery addresses with geolocation
- `cart_items` - Shopping cart items linked to users
- `auth.users` - Supabase authentication (managed by Supabase)

#### Order Management
- `orders` - Order tracking with status and delivery details
- `order_items` - Individual items within orders
- `delivery_tracking` - Real-time delivery status updates

#### Delivery System
- `delivery_agents` - Agent profiles with location and status
- `agent_location_history` - Location tracking history
- `agent_earnings` - Delivery earnings and performance tracking
- `agent_notifications` - Agent-specific notifications

#### Communication
- `notifications` - User notifications
- `agent_notifications` - Delivery agent notifications

### Key Features

#### 🗺️ Location Services
- PostGIS integration for geographic queries
- Automatic location geography updates via triggers
- Distance-based agent assignment
- Delivery radius validation

#### 🔐 Security
- Row Level Security (RLS) policies
- User-specific data access
- Agent-specific order access
- Secure authentication integration

#### ⚡ Performance
- Comprehensive indexing strategy
- Optimized queries for real-time operations
- Geographic indexes for location-based searches
- Efficient order and inventory management

#### 🔄 Real-time Features
- Agent location tracking
- Order status updates
- Inventory management
- Notification system

## 🛠️ Utility Functions

The `04-utilities.sql` file includes helpful functions for:

### Development
- `reset_agent_statuses()` - Reset all agents to offline
- `clear_all_carts()` - Clear all cart items
- `generate_sample_orders()` - Create test orders

### Maintenance
- `update_inventory_from_orders()` - Update stock based on orders
- `restock_low_inventory()` - Automatically restock items
- `cleanup_old_notifications()` - Remove old notifications
- `archive_old_orders()` - Archive completed orders

### Analytics
- `get_delivery_performance_stats()` - Performance metrics
- `get_top_selling_products()` - Sales analytics
- `get_agent_performance_summary()` - Agent statistics

### Health Checks
- `check_database_health()` - Database integrity checks

## 🔧 Migration System

The migration system in `03-migrations.sql` includes:

1. **Schema Updates** - Add missing columns and tables
2. **Data Fixes** - Correct invalid or inconsistent data
3. **Performance Improvements** - Add indexes and optimize queries
4. **Security Updates** - Update RLS policies and permissions
5. **Feature Additions** - Add new functionality

Each migration is idempotent and can be run multiple times safely.

## 📈 Performance Considerations

### Indexes
- Geographic indexes for location-based queries
- Composite indexes for common query patterns
- Partial indexes for filtered queries
- Foreign key indexes for join performance

### Query Optimization
- Efficient agent assignment algorithm
- Optimized inventory queries
- Fast order lookup and tracking
- Real-time location updates

### Scaling
- Partitioning strategy for large tables
- Archive strategy for old data
- Connection pooling recommendations
- Read replica considerations

## 🔍 Troubleshooting

### Common Issues

1. **PostGIS Extension Missing**
   ```sql
   CREATE EXTENSION IF NOT EXISTS "postgis";
   ```

2. **UUID Extension Missing**
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

3. **Permission Issues**
   - Ensure proper RLS policies are applied
   - Check user authentication status
   - Verify agent profile exists

4. **Performance Issues**
   - Run `ANALYZE` on large tables
   - Check index usage with `EXPLAIN`
   - Monitor connection counts

### Health Checks

Run the health check function regularly:
```sql
SELECT * FROM check_database_health();
```

## 🚀 Production Deployment

### Pre-deployment Checklist
- [ ] Backup existing database
- [ ] Test migrations on staging environment
- [ ] Verify all indexes are created
- [ ] Check RLS policies are properly configured
- [ ] Validate sample data loads correctly

### Post-deployment Verification
- [ ] Run health checks
- [ ] Verify application connectivity
- [ ] Test critical user flows
- [ ] Monitor performance metrics
- [ ] Check error logs

## 📞 Support

For database-related issues:
1. Check the health check function output
2. Review migration logs
3. Verify schema matches expected structure
4. Test with utility functions

---

**Note**: This database schema supports a production-ready grocery delivery application with real-time tracking, comprehensive order management, and scalable architecture.
