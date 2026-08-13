import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import api from "./api";

export interface CreateTenantPayload {
  name: string;
  email?: string;
  phone: string;
  emergencyPhone?: string;
  propertyId: number;
  flatId: string;
  roomId?: number | string | null;
  bedId?: number | string | null;
  allocationType: number;
  rent: number;
  deposit: number;
  advancePaid: number;
  dueDate: number;
  paymentMethod: string;
  startingMeterReading: number;
  lockInPeriodMonths: number;
  joiningDate: string;
  agreementEndDate: string;
  idProofType: string;
  idProofNumber: string;
  policeVerificationStatus: string;
  status: number;
  idProofFile?: any;
  tenantPhotoFile?: any;
}

export type TenantPayload = CreateTenantPayload;

// 1. GET: Fetch Flats by User ID
export const getFlatsByUserIdApi = async (userId: string) => {
  const response = await api.get(`/Flats/user/${userId}`);
  return response.data;
};

// 2. POST: Create New Tenant
export const createTenantApi = async (
  payload: CreateTenantPayload,
  idProofFile?: { uri: string; type: string; name: string } | null,
  tenantPhotoFile?: { uri: string; type: string; name: string } | null,
) => {
  const formData = new FormData();

  Object.keys(payload).forEach((key) => {
    const value = (payload as any)[key];
    if (value !== undefined && value !== null) {
      formData.append(key, value.toString());
    }
  });

  if (idProofFile) {
    formData.append("idProofFile", idProofFile as any);
  }

  if (tenantPhotoFile) {
    formData.append("tenantPhotoFile", tenantPhotoFile as any);
  }

  const response = await api.post("/Tenants", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// 3. GET: Get Tenant Details By ID
export const getTenantByIdApi = async (id: string | number) => {
  const response = await api.get(`/Tenants/${id}`);
  return response.data;
};

// 4. GET: Get All Tenants for a Specific User
export const getTenantsByUserIdApi = async (userId: string | number) => {
  const response = await api.get(`/Tenants/user/${userId}`);
  return response.data;
};

// 5. PUT: Update Tenant
export const updateTenantApi = async (
  id: string | number,
  payload: Partial<CreateTenantPayload>,
  idProofFile?: { uri: string; type: string; name: string } | null,
  tenantPhotoFile?: { uri: string; type: string; name: string } | null,
) => {
  const formData = new FormData();

  Object.keys(payload).forEach((key) => {
    const value = (payload as any)[key];
    if (value !== undefined && value !== null) {
      formData.append(key, value.toString());
    }
  });

  if (idProofFile) {
    formData.append("idProofFile", idProofFile as any);
  }

  if (tenantPhotoFile) {
    formData.append("tenantPhotoFile", tenantPhotoFile as any);
  }

  const response = await api.put(`/Tenants/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// 6. DELETE: Delete Tenant By ID
export const deleteTenantApi = async (id: string | number) => {
  const response = await api.delete(`/Tenants/${id}`);
  return response.data;
};

// 7. PATCH: Update Tenant Status
export const updateTenantStatusApi = async (
  id: string | number,
  status: number,
) => {
  const response = await api.patch(`/Tenants/${id}/status`, status, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.data;
};

export interface TenantProfile {
  name: string;
  roomNumber: string;
  rentAmount: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  isRentPaid: boolean;
  pgName: string;
  flatId?: string | number | null; // Added flatId here for seamless notice fetching
}

export const tenantService = {
  async getTenantId(): Promise<string> {
    try {
      const storedId =
        (await AsyncStorage.getItem("tenantId")) ||
        (await AsyncStorage.getItem("userId")) ||
        (await AsyncStorage.getItem("id"));
      if (storedId) return storedId;

      const token = await AsyncStorage.getItem("token");
      if (token) {
        const decoded: any = jwtDecode(token);
        return (
          decoded.id ||
          decoded.tenantId ||
          decoded.sub ||
          decoded.UserId ||
          "18"
        );
      }
    } catch (e) {
      console.log("Error getting tenant ID:", e);
    }
    return "18";
  },

  async fetchTenantProfileData(): Promise<TenantProfile | null> {
    try {
      const tenantId = await this.getTenantId();

      // 1. Fetch Tenant Profile
      const response = await api.get(`/Tenants/${tenantId}`);
      const resData = response.data?.data || response.data;

      let isPaid = resData?.isRentPaid === true;
      let finalTotalRent = resData?.rent || 0;
      let finalPaidAmount = 0;
      let finalPendingAmount = 0;

      // 2. Cross-verify with pending bills API
      try {
        const billsResponse = await api.get("/Rent/tenant/my-pending-bills");
        const billsData = billsResponse.data?.data || billsResponse.data;

        if (Array.isArray(billsData) && billsData.length > 0) {
          const currentBill = billsData[0];

          finalTotalRent =
            currentBill.totalAmount ??
            currentBill.baseRent ??
            resData?.rent ??
            0;
          finalPaidAmount = currentBill.paidAmount ?? 0;
          finalPendingAmount = currentBill.pendingAmount ?? 0;

          const hasUnpaidBills = billsData.some((bill: any) => {
            const status = bill.status ? String(bill.status).toUpperCase() : "";
            const pendingAmt = Number(
              bill.pendingAmount ?? bill.dueAmount ?? 0,
            );
            const isMarkedPaid = bill.isPaid === true || status === "PAID";

            return !isMarkedPaid || pendingAmt > 0 || status === "PARTIAL";
          });

          isPaid = !hasUnpaidBills;
        } else if (Array.isArray(billsData) && billsData.length === 0) {
          isPaid = true;
        }
      } catch (billErr: any) {
        console.log("Could not fetch pending bills:", billErr?.message);
      }

      const currentMonthName = new Date().toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      if (resData) {
        return {
          name: resData.name || "Tenant",
          roomNumber: `Flat ${resData.flatName || resData.flatNumber || "N/A"} - ${resData.roomName || ""} (${resData.bedName || ""})`,
          rentAmount: finalTotalRent,
          paidAmount: finalPaidAmount,
          pendingAmount: finalPendingAmount,
          dueDate: resData.dueDate
            ? `${resData.dueDate}th of ${currentMonthName}`
            : currentMonthName,
          isRentPaid: isPaid,
          pgName: resData.apartmentName || "PG Accommodation",
          flatId: resData.flatId || resData.FlatId || resData.flat_id || null, // Mapped flatId properly
        };
      }
      return null;
    } catch (error: any) {
      console.log("Error fetching tenant profile:", error?.message);
      throw error;
    }
  },

  async clearSessionData() {
    await AsyncStorage.multiRemove([
      "token",
      "isLoggedIn",
      "userRole",
      "tenantId",
      "userId",
    ]);
  },
};
