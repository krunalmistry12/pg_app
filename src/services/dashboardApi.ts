import api from "./api";

// --- Dashboard Interfaces ---
export interface RevenueOverview {
  monthName: string;
  totalExpectedRevenue: number;
  totalCollected: number;
  totalPendingDue: number;
}

export interface PropertyMetrics {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  activeTenants: number;
  newJoinersThisMonth: number;
  occupancyPercentage: number;
}

export interface DashboardAlert {
  id: string;
  type: "rent" | "maintenance" | "notice";
  title: string;
  subtitle: string;
  time: string;
  route: string;
  color: string;
}

export interface RecentActivity {
  id: string;
  text: string;
  time: string;
  icon: string;
  color: string;
}

export interface DashboardDataResponse {
  ownerName: string;
  revenueOverview: RevenueOverview;
  propertyMetrics: PropertyMetrics;
  alerts: DashboardAlert[];
  recentActivities: RecentActivity[];
}

// 1. GET: Fetch Complete Dashboard Data by User ID
export const getDashboardDataApi = async (
  userId: string,
  role: string = "SuperAdmin",
): Promise<DashboardDataResponse> => {
  const response = await api.get("/Dashboard/summary", {
    params: {
      userId: userId,
      role: role,
    },
  });
  return response.data;
};
// 2. PATCH: Dismiss or Update Alert Status (Optional helper)
export const dismissDashboardAlertApi = async (alertId: string | number) => {
  const response = await api.patch(`/Dashboard/alerts/${alertId}/dismiss`);
  return response.data;
};
