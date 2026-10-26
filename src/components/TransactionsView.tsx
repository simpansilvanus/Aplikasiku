import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Edit3, 
  Trash2, 
  ArrowDownLeft, 
  ArrowUpRight,
  CreditCard,
  Building2,
  Printer,
  Eye,
  FileDown,
  Download
} from 'lucide-react';
import { Account, BumdesProfile, BusinessUnit, Transaction } from '../types';
import { formatRupiah, formatTanggalSingkat } from '../utils/formatters';
import { OfficialSignatures } from './OfficialSignatures';

interface TransactionsViewProps {
  profile: BumdesProfile;
  accounts: Account[];
  units: BusinessUnit[];
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  onOpenAddTx: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onPrintReceipt: (tx: Transaction) => void;
  onPrint?: () => void;
  onDownloadPdf?: () => void;
  onDownloadExcel?: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  profile,
  accounts,
  units,
  filteredTransactions,
  onOpenAddTx,
  onEditTransaction,
  onDeleteTransaction,
  onPrintReceipt,
  onPrint,
  onDownloadPdf,
  onDownloadExcel,
}) => {
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'KAS' | 'BANK'>('ALL');

  const accountMap = new Map(accounts.map((a) => [a.code, a]));
  const unitMap = new Map(units.map((u) => [u.id, u.name]));

  // Apply sub-filters
  const displayed = filteredTransactions.filter((tx) => {
    if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false;
    if (methodFilter !== 'ALL' && tx.paymentMethod !== methodFilter) return false;
    return true;
  });

  const totalMasuk = displayed
    .filter((t) => t.type === 'IN')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalKeluar = displayed
    .filter((t) => t.type === 'OUT')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-4">
      {/* Official Header with Logo BUMDes & Print Toolbar */}
      <div className="bg-white border border-stone-200 shadow-sm p-6 rounded-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#107c41]"></div>

        {/* Quick Toolbar (Screen only) with Print Preview, Print, Download PDF, Download Excel */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-stone-100 print:hidden">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-purple-600"></span>
            <span>Buku Jurnal & Rekapitulasi Transaksi · {displayed.length} Transaksi</span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={onPrint || (() => window.print())}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs rounded-lg shadow-sm transition active:scale-95"
              title="Buka Print Preview A4 Jurnal Transaksi"
            >
              <Eye className="w-3.5 h-3.5 text-amber-300" />
              <span>Print Preview</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-white font-semibold text-xs rounded-lg shadow-sm transition active:scale-95"
              title="Cetak langsung ke printer (Ctrl+P)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={onDownloadPdf || onPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-lg shadow-sm transition active:scale-95"
              title="Unduh Dokumen Jurnal Transaksi dalam format PDF (.pdf)"
            >
              <FileDown className="w-3.5 h-3.5 text-stone-900" />
              <span>Download PDF</span>
            </button>

            {onDownloadExcel && (
              <button
                onClick={onDownloadExcel}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-sm transition active:scale-95"
                title="Unduh seluruh buku laporan ke format Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Excel</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-stone-800/80 pb-4 mb-4 gap-4">
          <div className="flex-shrink-0">
            <img
              src={profile.logoUrl || '/logo-bumdes.jpg'}
              alt={`Logo ${profile.name}`}
              className="w-20 h-20 md:w-24 md:h-24 object-contain rounded-full border border-stone-200 shadow-sm bg-white"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <div className="flex-1 text-center">
            <h3 className="text-xs uppercase tracking-widest text-stone-600 font-bold">
              PEMERINTAH {profile.district.toUpperCase()}
            </h3>
            <h2 className="text-sm font-semibold uppercase text-stone-800">
              {profile.subdistrict.toUpperCase()} · {profile.village.toUpperCase()}
            </h2>
            <h1 className="text-xl font-black uppercase text-emerald-900 tracking-wide mt-1">
              {profile.name}
            </h1>
            {profile.ahuNumber && (
              <p className="text-xs font-bold text-stone-900 mt-0.5 tracking-wide">
                Sertifikat Pendaftaran Badan Hukum No. AHU: {profile.ahuNumber}
              </p>
            )}
            <p className="text-xs text-stone-600 mt-0.5">
              Badan Usaha Milik Desa berdasarkan PP No. 11 Tahun 2021 & Permendesa PDTT
            </p>
          </div>

          {/* Logo Kabupaten (Sebelah Kanan) */}
          <div className="flex-shrink-0">
            {profile.regencyLogoUrl ? (
              <img
                src={profile.regencyLogoUrl}
                alt={`Logo ${profile.district}`}
                className="w-20 h-20 md:w-24 md:h-24 object-contain rounded-lg border border-stone-200 shadow-sm bg-white p-1"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-20 md:w-24 hidden sm:block opacity-0"></div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-semibold text-stone-800 px-2">
          <div>
            <span className="text-stone-500">DOKUMEN KEUANGAN:</span>{' '}
            <span className="text-purple-900 font-bold text-sm">
              BUKU JURNAL & REKAP TRANSAKSI ({displayed.length} Transaksi)
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-stone-500">TAHUN ANGGARAN:</span> {profile.fiscalYear}
            </div>
          </div>
        </div>
      </div>

      {/* Top Controls & Metrics */}
      <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Tipe filter */}
          <div className="flex items-center bg-stone-100 p-1 rounded-md">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1 font-medium rounded transition ${
                typeFilter === 'ALL' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Semua Jenis
            </button>
            <button
              onClick={() => setTypeFilter('IN')}
              className={`px-3 py-1 font-medium rounded transition flex items-center gap-1 ${
                typeFilter === 'IN' ? 'bg-emerald-700 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ArrowDownLeft className="w-3 h-3" />
              Penerimaan (BKM)
            </button>
            <button
              onClick={() => setTypeFilter('OUT')}
              className={`px-3 py-1 font-medium rounded transition flex items-center gap-1 ${
                typeFilter === 'OUT' ? 'bg-red-700 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ArrowUpRight className="w-3 h-3" />
              Pengeluaran (BKK)
            </button>
          </div>

          {/* Metode filter */}
          <div className="flex items-center bg-stone-100 p-1 rounded-md">
            <button
              onClick={() => setMethodFilter('ALL')}
              className={`px-3 py-1 font-medium rounded transition ${
                methodFilter === 'ALL' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Kas & Bank
            </button>
            <button
              onClick={() => setMethodFilter('KAS')}
              className={`px-3 py-1 font-medium rounded transition ${
                methodFilter === 'KAS' ? 'bg-amber-700 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Tunai
            </button>
            <button
              onClick={() => setMethodFilter('BANK')}
              className={`px-3 py-1 font-medium rounded transition ${
                methodFilter === 'BANK' ? 'bg-blue-700 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {profile.bankName ? (profile.bankName.length > 15 ? profile.bankName.slice(0, 15) + '...' : profile.bankName) : 'Bank'}
            </button>
          </div>
        </div>

        {/* Quick add and totals */}
        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <div className="text-stone-500">
              Total {displayed.length} Transaksi:
            </div>
            <div className="font-mono font-bold text-stone-800">
              <span className="text-emerald-700">+{formatRupiah(totalMasuk)}</span> /{' '}
              <span className="text-red-700">-{formatRupiah(totalKeluar)}</span>
            </div>
          </div>

          <button
            onClick={onOpenAddTx}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white rounded-md shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Transaksi</span>
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-stone-200 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead>
              <tr className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200 text-center">
                <th className="w-12 py-2.5">No</th>
                <th className="w-24 py-2.5">Tanggal</th>
                <th className="w-36 py-2.5">No. Bukti</th>
                <th className="py-2.5 px-3 min-w-[260px] text-left">Uraian Transaksi</th>
                <th className="w-24 py-2.5">Kode Rek.</th>
                <th className="w-36 py-2.5">Nama Rekening</th>
                <th className="w-32 py-2.5">Unit Usaha</th>
                <th className="w-24 py-2.5">Metode</th>
                <th className="w-32 py-2.5">Nominal (Rp)</th>
                <th className="w-28 py-2.5 print:hidden">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-200 text-stone-800">
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-stone-400">
                    Tidak ada transaksi yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                displayed.map((tx, idx) => {
                  const acc = accountMap.get(tx.accountCode);
                  const unitName = unitMap.get(tx.unitId) || tx.unitId;

                  return (
                    <tr key={tx.id} className="hover:bg-stone-50 transition">
                      <td className="py-2 text-center font-mono text-stone-400">{idx + 1}</td>
                      <td className="py-2 text-center font-mono text-stone-700">
                        {formatTanggalSingkat(tx.date)}
                      </td>
                      <td className="py-2 text-center font-mono font-semibold text-stone-800">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] ${
                            tx.type === 'IN'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-red-50 text-red-800 border border-red-200'
                          }`}
                        >
                          {tx.docNumber}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-stone-900">
                        <div className="font-medium">{tx.description}</div>
                        {tx.recipientOrPayer && (
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            {tx.type === 'IN' ? 'Dari: ' : 'Kepada: '}
                            <span className="font-medium text-stone-700">{tx.recipientOrPayer}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2 text-center font-mono text-stone-600 font-medium">
                        {tx.accountCode}
                      </td>
                      <td className="py-2 text-stone-700 truncate max-w-[150px]">{acc?.name || '-'}</td>
                      <td className="py-2 text-stone-600 text-[11px] truncate max-w-[120px]">
                        {unitName}
                      </td>
                      <td className="py-2 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            tx.paymentMethod === 'KAS'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-blue-100 text-blue-900 border border-blue-300'
                          }`}
                        >
                          {tx.paymentMethod === 'KAS' ? 'KAS TUNAI' : 'BANK BRI'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold whitespace-nowrap">
                        <span className={tx.type === 'IN' ? 'text-emerald-700' : 'text-red-700'}>
                          {tx.type === 'IN' ? '+' : '-'}
                          {formatRupiah(tx.amount)}
                        </span>
                      </td>
                      <td className="py-2 text-center whitespace-nowrap print:hidden">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onPrintReceipt(tx)}
                            title="Cetak Kuitansi Resmi"
                            className="p-1 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditTransaction(tx)}
                            title="Edit Transaksi"
                            className="p-1 text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(tx.id)}
                            title="Hapus Transaksi"
                            className="p-1 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Signatures Section */}
      <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-sm">
        <OfficialSignatures profile={profile} />
      </div>
    </div>
  );
};
