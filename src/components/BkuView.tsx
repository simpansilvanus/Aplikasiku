import React, { useState } from 'react';
import { 
  Printer, 
  Trash2, 
  Edit3, 
  FileText, 
  ArrowDownLeft, 
  ArrowUpRight,
  ShieldCheck,
  Building,
  Info,
  Eye,
  FileDown,
  Download
} from 'lucide-react';
import { Account, BumdesProfile, BusinessUnit, Transaction } from '../types';
import { formatRupiah, formatTanggalSingkat, formatTanggalIndo } from '../utils/formatters';

interface BkuViewProps {
  profile: BumdesProfile;
  accounts: Account[];
  units: BusinessUnit[];
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  periodLabel: string;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onPrintReceipt: (tx: Transaction) => void;
  onSelectCell: (cellName: string, value: string) => void;
  onPrint?: () => void;
  onDownloadPdf?: () => void;
  onDownloadExcel?: () => void;
}

export const BkuView: React.FC<BkuViewProps> = ({
  profile,
  accounts,
  units,
  transactions,
  filteredTransactions,
  periodLabel,
  onEditTransaction,
  onDeleteTransaction,
  onPrintReceipt,
  onSelectCell,
  onPrint,
  onDownloadPdf,
  onDownloadExcel,
}) => {
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const accountMap = new Map(accounts.map((a) => [a.code, a]));
  const unitMap = new Map(units.map((u) => [u.id, u.name]));

  // Calculate cumulative balance row by row
  // Saldo awal adalah saldo kas tunai + bank
  const initialTotalBalance = profile.initialCash + profile.initialBank;

  // Sort by date ascending for chronological ledger
  const sortedTx = [...filteredTransactions].sort((a, b) => a.date.localeCompare(b.date));

  let runningBalance = initialTotalBalance;
  let totalMasuk = initialTotalBalance;
  let totalKeluar = 0;

  const rowsWithBalance = sortedTx.map((tx) => {
    const masuk = tx.type === 'IN' ? tx.amount : 0;
    const keluar = tx.type === 'OUT' ? tx.amount : 0;
    runningBalance = runningBalance + masuk - keluar;
    totalMasuk += masuk;
    totalKeluar += keluar;

    return {
      tx,
      masuk,
      keluar,
      balanceAfter: runningBalance,
    };
  });

  // Calculate actual physical cash & bank breakdown for Kas Opname
  let physicalCash = profile.initialCash;
  let physicalBank = profile.initialBank;
  for (const t of sortedTx) {
    if (t.paymentMethod === 'KAS') {
      physicalCash += t.type === 'IN' ? t.amount : -t.amount;
    } else {
      physicalBank += t.type === 'IN' ? t.amount : -t.amount;
    }
  }

  const finalBkuBalance = runningBalance;
  const totalRiil = physicalCash + physicalBank;
  const selisih = finalBkuBalance - totalRiil;

  return (
    <div className="space-y-6">
      {/* Official Document Paper Header (Print & Screen) */}
      <div className="bg-white border border-stone-200 shadow-sm p-6 rounded-lg text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#107c41]"></div>
        
        {/* Quick Toolbar (Screen only) with Print Preview, Print, Download PDF, Download Excel */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-stone-100 print:hidden">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Buku Kas Umum (BKU) · Standar Kemendesa PDTT</span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={onPrint || (() => window.print())}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs rounded-lg shadow-sm transition active:scale-95"
              title="Buka Print Preview A4 BKU Resmi"
            >
              <Eye className="w-3.5 h-3.5 text-amber-300" />
              <span>Print Preview BKU</span>
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
              title="Unduh Dokumen BKU dalam format PDF (.pdf)"
            >
              <FileDown className="w-3.5 h-3.5 text-stone-900" />
              <span>Download PDF</span>
            </button>

            {onDownloadExcel && (
              <button
                onClick={onDownloadExcel}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-sm transition active:scale-95"
                title="Unduh BKU dalam format Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Excel</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-stone-800/80 pb-4 mb-4 gap-4">
          {/* Logo BUMDes */}
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

          {/* Teks Kop Surat */}
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
            <span className="text-emerald-900 font-bold text-sm">BUKU KAS UMUM (BKU)</span>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-stone-500">PERIODE:</span> {periodLabel}
            </div>
            <div>
              <span className="text-stone-500">TAHUN ANGGARAN:</span> {profile.fiscalYear}
            </div>
          </div>
        </div>
      </div>

      {/* Spreadsheet Grid Container */}
      <div className="bg-white border border-stone-200 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans border-collapse">
            {/* Excel Alphabetical Column Header Bar */}
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200 text-stone-500 font-mono text-[10px] select-none">
                <th className="w-10 px-2 py-1 text-center border-r border-stone-200"></th>
                <th className="px-3 py-1 border-r border-stone-200 text-center">A</th>
                <th className="px-3 py-1 border-r border-stone-200 text-center">B</th>
                <th className="px-3 py-1 border-r border-stone-200 text-center">C</th>
                <th className="px-3 py-1 border-r border-stone-200 text-center">D</th>
                <th className="px-3 py-1 border-r border-stone-200 text-center">E</th>
                <th className="px-3 py-1 border-r border-stone-200 text-center">F</th>
                <th className="px-3 py-1 border-r border-stone-200 text-center">G</th>
                <th className="px-3 py-1 border-r border-stone-200 text-center">H</th>
                <th className="px-3 py-1 border-r border-stone-200 text-center">I</th>
                <th className="px-3 py-1 border-r border-stone-200 text-center">J</th>
                <th className="px-2 py-1 text-center print:hidden">K</th>
              </tr>

              {/* Official Table Header Columns */}
              <tr className="bg-emerald-800 text-white font-semibold text-center text-xs divide-x divide-emerald-700">
                <th className="w-10 py-2.5">No</th>
                <th className="w-24 py-2.5">Tanggal</th>
                <th className="w-36 py-2.5">No. Bukti</th>
                <th className="py-2.5 px-3 min-w-[240px]">Uraian Transaksi</th>
                <th className="w-24 py-2.5">Kode Rek.</th>
                <th className="w-36 py-2.5">Nama Akun</th>
                <th className="w-32 py-2.5">Unit Usaha</th>
                <th className="w-24 py-2.5">Metode</th>
                <th className="w-32 py-2.5">Penerimaan (Rp)</th>
                <th className="w-32 py-2.5">Pengeluaran (Rp)</th>
                <th className="w-36 py-2.5">Saldo Kumulatif (Rp)</th>
                <th className="w-24 py-2.5 print:hidden">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-200 font-normal text-stone-800">
              {/* Row 1: Saldo Awal Tahun Buku */}
              <tr 
                onClick={() => onSelectCell('A1', `Saldo Awal: ${formatRupiah(initialTotalBalance)}`)}
                className="bg-emerald-50/50 hover:bg-emerald-100/40 transition cursor-pointer font-medium"
              >
                <td className="px-2 py-2 text-center text-stone-400 font-mono text-[11px] bg-stone-50 border-r border-stone-200">
                  1
                </td>
                <td className="px-2 py-2 text-center text-stone-600 font-mono">
                  {profile.fiscalYear}-01-01
                </td>
                <td className="px-2 py-2 text-center font-mono text-stone-500">-</td>
                <td className="px-3 py-2 font-semibold text-emerald-950">
                  SALDO AWAL TAHUN BUKU (Kas Tunai + Rekening Bank BRI)
                </td>
                <td className="px-2 py-2 text-center font-mono text-stone-600">1.1.00</td>
                <td className="px-2 py-2 text-stone-600">Kas & Setara Kas Awal</td>
                <td className="px-2 py-2 text-stone-500">Kantor Pengelola</td>
                <td className="px-2 py-2 text-center">
                  <span className="text-[11px] font-semibold text-stone-700 bg-stone-200/80 px-1.5 py-0.5 rounded">
                    GABUNGAN
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-700">
                  {formatRupiah(initialTotalBalance)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-stone-400">-</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-900 bg-emerald-100/30">
                  {formatRupiah(initialTotalBalance)}
                </td>
                <td className="px-2 py-2 text-center text-stone-400 print:hidden">-</td>
              </tr>

              {/* Transaction Rows */}
              {rowsWithBalance.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-stone-400">
                    <Info className="w-6 h-6 mx-auto mb-2 text-stone-300" />
                    Tidak ada transaksi pada filter periode ini.
                  </td>
                </tr>
              ) : (
                rowsWithBalance.map((item, idx) => {
                  const { tx, masuk, keluar, balanceAfter } = item;
                  const acc = accountMap.get(tx.accountCode);
                  const unitName = unitMap.get(tx.unitId) || tx.unitId;
                  const isSelected = selectedRowId === tx.id;
                  const rowNumber = idx + 2;

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => {
                        setSelectedRowId(tx.id);
                        onSelectCell(
                          `BKU-R${rowNumber}`,
                          `${tx.docNumber} | ${tx.description} | ${formatRupiah(tx.amount)}`
                        );
                      }}
                      className={`hover:bg-amber-50/60 transition cursor-pointer ${
                        isSelected ? 'bg-amber-100/60' : idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/40'
                      }`}
                    >
                      {/* Excel Row Index */}
                      <td className="px-2 py-2 text-center text-stone-400 font-mono text-[11px] bg-stone-50 border-r border-stone-200">
                        {rowNumber}
                      </td>

                      {/* Tanggal */}
                      <td className="px-2 py-2 text-center font-mono text-stone-700 whitespace-nowrap">
                        {formatTanggalSingkat(tx.date)}
                      </td>

                      {/* No Bukti */}
                      <td className="px-2 py-2 text-center font-mono font-semibold text-stone-800 whitespace-nowrap">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                          tx.type === 'IN' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                          {tx.docNumber}
                        </span>
                      </td>

                      {/* Uraian */}
                      <td className="px-3 py-2 text-stone-900 leading-snug">
                        <div className="font-medium">{tx.description}</div>
                        {tx.recipientOrPayer && (
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            {tx.type === 'IN' ? 'Dari: ' : 'Kepada: '}
                            <span className="font-semibold text-stone-700">{tx.recipientOrPayer}</span>
                          </div>
                        )}
                      </td>

                      {/* Kode Akun */}
                      <td className="px-2 py-2 text-center font-mono text-stone-600 font-medium">
                        {tx.accountCode}
                      </td>

                      {/* Nama Rekening */}
                      <td className="px-2 py-2 text-stone-700 truncate max-w-[150px]" title={acc?.name}>
                        {acc?.name || '-'}
                      </td>

                      {/* Unit Usaha */}
                      <td className="px-2 py-2 text-stone-600 text-[11px] truncate max-w-[120px]" title={unitName}>
                        {unitName}
                      </td>

                      {/* Metode */}
                      <td className="px-2 py-2 text-center whitespace-nowrap">
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

                      {/* Penerimaan */}
                      <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-700 whitespace-nowrap">
                        {masuk > 0 ? formatRupiah(masuk) : '-'}
                      </td>

                      {/* Pengeluaran */}
                      <td className="px-3 py-2 text-right font-mono font-semibold text-red-700 whitespace-nowrap">
                        {keluar > 0 ? formatRupiah(keluar) : '-'}
                      </td>

                      {/* Saldo Kumulatif */}
                      <td className="px-3 py-2 text-right font-mono font-bold text-stone-900 bg-stone-100/50 whitespace-nowrap">
                        {formatRupiah(balanceAfter)}
                      </td>

                      {/* Actions */}
                      <td className="px-2 py-2 text-center whitespace-nowrap print:hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onPrintReceipt(tx)}
                            title="Cetak Kuitansi / Bukti Kas Resmi"
                            className="p-1 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditTransaction(tx)}
                            title="Ubah Transaksi"
                            className="p-1 text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteTransaction(tx.id);
                            }}
                            title="Hapus Transaksi dari BKU"
                            aria-label="Hapus Transaksi"
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

              {/* Total Summary Row */}
              <tr className="bg-emerald-900 text-white font-bold font-mono">
                <td className="py-2.5 text-center text-emerald-300 bg-emerald-950">Σ</td>
                <td colSpan={7} className="px-4 py-2.5 text-left font-sans text-xs tracking-wider uppercase">
                  JUMLAH TOTAL PENUTUPAN BKU (PERIODE {periodLabel})
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-emerald-200">
                  {formatRupiah(totalMasuk)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-red-300">
                  {formatRupiah(totalKeluar)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-amber-300 text-sm bg-emerald-950">
                  {formatRupiah(finalBkuBalance)}
                </td>
                <td className="print:hidden bg-emerald-950"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Reconciliation (Berita Acara Kas Opname / Penutupan Kas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
        {/* Kas Opname Table */}
        <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm text-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <h4 className="font-bold text-stone-800 uppercase tracking-wide">
              BERITA ACARA PENUTUPAN KAS (KAS OPNAME)
            </h4>
          </div>

          <div className="space-y-2 text-stone-700">
            <div className="flex justify-between items-center py-1 border-b border-stone-100 font-medium">
              <span>A. Saldo Menurut Buku Kas Umum (BKU):</span>
              <span className="font-mono font-bold text-stone-900">{formatRupiah(finalBkuBalance)}</span>
            </div>

            <div className="pl-3 space-y-1.5 text-stone-600">
              <div className="text-[11px] font-semibold text-stone-700">B. Saldo Riil Fisik Terdiri Atas:</div>
              <div className="flex justify-between items-center">
                <span>1. Saldo Kas Tunai (di Bendahara)</span>
                <span className="font-mono text-stone-900 font-semibold">{formatRupiah(physicalCash)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>2. Saldo Rekening Bank ({profile.bankName})</span>
                <span className="font-mono text-blue-900 font-semibold">{formatRupiah(physicalBank)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-1.5 border-t border-b border-stone-200 font-semibold text-stone-900">
              <span>Jumlah Saldo Riil Fisik (1 + 2):</span>
              <span className="font-mono">{formatRupiah(totalRiil)}</span>
            </div>

            <div className={`flex justify-between items-center py-1.5 px-3 rounded font-bold ${
              selisih === 0 ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-red-50 text-red-900 border border-red-200'
            }`}>
              <span>C. Selisih Kas (A - B):</span>
              <span className="font-mono">{formatRupiah(selisih)} {selisih === 0 ? '(NIHIL / SEIMBANG)' : '(SELISIH)'}</span>
            </div>
          </div>
        </div>

        {/* Bank & Entity Info Card */}
        <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm text-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
            <Building className="w-4 h-4 text-emerald-700" />
            <h4 className="font-bold text-stone-800 uppercase tracking-wide">
              INFORMASI REKENING & PENGELOLA BUMDES
            </h4>
          </div>

          <div className="space-y-2 text-stone-600">
            <div className="flex justify-between">
              <span className="text-stone-500">Nama Bank:</span>
              <span className="font-semibold text-stone-900">{profile.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Nomor Rekening:</span>
              <span className="font-mono font-semibold text-stone-900">{profile.bankAccount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Atas Nama:</span>
              <span className="font-semibold text-stone-900">{profile.name}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-stone-100">
              <span className="text-stone-500">Penasihat (Kades):</span>
              <span className="font-semibold text-stone-900">{profile.headOfVillage}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Direktur BUMDes:</span>
              <span className="font-semibold text-stone-900">{profile.director}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Bendahara BUMDes:</span>
              <span className="font-semibold text-stone-900">{profile.treasurer}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Official Signatures Section (Standar Laporan Desa) */}
      <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-sm text-xs">
        <div className="text-right text-stone-600 mb-4">
          {profile.village}, {formatTanggalIndo(new Date().toISOString().split('T')[0])}
        </div>

        <div className="grid grid-cols-3 gap-6 text-center">
          {/* Kolom 1: Penasihat */}
          <div className="flex flex-col justify-between h-32">
            <div>
              <p className="font-semibold text-stone-800">Mengetahui,</p>
              <p className="text-stone-600 font-medium">Penasihat / Kepala Desa</p>
            </div>
            <div>
              <p className="font-bold underline text-stone-900">{profile.headOfVillage}</p>
              <p className="text-[10px] text-stone-500">Kepala Desa {profile.village}</p>
            </div>
          </div>

          {/* Kolom 2: Direktur BUMDes */}
          <div className="flex flex-col justify-between h-32">
            <div>
              <p className="font-semibold text-stone-800">Menyetujui,</p>
              <p className="text-stone-600 font-medium">Direktur BUMDes</p>
            </div>
            <div>
              <p className="font-bold underline text-stone-900">{profile.director}</p>
              <p className="text-[10px] text-stone-500">Direktur Utama</p>
            </div>
          </div>

          {/* Kolom 3: Bendahara */}
          <div className="flex flex-col justify-between h-32">
            <div>
              <p className="font-semibold text-stone-800">Dibuat Oleh,</p>
              <p className="text-stone-600 font-medium">Bendahara BUMDes</p>
            </div>
            <div>
              <p className="font-bold underline text-stone-900">{profile.treasurer}</p>
              <p className="text-[10px] text-stone-500">Bendahara Operasional</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
