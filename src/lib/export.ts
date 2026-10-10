import type { Customer, LedgerEntry } from "./ledger/types"
import { formatCurrency, formatDate } from "./utils"

export function exportCustomerLedgerToExcel(
  customer: Customer,
  ledgerEntries: LedgerEntry[],
  totalSales: number,
  totalPaid: number,
  outstanding: number,
  businessName = "Saree Collections",
) {
  const dateStr = formatDate(new Date())

  // Build CSV content with UTF-8 BOM so Excel opens it with proper formatting and currency symbols
  const lines: string[] = []

  // Header section
  lines.push(`"${businessName} - CUSTOMER STATEMENT"`)
  lines.push(`"Customer Name:", "${customer.name}"`)
  lines.push(`"Phone:", "${customer.phone || 'N/A'}"`)
  lines.push(`"Address:", "${customer.address || 'N/A'}"`)
  lines.push(`"Statement Date:", "${dateStr}"`)
  lines.push(`"Total Purchases:", "${formatCurrency(totalSales)}"`)
  lines.push(`"Total Paid:", "${formatCurrency(totalPaid)}"`)
  lines.push(`"Outstanding Due:", "${formatCurrency(outstanding)}"`)
  lines.push("") // Blank line

  // Table headers
  lines.push(
    [
      '"Date"',
      '"Transaction Type"',
      '"Particulars / Saree Description"',
      '"Bill / Ref No"',
      '"Debit (₹ Added)"',
      '"Credit (₹ Paid)"',
      '"Running Balance (₹ Due)"',
    ].join(","),
  )

  // Transactions rows
  for (const entry of ledgerEntries) {
    const row = [
      `"${formatDate(entry.dateISO)}"`,
      `"${entry.type}"`,
      `"${entry.description.replace(/"/g, '""')}"`,
      `"${entry.reference || ''}"`,
      entry.debit > 0 ? `"${entry.debit.toFixed(2)}"` : '""',
      entry.credit > 0 ? `"${entry.credit.toFixed(2)}"` : '""',
      `"${entry.balance.toFixed(2)}"`,
    ]
    lines.push(row.join(","))
  }

  lines.push("")
  lines.push(`"TOTAL SUMMARY"`)
  lines.push(`"Total Saree Purchases", "", "", "", "${totalSales.toFixed(2)}", "", ""`)
  lines.push(`"Total Collections Paid", "", "", "", "", "${totalPaid.toFixed(2)}", ""`)
  lines.push(`"CURRENT REMAINING BALANCE", "", "", "", "", "", "${outstanding.toFixed(2)}"`)

  const csvString = "\uFEFF" + lines.join("\r\n")
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const safeName = customer.name.replace(/[^a-zA-Z0-9]/g, "_")
  const filename = `${safeName}_Ledger_Statement_${new Date().toISOString().split("T")[0]}.csv`

  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportPeriodReportToCSV(
  startDate: string,
  endDate: string,
  sales: Array<{
    billNumber: string
    date: string
    customerName: string
    sareeName: string
    amount: number
  }>,
  payments: Array<{
    date: string
    customerName: string
    method: string
    amount: number
    notes: string
  }>,
  totalSales: number,
  totalCollections: number,
  businessName = "Saree Collections",
) {
  const lines: string[] = []

  lines.push(`"${businessName} - SALES & COLLECTIONS REPORT"`)
  lines.push(`"Period:", "${formatDate(startDate)} to ${formatDate(endDate)}"`)
  lines.push(`"Total Sales:", "${formatCurrency(totalSales)}"`)
  lines.push(`"Total Collections:", "${formatCurrency(totalCollections)}"`)
  lines.push("")

  lines.push('"--- SALES IN THIS PERIOD ---"')
  lines.push(['"Bill No"', '"Date"', '"Customer"', '"Saree Details"', '"Sale Amount (₹)"'].join(","))
  for (const s of sales) {
    lines.push([
      `"${s.billNumber}"`,
      `"${formatDate(s.date)}"`,
      `"${s.customerName.replace(/"/g, '""')}"`,
      `"${s.sareeName.replace(/"/g, '""')}"`,
      `"${s.amount.toFixed(2)}"`,
    ].join(","))
  }

  lines.push("")
  lines.push('"--- PAYMENTS RECEIVED IN THIS PERIOD ---"')
  lines.push(['"Date"', '"Customer"', '"Payment Mode"', '"Amount Received (₹)"', '"Notes"'].join(","))
  for (const p of payments) {
    lines.push([
      `"${formatDate(p.date)}"`,
      `"${p.customerName.replace(/"/g, '""')}"`,
      `"${p.method}"`,
      `"${p.amount.toFixed(2)}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
    ].join(","))
  }

  const csvString = "\uFEFF" + lines.join("\r\n")
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const filename = `Period_Report_${startDate}_to_${endDate}.csv`

  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
