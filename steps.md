# 🧭 Development Steps — Invoice Generator App

> Cursor AI must read and follow these steps strictly and in order.

---

## STEP 1: Setup Project
- Initialize Next.js app
- Install Tailwind CSS and configure
- Setup Supabase client (auth + database connection)

---

## STEP 2: Auth (Login Page)
- Build login page (email/password using Supabase Auth)
- Redirect to dashboard after login
- Prevent unauthorized access to all other pages

---

## STEP 3: Product Management
- Create product listing page
- Add product form: name, purchase price, selling price
- Edit and delete functionality
- Store in Supabase table `products`

---

## STEP 4: Invoice Creation Page
- Create form with:
  - Invoice Number
  - Order Date
  - Print Date
- Product adder:
  - Search and dropdown selector
  - Quantity, P/O Number(s), auto-fill selling price
- Calculate total per item and grand total
- Button to save as draft
- Button to generate PDF
- Save invoice to Supabase table `invoices`

---

## STEP 5: Invoice History
- Show list of previously created invoices
- Include Edit button to reload into creation page
- Allow re-generating PDF

---

## STEP 6: PDF Generation
- Use html2pdf or jsPDF to generate invoice as PDF
- PDF should include:
  - Header info (invoice no, dates)
  - Table of products
  - Grand total
- Trigger download in browser

---

## STEP 7: Final Cleanup
- Add error handling and form validations
- Polish UI with Tailwind
- Test all flows (auth, CRUD, PDF)

---

✅ Do not skip any step. Each feature must be implemented fully and tested before moving on. 