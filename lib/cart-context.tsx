'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface CartItem {
  productId: number
  productName: string
  price: number
  quantity: number
  image: string | null
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const MAX_CART_ITEM_QUANTITY = 100

type SavedCartItem = Partial<CartItem> & {
  id?: number | string
  name?: string
  image_url?: string | null
}

function clampCartQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) {
    return 1
  }

  return Math.min(MAX_CART_ITEM_QUANTITY, Math.max(1, Math.floor(quantity)))
}

function normalizeSavedCartItem(item: SavedCartItem): CartItem | null {
  const productId = Number(item.productId ?? item.id)
  const price = Number(item.price)
  const quantity = Number(item.quantity)
  const productName = String(item.productName ?? item.name ?? '').trim()
  const image = typeof item.image === 'string'
    ? item.image
    : (typeof item.image_url === 'string' ? item.image_url : null)

  if (!Number.isInteger(productId) || productId <= 0) {
    return null
  }

  if (!Number.isFinite(price) || price < 0 || productName.length === 0) {
    return null
  }

  return {
    productId,
    productName,
    price,
    quantity: clampCartQuantity(quantity),
    image,
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart)
        const normalized = Array.isArray(parsed)
          ? parsed
            .map((item) => normalizeSavedCartItem(item as SavedCartItem))
            .filter((item): item is CartItem => item !== null)
          : []

        setItems(normalized)
      } catch (error) {
        console.error('[v0] Failed to parse cart from localStorage:', error)
      }
    }
    setIsHydrated(true)
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('cart', JSON.stringify(items))
    }
  }, [items, isHydrated])

  const addItem = (newItem: CartItem) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.productId === newItem.productId)
      if (existingItem) {
        return prevItems.map((item) =>
          item.productId === newItem.productId
            ? { ...item, quantity: clampCartQuantity(item.quantity + newItem.quantity) }
            : item
        )
      }
      return [...prevItems, { ...newItem, quantity: clampCartQuantity(newItem.quantity) }]
    })
  }

  const removeItem = (productId: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.productId !== productId))
  }

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
    } else {
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.productId === productId ? { ...item, quantity: clampCartQuantity(quantity) } : item
        )
      )
    }
  }

  const clearCart = () => {
    setItems([])
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
