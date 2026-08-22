import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert, Linking } from "react-native";
import api from "./api";
import { getDashboardDataApi } from "./dashboardApi";

export interface ReceiptData {
  rentId: string;
  tenantName: string;
  tenantPhone?: string;
  amountPaid: number;
  paymentMode: string;
  transactionId?: string;
  apartmentName?: string;
  roomNumber?: string;
  month: string;
  year: string;
  receiptNumber: string;
  paymentDate: string;
  pgName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

// Helper to convert number to words (Indian numbering system)
function numberToWords(num: number): string {
  if (isNaN(num) || num === 0) return "Zero Only";

  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertLessThanThousand(n: number): string {
    if (n === 0) return "";
    if (n < 20) return a[n];
    if (n < 100)
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : " ");
    return (
      a[Math.floor(n / 100)] + "Hundred " + convertLessThanThousand(n % 100)
    );
  }

  let n = Math.floor(num);
  let str = "";

  if (n >= 10000000) {
    str += convertLessThanThousand(Math.floor(n / 10000000)) + "Crore ";
    n %= 10000000;
  }
  if (n >= 100000) {
    str += convertLessThanThousand(Math.floor(n / 100000)) + "Lakh ";
    n %= 100000;
  }
  if (n >= 1000) {
    str += convertLessThanThousand(Math.floor(n / 1000)) + "Thousand ";
    n %= 1000;
  }
  if (n > 0) {
    str += convertLessThanThousand(n);
  }

  return `Rupees ${str.trim()} Only`;
}

export class ReceiptFormatter {
  static generateHTML(details: {
    receiptNumber: string;
    paymentDate: string;
    monthYear: string;
    tenantName: string;
    tenantPhone?: string;
    apartmentName?: string;
    roomNumber: string;
    paymentMode: string;
    transactionId?: string;
    amountPaid: number;
    remarks?: string;
    isDuplicate?: boolean;
    pgName?: string;
    phone?: string;
    email?: string;
    address?: string;
  }): string {
    const {
      receiptNumber,
      paymentDate,
      monthYear,
      tenantName,
      tenantPhone,
      apartmentName,
      roomNumber,
      paymentMode,
      transactionId,
      amountPaid,
      remarks,
      isDuplicate = false,
      pgName,
      phone = "",
      email = "",
      address = "",
    } = details;

    const finalPgName =
      pgName && pgName.trim() !== "" ? pgName : "PG Management Enterprise Hub";
    const amountInWords = numberToWords(amountPaid);

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>Rent Payment Receipt</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
              color: #1F2937; 
              background-color: #FFFFFF;
              padding: 35px;
              font-size: 11px;
              line-height: 1.5;
            }
            .header {
              width: 100%;
              border-bottom: 2px solid #111827;
              padding-bottom: 15px;
              margin-bottom: 20px;
              display: table;
            }
            .header-left {
              display: table-cell;
              width: 65%;
              vertical-align: top;
            }
            .header-right {
              display: table-cell;
              width: 35%;
              vertical-align: top;
              text-align: right;
            }
            .company-info h1 { font-size: 18px; font-weight: 800; color: #111827; letter-spacing: 0.3px; }
            .company-info .address { font-size: 10px; color: #4B5563; margin-top: 4px; line-height: 1.4; }
            .company-info .contact { font-size: 10px; color: #4B5563; margin-top: 3px; }
            
            .receipt-title { font-size: 14px; font-weight: 800; color: #1E3A8A; text-transform: uppercase; letter-spacing: 0.5px; }
            .report-badge {
              background-color: #DEF7EC;
              color: #03543F;
              padding: 4px 8px;
              border-radius: 4px;
              font-weight: 700;
              font-size: 9px;
              text-transform: uppercase;
              display: inline-block;
              margin-top: 6px;
              letter-spacing: 0.5px;
            }

            .meta-grid {
              width: 100%;
              border-collapse: collapse;
              background: #F9FAFB;
              border: 1px solid #E5E7EB;
              margin-bottom: 18px;
              border-radius: 4px;
            }
            .meta-grid td {
              width: 50%;
              padding: 10px 14px;
              border: 1px solid #E5E7EB;
              vertical-align: top;
            }
            .meta-item-label { display: block; font-size: 8px; text-transform: uppercase; color: #6B7280; font-weight: 700; letter-spacing: 0.5px; }
            .meta-item-val { font-size: 11px; font-weight: 600; color: #111827; margin-top: 2px; display: block; }
            
            .section-heading { font-size: 11px; font-weight: 700; color: #374151; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px; }
            
            table.data-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 15px; 
              table-layout: fixed;
            }
            table.data-table th {
              background-color: #F3F4F6;
              color: #374151;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              padding: 9px 12px;
              text-align: left;
              border: 1px solid #D1D5DB;
              width: 32%;
            }
            table.data-table td { 
              padding: 9px 12px; 
              font-size: 11px; 
              color: #1F2937; 
              border: 1px solid #D1D5DB;
              width: 68%;
              word-wrap: break-word;
            }
            table.data-table tr:nth-child(even) { background-color: #FAFAFA; }
            
            .amount-words-box {
              background-color: #EFF6FF;
              border: 1px solid #BFDBFE;
              padding: 10px 14px;
              border-radius: 4px;
              margin-bottom: 20px;
            }
            .amount-words-label { font-size: 9px; font-weight: 700; color: #1E40AF; text-transform: uppercase; }
            .amount-words-val { font-size: 11px; font-weight: 700; color: #1E3A8A; margin-top: 2px; }

            .signatory-section { margin-top: 35px; width: 100%; display: table; }
            .signatory-left { display: table-cell; width: 60%; vertical-align: bottom; font-size: 9px; color: #6B7280; }
            .signatory-right { display: table-cell; width: 40%; vertical-align: top; text-align: right; }
            .signatory-box { display: inline-block; text-align: center; width: 180px; }
            .signature-line { border-bottom: 1px solid #9CA3AF; margin-bottom: 5px; padding-bottom: 25px; }
            .signatory-title { font-size: 10px; font-weight: 700; color: #374151; }
            .signatory-sub { font-size: 8px; color: #6B7280; }
            
            .footer {
              margin-top: 30px;
              border-top: 1px solid #E5E7EB;
              padding-top: 10px;
              display: table;
              width: 100%;
              font-size: 9px;
              color: #9CA3AF;
            }
            .footer-left { display: table-cell; text-align: left; }
            .footer-right { display: table-cell; text-align: right; }
          </style>
        </head>
        <body>

          <div class="header">
            <div class="header-left">
              <div class="company-info">
                <h1>${finalPgName}</h1>
                ${address ? `<div class="address">${address}</div>` : ""}
                ${
                  phone || email
                    ? `
                  <div class="contact">
                    ${phone ? `Phone: ${phone}` : ""}
                    ${phone && email ? ` • ` : ""}
                    ${email ? `Email: ${email}` : ""}
                  </div>
                `
                    : ""
                }
              </div>
            </div>
            <div class="header-right">
              <div class="receipt-title">Rent Receipt</div>
              <div><span class="report-badge">STATUS: PAID ${isDuplicate ? "(DUPLICATE COPY)" : ""}</span></div>
            </div>
          </div>

          <table class="meta-grid">
            <tr>
              <td>
                <span class="meta-item-label">Receipt Number</span>
                <span class="meta-item-val">${receiptNumber}</span>
              </td>
              <td>
                <span class="meta-item-label">Billing Period / Month</span>
                <span class="meta-item-val">${monthYear}</span>
              </td>
            </tr>
            <tr>
              <td>
                <span class="meta-item-label">Payment Date</span>
                <span class="meta-item-val">${new Date(paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
              </td>
              <td>
                <span class="meta-item-label">Payment Status</span>
                <span class="meta-item-val" style="color: #047857;">Verified & Completed</span>
              </td>
            </tr>
          </table>

          <div class="section-heading">Transaction Breakdown</div>
          <table class="data-table">
            <tr>
              <th>Tenant Name</th>
              <td>${tenantName} ${tenantPhone ? `(${tenantPhone})` : ""}</td>
            </tr>
            <tr>
              <th>Property / Accommodation</th>
              <td>${apartmentName || "PG Property"} — Room No: ${roomNumber}</td>
            </tr>
            <tr>
              <th>Payment Mode</th>
              <td>${paymentMode}</td>
            </tr>
            <tr>
              <th>Transaction Reference ID</th>
              <td>${transactionId || "N/A"}</td>
            </tr>
            ${remarks ? `<tr><th>Remarks</th><td>${remarks}</td></tr>` : ""}
            <tr style="background-color: #F0FDF4 !important;">
              <th style="text-align: right; color: #166534;">Total Amount Paid:</th>
              <td style="font-size: 13px; font-weight: 800; color: #15803D;">₹${Number(amountPaid || 0).toLocaleString()}</td>
            </tr>
          </table>

          <div class="amount-words-box">
            <div class="amount-words-label">Amount in Words</div>
            <div class="amount-words-val">${amountInWords}</div>
          </div>

          <div class="signatory-section">
            <div class="signatory-left">
              <div>Note: This is a system-generated electronic receipt valid without physical signature for digital rental reporting.</div>
            </div>
            <div class="signatory-right">
              <div class="signatory-box">
                <div class="signature-line"></div>
                <div class="signatory-title">Authorized Signatory</div>
                <div class="signatory-sub">${finalPgName}</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="footer-left">Generated via PG Management Hub</div>
            <div class="footer-right">Timestamp: ${new Date().toLocaleString()}</div>
          </div>

        </body>
      </html>
    `;
  }
}

// Helper function to dynamically fetch admin/PG details
async function getResolvedAdminConfig(passedConfig?: {
  pgName?: string;
  phone?: string;
  email?: string;
  address?: string;
}) {
  let pgName = passedConfig?.pgName;
  let phone = passedConfig?.phone;
  let email = passedConfig?.email;
  let address = passedConfig?.address;

  if (!pgName || !address || !phone) {
    try {
      const storedData = await AsyncStorage.getItem("@admin_profile");
      if (storedData) {
        const parsed = JSON.parse(storedData);
        pgName = pgName || parsed.pgName || parsed.name || parsed.companyName;
        phone = phone || parsed.phone || parsed.mobile;
        email = email || parsed.email;
        address =
          address ||
          parsed.address ||
          parsed.pgAddress ||
          parsed.location ||
          parsed.street;
      }
    } catch (e) {
      console.log("Error reading profile cache:", e);
    }
  }

  if (!pgName || !address) {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        const dashboardData = (await getDashboardDataApi(userId)) as any;
        pgName =
          pgName ||
          dashboardData?.pgName ||
          dashboardData?.companyName ||
          dashboardData?.name;
        phone = phone || dashboardData?.phone || dashboardData?.mobile;
        email = email || dashboardData?.email;
        address =
          address ||
          dashboardData?.address ||
          dashboardData?.pgAddress ||
          dashboardData?.location ||
          dashboardData?.street ||
          dashboardData?.fullAddress;
      }
    } catch (e) {
      console.log("Error fetching fallback dashboard data:", e);
    }
  }

  return {
    pgName: pgName || "PG Management Enterprise Hub",
    phone: phone || "",
    email: email || "",
    address: address || "",
  };
}

// ✅ EXPLICIT EXPORT ADDED HERE
export const pdfReceiptService = {
  async recordAndGeneratePDF(
    data: ReceiptData,
    adminConfig?: {
      pgName?: string;
      phone?: string;
      email?: string;
      address?: string;
    },
  ) {
    try {
      const response = await api.post("/Rent/record-payment", {
        rentId: data.rentId,
        amountPaid: data.amountPaid,
        paymentMode: data.paymentMode,
        transactionId: data.transactionId,
        receiptNumber: data.receiptNumber,
        remarks: `Rent paid for ${data.month} ${data.year}. PDF Receipt generated.`,
      });

      if (response?.data) {
        const config = await getResolvedAdminConfig({
          pgName: data.pgName || adminConfig?.pgName,
          phone: data.phone || adminConfig?.phone,
          email: data.email || adminConfig?.email,
          address: data.address || adminConfig?.address,
        });

        const htmlContent = ReceiptFormatter.generateHTML({
          receiptNumber: data.receiptNumber,
          paymentDate: data.paymentDate,
          monthYear: `${data.month} ${data.year}`,
          tenantName: data.tenantName,
          tenantPhone: data.tenantPhone,
          apartmentName: data.apartmentName,
          roomNumber: data.roomNumber || "N/A",
          paymentMode: data.paymentMode,
          transactionId: data.transactionId,
          amountPaid: data.amountPaid,
          remarks: `Rent paid for ${data.month} ${data.year}.`,
          isDuplicate: false,
          pgName: config.pgName,
          phone: config.phone,
          email: config.email,
          address: config.address,
        });

        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        return { success: true, pdfUri: uri };
      }
      return { success: false, error: "Failed to record payment on server." };
    } catch (error: any) {
      if (
        error?.code === "ERR_PRINT_CANCELLED" ||
        error?.message?.includes("did not complete")
      ) {
        return { success: false, cancelled: true };
      }
      return {
        success: false,
        error: error?.message || "Error generating PDF",
      };
    }
  },

  async previewPDF(
    payment: any,
    tenant: any,
    adminConfig?: {
      pgName?: string;
      phone?: string;
      email?: string;
      address?: string;
    },
  ) {
    try {
      const config = await getResolvedAdminConfig(
        adminConfig || {
          pgName: payment.pgName,
          phone: payment.phone,
          email: payment.email,
          address: payment.address,
        },
      );

      const htmlContent = ReceiptFormatter.generateHTML({
        receiptNumber: payment.receiptNumber || "REC-RECEIPT",
        paymentDate: payment.paymentDate,
        monthYear: `${tenant.month} ${tenant.year}`,
        tenantName: tenant.tenant,
        tenantPhone: tenant.phone,
        apartmentName: tenant.apartmentName,
        roomNumber: tenant.room || "N/A",
        paymentMode: payment.paymentMode || "CASH_OR_UPI",
        transactionId: payment.transactionId,
        amountPaid: payment.amountPaid,
        remarks: payment.remarks,
        isDuplicate: false,
        pgName: config.pgName,
        phone: config.phone,
        email: config.email,
        address: config.address,
      });

      await Print.printAsync({ html: htmlContent });
    } catch (error: any) {
      if (
        error?.code === "ERR_PRINT_CANCELLED" ||
        error?.message?.includes("did not complete")
      )
        return;
      Alert.alert("Error", "Could not preview PDF receipt.");
    }
  },

  async regenerateAndSharePDF(
    payment: any,
    tenant: any,
    adminConfig?: {
      pgName?: string;
      phone?: string;
      email?: string;
      address?: string;
    },
  ) {
    try {
      const config = await getResolvedAdminConfig(
        adminConfig || {
          pgName: payment.pgName,
          phone: payment.phone,
          email: payment.email,
          address: payment.address,
        },
      );

      const htmlContent = ReceiptFormatter.generateHTML({
        receiptNumber: payment.receiptNumber || "REC-DUPLICATE",
        paymentDate: payment.paymentDate,
        monthYear: `${tenant.month} ${tenant.year}`,
        tenantName: tenant.tenant,
        tenantPhone: tenant.phone,
        apartmentName: tenant.apartmentName,
        roomNumber: tenant.room || "N/A",
        paymentMode: payment.paymentMode || "CASH_OR_UPI",
        transactionId: payment.transactionId,
        amountPaid: payment.amountPaid,
        remarks: payment.remarks,
        isDuplicate: true,
        pgName: config.pgName,
        phone: config.phone,
        email: config.email,
        address: config.address,
      });

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await this.sharePDF(
        uri,
        tenant.phone,
        tenant.tenant,
        payment.amountPaid,
        tenant.month,
        config.pgName,
      );
    } catch (error: any) {
      Alert.alert("Error", "Could not generate PDF receipt.");
    }
  },

  async sharePDF(
    pdfUri: string,
    phone?: string,
    tenantName?: string,
    amount?: number,
    month?: string,
    pgName?: string,
  ) {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: "application/pdf",
          dialogTitle: "Share Rent Receipt PDF",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }

      if (phone) {
        const cleanPhone = phone.replace(/[^0-9]/g, "");
        const formattedPhone = cleanPhone.startsWith("91")
          ? `+${cleanPhone}`
          : `+91${cleanPhone}`;
        const companyLabel = pgName || "PG ADMIN HUB";
        const message = encodeURIComponent(
          `Hello ${tenantName}, your rent payment of ₹${amount?.toLocaleString()} for ${month} has been received. Please find your PDF receipt attached. - ${companyLabel}`,
        );
        setTimeout(() => {
          Linking.openURL(
            `https://wa.me/${formattedPhone}?text=${message}`,
          ).catch(() => {});
        }, 1000);
      }
    } catch (error) {
      console.error("Error sharing PDF:", error);
    }
  },
};
