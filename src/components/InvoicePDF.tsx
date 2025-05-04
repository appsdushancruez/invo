import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer'
import { formatCurrency } from '@/lib/utils'

interface InvoiceItem {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  po_number: string
  total_price: number
  product: {
    name: string
    purchase_price: number
  }
}

interface Invoice {
  id: string
  invoice_number: string
  order_date: string
  print_date: string
  status: string
  total_amount: number
  items: InvoiceItem[]
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff'
  },
  header: {
    marginBottom: 20,
    borderBottom: 1,
    borderBottomColor: '#000000',
    paddingBottom: 10
  },
  title: {
    fontSize: 24,
    marginBottom: 10
  },
  info: {
    fontSize: 12,
    marginBottom: 5
  },
  table: {
    display: 'table',
    width: 'auto',
    marginTop: 20,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000'
  },
  tableHeader: {
    backgroundColor: '#f0f0f0'
  },
  tableCell: {
    padding: 5,
    fontSize: 10,
    borderRightWidth: 1,
    borderRightColor: '#000000'
  },
  tableCellLast: {
    padding: 5,
    fontSize: 10
  },
  footer: {
    marginTop: 20,
    borderTop: 1,
    borderTopColor: '#000000',
    paddingTop: 10
  },
  total: {
    fontSize: 12,
    marginTop: 5
  }
})

export default function InvoicePDF({ invoice }: { invoice: Invoice }) {
  return (
    <PDFViewer style={{ width: '100%', height: '100vh' }}>
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Invoice #{invoice.invoice_number}</Text>
            <Text style={styles.info}>Order Date: {new Date(invoice.order_date).toLocaleDateString()}</Text>
            <Text style={styles.info}>Print Date: {new Date(invoice.print_date).toLocaleDateString()}</Text>
            <Text style={styles.info}>Status: {invoice.status}</Text>
          </View>

          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { width: '30%' }]}>Product</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>Quantity</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>Unit Price</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>P/O Number</Text>
              <Text style={[styles.tableCellLast, { width: '30%' }]}>Total</Text>
            </View>

            {invoice.items.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '30%' }]}>{item.product.name}</Text>
                <Text style={[styles.tableCell, { width: '10%' }]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>{formatCurrency(item.unit_price)}</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>{item.po_number}</Text>
                <Text style={[styles.tableCellLast, { width: '30%' }]}>{formatCurrency(item.total_price)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.total}>Total Amount: {formatCurrency(invoice.total_amount)}</Text>
          </View>
        </Page>
      </Document>
    </PDFViewer>
  )
} 