export type HouseholdRole = 'titular' | 'co_propietario' | 'inquilino' | 'auditor';

export interface GoogleServiceConnection {
  googleIdentity: boolean;
  googleTranslate: boolean;
  googleMapsLocation: boolean;
  googleCalendarAlerts: boolean;
}

export interface GoogleAccountLink {
  isConnected: boolean;
  googleEmail?: string;
  googleName?: string;
  googleAvatarUrl?: string;
  linkedAt?: string;
  connectedServices: GoogleServiceConnection;
}

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  householdRole: HouseholdRole;
  primaryHouseholdId: string;
  organization?: string;
  pinCode?: string; // 4-digit security PIN for sensitive edits
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  preferences: {
    currency: string;
    language: string;
    theme: 'dark' | 'light' | 'auto';
    notificationsEnabled: boolean;
    autoBackup: boolean;
  };
  googleConnection: GoogleAccountLink;
}
