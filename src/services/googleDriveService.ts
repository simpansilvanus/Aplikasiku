import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { BumdesProfile, Account, BusinessUnit, Transaction } from '../types';

export interface AppDataBackup {
  version: number;
  appName: string;
  savedAt: string;
  profile: BumdesProfile;
  accounts: Account[];
  units: BusinessUnit[];
  transactions: Transaction[];
}

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Provider Google Auth dengan Scope Google Drive
const provider = new GoogleAuthProvider();
export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
provider.addScope('https://www.googleapis.com/auth/drive.file');

// Flag sign-in dan token memory cache (sesuai aturan skill: tidak disimpan di localStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Jika token belum di-cache pada sesi ini, minta token baru lewat sign in interaktif jika diperlukan
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

const DRIVE_BACKUP_FILE_NAME = 'bumdes_keuangan_backup.json';

/**
 * Mencari file backup BUMDes yang pernah dibuat oleh aplikasi ini di Google Drive
 */
export const findDriveBackupFile = async (
  token: string
): Promise<{ id: string; name: string; modifiedTime: string } | null> => {
  try {
    const query = encodeURIComponent(`name = '${DRIVE_BACKUP_FILE_NAME}' and trashed = false`);
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&spaces=drive`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      if (res.status === 401) {
        cachedAccessToken = null;
      }
      throw new Error(`Gagal mencari file di Google Drive: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0];
    }
    return null;
  } catch (err) {
    console.error('findDriveBackupFile error:', err);
    throw err;
  }
};

/**
 * Menyimpan data aplikasi BUMDes ke Google Drive
 */
export const saveAppDataToDrive = async (
  token: string,
  appData: {
    profile: BumdesProfile;
    accounts: Account[];
    units: BusinessUnit[];
    transactions: Transaction[];
  }
): Promise<{ fileId: string; modifiedTime: string; webViewLink?: string }> => {
  const payload: AppDataBackup = {
    version: 1,
    appName: 'Sistem Keuangan BUMDes Berbasis Excel',
    savedAt: new Date().toISOString(),
    ...appData,
  };

  const jsonString = JSON.stringify(payload, null, 2);

  // Periksa apakah file sudah ada di Drive
  const existingFile = await findDriveBackupFile(token);

  if (existingFile) {
    // Perbarui file yang sudah ada
    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: jsonString,
      }
    );

    if (!res.ok) {
      throw new Error(`Gagal memperbarui file di Google Drive: ${res.statusText}`);
    }

    const result = await res.json();
    return {
      fileId: result.id || existingFile.id,
      modifiedTime: result.modifiedTime || new Date().toISOString(),
    };
  } else {
    // Buat file baru di Google Drive menggunakan multipart upload
    const metadata = {
      name: DRIVE_BACKUP_FILE_NAME,
      mimeType: 'application/json',
      description: 'Data Pembukuan & Transaksi Keuangan BUMDes Tersimpan Otomatis',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      jsonString +
      closeDelimiter;

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!res.ok) {
      throw new Error(`Gagal membuat file baru di Google Drive: ${res.statusText}`);
    }

    const result = await res.json();
    return {
      fileId: result.id,
      modifiedTime: result.modifiedTime || new Date().toISOString(),
      webViewLink: result.webViewLink,
    };
  }
};

/**
 * Membaca / Memulihkan data dari Google Drive
 */
export const loadAppDataFromDrive = async (
  token: string
): Promise<{ data: AppDataBackup; fileId: string; modifiedTime: string } | null> => {
  const file = await findDriveBackupFile(token);
  if (!file) return null;

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Gagal mengunduh file data dari Google Drive: ${res.statusText}`);
  }

  const data: AppDataBackup = await res.json();
  return {
    data,
    fileId: file.id,
    modifiedTime: file.modifiedTime,
  };
};

/**
 * Mengunggah file Excel (.xlsx) langsung ke Google Drive pengguna
 */
export const uploadExcelBlobToDrive = async (
  token: string,
  blob: Blob,
  filename: string
): Promise<{ fileId: string; webViewLink?: string }> => {
  const metadata = {
    name: filename,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    description: 'Laporan Keuangan & Buku Kas Umum BUMDes (Format Excel)',
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json; charset=UTF-8' })
  );
  form.append('file', blob);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    throw new Error(`Gagal mengunggah berkas Excel ke Google Drive: ${res.statusText}`);
  }

  const result = await res.json();
  return {
    fileId: result.id,
    webViewLink: result.webViewLink,
  };
};
