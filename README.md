# 🧾 Invoice Generator Web App

## 📌 Overview
A simple web application to generate PDF invoices. Users can manage products, create invoices with detailed line items, and view invoice history. The app is connected to **Supabase** for backend data storage and authentication.

## 🛠 Tech Stack
- **Frontend**: Next.js
- **Styling**: Tailwind CSS
- **Backend / Auth / DB**: Supabase
- **PDF Generation**: Browser-based (e.g., html2pdf or jsPDF)

## ✨ Core Features
1. **User Login** – Authenticated access to protect data
2. **Product Management**
   - Add / Edit / Delete products
   - Fields: Name, Purchase Price, Selling Price
3. **Invoice Creation**
   - Invoice number, order date, print date
   - Add products by search or dropdown
   - Add multiple purchase order numbers (P/O No)
   - Quantity, price, and total per item
   - Grand total
   - Save as draft or generate PDF
4. **Invoice History**
   - View and edit previous invoices
   - Regenerate PDF invoices

## 📁 Project Structure (Simplified)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Database Schema

### Products Table
```sql
create table public.products (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  name text not null,
  purchase_price numeric(10, 2) not null,
  selling_price numeric(10, 2) not null,
  constraint products_pkey primary key (id)
) TABLESPACE pg_default;
```

### Invoices Table
```sql
create table public.invoices (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  invoice_number text not null,
  order_date date not null,
  print_date date not null,
  status text not null default 'draft'::text,
  total_amount numeric(10, 2) not null default 0,
  constraint invoices_pkey primary key (id)
) TABLESPACE pg_default;
```

### Invoice Items Table
```sql
create table public.invoice_items (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  invoice_id uuid null,
  product_id uuid null,
  quantity integer not null,
  unit_price numeric(10, 2) not null,
  po_number text null,
  total_price numeric(10, 2) not null,
  constraint invoice_items_pkey primary key (id),
  constraint invoice_items_invoice_id_fkey foreign key (invoice_id) references invoices (id) on delete cascade,
  constraint invoice_items_product_id_fkey foreign key (product_id) references products (id) on delete restrict
) TABLESPACE pg_default;
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `src/app/` - Next.js app directory
- `src/components/` - Reusable components
- `src/lib/` - Utility functions and configurations
- `src/types/` - TypeScript type definitions

## Features

### Products
- Create, read, update, and delete products
- Set purchase and selling prices
- Track product inventory

### Invoices
- Create new invoices with multiple items
- Add purchase order numbers to items
- Calculate total amounts and profits
- Generate PDF invoices
- Track invoice status (draft, sent, paid)

### PDF Generation
- Generate professional PDF invoices
- Include company and customer details
- List all items with quantities and prices
- Show totals and payment information

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
