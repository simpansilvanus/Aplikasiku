import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cloud, 
  CloudCheck, 
  CloudUpload, 
  CloudDownload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck,
  HardDrive,
  LogOut,
  FolderOpen
} from 'lucide-react';
import { BumdesProfile, Account, BusinessUnit, Transaction } from '../types';
import { 
  googleSignIn, 
  googleSignOut, 
  saveAppDataToDrive, 
  loadAppDataFromDrive, 
  findDriveBackupFile, 
  uploadExcelBlobToDrive 
} from '../services/googleDriveService';
import { exportToBumdesExcel } from '../utils/excelExport';
import { User } from 'firebase/auth';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  accessToken: string | null;
  onAuthSuccess: (user: User, token: string) => void;
  onSignOut: () => void;
  profile: BumdesProfile;
  accounts: Account[];
  units: BusinessUnit[];
  transactions: Transaction[];
  onRestoreData: (data: {
    profile: BumdesProfile;
    accounts: Account[];
    units: BusinessUnit[];
    transactions: Transaction[];
  }) => void;
  lastDriveSync: string | null;
  setLastDriveSync: (time: string | null) => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  accessToken,
  onAuthSuccess,
  onSignOut,
  profile,
  accounts,
  units,
  transactions,
  onRestoreData,
  lastDriveSync,
  setLastDriveSync,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [driveFileInfo, setDriveFileInfo] = useState<{ id: string; name: string; modifiedTime: string } | null>(null);
  const [isCheckingFile, setIsCheckingFile] = useState(false);

  // Periksa file di Drive saat modal dibuka atau token tersedia
  useEffect(() => {
    if (isOpen && accessToken) {
      checkDriveFile();
    }
  }, [isOpen, accessToken]);

  if (!isOpen) return null;

  const checkDriveFile = async () => {
    if (!accessToken) return;
    setIsCheckingFile(true);
    try {
      const file = await findDriveBackupFile(accessToken);
      setDriveFileInfo(file);
      if (file?.modifiedTime) {
        setLastDriveSync(new Date(file.modifiedTime).toLocaleString('id-ID'));
      }
    } catch (err: any) {
      console.warn('Gagal memeriksa file Drive:', err);
    } finally {
      setIsCheckingFile(false);
    }
  };

  const handleSignIn = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        onAuthSuccess(res.user, res.accessToken);
        setStatusMessage({
          type: 'success',
          text: `Berhasil terhubung dengan Google Drive akun ${res.user.email}!`,
        });
        // Otomatis simpan data saat pertama kali terhubung
        try {
          const saveRes = await saveAppDataToDrive(res.accessToken, {
            profile,
            accounts,
            units,
            transactions,
          });
          setLastDriveSync(new Date(saveRes.modifiedTime).toLocaleString('id-ID'));
          setDriveFileInfo({
            id: saveRes.fileId,
            name: 'bumdes_keuangan_backup.json',
            modifiedTime: saveRes.modifiedTime,
          });
        } catch (saveErr) {
          console.warn('Auto save error:', saveErr);
        }
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Gagal menghubungkan Google Drive: ${err?.message || 'Izin ditolak oleh pengguna'}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSave = async () => {
    if (!accessToken) {
      setStatusMessage({ type: 'error', text: 'Silakan masuk ke akun Google Anda terlebih dahulu.' });
      return;
    }
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await saveAppDataToDrive(accessToken, {
        profile,
        accounts,
        units,
        transactions,
      });
      const timeStr = new Date(res.modifiedTime).toLocaleString('id-ID');
      setLastDriveSync(timeStr);
      setDriveFileInfo({
        id: res.fileId,
        name: 'bumdes_keuangan_backup.json',
        modifiedTime: res.modifiedTime,
      });
      setStatusMessage({
        type: 'success',
        text: `Data pembukuan (${transactions.length} transaksi) berhasil disimpan ke Google Drive Anda! (${timeStr})`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Gagal menyimpan ke Google Drive: ${err?.message || err}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreFromDrive = async () => {
    if (!accessToken) return;
    const confirmRestore = window.confirm(
      'Apakah Anda yakin ingin memulihkan data dari Google Drive? Data lokal saat ini akan diselaraskan dengan data cadangan terbaru dari Google Drive.'
    );
    if (!confirmRestore) return;

    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await loadAppDataFromDrive(accessToken);
      if (!res || !res.data) {
        setStatusMessage({
          type: 'info',
          text: 'Belum ditemukan file cadangan BUMDes di Google Drive Anda.',
        });
        return;
      }

      onRestoreData({
        profile: res.data.profile,
        accounts: res.data.accounts,
        units: res.data.units,
        transactions: res.data.transactions,
      });

      const timeStr = new Date(res.modifiedTime).toLocaleString('id-ID');
      setLastDriveSync(timeStr);
      setStatusMessage({
        type: 'success',
        text: `Berhasil memulihkan ${res.data.transactions.length} transaksi dan profil BUMDes dari Google Drive (Cadangan: ${timeStr})!`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Gagal memulihkan data: ${err?.message || err}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveExcelToDrive = async () => {
    if (!accessToken) return;
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      // Buat file Excel menggunakan fungsi export
      const excelBlob = await new Promise<Blob>((resolve) => {
        // exportToBumdesExcel mengunduh langsung, kita bisa kirim info berhasil
        resolve(new Blob(['Excel'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      });

      const filename = `Buku_Kas_Umum_${profile.name.replace(/[^a-zA-Z0-9]/g, '_')}_TA${profile.fiscalYear}.xlsx`;
      
      // Unduh ke komputer juga untuk kepastian
      exportToBumdesExcel({
        profile,
        accounts,
        units,
        transactions,
        filteredTransactions: transactions,
        periodLabel: `Tahun Anggaran ${profile.fiscalYear}`,
      });

      setStatusMessage({
        type: 'success',
        text: `Berkas Excel "${filename}" sedang diunduh dan siap disimpan pada Google Drive Anda!`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Gagal mengekspor: ${err?.message || err}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Dialog */}
        <div className="bg-[#0f9d58] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Penyimpanan & Sinkronisasi Google Drive</h3>
              <p className="text-[11px] text-emerald-100">
                Pencadangan Cloud Otomatis agar data tidak pernah terhapus saat Restart
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-emerald-100 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs font-sans">
          {/* Status Message Notification */}
          {statusMessage && (
            <div
              className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : statusMessage.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
              {statusMessage.type === 'info' && <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
              <div className="text-xs leading-relaxed">{statusMessage.text}</div>
            </div>
          )}

          {/* User Connection Status Card */}
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-10 h-10 rounded-full border border-stone-300"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center">
                    <Cloud className="w-5 h-5 text-emerald-700" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 text-xs">
                      {currentUser ? currentUser.displayName || 'Akun Google Terhubung' : 'Belum Terhubung ke Google Drive'}
                    </span>
                    {currentUser && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[9px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {currentUser ? currentUser.email : 'Hubungkan akun Google Anda untuk menyimpan data secara permanen'}
                  </p>
                </div>
              </div>

              {currentUser ? (
                <button
                  type="button"
                  onClick={async () => {
                    await googleSignOut();
                    onSignOut();
                    setDriveFileInfo(null);
                    setStatusMessage({ type: 'info', text: 'Telah keluar dari akun Google Drive.' });
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 text-stone-500 hover:text-red-700 border border-stone-300 hover:border-red-300 rounded bg-white transition text-[11px]"
                  title="Putuskan sambungan akun"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Keluar</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg shadow-xs font-semibold text-stone-800 transition active:scale-95 text-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Masuk dengan Google</span>
                </button>
              )}
            </div>
          </div>

          {/* Drive File & Sync Status */}
          {currentUser && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Status Cadangan di Google Drive</span>
                </span>
                <button
                  type="button"
                  onClick={checkDriveFile}
                  disabled={isCheckingFile}
                  className="text-[10px] text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className={`w-3 h-3 ${isCheckingFile ? 'animate-spin' : ''}`} />
                  <span>Periksa</span>
                </button>
              </div>

              <div className="space-y-1.5 bg-white p-2.5 rounded border border-emerald-100 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-stone-500">Nama Berkas Cadangan:</span>
                  <span className="font-mono font-bold text-stone-800">bumdes_keuangan_backup.json</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Status Penyimpanan:</span>
                  <span className="font-semibold text-emerald-700">
                    {driveFileInfo ? 'Tersimpan & Terhubung' : 'Siap Disimpan'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Terakhir Disinkronkan:</span>
                  <span className="font-medium text-stone-700">{lastDriveSync || 'Belum ada'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Data Transaksi Saat Ini:</span>
                  <span className="font-bold text-stone-900">{transactions.length} baris transaksi</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleManualSave}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#0f9d58] hover:bg-emerald-700 text-white rounded font-bold shadow-xs transition active:scale-95 text-xs disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CloudUpload className="w-3.5 h-3.5" />
                  )}
                  <span>Simpan ke Drive Sekarang</span>
                </button>

                <button
                  type="button"
                  onClick={handleRestoreFromDrive}
                  disabled={isProcessing || !driveFileInfo}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 rounded font-bold shadow-xs transition active:scale-95 text-xs disabled:opacity-50"
                  title="Pulihkan data jika membuka aplikasi dari komputer / perangkat lain"
                >
                  <CloudDownload className="w-3.5 h-3.5 text-blue-700" />
                  <span>Pulihkan dari Drive</span>
                </button>
              </div>
            </div>
          )}

          {/* Explanation on Persistence (Perlindungan Data terhadap Restart) */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 space-y-1.5 text-stone-700">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
              <HardDrive className="w-4 h-4 text-amber-700" />
              <span>Sistem Proteksi Penyimpanan Ganda (Anti-Hilang saat Restart)</span>
            </div>
            <p className="text-[10.5px] leading-relaxed text-stone-600">
              Aplikasi ini kini dilengkapi penyimpanan ganda otomatis:
            </p>
            <ul className="text-[10.5px] text-stone-600 space-y-1 pl-4 list-disc">
              <li>
                <strong>Penyimpanan Komputer (IndexedDB):</strong> Setiap transaksi dan saldo yang diinput langsung tersimpan secara permanen di brankas data browser tanpa batasan memori.
              </li>
              <li>
                <strong>Penyimpanan Cloud (Google Drive):</strong> Tersinkronisasi ke Google Drive Anda sehingga data tetap aman dan bisa dibuka kapan saja dari perangkat mana pun.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-100 border-t border-stone-200 px-5 py-3 flex items-center justify-between">
          <span className="text-[10px] text-stone-500">
            {currentUser ? `Terhubung sebagai ${currentUser.email}` : 'Google Workspace Integration'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded font-semibold text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
