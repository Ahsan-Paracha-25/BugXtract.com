export const customerEngagementStatuses = ["Active", "Paused", "Completed"] as const;
export type CustomerEngagementStatus = (typeof customerEngagementStatuses)[number];

export type CustomerProfile = {
  leadId: string;
  engagementStatus: CustomerEngagementStatus;
  startedAt: string;
  deliveryNotes: string;
  updatedAt: string;
};

export function isCustomerEngagementStatus(value: unknown): value is CustomerEngagementStatus {
  return typeof value === "string" && (customerEngagementStatuses as readonly string[]).includes(value);
}
