import api from "../api";

import AsyncStorage from "@react-native-async-storage/async-storage";

export const fetchFlatsAndBranches = async (storedUserId: string | null) => {
  let flatList: any[] = [];

  if (storedUserId) {
    try {
      const response = await api.get(`/Flats/user/${storedUserId}`);
      flatList = Array.isArray(response)
        ? response
        : Array.isArray((response as any)?.data)
          ? (response as any).data
          : Array.isArray((response as any)?.data?.data)
            ? (response as any).data.data
            : ((response as any)?.data?.flats ?? []);
    } catch (err1) {
      try {
        const altResponse = await api.get(`/Flats`);
        flatList = Array.isArray(altResponse)
          ? altResponse
          : Array.isArray((altResponse as any)?.data)
            ? (altResponse as any).data
            : Array.isArray((altResponse as any)?.data?.data)
              ? (altResponse as any).data.data
              : [];
      } catch (err2) {
        flatList = [];
      }
    }
  }

  return flatList;
};

export const fetchAdminComplaintsApi = async () => {
  const token = await AsyncStorage.getItem("userToken");
  const response = await api.get(`/Complaints/admin/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: "*/*",
    },
  });

  const result = response.data;
  const rawData = Array.isArray(result) ? result : result?.data || [];

  return rawData.map((item: any) => ({
    id: item.complaintId || item.id || item.Id,
    pgName:
      item.pgName ||
      item.PgName ||
      item.apartmentName ||
      item.flatName ||
      "Sunrise PG (Branch 1)",
    tenant: item.tenantName || item.Tenant || "Tenant",
    room:
      item.room ||
      item.roomNumber ||
      item.Room ||
      item.flatNumber ||
      "Room N/A",
    phone: item.phone || item.phoneNumber || "+919876543210",
    title: item.title || item.Title || "Untitled Issue",
    category: item.category || item.Category || "General",
    priority: item.priority || item.Priority || "Medium",
    status: item.status || item.Status || "Pending",
    date:
      item.createdAt || item.Date
        ? new Date(item.createdAt || item.Date).toLocaleDateString()
        : "Recent",
    remark: item.adminRemark || item.Remark || "",
  }));
};

export const updateComplaintStatusApi = async (
  complaintId: any,
  status: string,
  adminRemark: string,
) => {
  const token = await AsyncStorage.getItem("userToken");
  const payload = { complaintId, status, adminRemark };

  await api.put(`/Complaints/admin/update-status`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      accept: "*/*",
    },
  });
};
export const complaintService = {
  createComplaint: async (payload: {
    flatId: string;
    tenantId?: number;
    title: string;
    description: string;
    category: string;
    priority: string;
    attachmentName?: string;
    attachmentUri?: string;
  }) => {
    const response = await api.post("/Complaints/tenant/create", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  },

  getMyComplaints: async () => {
    const response = await api.get("/Complaints/tenant/my-complaints");
    return response.data;
  },
};
