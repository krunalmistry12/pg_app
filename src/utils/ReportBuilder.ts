// ReportBuilder.ts

export interface ReportItem {
  id: string;
  primaryText: string;
  secondaryText: string;
  amountOrContact: string;
  statusOrMeta: string;
}

export interface ReportConfig {
  branch: string;
  month: string; // <-- Updated from startDate/endDate to single month field
  generatedBy: string;
  reportType: "rent" | "expense" | "tenants";
}

export class ReportData {
  static getReportTitle(type: "rent" | "expense" | "tenants"): string {
    switch (type) {
      case "rent":
        return "Monthly Rent Collection & Ledger Statement";
      case "expense":
        return "Utility Bills & Maintenance Expense Statement";
      case "tenants":
        return "Active Occupants & Tenants Directory";
    }
  }

  static getSummaryMeta(type: "rent" | "expense" | "tenants") {
    switch (type) {
      case "rent":
        return {
          totalLabel: "Total Rooms Managed",
          totalVal: "24",
          secondaryLabel: "Occupancy Rate",
          secondaryVal: "92%",
        };
      case "expense":
        return {
          totalLabel: "Total Recorded Expenses",
          totalVal: "₹34,500",
          secondaryLabel: "Pending Approvals",
          secondaryVal: "0",
        };
      case "tenants":
        return {
          totalLabel: "Total Active Tenants",
          totalVal: "22",
          secondaryLabel: "Vacant Beds",
          secondaryVal: "2",
        };
    }
  }

  static getTableHeaders(type: "rent" | "expense" | "tenants"): string[] {
    switch (type) {
      case "rent":
        return ["Tenant Name", "Room No", "Rent Amount", "Payment Status"];
      case "expense":
        return ["Expense Category", "Vendor / Description", "Amount"];
      case "tenants":
        return ["Tenant Name", "Room No", "Contact Number", "Status"];
    }
  }

  static getTableRows(type: "rent" | "expense" | "tenants"): ReportItem[] {
    switch (type) {
      case "rent":
        return [
          {
            id: "1",
            primaryText: "Rahul Sharma",
            secondaryText: "Room 101-A",
            amountOrContact: "₹6,500",
            statusOrMeta: "PAID",
          },
          {
            id: "2",
            primaryText: "Aman Patel",
            secondaryText: "Room 102-B",
            amountOrContact: "₹7,000",
            statusOrMeta: "PENDING",
          },
          {
            id: "3",
            primaryText: "Vikas Verma",
            secondaryText: "Room 201-A",
            amountOrContact: "₹6,500",
            statusOrMeta: "PAID",
          },
        ];
      case "expense":
        return [
          {
            id: "1",
            primaryText: "Electricity Bill",
            secondaryText: "MSEB Power Board",
            amountOrContact: "₹12,400",
            statusOrMeta: "Paid",
          },
          {
            id: "2",
            primaryText: "High-speed Wi-Fi",
            secondaryText: "Jio Fiber Lease",
            amountOrContact: "₹2,499",
            statusOrMeta: "Paid",
          },
        ];
      case "tenants":
        return [
          {
            id: "1",
            primaryText: "Rahul Sharma",
            secondaryText: "Room 101-A",
            amountOrContact: "+91 98765 43210",
            statusOrMeta: "Active",
          },
          {
            id: "2",
            primaryText: "Aman Patel",
            secondaryText: "Room 102-B",
            amountOrContact: "+91 91234 56789",
            statusOrMeta: "Active",
          },
        ];
    }
  }
}

export class ReportFormatter {
  static generateHTML(config: ReportConfig): string {
    const title = ReportData.getReportTitle(config.reportType);
    const meta = ReportData.getSummaryMeta(config.reportType);
    const headers = ReportData.getTableHeaders(config.reportType);
    const rows = ReportData.getTableRows(config.reportType);

    const tableHeadersHTML = headers.map((h) => `<th>${h}</th>`).join("");

    const tableRowsHTML = rows
      .map((row) => {
        if (config.reportType === "rent") {
          const isPaid = row.statusOrMeta === "PAID";
          const badgeClass = isPaid ? "status-paid" : "status-pending";
          return `
          <tr>
            <td><b>${row.primaryText}</b></td>
            <td>${row.secondaryText}</td>
            <td>${row.amountOrContact}</td>
            <td><span class="${badgeClass}">${row.statusOrMeta}</span></td>
          </tr>
        `;
        } else if (config.reportType === "expense") {
          return `
          <tr>
            <td><b>${row.primaryText}</b></td>
            <td>${row.secondaryText}</td>
            <td><b>${row.amountOrContact}</b></td>
          </tr>
        `;
        } else {
          return `
          <tr>
            <td><b>${row.primaryText}</b></td>
            <td>${row.secondaryText}</td>
            <td>${row.amountOrContact}</td>
            <td><span class="status-active">${row.statusOrMeta}</span></td>
          </tr>
        `;
        }
      })
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #1E293B; background: #FFF; }
            .brand-header { border-bottom: 2px solid #2563EB; padding-bottom: 15px; margin-bottom: 20px; }
            .company-name { font-size: 22px; font-weight: 800; color: #1E293B; margin: 0; }
            .report-title { font-size: 14px; font-weight: 600; color: #2563EB; margin-top: 4px; }
            .meta-badge { font-size: 12px; color: #64748B; margin-top: 5px; }
            .summary-box { background: #F8FAFC; padding: 12px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #E2E8F0; font-size: 13px; color: #475569; }
            .summary-val { font-weight: 700; color: #0F172A; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th { background: #1E293B; color: #FFFFFF; text-align: left; padding: 10px; font-weight: 600; text-transform: uppercase; }
            td { border-bottom: 1px solid #E2E8F0; padding: 10px; color: #334155; }
            tr:nth-child(even) { background-color: #F8FAFC; }
            .status-paid { color: #059669; background: #ECFDF5; padding: 3px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; }
            .status-pending { color: #DC2626; background: #FEF2F2; padding: 3px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; }
            .status-active { color: #2563EB; background: #EFF6FF; padding: 3px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; }
            .footer { margin-top: 30px; font-size: 11px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 10px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="brand-header">
            <div class="company-name">${config.branch}</div>
            <div class="report-title">${title}</div>
            <div class="meta-badge">Report Period (Month): ${config.month}</div>
          </div>
          <div class="summary-box">
            <div>${meta.totalLabel}: <span class="summary-val">${meta.totalVal}</span></div>
            <div>${meta.secondaryLabel}: <span class="summary-val">${meta.secondaryVal}</span></div>
            <div>Admin In-Charge: <span class="summary-val">${config.generatedBy}</span></div>
          </div>
          <table>
            <thead><tr>${tableHeadersHTML}</tr></thead>
            <tbody>${tableRowsHTML}</tbody>
          </table>
          <div class="footer">Generated via Kunal PG Management System • Page 1 of 1</div>
        </body>
      </html>
    `;
  }
}
