import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert, Linking } from "react-native";
import api from "./api";

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
}

// Helper function to generate clean and professional HTML receipt
const generateReceiptHTML = (details: {
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
}) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            padding: 40px; 
            color: #1F2937; 
            background-color: #FFFFFF;
            margin: 0;
          }
          .invoice-box {
            max-width: 800px;
            margin: auto;
            border: 1px solid #E5E7EB;
            padding: 35px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
          }
          .header-table {
            width: 100%;
            border-bottom: 2px solid #4F46E5;
            padding-bottom: 20px;
            margin-bottom: 25px;
          }
          .header-table td {
            vertical-align: middle;
          }
          .brand { 
            font-size: 26px; 
            font-weight: 800; 
            color: #4F46E5; 
            letter-spacing: 0.5px;
          }
          .subtitle { 
            font-size: 13px; 
            color: #6B7280; 
            text-transform: uppercase; 
            letter-spacing: 1px;
            margin-top: 4px; 
          }
          .badge {
            background-color: #DEF7EC;
            color: #03543F;
            padding: 6px 14px;
            font-size: 12px;
            font-weight: bold;
            border-radius: 20px;
            text-align: center;
            display: inline-block;
          }
          .meta-section {
            width: 100%;
            margin-bottom: 25px;
            background: #F9FAFB;
            padding: 15px 20px;
            border-radius: 8px;
            box-sizing: border-box;
          }
          .meta-section td {
            font-size: 14px;
            color: #374151;
            padding: 4px 0;
          }
          .table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 15px; 
          }
          .table th, .table td { 
            border: 1px solid #E5E7EB; 
            padding: 12px 15px; 
            text-align: left; 
            font-size: 14px;
          }
          .table th { 
            background-color: #F3F4F6; 
            color: #374151; 
            font-weight: 600;
            width: 30%;
          }
          .table td {
            color: #111827;
          }
          .total-container {
            margin-top: 30px;
            background: #F0FDF4;
            border: 1px solid #BBF7D0;
            padding: 15px 20px;
            border-radius: 8px;
            text-align: right;
          }
          .total-label {
            font-size: 14px;
            color: #166534;
            font-weight: 600;
          }
          .total-amount {
            font-size: 22px;
            font-weight: bold;
            color: #15803D;
            margin-top: 2px;
          }
          .footer { 
            margin-top: 45px; 
            text-align: center; 
            font-size: 11px; 
            color: #9CA3AF; 
            border-top: 1px solid #E5E7EB; 
            padding-top: 20px; 
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <table class="header-table">
            <tr>
              <td>
                <div class="brand">PG ADMIN HUB</div>
                <div class="title" style="font-size: 16px; font-weight: 600; color: #374151; margin-top: 4px;">
                  Official Rent Payment Receipt ${details.isDuplicate ? "(Copy)" : ""}
                </div>
              </td>
              <td style="text-align: right;">
                <div class="badge">PAID</div>
              </td>
            </tr>
          </table>

          <table class="meta-section">
            <tr>
              <td><strong>Receipt No:</strong> ${details.receiptNumber}</td>
              <td style="text-align: right;"><strong>Billing Period:</strong> ${details.monthYear}</td>
            </tr>
            <tr>
              <td><strong>Date:</strong> ${new Date(details.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
              <td style="text-align: right;"><strong>Status:</strong> Completed</td>
            </tr>
          </table>

          <table class="table">
            <tr>
              <th>Tenant Name</th>
              <td>${details.tenantName} ${details.tenantPhone ? `(${details.tenantPhone})` : ""}</td>
            </tr>
            <tr>
              <th>Property / Flat</th>
              <td>${details.apartmentName || "PG Property"} — Room/Flat: ${details.roomNumber}</td>
            </tr>
            <tr>
              <th>Payment Mode</th>
              <td>${details.paymentMode}</td>
            </tr>
            <tr>
              <th>Transaction ID</th>
              <td>${details.transactionId || "N/A"}</td>
            </tr>
            ${details.remarks ? `<tr><th>Remarks</th><td>${details.remarks}</td></tr>` : ""}
          </table>

          <div class="total-container">
            <div class="total-label">Total Amount Paid</div>
            <div class="total-amount">₹${Number(details.amountPaid || 0).toLocaleString()}</div>
          </div>

          <div class="footer">
            <p>This is a computer-generated digital receipt and does not require a physical signature or stamp.</p>
            <p>Thank you for your timely payment! For support, contact PG Admin Hub management.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

export const pdfReceiptService = {
  /**
   * 1. Backend me payment record karega aur PDF generate karega ("Mark Paid" ke liye)
   */
  /**
   * 1. Backend me payment record karega aur PDF generate karega ("Mark Paid" ke liye)
   */
  async recordAndGeneratePDF(data: ReceiptData) {
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
        const htmlContent = generateReceiptHTML({
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
        });

        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        return { success: true, pdfUri: uri };
      }
      return { success: false, error: "Failed to record payment on server." };
    } catch (error: any) {
      // Agar user ne print cancel kiya hai toh error ignore karein
      if (
        error?.code === "ERR_PRINT_CANCELLED" ||
        error?.message?.includes("did not complete")
      ) {
        console.log("Print operation was cancelled by the user.");
        return { success: false, cancelled: true };
      }
      console.error("PDF Generation Error:", error);
      return {
        success: false,
        error: error?.message || "Error generating PDF",
      };
    }
  },

  /**
   * 4. Direct device ka PDF preview/viewer open karein (History Modal "View")
   */
  async previewPDF(payment: any, tenant: any) {
    try {
      const htmlContent = generateReceiptHTML({
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
      });

      await Print.printAsync({ html: htmlContent });
    } catch (error: any) {
      // User cancellation ko safely handle karne ke liye
      if (
        error?.code === "ERR_PRINT_CANCELLED" ||
        error?.message?.includes("did not complete")
      ) {
        console.log("PDF Preview was cancelled by the user.");
        return;
      }
      console.error("Preview PDF Error:", error);
      Alert.alert("Error", "Could not preview PDF receipt.");
    }
  },
  /**
   * 2. Purane payment history item se dobara PDF generate karke share karne ke liye (History Modal "Share")
   */
  async regenerateAndSharePDF(payment: any, tenant: any) {
    try {
      const htmlContent = generateReceiptHTML({
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
      });

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await this.sharePDF(
        uri,
        tenant.phone,
        tenant.tenant,
        payment.amountPaid,
        tenant.month,
      );
    } catch (error: any) {
      console.error("Regenerate PDF Error:", error);
      Alert.alert("Error", "Could not generate PDF receipt.");
    }
  },

  /**
   * 3. PDF share karein (WhatsApp ya kisi bhi app par)
   */
  async sharePDF(
    pdfUri: string,
    phone?: string,
    tenantName?: string,
    amount?: number,
    month?: string,
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
        const message = encodeURIComponent(
          `Hello ${tenantName}, your rent payment of ₹${amount?.toLocaleString()} for ${month} has been received. Please find your PDF receipt attached. - PG ADMIN HUB`,
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
