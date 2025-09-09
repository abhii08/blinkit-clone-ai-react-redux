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
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
    
    if (error) throw error
    return data
  },

  // Products
  getProducts: async (categoryId = null, limit = 20, offset = 0) => {
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
  },

  searchProducts: async (searchTerm, limit = 20) => {
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
  },

  getProductsByCategory: async (categorySlug, limit = 6) => {
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
  },

  // Stores
  getNearbyStores: async (latitude, longitude, radiusKm = 10) => {
    // Simple query since RPC function doesn't exist in fresh schema
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .limit(10)

    if (error) throw error
    return data || []
  },

  // Cart operations
  getCartItems: async (userId) => {
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
  },

  updateCartItem: async (userId, productId, quantity) => {
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
  },

  removeFromCart: async (userId, productId) => {
    const { data, error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)

    if (error) throw error
    return data
  },

  clearCart: async (userId) => {
    const { data, error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)

    if (error) throw error
    return data
  },

  // User addresses
  getUserAddresses: async (userId) => {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })

    if (error) throw error
    return data
  },

  addAddress: async (addressData) => {
    const { data, error } = await supabase
      .from('addresses')
      .insert(addressData)
      .select()

    if (error) throw error
    return data[0]
  },

  updateAddress: async (addressId, addressData) => {
    const { data, error } = await supabase
      .from('addresses')
      .update(addressData)
      .eq('id', addressId)
      .select()

    if (error) throw error
    return data[0]
  },

  deleteAddress: async (addressId) => {
    const { data, error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId)

    if (error) throw error
    return data
  },

  // Orders
  createOrder: async (orderData) => {
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()

    if (error) throw error
    return data[0]
  },

  getUserOrders: async (userId, limit = 20) => {
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
  },

  getOrderById: async (orderId) => {
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
  },

  // Notifications
  getUserNotifications: async (userId, limit = 50) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },

  markNotificationAsRead: async (notificationId) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) throw error
    return data
  }
}

// Auth helper functions
export const auth = {
  signUp: async (email, password, userData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })

    if (error) throw error
    return data
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  updateProfile: async (updates) => {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    })

    if (error) throw error
    return data
  }
}
