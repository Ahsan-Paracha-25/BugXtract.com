export const leadStatuses = ["New", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost", "On Hold"] as const;
export type LeadStatus = (typeof leadStatuses)[number];
