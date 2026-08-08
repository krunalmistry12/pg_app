import apiClient from "./apiClient";

export interface CreateUserPayload {
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  roleId: number;
}

export interface UpdateUserPayload extends Partial<CreateUserPayload> {
  isActive?: boolean;
}

export const userService = {
  // 1. Get All Users
  getAllUsers: async () => {
    const response = await apiClient.get("/User");
    return response.data;
  },

  // 2. Register New User
  createUser: async (userData: CreateUserPayload) => {
    const backendPayload = {
      name: userData.fullName,         // ✅ Backend DTO expects 'name'
      email: userData.email,
      mobile: userData.phone,          // ✅ Backend DTO expects 'mobile'
      password: userData.passwordHash, // ✅ Backend DTO expects 'password'
      roleId: userData.roleId,
    };
    
 
    // ⚠️ Yahan pehle 'userData' ja raha tha, ab 'backendPayload' jayega
    const response = await apiClient.post("/User/register", backendPayload);
    return response.data;
  },

  // 3. Update User Details
  updateUser: async (userId: string, userData: UpdateUserPayload) => {
    const backendPayload: any = {};
    if (userData.fullName !== undefined) backendPayload.name = userData.fullName;
    if (userData.email !== undefined) backendPayload.email = userData.email;
    if (userData.phone !== undefined) backendPayload.mobile = userData.phone;
    if (userData.passwordHash !== undefined) backendPayload.password = userData.passwordHash;
    if (userData.roleId !== undefined) backendPayload.roleId = userData.roleId;
    if (userData.isActive !== undefined) backendPayload.isActive = userData.isActive;

    const response = await apiClient.put(`/User/${userId}`, backendPayload);
    return response.data;
  },

  // 4. Update User Status (Active / Deactive)
  updateUserStatus: async (
    userId: string,
    isActive: boolean,
    fullUserData?: any,
  ) => {
    const payload = fullUserData ? { ...fullUserData, isActive } : { isActive };
    const response = await apiClient.put(`/User/${userId}`, payload);
    return response.data;
  },

  // 5. Delete User
  deleteUser: async (userId: string) => {
    const response = await apiClient.delete(`/User/${userId}`);
    return response.data;
  },
};