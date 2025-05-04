'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import LoadingOverlay from '@/components/LoadingOverlay'

interface Product {
  id: string
  name: string
  purchase_price: number
  selling_price: number
  created_at: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    setProcessing(`Deleting product...`)
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      setProducts(products.filter(product => product.id !== id))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return <LoadingOverlay message="Loading products..." />
  }

  return (
    <div className="space-y-8">
      {processing && <LoadingOverlay message={processing} />}
      
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Products
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={() => router.push('/products/new')}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Product
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {products.map((product) => (
            <li key={product.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                      {product.name}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex items-center space-x-4">
                    <div className="text-gray-900 dark:text-white">
                      <span className="text-gray-500 dark:text-gray-400">Purchase: </span>
                      {formatCurrency(product.purchase_price)}
                    </div>
                    <div className="text-gray-900 dark:text-white">
                      <span className="text-gray-500 dark:text-gray-400">Selling: </span>
                      {formatCurrency(product.selling_price)}
                    </div>
                    <button
                      onClick={() => router.push(`/products/${product.id}/edit`)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      disabled={!!processing}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      disabled={!!processing}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {products.length === 0 && (
            <li className="px-4 py-4 sm:px-6 text-center text-gray-500 dark:text-gray-400">
              No products found. Add your first product!
            </li>
          )}
        </ul>
      </div>
    </div>
  )
} 