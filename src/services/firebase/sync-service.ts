/**
 * VATIO · Sincronización Firestore ↔ IndexedDB
 *
 * Estrategia: cada usuario (uid de Firebase) tiene un documento raíz.
 * Los stores locales de IndexedDB se suben/bajan como colecciones
 * `users/{uid}/{store}` usando el mismo id local como id de documento,
 * de modo que la app funciona offline-first y sincroniza cuando hay red.
 */

import {
  getFirestore,
  Firestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { firebaseApp } from './auth-service';
import { db as localDb } from '../../database/db';
import { STORES } from '../../database/schema';

const firestore: Firestore = getFirestore(firebaseApp);

const SYNC_STORES: string[] = [
  STORES.HOUSEHOLDS,
  STORES.INVOICES,
  STORES.APPLIANCES,
  STORES.TARIFFS,
  STORES.SCENARIOS,
  STORES.DIAGNOSTICS,
  STORES.SAVINGS_ACTIONS,
  STORES.INVESTMENTS,
  STORES.ANALYTICS_SNAPSHOTS,
  STORES.SAVED_VISUALIZATIONS,
  STORES.USER_ACCOUNT,
  STORES.APP_SETTINGS,
];

type AnyRecord = Record<string, any>;

/** Firestore no acepta `undefined` → limpiamos esas claves */
function cleanForFirestore(obj: AnyRecord): AnyRecord {
  const out: AnyRecord = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (v instanceof Date) {
      out[k] = v.toISOString();
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = cleanForFirestore(v as AnyRecord);
    } else if (Array.isArray(v)) {
      out[k] = v.map(item =>
        item && typeof item === 'object' ? cleanForFirestore(item) : item
      );
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** Sube todos los stores locales a users/{uid}/... */
export async function pushAllToCloud(uid: string): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const storeName of SYNC_STORES) {
    const items = await localDb.getAll<AnyRecord>(storeName);
    counts[storeName] = items.length;
    if (items.length === 0) continue;

    // Firestore permite máx. 500 escrituras por batch
    for (let i = 0; i < items.length; i += 400) {
      const batch = writeBatch(firestore);
      for (const item of items.slice(i, i + 400)) {
        const id = String(item.id ?? crypto.randomUUID());
        const ref = doc(firestore, 'users', uid, storeName, id);
        batch.set(ref, cleanForFirestore(item), { merge: true });
      }
      await batch.commit();
    }
  }
  return counts;
}

/** Baja la nube y la fusiona con lo local (la nube gana si hay conflicto) */
export async function pullAllFromCloud(uid: string): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const storeName of SYNC_STORES) {
    const col = collection(firestore, 'users', uid, storeName);
    const snap = await getDocs(col);
    counts[storeName] = snap.size;
    for (const snapDoc of snap.docs) {
      const data = snapDoc.data();
      if (data && (data.id || snapDoc.id)) {
        await localDb.put(storeName, { ...data, id: (data.id as string) ?? snapDoc.id });
      }
    }
  }
  return counts;
}

/** Borra TODA la nube del usuario (para "reset total" en dos dispositivos) */
export async function wipeCloudData(uid: string): Promise<void> {
  for (const storeName of SYNC_STORES) {
    const col = collection(firestore, 'users', uid, storeName);
    const snap = await getDocs(col);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  }
}

/** Marca de la última sincronización */
export async function touchSyncStamp(uid: string): Promise<void> {
  await setDoc(
    doc(firestore, 'users', uid),
    { lastSyncAt: new Date().toISOString() },
    { merge: true }
  );
}

export async function getSyncStamp(uid: string): Promise<string | null> {
  const snap = await getDoc(doc(firestore, 'users', uid));
  return (snap.data()?.lastSyncAt as string) || null;
}
