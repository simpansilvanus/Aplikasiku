import React from 'react';
import { TrendingUp, PieChart, CheckCircle2, Printer, Eye, FileDown, Download } from 'lucide-react';
import { Account, BumdesProfile, BusinessUnit, Transaction } from '../types';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';
import { OfficialSignatures } from './OfficialSignatures';

interface IncomeStatementViewProps {
  profile: BumdesProfile;
  accounts: Account[];
  units: BusinessUnit[];
  filteredTransactions: Transaction[];
  periodLabel: string;
  onPrint?: () => void;
  onDownloadPdf?: () => void;
  onDownloadExcel?: () => void;
}

export const IncomeStatementView: React.FC<IncomeStatementViewProps> = ({
  profile,
  accounts,
  units,
  filteredTransactions,
  periodLabel,
  onPrint,
  onDownloadPdf,
  onDownloadExcel,
}) => {
  // Aggregate transactions by accountCode
  const accountTotals = new Map<string, number>();
  for (const tx of filteredTransactions) {
    const cur = accountTotals.get(tx.accountCode) || 0;
    accountTotals.set(tx.accountCode, cur + tx.amount);
  }

  const revenueAccounts = accounts.filter((a) => a.category === 'PENDAPATAN');
  const hppAccounts = accounts.filter((a) => a.category === 'HPP');
  const opexAccounts = accounts.filter((a) => a.category === 'BEBAN_OPERASIONAL');
  const otherIncAccounts = accounts.filter((a) => a.category === 'PENDAPATAN_LAIN');
  const otherExpAccounts = accounts.filter((a) => a.category === 'BEBAN_LAIN');

  const totalPendapatanUsaha = revenueAccounts.reduce(
    (sum, a) => sum + (accountTotals.get(a.code) || 0),
    0
  );
  const totalHpp = hppAccounts.reduce((sum, a) => sum + (accountTotals.get(a.code) || 0), 0);
  const labaKotor = totalPendapatanUsaha - totalHpp;

  const totalBebanOperasional = opexAccounts.reduce(
    (sum, a) => sum + (accountTotals.get(a.code) || 0),
    0
  );
  const labaOperasional = labaKotor - totalBebanOperasional;

  const totalPendapatanLain = otherIncAccounts.reduce(
    (sum, a) => sum + (accountTotals.get(a.code) || 0),
    0
  );
  const totalBebanLain = otherExpAccounts.reduce(
    (sum, a) => sum + (accountTotals.get(a.code) || 0),
    0
  );
  const netLainLain = totalPendapatanLain - totalBebanLain;

  const sisaHasilUsaha = labaOperasional + netLainLain;

  // Alokasi SHU
  const shuPositive = Math.max(0, sisaHasilUsaha);
  const pades = Math.round(shuPositive * 0.3); // 30%
  const cadanganModal = Math.round(shuPositive * 0.3); // 30%
  const jasaPengurus = Math.round(shuPositive * 0.2); // 20%
  const danaSosial = Math.round(shuPositive * 0.1); // 10%
  const danaPendidikan = Math.round(shuPositive * 0.1); // 10%

  return (
    <div className="space-y-6">
      {/* Header Document with Logo BUMDes & Print Toolbar */}
      <div className="bg-white border border-stone-200 shadow-sm p-6 rounded-lg text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#107c41]"></div>

        {/* Quick Toolbar (Screen only) */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-stone-100 print:hidden">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            <span>Laporan Hasil Usaha & Pembagian SHU BUMDes</span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={onPrint || (() => window.print())}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs rounded-lg shadow-sm transition active:scale-95"
              title="Buka Print Preview A4 Laba Rugi"
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
              title="Unduh Laporan Laba Rugi dalam format PDF (.pdf)"
            >
              <FileDown className="w-3.5 h-3.5 text-stone-900" />
              <span>Download PDF</span>
            </button>

            {onDownloadExcel && (
              <button
                onClick={onDownloadExcel}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-sm transition active:scale-95"
                title="Unduh ke format Excel (.xlsx)"
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
            <span className="text-emerald-900 font-bold text-sm">
              LAPORAN LABA RUGI (HASIL USAHA BUMDES)
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
          <span className="text-xs text-stone-500">Total Pendapatan Usaha</span>
          <div className="text-lg font-bold font-mono text-emerald-800 mt-1">
            {formatRupiah(totalPendapatanUsaha)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
          <span className="text-xs text-stone-500">Harga Pokok Penjualan (HPP)</span>
          <div className="text-lg font-bold font-mono text-stone-700 mt-1">
            {formatRupiah(totalHpp)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
          <span className="text-xs text-stone-500">Beban Operasional</span>
          <div className="text-lg font-bold font-mono text-red-700 mt-1">
            {formatRupiah(totalBebanOperasional)}
          </div>
        </div>
        <div className={`p-4 rounded-lg border shadow-sm ${
          sisaHasilUsaha >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
        }`}>
          <span className="text-xs text-stone-600 font-medium">Sisa Hasil Usaha (SHU)</span>
          <div className={`text-xl font-bold font-mono mt-1 ${
            sisaHasilUsaha >= 0 ? 'text-emerald-900' : 'text-red-900'
          }`}>
            {formatRupiah(sisaHasilUsaha)}
          </div>
        </div>
      </div>

      {/* Main Income Statement Table */}
      <div className="bg-white border border-stone-200 shadow-sm rounded-lg overflow-hidden">
        <table className="w-full text-left text-xs font-sans border-collapse">
          <thead>
            <tr className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
              <th className="w-28 py-2.5 px-4">KODE REK</th>
              <th className="py-2.5 px-4">POS KEUANGAN / URAIAN</th>
              <th className="w-44 py-2.5 px-4 text-right">JUMLAH (Rp)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-800">
            {/* I. PENDAPATAN */}
            <tr className="bg-stone-50 font-bold text-stone-900">
              <td className="py-2.5 px-4 font-mono">4.1</td>
              <td className="py-2.5 px-4">I. PENDAPATAN USAHA</td>
              <td className="py-2.5 px-4 text-right"></td>
            </tr>
            {revenueAccounts.map((a) => {
              const val = accountTotals.get(a.code) || 0;
              return (
                <tr key={a.code} className="hover:bg-stone-50/50">
                  <td className="py-2 px-4 font-mono text-stone-500 pl-6">{a.code}</td>
                  <td className="py-2 px-4 pl-8">{a.name}</td>
                  <td className="py-2 px-4 text-right font-mono text-stone-800">
                    {formatRupiah(val)}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-emerald-50/60 font-semibold text-emerald-950">
              <td className="py-2 px-4"></td>
              <td className="py-2 px-4 font-bold">TOTAL PENDAPATAN USAHA</td>
              <td className="py-2 px-4 text-right font-mono font-bold text-emerald-900">
                {formatRupiah(totalPendapatanUsaha)}
              </td>
            </tr>

            {/* II. HPP */}
            <tr className="bg-stone-50 font-bold text-stone-900">
              <td className="py-2.5 px-4 font-mono">5.1</td>
              <td className="py-2.5 px-4">II. HARGA POKOK PENJUALAN (HPP)</td>
              <td className="py-2.5 px-4 text-right"></td>
            </tr>
            {hppAccounts.map((a) => {
              const val = accountTotals.get(a.code) || 0;
              return (
                <tr key={a.code} className="hover:bg-stone-50/50">
                  <td className="py-2 px-4 font-mono text-stone-500 pl-6">{a.code}</td>
                  <td className="py-2 px-4 pl-8">{a.name}</td>
                  <td className="py-2 px-4 text-right font-mono text-stone-800">
                    {formatRupiah(val)}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-stone-50 font-semibold">
              <td className="py-2 px-4"></td>
              <td className="py-2 px-4 font-bold">TOTAL HARGA POKOK PENJUALAN</td>
              <td className="py-2 px-4 text-right font-mono font-bold text-stone-900">
                {formatRupiah(totalHpp)}
              </td>
            </tr>

            {/* LABA KOTOR */}
            <tr className="bg-amber-50/80 font-bold text-stone-900 border-t border-b border-amber-200">
              <td className="py-2.5 px-4"></td>
              <td className="py-2.5 px-4 uppercase tracking-wide">LABA KOTOR USAHA (I - II)</td>
              <td className="py-2.5 px-4 text-right font-mono text-sm text-stone-950">
                {formatRupiah(labaKotor)}
              </td>
            </tr>

            {/* III. BEBAN OPERASIONAL */}
            <tr className="bg-stone-50 font-bold text-stone-900">
              <td className="py-2.5 px-4 font-mono">5.2</td>
              <td className="py-2.5 px-4">III. BEBAN OPERASIONAL & ADMINISTRASI</td>
              <td className="py-2.5 px-4 text-right"></td>
            </tr>
            {opexAccounts.map((a) => {
              const val = accountTotals.get(a.code) || 0;
              return (
                <tr key={a.code} className="hover:bg-stone-50/50">
                  <td className="py-2 px-4 font-mono text-stone-500 pl-6">{a.code}</td>
                  <td className="py-2 px-4 pl-8">{a.name}</td>
                  <td className="py-2 px-4 text-right font-mono text-stone-800">
                    {formatRupiah(val)}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-red-50/50 font-semibold text-red-950">
              <td className="py-2 px-4"></td>
              <td className="py-2 px-4 font-bold">TOTAL BEBAN OPERASIONAL</td>
              <td className="py-2 px-4 text-right font-mono font-bold text-red-900">
                {formatRupiah(totalBebanOperasional)}
              </td>
            </tr>

            {/* LABA OPERASIONAL */}
            <tr className="bg-stone-100 font-bold text-stone-900">
              <td className="py-2.5 px-4"></td>
              <td className="py-2.5 px-4">LABA OPERASIONAL (Laba Kotor - Beban Operasional)</td>
              <td className="py-2.5 px-4 text-right font-mono">
                {formatRupiah(labaOperasional)}
              </td>
            </tr>

            {/* IV. LAIN-LAIN */}
            <tr className="bg-stone-50 font-bold text-stone-900">
              <td className="py-2.5 px-4 font-mono">4.2 / 5.2</td>
              <td className="py-2.5 px-4">IV. PENDAPATAN & (BEBAN) LAIN-LAIN</td>
              <td className="py-2.5 px-4 text-right"></td>
            </tr>
            {otherIncAccounts.map((a) => {
              const val = accountTotals.get(a.code) || 0;
              return (
                <tr key={a.code}>
                  <td className="py-2 px-4 font-mono text-stone-500 pl-6">{a.code}</td>
                  <td className="py-2 px-4 pl-8">{a.name}</td>
                  <td className="py-2 px-4 text-right font-mono text-emerald-700">
                    +{formatRupiah(val)}
                  </td>
                </tr>
              );
            })}
            {otherExpAccounts.map((a) => {
              const val = accountTotals.get(a.code) || 0;
              return (
                <tr key={a.code}>
                  <td className="py-2 px-4 font-mono text-stone-500 pl-6">{a.code}</td>
                  <td className="py-2 px-4 pl-8">{a.name}</td>
                  <td className="py-2 px-4 text-right font-mono text-red-700">
                    -{formatRupiah(val)}
                  </td>
                </tr>
              );
            })}

            {/* FINAL SHU */}
            <tr className="bg-[#107c41] text-white font-bold text-sm">
              <td className="py-3 px-4 font-mono">3.1.04</td>
              <td className="py-3 px-4 uppercase tracking-wider">
                SISA HASIL USAHA (SHU) / LABA BERSIH PERIODE BERJALAN
              </td>
              <td className="py-3 px-4 text-right font-mono text-base text-amber-300">
                {formatRupiah(sisaHasilUsaha)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Rencana Alokasi Pembagian SHU (Standar Musdes / AD-ART) */}
      <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
          <PieChart className="w-5 h-5 text-emerald-700" />
          <div>
            <h4 className="font-bold text-stone-900 text-sm">
              SIMULASI ALOKASI PEMBAGIAN SISA HASIL USAHA (SHU)
            </h4>
            <p className="text-xs text-stone-500">
              Sesuai Anggaran Dasar / Anggaran Rumah Tangga (AD/ART) BUMDes & Musyawarah Desa
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-stone-700">1. PADes (Desa)</span>
              <span className="font-bold text-emerald-700">30%</span>
            </div>
            <div className="text-sm font-bold font-mono text-stone-900 mt-2">
              {formatRupiah(pades)}
            </div>
            <p className="text-[10px] text-stone-500 mt-1">Pendapatan Asli Desa</p>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-stone-700">2. Cadangan Modal</span>
              <span className="font-bold text-emerald-700">30%</span>
            </div>
            <div className="text-sm font-bold font-mono text-stone-900 mt-2">
              {formatRupiah(cadanganModal)}
            </div>
            <p className="text-[10px] text-stone-500 mt-1">Pengembangan Usaha</p>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-stone-700">3. Jasa Pengurus</span>
              <span className="font-bold text-emerald-700">20%</span>
            </div>
            <div className="text-sm font-bold font-mono text-stone-900 mt-2">
              {formatRupiah(jasaPengurus)}
            </div>
            <p className="text-[10px] text-stone-500 mt-1">Direksi, Pegawai, Pengawas</p>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-stone-700">4. Dana Sosial</span>
              <span className="font-bold text-emerald-700">10%</span>
            </div>
            <div className="text-sm font-bold font-mono text-stone-900 mt-2">
              {formatRupiah(danaSosial)}
            </div>
            <p className="text-[10px] text-stone-500 mt-1">Bantuan Kemasyarakatan</p>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-stone-700">5. Pendidikan</span>
              <span className="font-bold text-emerald-700">10%</span>
            </div>
            <div className="text-sm font-bold font-mono text-stone-900 mt-2">
              {formatRupiah(danaPendidikan)}
            </div>
            <p className="text-[10px] text-stone-500 mt-1">Pelatihan & Pembinaan</p>
          </div>
        </div>
      </div>

      {/* Official Signatures block */}
      <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-sm">
        <OfficialSignatures profile={profile} />
      </div>
    </div>
  );
};
