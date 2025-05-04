'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import supabase from '@/lib/supabase'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency } from '@/lib/utils'

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
  product: {
    name: string
  }
  quantity: number
  unit_price: number
  po_number: string
  total_price: number
}

interface InvoiceItemResponse {
  id: string
  quantity: number
  unit_price: number
  po_number: string
  total_price: number
  product: {
    name: string
  }
}

export default function ViewInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchInvoice()
  }, [resolvedParams.id])

  const fetchInvoice = async () => {
    try {
      // Fetch invoice details
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()

      if (invoiceError) throw invoiceError

      // Fetch invoice items with product details
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select(`
          id,
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

      setInvoice(invoiceData)
      setItems((itemsData as unknown as InvoiceItemResponse[]) || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleGeneratePDF = () => {
    if (!invoice) return

    const doc = new jsPDF()
    
    // Add header
    doc.setFontSize(20)
    doc.text(`Invoice #${invoice.invoice_number}`, 14, 20)
    
    // Add dates and status
    doc.setFontSize(12)
    doc.text(`Order Date: ${new Date(invoice.order_date).toLocaleDateString()}`, 14, 30)
    doc.text(`Print Date: ${new Date(invoice.print_date).toLocaleDateString()}`, 14, 35)
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 14, 40)

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
      startY: 50,
      head: [['Product', 'Quantity', 'P/O Number', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 20, halign: 'right' },
        2: { cellWidth: 30 },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
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
            Invoice #{invoice.invoice_number}
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <button
            onClick={() => router.push(`/invoices/${invoice.id}/edit`)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Edit
          </button>
          <button
            onClick={handleGeneratePDF}
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

      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Date</h3>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(invoice.order_date)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Print Date</h3>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(invoice.print_date)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{invoice.status}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    P/O Number
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.po_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                      {formatCurrency(item.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                    Total Amount:
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(invoice.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
} 