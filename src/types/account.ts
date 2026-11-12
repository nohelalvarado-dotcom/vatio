export type AccountType = 'personal' | 'commercial' | 'auditor';
export type AuthProvider = 'local' | 'google';

export interface GoogleDriveConfig {
  enabled: boolean;
  backupFolder: string;
  autoSyncInvoices: boolean;
  autoSyncReports: boolean;
  lastBackupDate?: string;
  backupStatus?: 'synced' | 'pending' | 'idle' | 'error';
  lastFileBackedUp?: string;
}

export interface GoogleSheetsConfig {
  enabled: boolean;
  sheetName: string;
  autoExportOnSave: boolean;
  lastExportDate?: string;
}

export interface GoogleCalendarConfig {
  enabled: boolean;
  meterReadingReminder: boolean;
  meterReadingDay: number; // Day of month 1-31
  billingDueDateReminder: boolean;
  reminderNoticeDays: number; // e.g. 3 days before
  lastReminderCreated?: string;
}

export interface GoogleIntegrations {
  connected: boolean;
  googleId?: string;
  googleEmail?: string;
  googleName?: string;
  googlePicture?: string;
  connectedAt?: string;
  scopesGranted: string[];
  drive: GoogleDriveConfig;
  sheets: GoogleSheetsConfig;
  calendar: GoogleCalendarConfig;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country: string;
  city: string;
  householdId: string;
  meterNumber?: string; // NIS o número de medidor
  distributor?: string;
  accountType: AccountType;
  authProvider: AuthProvider;
  avatarUrl?: string;
  pinProtection: boolean;
  pinCode?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  google: GoogleIntegrations;
}

export const DEFAULT_USER_ACCOUNT: UserAccount = {
  id: 'acc_demo_primary',
  name: 'Nohel Alvarado',
  email: 'Nohelalvarado@gmail.com',
  phone: '+506 8888-0000',
  country: 'Costa Rica',
  city: 'San José',
  householdId: 'household-primary',
  meterNumber: 'NIS-849201',
  distributor: 'ICE',
  accountType: 'personal',
  authProvider: 'local',
  avatarUrl: '',
  pinProtection: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
  google: {
    connected: false,
    googleEmail: 'Nohelalvarado@gmail.com',
    googleName: 'Nohel Alvarado',
    scopesGranted: [],
    drive: {
      enabled: false,
      backupFolder: 'VATIO_Energia_Respaldos',
      autoSyncInvoices: true,
      autoSyncReports: true,
      backupStatus: 'idle',
    },
    sheets: {
      enabled: false,
      sheetName: 'VATIO_Auditoria_Facturas_2024',
      autoExportOnSave: false,
    },
    calendar: {
      enabled: false,
      meterReadingReminder: true,
      meterReadingDay: 28,
      billingDueDateReminder: true,
      reminderNoticeDays: 3,
    },
  },
};
