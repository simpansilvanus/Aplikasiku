import { BumdesProfile, Account, BusinessUnit, Transaction } from '../types';
import { 
  DEFAULT_ACCOUNTS, 
  DEFAULT_BUSINESS_UNITS, 
  DEFAULT_PROFILE, 
  INITIAL_TRANSACTIONS 
} from '../data/initialData';

export const STORAGE_PROFILE_KEY = 'bumdes_keuangan_profile_v1';
export const STORAGE_TRANSACTIONS_KEY = 'bumdes_keuangan_tx_v1';
export const STORAGE_ACCOUNTS_KEY = 'bumdes_keuangan_accounts_v1';
export const STORAGE_UNITS_KEY = 'bumdes_keuangan_units_v1';
export const STORAGE_DRIVE_SYNC_KEY = 'bumdes_keuangan_drive_sync_v1';

const DB_NAME = 'BumdesKeuanganAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_data';

export interface PersistentDataBundle {
  profile: BumdesProfile;
  transactions: Transaction[];
  accounts: Account[];
  units: BusinessUnit[];
  lastSaved: string;
}

/**
 * Membuka koneksi IndexedDB browser secara aman
 */
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB tidak didukung oleh browser ini.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Menyimpan data ke IndexedDB (kapasitas besar, tidak terbatas 5MB)
 */
export async function setIndexedDBItem<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Gagal menyimpan ke IndexedDB:', err);
  }
}

/**
 * Membaca data dari IndexedDB
 */
export async function getIndexedDBItem<T>(key: string): Promise<T | null> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        resolve(req.result !== undefined ? req.result : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Gagal membaca dari IndexedDB:', err);
    return null;
  }
}

/**
 * Menyimpan seluruh dataset aplikasi ke LocalStorage dan IndexedDB secara redundan.
 * Menangani QuotaExceededError dengan cerdas agar data tidak hilang jika logo berukuran besar.
 */
export function saveAllDataSafely(
  profile: BumdesProfile,
  transactions: Transaction[],
  accounts: Account[],
  units: BusinessUnit[]
): void {
  const timestamp = new Date().toISOString();

  // 1. Simpan ke IndexedDB (tidak ada batasan 5MB)
  const bundle: PersistentDataBundle = {
    profile,
    transactions,
    accounts,
    units,
    lastSaved: timestamp,
  };
  setIndexedDBItem('bundle', bundle).catch(console.warn);

  // 2. Simpan ke LocalStorage dengan proteksi kuota
  try {
    localStorage.setItem(STORAGE_TRANSACTIONS_KEY, JSON.stringify(transactions));
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
    localStorage.setItem(STORAGE_UNITS_KEY, JSON.stringify(units));
    localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
  } catch (err: any) {
    console.warn('LocalStorage kuota penuh, menyimpan versi tanpa logo besar ke LocalStorage:', err);
    try {
      // Jika localStorage penuh akibat base64 logo, simpan profil dengan fallback logo kecil
      // Data asli tetap 100% utuh di IndexedDB
      const slimProfile: BumdesProfile = {
        ...profile,
        logoUrl: profile.logoUrl?.startsWith('data:') ? '/logo-bumdes.jpg' : profile.logoUrl,
        regencyLogoUrl: profile.regencyLogoUrl?.startsWith('data:') ? '' : profile.regencyLogoUrl,
      };
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(slimProfile));
      localStorage.setItem(STORAGE_TRANSACTIONS_KEY, JSON.stringify(transactions));
    } catch (e2) {
      console.error('LocalStorage error total:', e2);
    }
  }
}

/**
 * Membaca data awal saat aplikasi dimuat / direstart.
 * Memeriksa IndexedDB dan LocalStorage untuk memastikan tidak ada data inputan yang hilang.
 */
export async function loadInitialAppData(): Promise<PersistentDataBundle> {
  // Coba ambil dari IndexedDB terlebih dahulu
  try {
    const fromIdb = await getIndexedDBItem<PersistentDataBundle>('bundle');
    if (fromIdb && fromIdb.transactions && fromIdb.profile) {
      return {
        profile: {
          ...DEFAULT_PROFILE,
          ...fromIdb.profile,
          ahuNumber: fromIdb.profile.ahuNumber !== undefined && fromIdb.profile.ahuNumber !== '' ? fromIdb.profile.ahuNumber : DEFAULT_PROFILE.ahuNumber,
        },
        transactions: fromIdb.transactions || [],
        accounts: fromIdb.accounts || DEFAULT_ACCOUNTS,
        units: fromIdb.units || DEFAULT_BUSINESS_UNITS,
        lastSaved: fromIdb.lastSaved || new Date().toISOString(),
      };
    }
  } catch (e) {
    console.warn('Gagal memuat dari IndexedDB:', e);
  }

  // Fallback ke LocalStorage
  try {
    const savedProf = localStorage.getItem(STORAGE_PROFILE_KEY);
    const savedTx = localStorage.getItem(STORAGE_TRANSACTIONS_KEY);
    const savedAcc = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    const savedUnits = localStorage.getItem(STORAGE_UNITS_KEY);

    const parsedProf = savedProf ? JSON.parse(savedProf) : null;
    const profile: BumdesProfile = parsedProf
      ? {
          ...DEFAULT_PROFILE,
          ...parsedProf,
          ahuNumber: parsedProf.ahuNumber !== undefined && parsedProf.ahuNumber !== '' ? parsedProf.ahuNumber : DEFAULT_PROFILE.ahuNumber,
        }
      : DEFAULT_PROFILE;

    const transactions: Transaction[] = savedTx
      ? JSON.parse(savedTx)
      : INITIAL_TRANSACTIONS;

    const accounts: Account[] = savedAcc
      ? JSON.parse(savedAcc)
      : DEFAULT_ACCOUNTS;

    const units: BusinessUnit[] = savedUnits
      ? JSON.parse(savedUnits)
      : DEFAULT_BUSINESS_UNITS;

    return {
      profile,
      transactions,
      accounts,
      units,
      lastSaved: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Fallback LocalStorage error:', err);
    return {
      profile: DEFAULT_PROFILE,
      transactions: INITIAL_TRANSACTIONS,
      accounts: DEFAULT_ACCOUNTS,
      units: DEFAULT_BUSINESS_UNITS,
      lastSaved: new Date().toISOString(),
    };
  }
}
