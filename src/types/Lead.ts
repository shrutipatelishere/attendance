export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'converted' | 'lost';
export type LeadType = 'hot' | 'warm' | 'cold';
export type LeadSource = 'google_ads' | 'facebook' | 'linkedin' | 'email_campaign' | 'other';
export type ServiceType = 'website' | 'automation' | 'lp' | 'app' | 'web_app' | 'other';

export interface Comment {
  id: string;
  text: string;
  createdAt: Date;
  userId?: string; // Who made the comment
  userName?: string;
}

export interface LeadAssignment {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  reason: string;
  assignedAt: Date;
}

export interface CallReminder {
  id: string;
  dateTime: Date;
  note: string;
  completed: boolean;
}

export interface Lead {
  id: string;
  name: string;
  number: string;
  email: string;
  city: string;
  leadType: LeadType;
  source: LeadSource;
  service: ServiceType;
  notes: string;
  status: LeadStatus;
  comments: Comment[];
  reminders: CallReminder[];
  createdAt: Date;
  // Assignment & Ownership
  createdBy?: string; // User ID who created the lead
  createdByName?: string;
  assignedTo?: string; // Current owner (caller/manager/TL)
  assignedToName?: string;
  assignmentHistory: LeadAssignment[]; // Track all assignments
  // Team thread - all users involved with this lead
  teamThread: string[]; // Array of user IDs who can see/work on this lead
}

export const LEAD_STATUSES: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: '#3498db' },
  { value: 'contacted', label: 'Contacted', color: '#9b59b6' },
  { value: 'qualified', label: 'Qualified', color: '#f39c12' },
  { value: 'proposal', label: 'Proposal', color: '#e67e22' },
  { value: 'negotiation', label: 'Negotiation', color: '#1abc9c' },
  { value: 'converted', label: 'Converted', color: '#27ae60' },
  { value: 'lost', label: 'Lost', color: '#e74c3c' },
];

export const LEAD_TYPES: { value: LeadType; label: string; color: string }[] = [
  { value: 'hot', label: 'Hot', color: '#e74c3c' },
  { value: 'warm', label: 'Warm', color: '#f39c12' },
  { value: 'cold', label: 'Cold', color: '#3498db' },
];

export const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'email_campaign', label: 'Email Campaign' },
  { value: 'other', label: 'Other' },
];

export const SERVICES: { value: ServiceType; label: string }[] = [
  { value: 'website', label: 'Website' },
  { value: 'automation', label: 'Automation' },
  { value: 'lp', label: 'Landing Page (LP)' },
  { value: 'app', label: 'App' },
  { value: 'web_app', label: 'Web App' },
  { value: 'other', label: 'Other' },
];
