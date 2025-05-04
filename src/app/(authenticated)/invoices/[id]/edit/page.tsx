'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import supabase from '@/lib/supabase'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency } from '@/lib/utils'

interface Product {
  id: string
  name: string
  purchase_price: number
  selling_price: number
}

interface Invoice {
  id: string
  invoice_number: string
  order_date: string
  print_date: string
  status: string
  total_amount: number
  created_at: string
}

interface InvoiceItem {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  po_number: string
  total_price: number
  product: {
    name: string
  }
}

interface InvoiceItemResponse {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  po_number: string
  total_price: number
  product: {
    name: string
  }
}

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [resolvedParams.id])

  const fetchData = async () => {
    try {
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name')

      if (productsError) throw productsError
      setProducts(productsData || [])

      // Fetch invoice details
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()

      if (invoiceError) throw invoiceError
      setInvoice(invoiceData)

      // Fetch invoice items with product details
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select(`
          id,
          product_id,
          quantity,
          unit_price,
          po_number,
          total_price,
          product:products!inner (
            name
          )
        `)
        .eq('invoice_id', resolvedParams.id)

      if (itemsError) throw itemsError
      setItems((itemsData as unknown as InvoiceItem[]) || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invoice) return

    try {
      // Update invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          invoice_number: invoice.invoice_number,
          order_date: invoice.order_date,
          print_date: invoice.print_date,
          status: invoice.status,
          total_amount: items.reduce((sum, item) => sum + item.total_price, 0)
        })
        .eq('id', invoice.id)

      if (invoiceError) throw invoiceError

      // Delete existing items
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoice.id)

      if (deleteError) throw deleteError

      // Insert new items
      const { error: insertError } = await supabase
        .from('invoice_items')
        .insert(
          items.map(item => ({
            invoice_id: invoice.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            po_number: item.po_number,
            total_price: item.total_price
          }))
        )

      if (insertError) throw insertError

      router.push(`/invoices/${invoice.id}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items]
    if (field === 'product_id') {
      const product = products.find(p => p.id === value)
      newItems[index] = {
        ...newItems[index],
        product_id: value,
        unit_price: product?.selling_price || 0,
        total_price: (product?.selling_price || 0) * newItems[index].quantity,
        product: { name: product?.name || '' }
      }
    } else if (field === 'quantity') {
      const quantity = typeof value === 'number' ? value : parseInt(value)
      newItems[index] = {
        ...newItems[index],
        quantity,
        total_price: newItems[index].unit_price * quantity
      }
    } else if (field === 'unit_price') {
      const price = typeof value === 'number' ? value : parseFloat(value)
      newItems[index] = {
        ...newItems[index],
        unit_price: price,
        total_price: price * newItems[index].quantity
      }
    } else {
      newItems[index] = {
        ...newItems[index],
        [field]: value
      }
    }
    setItems(newItems)
  }

  const addItem = () => {
    if (products.length === 0) return

    const defaultProduct = products[0]
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        product_id: defaultProduct.id,
        quantity: 1,
        unit_price: defaultProduct.selling_price,
        po_number: '',
        total_price: defaultProduct.selling_price,
        product: { name: defaultProduct.name }
      }
    ])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const generatePDF = () => {
    if (!invoice) return

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    
    // Set margins
    const margin = 15
    const pageWidth = doc.internal.pageSize.getWidth()
    const contentWidth = pageWidth - (margin * 2)
    
    // Add header
    doc.setFontSize(20)
    doc.text(`Invoice #${invoice.invoice_number}`, margin, margin + 10)
    
    // Add dates and status
    doc.setFontSize(12)
    doc.text(`Order Date: ${new Date(invoice.order_date).toLocaleDateString()}`, margin, margin + 20)
    doc.text(`Print Date: ${new Date(invoice.print_date).toLocaleDateString()}`, margin, margin + 27)
    doc.text(`Status: ${invoice.status.toUpperCase()}`, margin, margin + 34)

    // Add items table
    const tableData = items.map(item => [
      item.product.name,
      item.quantity.toString(),
      item.po_number,
      formatCurrency(item.unit_price),
      formatCurrency(item.total_price)
    ])

    // Add total row
    const total = items.reduce((sum, item) => sum + item.total_price, 0)
    tableData.push([
      '',
      '',
      '',
      'Total:',
      formatCurrency(total)
    ])

    autoTable(doc, {
      startY: margin + 40,
      head: [['Product', 'Quantity', 'P/O Number', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 20, halign: 'right' },
        2: { cellWidth: 30 },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      showFoot: 'lastPage',
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: 0,
        fontSize: 10,
        fontStyle: 'bold'
      }
    })

    // Save the PDF
    doc.save(`invoice-${invoice.invoice_number}.pdf`)
  }

  if (loading) {
    return (
      <div className="text-center text-gray-300">Loading...</div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center text-gray-300">Invoice not found</div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Edit Invoice #{invoice.invoice_number}
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <button
            type="button"
            onClick={generatePDF}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Generate PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Invoice Number
                </label>
                <input
                  type="text"
                  id="invoice_number"
                  value={invoice.invoice_number}
                  onChange={(e) => setInvoice({ ...invoice, invoice_number: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  id="status"
                  value={invoice.status}
                  onChange={(e) => setInvoice({ ...invoice, status: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  required
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div>
                <label htmlFor="order_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Order Date
                </label>
                <input
                  type="date"
                  id="order_date"
                  value={invoice.order_date}
                  onChange={(e) => setInvoice({ ...invoice, order_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="print_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Print Date
                </label>
                <input
                  type="date"
                  id="print_date"
                  value={invoice.print_date}
                  onChange={(e) => setInvoice({ ...invoice, print_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Product
                    </label>
                    <select
                      value={item.product_id}
                      onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      required
                    >
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      P/O Number
                    </label>
                    <input
                      type="text"
                      value={item.po_number}
                      onChange={(e) => handleItemChange(index, 'po_number', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Total
                    </label>
                    <div className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white">
                      {formatCurrency(item.total_price)}
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Total Amount: {formatCurrency(items.reduce((sum, item) => sum + item.total_price, 0))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push(`/invoices/${invoice.id}`)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      </form>

      <div className="mt-6 flex justify-end">
        <div className="text-right">
          <div className="text-lg font-medium text-gray-900 dark:text-white">
            Grand Total: {formatCurrency(items.reduce((sum, item) => sum + item.total_price, 0))}
          </div>
        </div>
      </div>
    </div>
  )
} 