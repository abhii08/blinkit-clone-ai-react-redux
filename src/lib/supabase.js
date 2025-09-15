import { createClient } from '@supabase/supabase-js'
import { homepageCache, categoriesCache, productsCache, CACHE_KEYS } from '../utils/cache'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database helper functions
export const db = {
  // Categories
  getCategories: async () => {
    try {
      // Check cache first
      const cached = categoriesCache.get(CACHE_KEYS.CATEGORIES);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      
      if (error) {
        console.error('Supabase error fetching categories:', error);
        throw new Error(`Failed to fetch categories: ${error.message}`);
      }
      
      // Cache the result
      categoriesCache.set(CACHE_KEYS.CATEGORIES, data);
      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      if (error.message?.includes('Failed to fetch categories')) {
        throw error;
      }
      throw new Error(`Database connection error: ${error.message}`);
    }
  },

  // Optimized homepage data fetch
  getHomepageData: async () => {
    try {
      // Check cache first
      const cached = homepageCache.get(CACHE_KEYS.HOMEPAGE_DATA);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase.rpc('get_homepage_data')
      
      if (error) {
        console.warn('RPC function not available, falling back to separate queries:', error.message);
        // Fallback to separate queries if RPC function doesn't exist
        return await db.getHomepageDataFallback();
      }
      
      // Cache the result
      homepageCache.set(CACHE_KEYS.HOMEPAGE_DATA, data);
      return data || { categories: [], featured_products: [] };
    } catch (error) {
      console.warn('Homepage RPC failed, using fallback:', error.message);
      try {
        // Fallback to separate queries
        return await db.getHomepageDataFallback();
      } catch (fallbackError) {
        console.error('Homepage fallback also failed:', fallbackError);
        throw new Error(`Failed to load homepage data: ${fallbackError.message}`);
      }
    }
  },

  // Fallback method for homepage data
  getHomepageDataFallback: async () => {
    try {
      // Get categories first
      const categories = await db.getCategories();
      const limitedCategories = categories.slice(0, 6);
      
      if (limitedCategories.length === 0) {
        console.warn('No categories found for homepage');
        return { categories: [], featured_products: [] };
      }
      
      // Get products for each category in parallel with error handling
      const productPromises = limitedCategories.map(async (category) => {
        try {
          return await db.getProductsByCategory(category.slug, 4);
        } catch (error) {
          console.error(`Failed to fetch products for category ${category.slug}:`, error);
          return []; // Return empty array for failed category
        }
      });
      
      const productResults = await Promise.allSettled(productPromises);
      
      // Structure the data, handling failed promises
      const featured_products = limitedCategories.map((category, index) => ({
        category_slug: category.slug,
        products: productResults[index].status === 'fulfilled' ? productResults[index].value : []
      }));
      
      return {
        categories: limitedCategories,
        featured_products
      };
    } catch (error) {
      console.error('Homepage fallback error:', error);
      throw new Error(`Failed to load homepage data fallback: ${error.message}`);
    }
  },

  // Products
  getProducts: async (categoryId = null, limit = 20, offset = 0) => {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories (name, slug)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }

      const { data, error } = await query
      if (error) {
        console.error('Supabase error fetching products:', error);
        throw new Error(`Failed to fetch products: ${error.message}`);
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      if (error.message?.includes('Failed to fetch products')) {
        throw error;
      }
      throw new Error(`Database error while fetching products: ${error.message}`);
    }
  },

  searchProducts: async (searchTerm, limit = 20) => {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name, slug)
        `)
        .eq('is_active', true)
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`)
        .limit(limit)

      if (error) {
        console.error('Supabase error searching products:', error);
        throw new Error(`Failed to search products: ${error.message}`);
      }
      return data || [];
    } catch (error) {
      console.error('Error searching products:', error);
      if (error.message?.includes('Failed to search products')) {
        throw error;
      }
      throw new Error(`Search error: ${error.message}`);
    }
  },

  getProductsByCategory: async (categorySlug, limit = 6) => {
    try {
      if (!categorySlug) {
        throw new Error('Category slug is required');
      }

      // Check cache first
      const cacheKey = CACHE_KEYS.PRODUCTS_BY_CATEGORY(categorySlug);
      const cached = productsCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          unit,
          image_url,
          delivery_time,
          categories!inner(slug)
        `)
        .eq('is_active', true)
        .eq('categories.slug', categorySlug)
        .limit(limit)

      if (error) {
        console.error(`Supabase error fetching products for category ${categorySlug}:`, error);
        throw new Error(`Failed to fetch products for category: ${error.message}`);
      }
      
      const transformedData = data?.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: product.unit,
        image: product.image_url,
        time: `${product.delivery_time} MINS`
      })) || []
      
      // Cache the result
      productsCache.set(cacheKey, transformedData);
      return transformedData;
    } catch (error) {
      console.error(`Error fetching products by category ${categorySlug}:`, error);
      if (error.message?.includes('Failed to fetch products for category')) {
        throw error;
      }
      throw new Error(`Category products error: ${error.message}`);
    }
  },

  getAllProductsByCategory: async (categorySlug) => {
    try {
      if (!categorySlug) {
        throw new Error('Category slug is required');
      }

      // Check cache first
      const cacheKey = CACHE_KEYS.ALL_PRODUCTS_BY_CATEGORY(categorySlug);
      const cached = productsCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          mrp,
          unit,
          image_url,
          delivery_time,
          brand,
          description,
          categories!inner(name, slug)
        `)
        .eq('is_active', true)
        .eq('categories.slug', categorySlug)
        .order('name')

      if (error) {
        console.error(`Supabase error fetching all products for category ${categorySlug}:`, error);
        throw new Error(`Failed to fetch all products for category: ${error.message}`);
      }
      
      const result = data || [];
      // Cache the result
      productsCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`Error fetching all products by category ${categorySlug}:`, error);
      if (error.message?.includes('Failed to fetch all products for category')) {
        throw error;
      }
      throw new Error(`All category products error: ${error.message}`);
    }
  },

  // Stores
  getNearbyStores: async (latitude, longitude, radiusKm = 10) => {
    try {
      if (!latitude || !longitude) {
        console.warn('Location coordinates not provided, returning all stores');
      }

      // Simple query since RPC function doesn't exist in fresh schema
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .limit(10)

      if (error) {
        console.error('Supabase error fetching nearby stores:', error);
        throw new Error(`Failed to fetch nearby stores: ${error.message}`);
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching nearby stores:', error);
      if (error.message?.includes('Failed to fetch nearby stores')) {
        throw error;
      }
      throw new Error(`Store location error: ${error.message}`);
    }
  },

  // Cart operations
  getCartItems: async (userId) => {
    try {
      if (!userId) {
        throw new Error('User ID is required to fetch cart items');
      }

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (
            id,
            name,
            price,
            image_url,
            unit
          )
        `)
        .eq('user_id', userId)

      if (error) {
        console.error('Supabase error fetching cart items:', error);
        throw new Error(`Failed to fetch cart items: ${error.message}`);
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching cart items:', error);
      if (error.message?.includes('Failed to fetch cart items')) {
        throw error;
      }
      throw new Error(`Cart access error: ${error.message}`);
    }
  },

  // Get product stock information
  getProductStock: async (productId, storeId = null) => {
    try {
      // Direct query - handle multiple inventory records
      let query = supabase
        .from('inventory')
        .select('quantity, reserved_quantity')
        .eq('product_id', productId)

      if (storeId) {
        query = query.eq('store_id', storeId).single()
      } else {
        // If no specific store, get all inventory records and sum them
        query = query.limit(10) // Limit to prevent excessive data
      }

      const { data, error } = await query
      
      if (error) {
        // Inventory query failed - using fallback
        // If no inventory record found, assume unlimited stock
        return { available: 999, total: 999 }
      }
      
      // Handle both single record and multiple records
      if (Array.isArray(data)) {
        // Multiple records - sum up all quantities
        const totalQuantity = data.reduce((sum, record) => sum + (record.quantity || 0), 0)
        const totalReserved = data.reduce((sum, record) => sum + (record.reserved_quantity || 0), 0)
        const available = totalQuantity - totalReserved
        return { 
          available: Math.max(0, available), 
          total: totalQuantity 
        }
      } else {
        // Single record
        const available = (data.quantity || 0) - (data.reserved_quantity || 0)
        return { 
          available: Math.max(0, available), 
          total: data.quantity || 0 
        }
      }
    } catch (directErr) {
      // Direct inventory query failed - using fallback
      // Ultimate fallback - assume unlimited stock
      return { available: 999, total: 999 }
    }
  },

  addToCart: async (userId, productId, quantity = 1) => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: userId,
          product_id: productId,
          quantity: quantity
        }, {
          onConflict: 'user_id,product_id'
        })

      if (error) throw error
      return data
    } catch (error) {
      // Error adding to cart
      throw error
    }
  },

  updateCartItem: async (userId, productId, quantity) => {
    try {
      if (quantity <= 0) {
        return await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', productId)
      }

      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('user_id', userId)
        .eq('product_id', productId)

      if (error) throw error
      return data
    } catch (error) {
      // Error updating cart item
      throw error
    }
  },

  removeFromCart: async (userId, productId) => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId)

      if (error) throw error
      return data
    } catch (error) {
      // Error removing from cart
      throw error
    }
  },

  clearCart: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId)

      if (error) throw error
      return data
    } catch (error) {
      // Error clearing cart
      throw error
    }
  },

  // Notifications
  getUserNotifications: async (userId, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data
    } catch (error) {
      // Error fetching notifications
      throw error
    }
  },

  markNotificationAsRead: async (notificationId) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select('*')
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      // Error marking notification as read
      throw error
    }
  },

  getUserOrders: async (userId, limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data
    } catch (error) {
      // Error fetching user orders
      throw error
    }
  },

  getOrderById: async (orderId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          ),
          stores (*),
          delivery_agents (*)
        `)
        .eq('id', orderId)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      // Error fetching order
      throw error
    }
  },

  getUserAddresses: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })

      if (error) throw error
      return data
    } catch (error) {
      // Error fetching user addresses
      throw error
    }
  },

  addAddress: async (addressData) => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .insert(addressData)
        .select()

      if (error) throw error
      return data[0]
    } catch (error) {
      // Error adding address
      throw error
    }
  },

  updateAddress: async (addressId, addressData) => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .update(addressData)
        .eq('id', addressId)
        .select()

      if (error) throw error
      return data[0]
    } catch (error) {
      // Error updating address
      throw error
    }
  },

  deleteAddress: async (addressId) => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId)

      if (error) throw error
      return data
    } catch (error) {
      // Error deleting address
      throw error
    }
  },

  // Orders
  createOrder: async (orderData) => {
    try {
      // Separate order items from order data
      const { order_items, ...orderInfo } = orderData;
      
      // Create the order first
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          ...orderInfo,
          status: 'confirmed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single()

      if (orderError) throw orderError

      // Create order items if they exist
      if (order_items && order_items.length > 0) {
        const orderItemsWithOrderId = order_items.map(item => ({
          ...item,
          order_id: order.id
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsWithOrderId);

        if (itemsError) throw itemsError;
      }

      // Return the order with items
      const { data: fullOrder, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .eq('id', order.id)
        .single();

      if (fetchError) throw fetchError;
      return fullOrder;
    } catch (error) {
      // Error creating order
      throw error
    }
  },

  updateOrderStatus: async (orderId, status, agentId = null) => {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      }
      
      if (agentId) {
        updateData.delivery_agent_id = agentId
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select(`
          *,
          order_items (
            *,
            products (*)
          ),
          delivery_agents (*)
        `)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      // Error updating order status
      throw error
    }
  },

  assignDeliveryAgent: async (orderId, agentId) => {
    try {
      // First check if the order exists
      const { data: existingOrder, error: checkError } = await supabase
        .from('orders')
        .select('id, status')
        .eq('id', orderId)
        .single()

      if (checkError || !existingOrder) {
        throw new Error(`Order with ID ${orderId} not found in database`)
      }

      // Check if order is in a valid state for assignment
      if (existingOrder.status === 'delivered' || existingOrder.status === 'cancelled') {
        throw new Error(`Cannot assign agent to order with status: ${existingOrder.status}`)
      }

      const { data, error } = await supabase
        .from('orders')
        .update({
          delivery_agent_id: agentId,
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select(`
          *,
          order_items (
            *,
            products (*)
          ),
          delivery_agents (*)
        `)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      // Error assigning delivery agent
      throw error
    }
  },

  // Delivery Agent Management
  getAvailableDeliveryAgents: async (latitude, longitude, radius = 5) => {
    try {
      // Query for agents with 'online' status (matching dashboard display)
      const { data, error } = await supabase
        .from('delivery_agents')
        .select('*')
        .in('status', ['available', 'online'])
        .eq('is_active', true)
        .limit(10)

      if (error) throw error
      console.log('Available agents found:', data?.length || 0, data)
      return data || []
    } catch (error) {
      console.error('Error fetching available delivery agents:', error)
      throw error
    }
  },

  updateAgentLocation: async (agentId, latitude, longitude) => {
    try {
      const { data, error } = await supabase
        .from('delivery_agents')
        .update({
          latitude,
          longitude,
          last_location_update: new Date().toISOString()
        })
        .eq('id', agentId)

      if (error) throw error
      return data
    } catch (error) {
      // Error updating agent location
      throw error
    }
  },

  updateAgentStatus: async (agentId, status) => {
    try {
      const { data, error } = await supabase
        .from('delivery_agents')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', agentId)

      if (error) throw error
      return data
    } catch (error) {
      // Error updating agent status
      throw error
    }
  },

  getAgentOrders: async (agentId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          ),
          stores (*)
        `)
        .eq('delivery_agent_id', agentId)
        .in('status', ['confirmed', 'preparing', 'out_for_delivery'])
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      // Error fetching agent orders
      throw error
    }
  },

  startDelivery: async (orderId, agentId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'out_for_delivery',
          delivery_started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('delivery_agent_id', agentId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      // Error starting delivery
      throw error
    }
  },

  completeDelivery: async (orderId, agentId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('delivery_agent_id', agentId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      // Error completing delivery
      throw error
    }
  },

  // Real-time tracking
  subscribeToOrderUpdates: (orderId, callback) => {
    const channel = supabase
      .channel(`order-updates-${orderId}`, { 
        config: { 
          broadcast: { self: true },
          presence: { key: orderId }
        } 
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, (payload) => {
        console.log('Order update received for user:', payload);
        if (callback) callback(payload);
      })
      .subscribe((status, err) => {
        console.log('Order subscription status:', status);
        if (err) console.error('Order subscription error:', err);
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to order ${orderId} updates`);
        }
      });
    
    return channel;
  },

  subscribeToAgentLocation: (agentId, callback) => {
    return supabase
      .channel(`agent-${agentId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'delivery_agents',
        filter: `id=eq.${agentId}`
      }, callback)
      .subscribe()
  }
}

// Auth helper functions
export const auth = {
  signUp: async (email, password, userData = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/auth/callback',
          data: {
            ...userData,
            user_type: userData.user_type || 'user', // Default to 'user' if not specified
            email_verified: false
          }
        }
      })

      if (error) {
        // Handle specific error cases
        if (error.message.includes('already registered')) {
          // Check if user exists but email isn't confirmed
          const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
          if (usersError) throw usersError
          
          const existingUser = users.find(u => u.email === email)
          if (existingUser && !existingUser.email_confirmed_at) {
            // Resend confirmation email
            const { error: resendError } = await supabase.auth.resend({
              type: 'signup',
              email,
              options: {
                emailRedirectTo: window.location.origin + '/auth/callback'
              }
            })
            
            if (resendError) {
              // Error resending confirmation
              throw new Error('Failed to resend confirmation email. Please try again.')
            }
            
            throw new Error('Please check your email to confirm your account. A new confirmation email has been sent.')
          }
        }
        throw error
      }
      
      if (data.user && !data.user.email_confirmed_at) {
        // Email confirmation required
        return {
          ...data,
          requires_confirmation: true,
          message: 'Please check your email to confirm your account before signing in.'
        }
      }
      
      return data
    } catch (error) {
      // Error signing up
      throw error
    }
  },

  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        // Check for email not confirmed error
        if (error.message.includes('Email not confirmed')) {
          // Get the user to check confirmation status
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          if (userError) throw userError
          
          // If user exists but email isn't confirmed
          if (user && !user.email_confirmed_at) {
            // Resend confirmation email
            const { error: resendError } = await supabase.auth.resend({
              type: 'signup',
              email,
              options: {
                emailRedirectTo: window.location.origin + '/auth/callback'
              }
            })
            
            if (resendError) {/* Error resending confirmation */}
            throw new Error('Please confirm your email before signing in. A new confirmation email has been sent.')
          }
        }
        throw error
      }
      
      // Double-check email confirmation status
      if (data.user && !data.user.email_confirmed_at) {
        throw new Error('Please confirm your email before signing in.')
      }
      
      return data
    } catch (error) {
      // Error signing in
      throw error
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      // Error signing out
      throw error
    }
  },

  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    } catch (error) {
      // Error getting current user
      throw error
    }
  },

  updateProfile: async (updates) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      })

      if (error) throw error
      return data
    } catch (error) {
      // Error updating profile
      throw error
    }
  }
}
