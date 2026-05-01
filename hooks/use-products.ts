import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"

interface Product {
  id: number
  sku: string
  name: string
  description: string
  price: string
  available_qty: number
  badge?: string
  is_featured: boolean
  category_name: string
  images?: string[]
  product_username?: string
  product_password?: string
}

const POLL_INTERVAL = 5000 // 5 seconds

export function useProducts(filterAvailableOnly: boolean = true) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products")
      if (!res.ok) {
        throw new Error("Failed to fetch products")
      }
      const data = await res.json()
      const list = Array.isArray(data) ? data : (data.products || [])
      const filtered = filterAvailableOnly ? list.filter((p: Product) => p.available_qty > 0) : list
      setProducts(filtered)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load products"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [filterAvailableOnly])

  useEffect(() => {
    fetchProducts()

    // Set up polling for real-time updates
    const interval = setInterval(fetchProducts, POLL_INTERVAL)

    return () => {
      clearInterval(interval)
    }
  }, [fetchProducts])

  return { products, loading, error, refetch: fetchProducts }
}
