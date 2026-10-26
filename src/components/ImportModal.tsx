import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Download, AlertCircle } from 'lucide-react';
import { Transaction } from '../types';
import { parseUploadedExcel } from '../utils/excelExport';

interface ImportModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onImportTransactions: (txs: Partial<Transaction>[]) => void;
  onDownloadTemplate: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen = true,
  onClose,
  onImportTransactions,
  onDownloadTemplate,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleProcessImport = async () => {
    if (!file) {
      setError('Silakan pilih file Excel (.xlsx / .xls) atau .csv terlebih dahulu.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const parsed = await parseUploadedExcel(file);
      if (parsed.length === 0) {
        setError('Tidak ada data transaksi valid yang ditemukan dalam file ini.');
        setLoading(false);
        return;
      }

      onImportTransactions(parsed);
      alert(`Berhasil mengimpor ${parsed.length} transaksi ke dalam Buku Kas BUMDes!`);
      onClose();
    } catch (err: any) {
      setError('Gagal membaca file: ' + (err.message || 'Format tidak didukung'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200">
        <div className="bg-[#107c41] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            <h3 className="font-bold text-sm">Impor Transaksi dari Excel / CSV</h3>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs font-sans">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              Petunjuk Impor Data:
            </p>
            <p className="text-[11px] text-amber-800">
              Unggah file Excel hasil ekspor aplikasi ini atau spreadsheet dengan susunan kolom:
              <br />
              <code className="font-mono font-bold text-amber-950">
                [No, Tanggal, No Bukti, Uraian, Kode Akun, ..., Penerimaan, Pengeluaran]
              </code>
            </p>
          </div>

          <div className="border-2 border-dashed border-stone-300 rounded-lg p-6 text-center hover:border-emerald-600 transition bg-stone-50">
            <FileSpreadsheet className="w-10 h-10 text-stone-400 mx-auto mb-2" />
            <p className="font-semibold text-stone-700 mb-1">
              Pilih File Spreadsheet (.xlsx, .xls, .csv)
            </p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="mt-2 text-stone-600 file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-700 file:text-white hover:file:bg-emerald-800 cursor-pointer"
            />
            {file && (
              <p className="mt-2 text-emerald-800 font-medium">
                File terpilih: <span className="font-bold">{file.name}</span> (
                {Math.round(file.size / 1024)} KB)
              </p>
            )}
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onDownloadTemplate}
              className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Format Template Excel</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 border border-stone-300 text-stone-700 rounded hover:bg-stone-100 font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!file || loading}
                onClick={handleProcessImport}
                className="px-4 py-1.5 bg-[#107c41] hover:bg-emerald-700 disabled:opacity-50 text-white rounded font-bold shadow flex items-center gap-1.5"
              >
                {loading ? 'Memproses...' : 'Impor Sekarang'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
