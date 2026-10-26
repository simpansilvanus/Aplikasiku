import React, { useState } from 'react';
import { Wallet, Landmark, ArrowDownLeft, ArrowUpRight, CheckCircle2, Printer, Eye, FileDown, Download } from 'lucide-react';
import { Account, BumdesProfile, Transaction } from '../types';
import { formatRupiah, formatTanggalSingkat } from '../utils/formatters';
import { OfficialSignatures } from './OfficialSignatures';

interface CashBankViewProps {
  profile: BumdesProfile;
  accounts: Account[];
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  periodLabel: string;
  onPrint?: (mode?: 'cash' | 'bank' | 'cash_bank') => void;
  onDownloadPdf?: () => void;
  onDownloadExcel?: () => void;
}

export const CashBankView: React.FC<CashBankViewProps> = ({
  profile,
  accounts,
  filteredTransactions,
  periodLabel,
  onPrint,
  onDownloadPdf,
  onDownloadExcel,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'KAS' | 'BANK'>('KAS');

  const accountMap = new Map(accounts.map((a) => [a.code, a]));

  // Sort chronological
  const sortedTx = [...filteredTransactions].sort((a, b) => a.date.localeCompare(b.date));

  // 1. Kas Tunai
  const kasTx = sortedTx.filter((t) => t.paymentMethod === 'KAS');
  let runningKas = profile.initialCash;
  let totalKasMasuk = profile.initialCash;
  let totalKasKeluar = 0;

  const kasRows = kasTx.map((tx) => {
    const masuk = tx.type === 'IN' ? tx.amount : 0;
    const keluar = tx.type === 'OUT' ? tx.amount : 0;
    runningKas = runningKas + masuk - keluar;
    totalKasMasuk += masuk;
    totalKasKeluar += keluar;

    return {
      tx,
      masuk,
      keluar,
      balance: runningKas,
    };
  });

  // 2. Bank BRI
  const bankTx = sortedTx.filter((t) => t.paymentMethod === 'BANK');
  let runningBank = profile.initialBank;
  let totalBankMasuk = profile.initialBank;
  let totalBankKeluar = 0;

  const bankRows = bankTx.map((tx) => {
    const masuk = tx.type === 'IN' ? tx.amount : 0;
    const keluar = tx.type === 'OUT' ? tx.amount : 0;
    runningBank = runningBank + masuk - keluar;
    totalBankMasuk += masuk;
    totalBankKeluar += keluar;

    return {
      tx,
      masuk,
      keluar,
      balance: runningBank,
    };
  });

  return (
    <div className="space-y-6">
      {/* Official Header with Logo BUMDes & Print Toolbar */}
      <div className="bg-white border border-stone-200 shadow-sm p-6 rounded-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#107c41]"></div>

        {/* Action Toolbar on Screen */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-stone-100 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wide">Pilihan Tampilan:</span>
            <button
              onClick={() => setActiveSubTab('KAS')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                activeSubTab === 'KAS'
                  ? 'bg-amber-500 text-stone-900 shadow-sm font-bold'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Buku Pembantu Kas
            </button>
            <button
              onClick={() => setActiveSubTab('BANK')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                activeSubTab === 'BANK'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Buku Pembantu Bank
            </button>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => onPrint ? onPrint(activeSubTab === 'KAS' ? 'cash' : 'bank') : window.print()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs rounded-lg shadow-sm transition active:scale-95"
              title="Buka Print Preview A4"
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
              onClick={() => onDownloadPdf ? onDownloadPdf() : onPrint ? onPrint(activeSubTab === 'KAS' ? 'cash' : 'bank') : window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-lg shadow-sm transition active:scale-95"
              title="Unduh Buku Kas/Bank ini dalam format file PDF (.pdf)"
            >
              <FileDown className="w-3.5 h-3.5 text-stone-900" />
              <span>Download PDF</span>
            </button>

            {onDownloadExcel && (
              <button
                onClick={onDownloadExcel}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-sm transition active:scale-95"
                title="Unduh seluruh buku ke format Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Excel</span>
              </button>
            )}

            <button
              onClick={() => onPrint ? onPrint('cash_bank') : window.print()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg shadow-sm transition active:scale-95 border border-emerald-600/50"
              title="Cetak Kas & Bank Bersama"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Cetak Keduanya</span>
            </button>
          </div>
        </div>

        {/* Kop Surat with Logo */}
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
            <span className="text-emerald-900 font-bold text-sm">
              {activeSubTab === 'KAS' ? 'BUKU PEMBANTU KAS TUNAI' : 'BUKU PEMBANTU BANK'}
            </span>
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

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Kas Tunai */}
        <div
          onClick={() => setActiveSubTab('KAS')}
          className={`p-5 rounded-lg border cursor-pointer transition shadow-sm ${
            activeSubTab === 'KAS'
              ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-400/30'
              : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Buku Pembantu Kas Tunai</h3>
                <p className="text-xs text-stone-500">Uang tunai brankas Bendahara BUMDes</p>
              </div>
            </div>
            {activeSubTab === 'KAS' && (
              <span className="text-[10px] font-bold uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                Aktif
              </span>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-amber-100 flex items-end justify-between">
            <div>
              <span className="text-xs text-stone-500">Saldo Akhir Tunai:</span>
              <div className="text-xl font-bold font-mono text-stone-900 mt-0.5">
                {formatRupiah(runningKas)}
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="text-emerald-700 font-mono">+{formatRupiah(totalKasMasuk)}</div>
              <div className="text-red-700 font-mono">-{formatRupiah(totalKasKeluar)}</div>
            </div>
          </div>
        </div>

        {/* Card Kas Bank */}
        <div
          onClick={() => setActiveSubTab('BANK')}
          className={`p-5 rounded-lg border cursor-pointer transition shadow-sm ${
            activeSubTab === 'BANK'
              ? 'bg-blue-50/60 border-blue-400 ring-2 ring-blue-400/30'
              : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Buku Pembantu Kas Bank</h3>
                <p className="text-xs text-stone-500">{profile.bankName} · {profile.bankAccount}</p>
              </div>
            </div>
            {activeSubTab === 'BANK' && (
              <span className="text-[10px] font-bold uppercase bg-blue-200 text-blue-900 px-2 py-0.5 rounded">
                Aktif
              </span>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-blue-100 flex items-end justify-between">
            <div>
              <span className="text-xs text-stone-500">Saldo Akhir Bank:</span>
              <div className="text-xl font-bold font-mono text-blue-950 mt-0.5">
                {formatRupiah(runningBank)}
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="text-emerald-700 font-mono">+{formatRupiah(totalBankMasuk)}</div>
              <div className="text-red-700 font-mono">-{formatRupiah(totalBankKeluar)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tab selection bar */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveSubTab('KAS')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition ${
            activeSubTab === 'KAS'
              ? 'bg-amber-800 text-white shadow-sm'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          1. Buku Pembantu Kas Tunai ({kasTx.length} Transaksi)
        </button>
        <button
          onClick={() => setActiveSubTab('BANK')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition ${
            activeSubTab === 'BANK'
              ? 'bg-blue-800 text-white shadow-sm'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          2. Buku Pembantu Bank BRI ({bankTx.length} Transaksi)
        </button>
      </div>

      {/* Detail Table */}
      <div className="bg-white border border-stone-200 shadow-sm rounded-lg overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-stone-900 text-sm">
              {activeSubTab === 'KAS'
                ? 'BUKU PEMBANTU KAS TUNAI BENDAHARA'
                : `BUKU PEMBANTU REKENING BANK (${profile.bankName})`}
            </h4>
            <p className="text-xs text-stone-500">
              Periode: {periodLabel} | BUMDes {profile.name}
            </p>
          </div>
          <div className="font-mono text-xs font-bold text-stone-800 bg-white px-3 py-1 rounded border border-stone-200">
            Saldo: {formatRupiah(activeSubTab === 'KAS' ? runningKas : runningBank)}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead>
              <tr className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200 text-center">
                <th className="w-12 py-2.5">No</th>
                <th className="w-24 py-2.5">Tanggal</th>
                <th className="w-36 py-2.5">No. Bukti</th>
                <th className="py-2.5 px-3 min-w-[260px] text-left">Uraian Transaksi</th>
                <th className="w-24 py-2.5">Kode Rek.</th>
                <th className="w-36 py-2.5">Nama Akun</th>
                <th className="w-32 py-2.5">
                  {activeSubTab === 'KAS' ? 'Penerimaan Kas' : 'Setoran Bank'}
                </th>
                <th className="w-32 py-2.5">
                  {activeSubTab === 'KAS' ? 'Pengeluaran Kas' : 'Penarikan Bank'}
                </th>
                <th className="w-36 py-2.5">Saldo (Rp)</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-200 text-stone-800">
              {/* Row Saldo Awal */}
              <tr className="bg-stone-50 font-medium">
                <td className="py-2 text-center font-mono text-stone-400">1</td>
                <td className="py-2 text-center font-mono text-stone-600">{profile.fiscalYear}-01-01</td>
                <td className="py-2 text-center font-mono text-stone-500">-</td>
                <td className="py-2 px-3 font-semibold text-stone-900">
                  {activeSubTab === 'KAS'
                    ? 'SALDO AWAL KAS TUNAI DI BENDAHARA'
                    : `SALDO AWAL REKENING ${profile.bankName}`}
                </td>
                <td className="py-2 text-center font-mono text-stone-500">
                  {activeSubTab === 'KAS' ? '1.1.01' : '1.1.02'}
                </td>
                <td className="py-2 text-stone-500">
                  {activeSubTab === 'KAS' ? 'Kas di Kasir/Tunai' : (profile.bankName || 'Kas di Bank')}
                </td>
                <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-700">
                  {formatRupiah(activeSubTab === 'KAS' ? profile.initialCash : profile.initialBank)}
                </td>
                <td className="py-2 px-3 text-right font-mono text-stone-400">-</td>
                <td className="py-2 px-3 text-right font-mono font-bold text-stone-900 bg-stone-100/60">
                  {formatRupiah(activeSubTab === 'KAS' ? profile.initialCash : profile.initialBank)}
                </td>
              </tr>

              {/* Rows */}
              {(activeSubTab === 'KAS' ? kasRows : bankRows).map((item, idx) => {
                const { tx, masuk, keluar, balance } = item;
                const acc = accountMap.get(tx.accountCode);
                return (
                  <tr key={tx.id} className="hover:bg-stone-50 transition">
                    <td className="py-2 text-center font-mono text-stone-400">{idx + 2}</td>
                    <td className="py-2 text-center font-mono text-stone-700">
                      {formatTanggalSingkat(tx.date)}
                    </td>
                    <td className="py-2 text-center font-mono font-semibold text-stone-800">
                      <span className="px-1.5 py-0.5 bg-stone-100 rounded text-[11px]">
                        {tx.docNumber}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-stone-900">
                      <div className="font-medium">{tx.description}</div>
                      {tx.recipientOrPayer && (
                        <div className="text-[11px] text-stone-500">
                          {tx.type === 'IN' ? 'Dari: ' : 'Kepada: '}
                          <span className="font-medium text-stone-700">{tx.recipientOrPayer}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-2 text-center font-mono text-stone-600 font-medium">
                      {tx.accountCode}
                    </td>
                    <td className="py-2 text-stone-700 truncate max-w-[150px]">{acc?.name || '-'}</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-700">
                      {masuk > 0 ? formatRupiah(masuk) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-red-700">
                      {keluar > 0 ? formatRupiah(keluar) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-stone-900 bg-stone-50">
                      {formatRupiah(balance)}
                    </td>
                  </tr>
                );
              })}

              {/* Footer Total */}
              <tr className="bg-stone-800 text-white font-bold font-mono">
                <td colSpan={6} className="py-2.5 px-4 text-left font-sans text-xs uppercase">
                  TOTAL MUTASI & SALDO AKHIR
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-300">
                  {formatRupiah(activeSubTab === 'KAS' ? totalKasMasuk : totalBankMasuk)}
                </td>
                <td className="py-2.5 px-3 text-right text-red-300">
                  {formatRupiah(activeSubTab === 'KAS' ? totalKasKeluar : totalBankKeluar)}
                </td>
                <td className="py-2.5 px-3 text-right text-amber-300 text-sm bg-stone-900">
                  {formatRupiah(activeSubTab === 'KAS' ? runningKas : runningBank)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Signatures Section */}
      <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-sm">
        <OfficialSignatures 
          profile={profile} 
          treasurerTitle={activeSubTab === 'KAS' ? 'Bendahara Kas Tunai' : 'Bendahara Rekening Bank'} 
        />
      </div>
    </div>
  );
};
