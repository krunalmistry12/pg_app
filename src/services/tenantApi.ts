import api from "./api";

export interface CreateTenantPayload {
  name: string;
  email?: string;
  phone: string;
  emergencyPhone?: string;
  propertyId: number;
  flatId: string;
  roomId?: string | null;
  bedId?: string | null;
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
export const getFlatsByUserIdApi = async (userId: string) => {
  const response = await api.get(`/Flats/user/${userId}`);
  return response.data; // Yeh array of flats hona chahiye
};
export const createTenantApi = async (
  payload: CreateTenantPayload,
  idProofFile?: { uri: string; type: string; name: string } | null,
  tenantPhotoFile?: { uri: string; type: string; name: string } | null,
) => {
  const formData = new FormData();

  // Har ek field ko individually FormData mein append karein taaki .NET model binder unhe catch kar sake
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
