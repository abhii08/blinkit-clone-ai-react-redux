// Simple in-memory cache for API responses
class SimpleCache {
  constructor(ttl = 5 * 60 * 1000) { // 5 minutes default TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    const expiry = Date.now() + this.ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }
}

// Create cache instances
export const homepageCache = new SimpleCache(5 * 60 * 1000); // 5 minutes
export const categoriesCache = new SimpleCache(10 * 60 * 1000); // 10 minutes
export const productsCache = new SimpleCache(3 * 60 * 1000); // 3 minutes

// Cache keys
export const CACHE_KEYS = {
  HOMEPAGE_DATA: 'homepage_data',
  CATEGORIES: 'categories',
  PRODUCTS_BY_CATEGORY: (slug) => `products_${slug}`,
  ALL_PRODUCTS_BY_CATEGORY: (slug) => `all_products_${slug}`,
};
