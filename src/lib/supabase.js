import { createClient } from '@supabase/supabase-js'

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
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
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
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  },

  searchProducts: async (searchTerm, limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name, slug)
        `)
        .eq('is_active', true)
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`)
        .limit(limit)

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error searching products:', error)
      throw error
    }
  },

  getProductsByCategory: async (categorySlug, limit = 6) => {
    try {
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

      if (error) throw error
      return data?.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: product.unit,
        image: product.image_url,
        time: `${product.delivery_time} MINS`
      })) || []
    } catch (error) {
      console.error('Error fetching products by category:', error)
      throw error
    }
  },

  getAllProductsByCategory: async (categorySlug) => {
    try {
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

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching all products by category:', error)
      throw error
    }
  },

  // Stores
  getNearbyStores: async (latitude, longitude, radiusKm = 10) => {
    try {
      // Simple query since RPC function doesn't exist in fresh schema
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .limit(10)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching nearby stores:', error)
      throw error
    }
  },

  // Cart operations
  getCartItems: async (userId) => {
    try {
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

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching cart items:', error)
      throw error
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
        console.log(`Inventory query failed for product ${productId}:`, error.message)
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
      console.log(`Direct inventory query failed for product ${productId}:`, directErr.message)
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
      console.error('Error adding to cart:', error)
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
      console.error('Error updating cart item:', error)
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
      console.error('Error removing from cart:', error)
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
      console.error('Error clearing cart:', error)
      throw error
    }
  },

  // User addresses
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
      console.error('Error fetching user addresses:', error)
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
      console.error('Error adding address:', error)
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
      console.error('Error updating address:', error)
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
      console.error('Error deleting address:', error)
      throw error
    }
  },

  // Orders
  createOrder: async (orderData) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()

      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('Error creating order:', error)
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
            products (name, image_url)
          ),
          addresses (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching user orders:', error)
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
          addresses (*),
          stores (*)
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching order by ID:', error)
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
      console.error('Error fetching user notifications:', error)
      throw error
    }
  },

  markNotificationAsRead: async (notificationId) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  },

  // Enhanced Order Management
  createOrder: async (orderData) => {
    try {
      // Separate order items from order data
      const { order_items, ...orderInfo } = orderData;
      
      // Create the order first
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          ...orderInfo,
          status: 'pending',
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
          ),
          addresses (*)
        `)
        .eq('id', order.id)
        .single();

      if (fetchError) throw fetchError;
      return fullOrder;
    } catch (error) {
      console.error('Error creating order:', error)
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
          addresses (*),
          delivery_agents (*)
        `)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating order status:', error)
      throw error
    }
  },

  assignDeliveryAgent: async (orderId, agentId) => {
    try {
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
          addresses (*),
          delivery_agents (*)
        `)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error assigning delivery agent:', error)
      throw error
    }
  },

  // Delivery Agent Management
  getAvailableDeliveryAgents: async (latitude, longitude, radius = 5) => {
    try {
      // Simple query for available agents - in production, use PostGIS for location queries
      const { data, error } = await supabase
        .from('delivery_agents')
        .select('*')
        .eq('status', 'available')
        .eq('is_active', true)
        .limit(10)

      if (error) throw error
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
      console.error('Error updating agent location:', error)
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
      console.error('Error updating agent status:', error)
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
      console.error('Error fetching agent orders:', error)
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
      console.error('Error starting delivery:', error)
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
      console.error('Error completing delivery:', error)
      throw error
    }
  },

  // Real-time tracking
  subscribeToOrderUpdates: (orderId, callback) => {
    return supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, callback)
      .subscribe()
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
              console.error('Error resending confirmation:', resendError)
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
      console.error('Error signing up:', error)
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
            
            if (resendError) console.error('Error resending confirmation:', resendError)
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
      console.error('Error signing in:', error)
      throw error
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  },

  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    } catch (error) {
      console.error('Error getting current user:', error)
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
      console.error('Error updating profile:', error)
      throw error
    }
  }
}
