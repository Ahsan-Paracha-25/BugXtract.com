export type Plan = {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  billing: string;
  audience: string;
  hours: string;
  description: string;
  popular: boolean;
  features: string[];
};

export type Retainer = {
  id: string;
  name: string;
  hours: string;
  price: string;
  description: string;
};

export type TrustMetric = {
  id: string;
  value: string;
  label: string;
  icon: "users" | "document" | "stars" | "lightning";
  visible: boolean;
};

export const defaultTrustMetrics: TrustMetric[] = [
  { id: "happy-customers", value: "50+", label: "Happy Customers", icon: "users", visible: true },
  { id: "projects-delivered", value: "100+", label: "Projects Delivered", icon: "document", visible: true },
  { id: "average-rating", value: "4.9/5", label: "Average Rating", icon: "stars", visible: true },
  { id: "response-time", value: "24h", label: "Response Time", icon: "lightning", visible: true },
];

export type PricingContent = {
  plans: Plan[];
  retainers: Retainer[];
  trustMetrics?: TrustMetric[];
};

export const defaultPricing: PricingContent = {
  trustMetrics: defaultTrustMetrics,
  plans: [
    {
      id: "free", name: "Free QA Trial", price: "$0", billing: "One-time evaluation",
      audience: "Service evaluation", hours: "2 hours", description: "Try our manual QA approach on one critical user flow.", popular: false,
      features: ["One critical flow", "Focused checks", "1 configuration", "—", "—", "—", "Short findings report", "—", "Recommendations"],
    },
    {
      id: "starter", name: "Starter QA", price: "$150–$300", billing: "Per project",
      audience: "Small apps / websites", hours: "6–12 hours", description: "A practical QA pass for a small product or focused release.", popular: false,
      features: ["Core workflows", "Included", "2 configurations", "—", "—", "—", "Detailed report", "1 focused cycle", "Test checklist"],
    },
    {
      id: "professional", name: "Professional QA", price: "$500–$1,000", billing: "Per project",
      audience: "Medium applications", hours: "20–40 hours", description: "Broader coverage for growing applications and planned releases.", popular: true,
      features: ["Agreed feature scope", "Included", "Up to 4 configurations", "Included", "Core APIs", "On agreement", "Detailed report", "2 cycles", "Checklist & release summary"],
    },
    {
      id: "complete", name: "Complete QA", price: "$1,500–$3,000", billing: "Per scoped engagement",
      audience: "Large enterprise apps", hours: "60–120 hours", description: "Risk-based testing across larger products and release scopes.", popular: false,
      features: ["Risk-based module coverage", "Included", "Agreed coverage matrix", "Included", "Agreed APIs & integrations", "Included in agreed scope", "Tracked defect reports", "Within reserved hours", "Test plan, cases & release assessment"],
    },
  ],
  retainers: [
    { id: "essential", name: "Essential", hours: "20", price: "$450", description: "Maintenance checks, small updates, and focused bug verification." },
    { id: "growth", name: "Growth", hours: "40", price: "$850", description: "Regular release cycles, regression coverage, and wider platform checks." },
    { id: "dedicated", name: "Dedicated", hours: "80", price: "$1,600", description: "Frequent releases, deeper product context, and embedded collaboration." },
  ],
};

export const featureLabels = [
  "Functional & exploratory", "Smoke & usability checks", "Browser / device coverage",
  "Regression testing", "API & integration testing", "Roles, permissions & UAT",
  "Bug reports with evidence", "Fix verification", "Test documentation",
];
