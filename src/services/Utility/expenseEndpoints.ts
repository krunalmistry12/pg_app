import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api";

export const EXPENSE_ENDPOINTS = {
  getFlatsByUser: (userId: string) => `/Flats/user/${userId}`,
  getAllFlats: () => `/Flats`,
  expenses: () => `/Expenses`,
  expenseById: (id: string) => `/Expenses/${id}`,
};

export interface ExpensePayload {
  flatId: string;
  isCommonExpense: boolean;
  userId: string;
  title: string;
  category: string;
  amount: number;
  month: string;
  date: string;
  paymentMode: string;
  paidBy: string;
  status: string;
  receiptName: string;
  receiptUri: string;
  notes: string;
}

export const expenseService = {
  async fetchFlats() {
    try {
      const storedUserId = await AsyncStorage.getItem("userId");
      let flatList: any = [];

      if (storedUserId) {
        try {
          const response: any = await api.get(
            EXPENSE_ENDPOINTS.getFlatsByUser(storedUserId)
          );
          flatList = Array.isArray(response)
            ? response
            : Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response?.data?.data)
                ? response.data.data
                : (response?.data?.flats ?? []);
        } catch {
          try {
            const altResponse: any = await api.get(
              EXPENSE_ENDPOINTS.getAllFlats()
            );
            flatList = Array.isArray(altResponse)
              ? altResponse
              : Array.isArray(altResponse?.data)
                ? altResponse.data
                : Array.isArray(altResponse?.data?.data)
                  ? altResponse.data.data
                  : [];
          } catch {
            flatList = [];
          }
        }
      }

      if (!flatList || flatList.length === 0) {
        const cachedFlats = await AsyncStorage.getItem("flats_2bhk");
        if (cachedFlats) {
          flatList = JSON.parse(cachedFlats);
        }
      }

      if (Array.isArray(flatList) && flatList.length > 0) {
        await AsyncStorage.setItem("flats_2bhk", JSON.stringify(flatList));
      }

      return flatList;
    } catch (error) {
      console.log("Error loading flats:", error);
      return [];
    }
  },

  async fetchExpenses(selectedMonth: string) {
    try {
      const response: any = await api.get(EXPENSE_ENDPOINTS.expenses());
      const allExpenses = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : [];

      return allExpenses.map((item: any, index: number) => {
        let rawMonth = item.month || item.Month;
        let parsedMonth = selectedMonth;

        if (rawMonth) {
          const dateObj = new Date(rawMonth);
          if (!isNaN(dateObj.getTime())) {
            parsedMonth = dateObj.toLocaleDateString("en-GB", {
              month: "short",
              year: "numeric",
            });
          } else {
            parsedMonth = rawMonth;
          }
        } else if (item.date) {
          const dateObj = new Date(item.date);
          if (!isNaN(dateObj.getTime())) {
            parsedMonth = dateObj.toLocaleDateString("en-GB", {
              month: "short",
              year: "numeric",
            });
          }
        }

        return {
          id:
            item.id ||
            item.Id ||
            item.expenseId ||
            item.ExpenseId ||
            `expense-${index}`,
          flatId: item.flatId || item.FlatId,
          isCommonExpense:
            item.isCommonExpense ?? item.IsCommonExpense ?? false,
          userId: item.userId || item.UserId,
          title: item.title || item.Title,
          category: item.category || item.Category,
          amount: String(item.amount || item.Amount || "0"),
          month: parsedMonth,
          date: item.date
            ? new Date(item.date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
              })
            : "Today",
          receiptName: item.receiptName || item.ReceiptName || "",
          receiptUri: item.receiptUri || item.ReceiptUri || "",
          paymentMode: item.paymentMode || "Online",
          paidBy: item.paidBy || "Admin",
          status: item.status || "Completed",
          notes: item.notes || "",
        };
      });
    } catch (error) {
      console.log("Error loading expenses from API:", error);
      throw error;
    }
  },

  async createExpense(payload: ExpensePayload) {
    return await api.post(EXPENSE_ENDPOINTS.expenses(), payload);
  },

  async deleteExpense(id: string) {
    return await api.delete(EXPENSE_ENDPOINTS.expenseById(id));
  },
};