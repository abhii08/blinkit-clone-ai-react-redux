# 🛒 Blinkit Clone - React Landing Page

A pixel-perfect, fully responsive Blinkit clone built with React and Tailwind CSS. This project replicates the Blinkit grocery delivery app's landing page with modern web technologies.

## ✨ Features

- **🎨 Pixel-Perfect Design** - Matches the original Blinkit layout exactly
- **📱 Fully Responsive** - Works seamlessly on desktop, tablet, and mobile devices
- **⚡ Fast & Modern** - Built with React 19 and Vite for optimal performance
- **🎭 Smooth Animations** - Hover effects and transitions throughout
- **♿ Accessible** - Proper ARIA labels, semantic HTML, and keyboard navigation
- **🧩 Modular Components** - Clean, reusable component architecture

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/
│   ├── Navbar.jsx          # Navigation with search and cart
│   ├── HeroSection.jsx     # Paan corner banner
│   ├── PromoCards.jsx      # Pharmacy, Pet Care, Baby Care cards
│   ├── CategoryGrid.jsx    # Product categories grid
│   ├── ProductSection.jsx  # Reusable product listing component
│   └── Footer.jsx          # Footer with links and app download
├── App.jsx                 # Main app component
└── main.jsx               # App entry point
```

## 🛠️ Tech Stack

- **Frontend:** React 19, JavaScript (ES6+)
- **Styling:** Tailwind CSS
- **Build Tool:** Vite
- **Development:** Hot Module Replacement (HMR)
- **Linting:** ESLint

## 🎯 Components Overview

### Navbar
- Blinkit logo with brand colors
- Location display with dropdown
- Search bar with placeholder
- Login button and shopping cart

### Hero Section
- Green gradient "Paan corner" banner
- Call-to-action button
- Product showcase images

### Promotional Cards
- Pharmacy services card
- Pet care supplies card  
- Baby care essentials card
- Hover animations and CTAs

### Category Grid
- 10 product categories with images
- Responsive grid layout
- Hover effects on category items

### Product Sections
- Dairy, Bread & Eggs section
- Rolling paper & tobacco section
- Product cards with pricing
- ADD buttons for cart functionality

### Footer
- Useful links and categories
- App download buttons
- Social media links
- Copyright information

## 🎨 Design Features

- **Color Scheme:** Green (#10B981) and Yellow (#F59E0B) brand colors
- **Typography:** Clean, modern font hierarchy
- **Images:** High-quality placeholder images from Unsplash
- **Responsive Breakpoints:** Mobile-first design approach
- **Hover States:** Subtle animations and color transitions

## 📱 Responsive Design

- **Mobile (320px+):** Single column layout, mobile-optimized navigation
- **Tablet (768px+):** Two-column grids, expanded search bar
- **Desktop (1024px+):** Full multi-column layout, all features visible

## 🔧 Customization

To customize the design:

1. **Colors:** Update Tailwind classes in components
2. **Images:** Replace Unsplash URLs with your own images
3. **Content:** Modify product data in `App.jsx`
4. **Layout:** Adjust grid columns and spacing in components

## 📄 License

This project is for educational purposes. Blinkit is a trademark of Blink Commerce Private Limited.
