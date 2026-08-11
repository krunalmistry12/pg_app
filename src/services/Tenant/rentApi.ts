import api from "../api";

export interface BillItem {
  id: number | string;
  rentId?: number;
  month: number;
  year: number;
  totalAmount?: number;
  amount?: number;
  status: string;
}

export interface PaymentHistoryItem {
  id: number | string;
  amountPaid: number;
  paymentMode: string;
  transactionId: string;
  paymentDate: string;
  remarks: string;
  status?: string;
}

export interface RecordPaymentPayload {
  rentId: number;
  amountPaid: number;
  paymentMode: string;
  transactionId: string;
  remarks: string;
}

export const rentApi = {
  async getPendingBills(): Promise<BillItem[]> {
    const response = await api.get("/Rent/tenant/my-pending-bills");
    const data = response.data?.data || response.data || [];
    return Array.isArray(data) ? data : [];
  },

  async getPaymentHistory(): Promise<PaymentHistoryItem[]> {
    const response = await api.get("/Rent/tenant/my-payment-history");
    const data = response.data?.data || response.data || [];
    return Array.isArray(data) ? data : [];
  },

  async recordPayment(payload: RecordPaymentPayload): Promise<any> {
    const response = await api.post("/Rent/record-payment", payload);
    return response.data;
  },
};
