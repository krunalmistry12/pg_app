// api/rentService.ts
import api from "./api";

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
