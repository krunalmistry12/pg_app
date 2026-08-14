export interface ReportOptions {
  branch: string;
  month: string;
  generatedBy: string;
  reportType: "rent" | "expense" | "tenants";
  detailed: boolean;
  watermark: boolean;
  subFilter?: "all" | "active" | "notice" | "defaulters";
  tableData?: any[];
}

export class ReportFormatter {
  static generateHTML(options: ReportOptions): string {
    const {
      branch,
      month,
      generatedBy,
      reportType,
      detailed,
      watermark,
      subFilter,
      tableData = [],
    } = options;

    // --- Yahan par aap check kar sakte hain ki API se kya data aa raha hai ---
    console.log("--- REPORT FORMATTER DEBUG ---");
    console.log("Report Type:", reportType);
    console.log("Received tableData:", tableData);
    console.log("Total Records Count:", tableData.length);
    console.log("------------------------------");

    const moduleConfig = {
      rent: {
        title: "RENT ROLL & COLLECTION AUDIT",
        color: "#1E3A8A",
        badgeBg: "#DBEAFE",
      },
      expense: {
        title: "OPERATIONAL EXPENSE STATEMENT",
        color: "#0369A1",
        badgeBg: "#E0F2FE",
      },
      tenants: {
        title: `TENANT DIRECTORY (${subFilter?.toUpperCase() || "ALL"})`,
        color: "#047857",
        badgeBg: "#D1FAE5",
      },
    };

    const currentConfig = moduleConfig[reportType];

    const renderEmptyRow = (colSpan: number, message: string) => `
      <tr>
        <td colspan="${colSpan}" style="text-align: center; padding: 20px; color: #6B7280; font-style: italic;">
          ${message}
        </td>
      </tr>
    `;

    // Calculate dynamic totals for numeric columns
    const calculateTotal = (key: string) => {
      return tableData.reduce((acc, row) => {
        const val = parseFloat(String(row[key]).replace(/[^0-9.-]+/g, ""));
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
    };

    const totalRentAmount =
      reportType === "rent" ? calculateTotal("amount") : 0;
    const totalExpenseAmount =
      reportType === "expense" ? calculateTotal("amount") : 0;
    const totalDepositAmount =
      reportType === "tenants" ? calculateTotal("deposit") : 0;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${currentConfig.title}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1F2937;
            background-color: #FFFFFF;
            padding: 35px;
            font-size: 12px;
            line-height: 1.5;
            position: relative;
          }
          .watermark-layer {
            position: absolute;
            top: 30%;
            left: 5%;
            width: 90%;
            text-align: center;
            font-size: 56px;
            color: rgba(156, 163, 175, 0.14);
            transform: rotate(-25deg);
            font-weight: 900;
            z-index: 9999;
            pointer-events: none;
            letter-spacing: 6px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #E5E7EB;
            padding-bottom: 18px;
            margin-bottom: 25px;
          }
          .company-info h1 { font-size: 18px; font-weight: 800; color: #111827; }
          .company-info p { font-size: 11px; color: #6B7280; margin-top: 3px; }
          .report-badge {
            background-color: ${currentConfig.badgeBg};
            color: ${currentConfig.color};
            padding: 6px 14px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            background: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 6px;
            padding: 12px 16px;
            margin-bottom: 25px;
          }
          .meta-item label { display: block; font-size: 9px; text-transform: uppercase; color: #6B7280; font-weight: 700; }
          .meta-item span { font-size: 12px; font-weight: 600; color: #111827; margin-top: 2px; display: block; }
          .kpi-container { display: flex; gap: 12px; margin-bottom: 25px; }
          .kpi-card {
            flex: 1;
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-left: 4px solid ${currentConfig.color};
            border-radius: 6px;
            padding: 12px 14px;
          }
          .kpi-label { font-size: 9px; color: #64748B; text-transform: uppercase; font-weight: 700; }
          .kpi-value { font-size: 15px; font-weight: 800; color: #0F172A; margin-top: 3px; }
          h3 { font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 10px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          th {
            background-color: #F1F5F9;
            color: #334155;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            padding: 10px 12px;
            text-align: left;
            border-bottom: 2px solid #CBD5E1;
          }
          td { padding: 11px 12px; font-size: 11px; color: #334155; border-bottom: 1px solid #E2E8F0; }
          tr:nth-child(even) { background-color: #F8FAFC; }
          .total-row {
            background-color: #F1F5F9 !important;
            font-weight: 700;
            border-top: 2px solid #CBD5E1;
          }
          .badge-success { background-color: #DCFCE7; color: #166534; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 10px; }
          .badge-pending { background-color: #FEF3C7; color: #92400E; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 10px; }
          .signatory-section { margin-top: 40px; display: flex; justify-content: flex-end; }
          .signatory-box { text-align: center; width: 200px; }
          .signature-line { border-bottom: 1px solid #9CA3AF; margin-bottom: 6px; padding-bottom: 25px; }
          .signatory-title { font-size: 11px; font-weight: 700; color: #374151; }
          .signatory-sub { font-size: 9px; color: #6B7280; margin-top: 2px; }
          .footer {
            margin-top: 30px;
            border-top: 1px solid #E5E7EB;
            padding-top: 12px;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #9CA3AF;
          }
        </style>
      </head>
      <body>

        ${watermark ? `<div class="watermark-layer">CONFIDENTIAL • PG MANAGEMENT</div>` : ""}

        <div class="header">
          <div class="company-info">
            <h1>PG Management Enterprise Hub</h1>
            <p>Automated Property Operations & Financial Intelligence</p>
          </div>
          <div>
            <div class="report-badge">${currentConfig.title}</div>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <label>Selected Flat / Branch</label>
            <span>${branch}</span>
          </div>
          <div class="meta-item">
            <label>Duration / Date Range</label>
            <span>${month}</span>
          </div>
          <div class="meta-item">
            <label>Generated By</label>
            <span>${generatedBy}</span>
          </div>
        </div>

        <div class="kpi-container">
          <div class="kpi-card">
            <div class="kpi-label">Total Records Logged</div>
            <div class="kpi-value">${tableData.length} Entries</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Audit Verification</div>
            <div class="kpi-value" style="color: #047857;">Verified</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Module Type</div>
            <div class="kpi-value" style="text-transform: uppercase;">${reportType}</div>
          </div>
        </div>

        ${
          reportType === "rent"
            ? `
          <h3>Rent Roll Itemized Ledger</h3>
          <table>
            <thead>
              <tr>
                <th>Receipt ID</th>
                <th>Tenant Name</th>
                <th>Flat / Bed Details</th>
                <th>Mode</th>
                <th>Status</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${
                tableData.length > 0
                  ? tableData
                      .map(
                        (row: any) => `
                    <tr>
                      <td>${row.id}</td>
                      <td>${row.tenantName}</td>
                      <td>${row.flatDetails}</td>
                      <td>${row.paymentMode}</td>
                      <td><span class="badge-success">${row.status}</span></td>
                      <td style="text-align: right; font-weight: 700;">${row.amount}</td>
                    </tr>
                  `,
                      )
                      .join("") +
                    `
                    <tr class="total-row">
                      <td colspan="5" style="text-align: right; text-transform: uppercase;">Total Rent Collection:</td>
                      <td style="text-align: right;">${totalRentAmount.toLocaleString()}</td>
                    </tr>
                  `
                  : renderEmptyRow(6, "No rent records found for this period.")
              }
            </tbody>
          </table>
        `
            : reportType === "expense"
              ? `
          <h3>Operational Expense Log</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Branch / Flat</th>
                <th style="text-align: right;">Expense Amount</th>
              </tr>
            </thead>
            <tbody>
              ${
                tableData.length > 0
                  ? tableData
                      .map(
                        (row: any) => `
                    <tr>
                      <td>${row.date}</td>
                      <td>${row.category}</td>
                      <td>${row.description}</td>
                      <td>${row.branchName}</td>
                      <td style="text-align: right; font-weight: 700;">${row.amount}</td>
                    </tr>
                  `,
                      )
                      .join("") +
                    `
                    <tr class="total-row">
                      <td colspan="4" style="text-align: right; text-transform: uppercase;">Total Expenses:</td>
                      <td style="text-align: right;">${totalExpenseAmount.toLocaleString()}</td>
                    </tr>
                  `
                  : renderEmptyRow(5, "No expense logs recorded.")
              }
            </tbody>
          </table>
        `
              : `
          <h3>Active Tenant Directory (${subFilter?.toUpperCase() || "ALL"})</h3>
          <table>
            <thead>
              <tr>
                <th>Tenant Name</th>
                <th>Contact Number</th>
                <th>Assigned Flat & Bed</th>
                <th>Status</th>
                <th style="text-align: right;">Deposit Amount</th>
              </tr>
            </thead>
            <tbody>
              ${
                tableData.length > 0
                  ? tableData
                      .map(
                        (row: any) => `
                    <tr>
                      <td>${row.name}</td>
                      <td>${row.phone}</td>
                      <td>${row.flat}</td>
                      <td><span class="${String(row.status).toLowerCase().includes("active") ? "badge-success" : "badge-pending"}">${row.status}</span></td>
                      <td style="text-align: right; font-weight: 700;">${row.deposit}</td>
                    </tr>
                  `,
                      )
                      .join("") +
                    `
                    <tr class="total-row">
                      <td colspan="4" style="text-align: right; text-transform: uppercase;">Total Security Deposit:</td>
                      <td style="text-align: right;">${totalDepositAmount.toLocaleString()}</td>
                    </tr>
                  `
                  : renderEmptyRow(5, "No tenant records found.")
              }
            </tbody>
          </table>
        `
        }

        <div class="signatory-section">
          <div class="signatory-box">
            <div class="signature-line"></div>
            <div class="signatory-title">Authorized Signatory</div>
            <div class="signatory-sub">PG Management System</div>
          </div>
        </div>

        <div class="footer">
          <span>Confidential Business Document • Generated via PG Management App</span>
          <span>Timestamp: ${new Date().toLocaleString()}</span>
        </div>

      </body>
      </html>
    `;
  }
}
