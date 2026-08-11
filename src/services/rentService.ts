// api/rentService.ts
import api from "./api";

export interface RecordPaymentPayload {
  rentId: number | string;
  amountPaid: number;
  paymentMode: string;
  transactionId?: string;
  remarks?: string;
}

export const rentService = {
  // Get all rent records for admin with filters
  getAllRentRecords: async (params: {
    month?: number;
    year?: string;
    status?: number;
    search?: string;
  }) => {
    const response = await api.get("/Rent/admin/all-records", { params });
    return response.data;
  },

  // Record a payment against pending amount
  recordPayment: async (payload: RecordPaymentPayload) => {
    const response = await api.post("/Rent/record-payment", payload);
    return response.data;
  },

  // Generate monthly bill
  generateMonthlyRent: async (
    tenantId: number,
    month: number,
    year: number,
    endingMeterReading = 0,
    ratePerUnit = 0,
    extraCharges = 0,
    discount = 0,
  ) => {
    const response = await api.post("/Rent/generate-bill", {
      tenantId: Number(tenantId),
      month: Number(month),
      year: Number(year),
      endingMeterReading: Number(endingMeterReading),
      ratePerUnit: Number(ratePerUnit),
      extraCharges: Number(extraCharges),
      discount: Number(discount),
    });
    return response.data;
  },
};
export const generateMonthlyRent = async (
  tenantId: number,
  month: number,
  year: number,
  endingMeterReading = 0,
  ratePerUnit = 0,
  extraCharges = 0,
  discount = 0,
) => {
  try {
    const response = await api.post(
      "/api/Rent/generate-bill", // Backend ka exact correct endpoint
      {
        tenantId: Number(tenantId),
        month: Number(month),
        year: Number(year),
        endingMeterReading: Number(endingMeterReading),
        ratePerUnit: Number(ratePerUnit),
        extraCharges: Number(extraCharges),
        discount: Number(discount),
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
