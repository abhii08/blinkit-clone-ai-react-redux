# 🚀 Vercel Deployment Guide - Blinkit Clone

This guide provides step-by-step instructions to deploy your Blinkit Clone application on Vercel.

## 📋 Pre-Deployment Checklist

### ✅ Project Requirements Met
- [x] React 19 + Vite application
- [x] All dependencies properly configured
- [x] Environment variables template ready
- [x] Database schema consolidated
- [x] Build configuration optimized

## 🔧 Step 1: Prepare Your Environment Variables

### Required Environment Variables
You'll need to set up these environment variables in Vercel:

```bash
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps API (Required for location features)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Payment Gateways (Optional - for checkout)
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# App Configuration (Optional)
VITE_APP_NAME=Blinkit Clone
VITE_APP_VERSION=1.0.0
VITE_DEFAULT_DELIVERY_RADIUS=10
```

### 🔑 How to Get API Keys

#### Supabase Setup
1. Go to [supabase.com](https://supabase.com) and create account
2. Create new project
3. Go to Settings → API
4. Copy `Project URL` and `anon public` key

#### Google Maps API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Maps JavaScript API and Places API
4. Create credentials → API Key
5. Restrict the API key to your domain

#### Payment Gateway Setup (Optional)
- **Razorpay**: Sign up at [razorpay.com](https://razorpay.com) → Get Key ID
- **Stripe**: Sign up at [stripe.com](https://stripe.com) → Get Publishable Key

## 🗄️ Step 2: Set Up Supabase Database

### Database Setup
1. In your Supabase project dashboard:
   - Go to SQL Editor
   - Run the database scripts in this order:

```sql
-- 1. Run schema setup
\i database/01-schema.sql

-- 2. Load sample data  
\i database/02-seed-data.sql

-- 3. Apply migrations
\i database/03-migrations.sql

-- 4. Load utilities
\i database/04-utilities.sql

-- 5. Final verification
\i database/DEPLOY.sql
```

### Authentication Setup
1. Go to Authentication → Settings
2. Configure Site URL: `https://your-app-name.vercel.app`
3. Add redirect URLs:
   - `https://your-app-name.vercel.app/**`
   - `http://localhost:5173/**` (for development)

### Row Level Security
- RLS policies are already configured in the schema
- Verify policies are enabled in Database → Tables

## 🚀 Step 3: Deploy to Vercel

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy from project directory**
```bash
cd "c:\Users\ABHIN\Projects\React\Big Projects\Blinkit-Clone"
vercel
```

4. **Follow the prompts:**
   - Link to existing project? → No
   - Project name → `blinkit-clone` (or your preferred name)
   - Directory → `./` (current directory)
   - Override settings? → No

### Method 2: GitHub Integration

1. **Push to GitHub** (you've already done this!)
```bash
git add .
git commit -m "Add Vercel deployment config"
git push
```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import from GitHub
   - Select your `blinkit-clone-ai-react-redux` repository

3. **Configure Project**
   - Framework Preset: `Vite`
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`

## ⚙️ Step 4: Configure Environment Variables in Vercel

### Via Vercel Dashboard
1. Go to your project dashboard
2. Click Settings → Environment Variables
3. Add each variable:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase URL | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Production, Preview, Development |
| `VITE_GOOGLE_MAPS_API_KEY` | Your Google Maps key | Production, Preview, Development |
| `VITE_RAZORPAY_KEY_ID` | Your Razorpay key (optional) | Production, Preview |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Your Stripe key (optional) | Production, Preview |
| `VITE_APP_NAME` | Blinkit Clone | All |
| `VITE_APP_VERSION` | 1.0.0 | All |
| `VITE_DEFAULT_DELIVERY_RADIUS` | 10 | All |

### Via Vercel CLI
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_GOOGLE_MAPS_API_KEY
# ... add other variables
```

## 🔄 Step 5: Redeploy and Verify

### Trigger New Deployment
```bash
vercel --prod
```

Or push changes to trigger automatic deployment:
```bash
git add .
git commit -m "Update environment variables"
git push
```

### Verify Deployment
1. **Check Build Logs**
   - Go to Vercel dashboard → Deployments
   - Click on latest deployment
   - Check build logs for errors

2. **Test Application**
   - Visit your deployed URL
   - Test key features:
     - [ ] User registration/login
     - [ ] Product browsing
     - [ ] Cart functionality
     - [ ] Location services
     - [ ] Order placement
     - [ ] Delivery agent dashboard

## 🛠️ Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check for missing dependencies
npm install

# Verify build locally
npm run build
npm run preview
```

#### Environment Variable Issues
- Ensure all `VITE_` prefixed variables are set
- Check variable names match exactly
- Verify values don't have extra spaces

#### Supabase Connection Issues
- Verify Supabase URL and key are correct
- Check RLS policies are properly configured
- Ensure authentication settings match your domain

#### Google Maps Issues
- Verify API key has proper permissions
- Check domain restrictions
- Ensure Maps JavaScript API is enabled

### Performance Optimization

#### Vercel Configuration
The `vercel.json` file includes:
- Static asset caching (1 year)
- SPA routing configuration
- Environment variable mapping

#### Build Optimization
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist
```

## 📊 Post-Deployment

### Monitoring
1. **Vercel Analytics**
   - Enable in project settings
   - Monitor performance metrics

2. **Supabase Monitoring**
   - Check database usage
   - Monitor API requests
   - Review authentication logs

### Domain Setup (Optional)
1. **Custom Domain**
   - Go to Vercel project → Settings → Domains
   - Add your custom domain
   - Configure DNS records

2. **SSL Certificate**
   - Automatically provided by Vercel
   - Verify HTTPS is working

## 🔐 Security Considerations

### Production Checklist
- [ ] Environment variables secured
- [ ] API keys restricted to domain
- [ ] RLS policies tested
- [ ] Authentication flows verified
- [ ] CORS settings configured
- [ ] Error handling implemented

### Supabase Security
- [ ] Database backups enabled
- [ ] API rate limiting configured
- [ ] User roles properly set
- [ ] Sensitive data encrypted

## 📱 Mobile Responsiveness

Your app is already mobile-optimized with:
- Tailwind CSS responsive design
- Mobile-first approach
- Touch-friendly interactions
- Progressive Web App ready

## 🎉 Success!

Your Blinkit Clone is now live on Vercel! 

**Next Steps:**
1. Share your deployment URL
2. Test all features thoroughly
3. Monitor performance and errors
4. Collect user feedback
5. Plan future enhancements

**Deployment URL Format:**
`https://your-project-name.vercel.app`

---

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review Supabase dashboard for errors
3. Test locally with same environment variables
4. Check browser console for client-side errors

**Happy Deploying! 🚀**
