export const APPLICATION_STATUSES = ["Applied", "Interview", "Offer", "Rejected"] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface Application {
  id: string;
  user_id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  applied_date: string | null;
  deadline: string | null;
  follow_up_date: string | null;
  notes: string | null;
  job_link: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationInput {
  company: string;
  role: string;
  status: ApplicationStatus;
  applied_date?: string | null;
  deadline?: string | null;
  follow_up_date?: string | null;
  notes?: string | null;
  job_link?: string | null;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface StatsOverview {
  total_applications: number;
  status_breakdown: {
    applied: number;
    interview: number;
    offer: number;
    rejected: number;
  };
  interview_rate: number;
  offer_rate: number;
  applications_over_time: { date: string; count: number }[];
}

export interface ApplicationFilters {
  company?: string;
  status?: ApplicationStatus;
  date_from?: string;
  date_to?: string;
}
