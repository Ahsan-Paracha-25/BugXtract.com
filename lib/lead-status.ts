export const leadStatuses = ["New", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost", "On Hold"] as const;
export type LeadStatus = (typeof leadStatuses)[number];

export const leadTypes = ["Prospect", "One-time Customer", "Retainer Customer"] as const;
export type LeadType = (typeof leadTypes)[number];
