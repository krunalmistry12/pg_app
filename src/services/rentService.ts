// api/rentService.ts
import axios from "axios";

export const generateMonthlyRent = async (month: number, year: number) => {
  try {
    const response = await axios.post(
      `/api/rent/generate-rent?month=${month}&year=${year}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
