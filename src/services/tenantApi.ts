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
// 1. GET: Fetch Flats by User ID
export const getFlatsByUserIdApi = async (userId: string) => {
  const response = await api.get(`/Flats/user/${userId}`);
  return response.data;
};
export type TenantPayload = CreateTenantPayload;
// 2. POST: Create New Tenant
export const createTenantApi = async (
  payload: CreateTenantPayload,
  idProofFile?: { uri: string; type: string; name: string } | null,
  tenantPhotoFile?: { uri: string; type: string; name: string } | null,
) => {
  const formData = new FormData();

  // Har ek field ko individually FormData mein append karein
  Object.keys(payload).forEach((key) => {
    const value = (payload as any)[key];
    if (value !== undefined && value !== null) {
      formData.append(key, value.toString());
    }
  });

  // Files append karein
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

// 7. PATCH: Update Tenant Status
export const updateTenantStatusApi = async (id: string | number, status: number) => {
  const response = await api.patch(`/Tenants/${id}/status`, status, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
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
