import { DB_NAME, DB_VERSION, STORES } from './schema';
import { Household } from '../types/household';
import { Invoice } from '../types/invoice';
import { Appliance } from '../types/appliance';
import { Tariff } from '../types/tariff';
import { Scenario } from '../types/scenario';
import { DiagnosticItem } from '../types/diagnostic';
import { EnergyInvestment, SavingsActionItem } from '../types/savings';
import { DEFAULT_TARIffS } from '../core/tariff-engine/default-tariffs';
import { INITIAL_HOUSEHOLD_CR } from './seed';

class VatioIndexedDB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  public async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      // Check for SSR or headless environment without IndexedDB
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB no está disponible en este entorno.'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Households
        if (!db.objectStoreNames.contains(STORES.HOUSEHOLDS)) {
          db.createObjectStore(STORES.HOUSEHOLDS, { keyPath: 'id' });
        }

        // Invoices
        if (!db.objectStoreNames.contains(STORES.INVOICES)) {
          const invoiceStore = db.createObjectStore(STORES.INVOICES, { keyPath: 'id' });
          invoiceStore.createIndex('householdId', 'householdId', { unique: false });
          invoiceStore.createIndex('periodStart', 'periodStart', { unique: false });
        }

        // Appliances
        if (!db.objectStoreNames.contains(STORES.APPLIANCES)) {
          const appStore = db.createObjectStore(STORES.APPLIANCES, { keyPath: 'id' });
          appStore.createIndex('householdId', 'householdId', { unique: false });
          appStore.createIndex('category', 'category', { unique: false });
        }

        // Tariffs
        if (!db.objectStoreNames.contains(STORES.TARIFFS)) {
          const tariffStore = db.createObjectStore(STORES.TARIFFS, { keyPath: 'id' });
          tariffStore.createIndex('country', 'country', { unique: false });
          tariffStore.createIndex('distributor', 'distributor', { unique: false });
        }

        // Scenarios
        if (!db.objectStoreNames.contains(STORES.SCENARIOS)) {
          const scenStore = db.createObjectStore(STORES.SCENARIOS, { keyPath: 'id' });
          scenStore.createIndex('householdId', 'householdId', { unique: false });
        }

        // Diagnostics
        if (!db.objectStoreNames.contains(STORES.DIAGNOSTICS)) {
          const diagStore = db.createObjectStore(STORES.DIAGNOSTICS, { keyPath: 'id' });
          diagStore.createIndex('householdId', 'householdId', { unique: false });
        }

        // Savings Actions
        if (!db.objectStoreNames.contains(STORES.SAVINGS_ACTIONS)) {
          const actionStore = db.createObjectStore(STORES.SAVINGS_ACTIONS, { keyPath: 'id' });
          actionStore.createIndex('householdId', 'householdId', { unique: false });
        }

        // Investments
        if (!db.objectStoreNames.contains(STORES.INVESTMENTS)) {
          const invStore = db.createObjectStore(STORES.INVESTMENTS, { keyPath: 'id' });
          invStore.createIndex('householdId', 'householdId', { unique: false });
        }

        // Settings
        if (!db.objectStoreNames.contains(STORES.APP_SETTINGS)) {
          db.createObjectStore(STORES.APP_SETTINGS, { keyPath: 'key' });
        }

        // Analytics Snapshots (Atlas Energético)
        if (!db.objectStoreNames.contains(STORES.ANALYTICS_SNAPSHOTS)) {
          const snapStore = db.createObjectStore(STORES.ANALYTICS_SNAPSHOTS, { keyPath: 'id' });
          snapStore.createIndex('householdId', 'householdId', { unique: false });
          snapStore.createIndex('invoiceId', 'invoiceId', { unique: false });
          snapStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Saved Visualizations (Atlas Energético)
        if (!db.objectStoreNames.contains(STORES.SAVED_VISUALIZATIONS)) {
          const vizStore = db.createObjectStore(STORES.SAVED_VISUALIZATIONS, { keyPath: 'id' });
          vizStore.createIndex('householdId', 'householdId', { unique: false });
          vizStore.createIndex('chartType', 'chartType', { unique: false });
          vizStore.createIndex('isFavorite', 'isFavorite', { unique: false });
        }

        // User Account & Google Integrations
        if (!db.objectStoreNames.contains(STORES.USER_ACCOUNT)) {
          db.createObjectStore(STORES.USER_ACCOUNT, { keyPath: 'id' });
        }
      };

      request.onsuccess = async () => {
        const db = request.result;
        // Check and seed initial data if empty
        await this.ensureSeedData(db);
        resolve(db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  private async ensureSeedData(db: IDBDatabase): Promise<void> {
    try {
      // 1. Seed tariffs if empty
      const tx = db.transaction([STORES.TARIFFS, STORES.HOUSEHOLDS], 'readwrite');
      const tariffStore = tx.objectStore(STORES.TARIFFS);
      const countReq = tariffStore.count();

      countReq.onsuccess = () => {
        if (countReq.result === 0) {
          for (const tariff of DEFAULT_TARIffS) {
            tariffStore.put(tariff);
          }
        }
      };

      // 2. Seed default Costa Rica household if empty
      const hhStore = tx.objectStore(STORES.HOUSEHOLDS);
      const hhCountReq = hhStore.count();
      hhCountReq.onsuccess = () => {
        if (hhCountReq.result === 0) {
          hhStore.put(INITIAL_HOUSEHOLD_CR);
        }
      };
    } catch {
      // Ignore background seed errors
    }
  }

  public async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  public async getById<T>(storeName: string, id: string): Promise<T | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  public async put<T>(storeName: string, item: T): Promise<T> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve(item);
      req.onerror = () => reject(req.error);
    });
  }

  public async delete(storeName: string, id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async clearStore(storeName: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Complete database export object.
   */
  public async exportFullBackup(): Promise<string> {
    const households = await this.getAll<Household>(STORES.HOUSEHOLDS);
    const invoices = await this.getAll<Invoice>(STORES.INVOICES);
    const appliances = await this.getAll<Appliance>(STORES.APPLIANCES);
    const tariffs = await this.getAll<Tariff>(STORES.TARIFFS);
    const scenarios = await this.getAll<Scenario>(STORES.SCENARIOS);
    const diagnostics = await this.getAll<DiagnosticItem>(STORES.DIAGNOSTICS);
    const savingsActions = await this.getAll<SavingsActionItem>(STORES.SAVINGS_ACTIONS);
    const investments = await this.getAll<EnergyInvestment>(STORES.INVESTMENTS);
    const analyticsSnapshots = await this.getAll<any>(STORES.ANALYTICS_SNAPSHOTS);
    const savedVisualizations = await this.getAll<any>(STORES.SAVED_VISUALIZATIONS);
    const userAccounts = await this.getAll<any>(STORES.USER_ACCOUNT);

    const payload = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      generator: 'VATIO Energy Intelligence Platform',
      data: {
        households,
        invoices,
        appliances,
        tariffs,
        scenarios,
        diagnostics,
        savingsActions,
        investments,
        analyticsSnapshots,
        savedVisualizations,
        userAccounts,
      },
    };

    return JSON.stringify(payload, null, 2);
  }

  /**
   * Restores database from a validated JSON backup.
   */
  public async restoreFullBackup(jsonString: string): Promise<{ success: boolean; counts: Record<string, number>; message: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !parsed.data) {
        throw new Error('Estructura de respaldo no válida. Falta la propiedad "data".');
      }

      const { data } = parsed;
      const counts: Record<string, number> = {
        households: 0,
        invoices: 0,
        appliances: 0,
        tariffs: 0,
        scenarios: 0,
        savingsActions: 0,
        investments: 0,
        analyticsSnapshots: 0,
        savedVisualizations: 0,
      };

      if (Array.isArray(data.households)) {
        for (const h of data.households) {
          await this.put(STORES.HOUSEHOLDS, h);
          counts.households++;
        }
      }

      if (Array.isArray(data.invoices)) {
        for (const inv of data.invoices) {
          await this.put(STORES.INVOICES, inv);
          counts.invoices++;
        }
      }

      if (Array.isArray(data.appliances)) {
        for (const app of data.appliances) {
          await this.put(STORES.APPLIANCES, app);
          counts.appliances++;
        }
      }

      if (Array.isArray(data.tariffs)) {
        for (const t of data.tariffs) {
          await this.put(STORES.TARIFFS, t);
          counts.tariffs++;
        }
      }

      if (Array.isArray(data.scenarios)) {
        for (const s of data.scenarios) {
          await this.put(STORES.SCENARIOS, s);
          counts.scenarios++;
        }
      }

      if (Array.isArray(data.savingsActions)) {
        for (const a of data.savingsActions) {
          await this.put(STORES.SAVINGS_ACTIONS, a);
          counts.savingsActions++;
        }
      }

      if (Array.isArray(data.investments)) {
        for (const inv of data.investments) {
          await this.put(STORES.INVESTMENTS, inv);
          counts.investments++;
        }
      }

      if (Array.isArray(data.analyticsSnapshots)) {
        for (const snap of data.analyticsSnapshots) {
          await this.put(STORES.ANALYTICS_SNAPSHOTS, snap);
          counts.analyticsSnapshots++;
        }
      }

      if (Array.isArray(data.savedVisualizations)) {
        for (const viz of data.savedVisualizations) {
          await this.put(STORES.SAVED_VISUALIZATIONS, viz);
          counts.savedVisualizations++;
        }
      }

      if (Array.isArray(data.userAccounts)) {
        for (const acc of data.userAccounts) {
          await this.put(STORES.USER_ACCOUNT, acc);
          counts.userAccounts = (counts.userAccounts || 0) + 1;
        }
      }

      return {
        success: true,
        counts,
        message: 'Respaldo restaurado correctamente sin pérdida de integridad.',
      };
    } catch (err: any) {
      return {
        success: false,
        counts: {},
        message: `Error al restaurar: ${err.message || 'Archivo dañado o incompatible.'}`,
      };
    }
  }
}

export const db = new VatioIndexedDB();
