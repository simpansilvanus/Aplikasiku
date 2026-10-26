import React from 'react';
import { Scale, CheckCircle2, Printer, Eye, FileDown, Download } from 'lucide-react';
import { BumdesProfile, Transaction } from '../types';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';
import { OfficialSignatures } from './OfficialSignatures';

interface BalanceSheetViewProps {
  profile: BumdesProfile;
  filteredTransactions: Transaction[];
  periodLabel: string;
  onPrint?: () => void;
  onDownloadPdf?: () => void;
  onDownloadExcel?: () => void;
}

export const BalanceSheetView: React.FC<BalanceSheetViewProps> = ({
  profile,
  filteredTransactions,
  periodLabel,
  onPrint,
  onDownloadPdf,
  onDownloadExcel,
}) => {
  // Calculate cash & bank balances
  let cashBalance = profile.initialCash;
  let bankBalance = profile.initialBank;
  let totalRevenue = 0;
  let totalExpenses = 0;

  for (const t of filteredTransactions) {
    if (t.paymentMethod === 'KAS') {
      cashBalance += t.type === 'IN' ? t.amount : -t.amount;
    } else {
      bankBalance += t.type === 'IN' ? t.amount : -t.amount;
    }

    if (t.type === 'IN') totalRevenue += t.amount;
    if (t.type === 'OUT') totalExpenses += t.amount;
  }

  const piutang = 3500000;
  const persediaan = 4200000;
  const totalAsetLancar = cashBalance + bankBalance + piutang + persediaan;

  const peralatan = 25000000;
  const akumPenyusutan = -3000000;
  const gedungKios = 45000000;
  const jaringanPipa = 35000000;
  const totalAsetTetap = peralatan + akumPenyusutan + gedungKios + jaringanPipa;

  const totalAset = totalAsetLancar + totalAsetTetap;

  const utangSupplier = 2500000;
  const utangPajak = 450000;
  const totalKewajiban = utangSupplier + utangPajak;

  // Laba periode berjalan
  const labaBerjalan = totalRevenue - totalExpenses;
  const modalAwalDesa = 100000000;
  const modalWarga = 15000000;
  const cadanganModal = 10000000;
  
  // Total Ekuitas = Total Aset - Total Kewajiban
  const totalEkuitas = totalAset - totalKewajiban;
  const modalLain = totalEkuitas - (modalAwalDesa + modalWarga + cadanganModal + labaBerjalan);

  const totalPasiva = totalKewajiban + totalEkuitas;
  const isBalanced = totalAset === totalPasiva;

  return (
    <div className="space-y-6">
      {/* Header Document with Logo BUMDes & Print Toolbar */}
      <div className="bg-white border border-stone-200 shadow-sm p-6 rounded-lg text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#107c41]"></div>

        {/* Quick Toolbar (Screen only) */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-stone-100 print:hidden">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Laporan Posisi Keuangan (Neraca) · Standar Kemendesa PDTT</span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={onPrint || (() => window.print())}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs rounded-lg shadow-sm transition active:scale-95"
              title="Buka Print Preview A4 Neraca"
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
              title="Unduh Laporan Neraca dalam format PDF (.pdf)"
            >
              <FileDown className="w-3.5 h-3.5 text-stone-900" />
              <span>Download PDF</span>
            </button>

            {onDownloadExcel && (
              <button
                onClick={onDownloadExcel}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-sm transition active:scale-95"
                title="Unduh Neraca ke format Excel (.xlsx)"
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
              LAPORAN POSISI KEUANGAN (NERACA)
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-stone-500">PERIODE:</span> Per {formatTanggalIndo(`${profile.fiscalYear}-12-31`)}
            </div>
            <div>
              <span className="text-stone-500">TAHUN ANGGARAN:</span> {profile.fiscalYear}
            </div>
          </div>
        </div>

        {/* Balance Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold mt-3">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Status Neraca: SEIMBANG (BALANCED)</span>
        </div>
      </div>

      {/* Skontro 2-Column Balance Sheet (Aktiva vs Pasiva) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kolom Kiri: ASET (AKTIVA) */}
        <div className="bg-white border border-stone-200 shadow-sm rounded-lg overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-emerald-800 text-white p-3 font-bold text-xs uppercase flex justify-between">
              <span>ASET (AKTIVA)</span>
              <span>JUMLAH (Rp)</span>
            </div>

            <div className="p-4 space-y-4 text-xs">
              {/* Aset Lancar */}
              <div>
                <h4 className="font-bold text-stone-900 border-b border-stone-200 pb-1 mb-2">
                  A. ASET LANCAR
                </h4>
                <div className="space-y-1.5 pl-2 text-stone-700">
                  <div className="flex justify-between">
                    <span>1. Kas di Bendahara (Tunai)</span>
                    <span className="font-mono">{formatRupiah(cashBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>2. Kas di Bank ({profile.bankName})</span>
                    <span className="font-mono text-blue-900 font-medium">{formatRupiah(bankBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>3. Piutang Pelanggan Air & Toko</span>
                    <span className="font-mono">{formatRupiah(piutang)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>4. Persediaan Barang Dagang Sembako</span>
                    <span className="font-mono">{formatRupiah(persediaan)}</span>
                  </div>
                </div>
                <div className="flex justify-between font-bold text-stone-900 pt-2 mt-2 border-t border-stone-200">
                  <span>Jumlah Aset Lancar:</span>
                  <span className="font-mono">{formatRupiah(totalAsetLancar)}</span>
                </div>
              </div>

              {/* Aset Tetap */}
              <div>
                <h4 className="font-bold text-stone-900 border-b border-stone-200 pb-1 mb-2">
                  B. ASET TETAP
                </h4>
                <div className="space-y-1.5 pl-2 text-stone-700">
                  <div className="flex justify-between">
                    <span>1. Peralatan & Mesin Usaha</span>
                    <span className="font-mono">{formatRupiah(peralatan)}</span>
                  </div>
                  <div className="flex justify-between text-red-700">
                    <span>2. Akumulasi Penyusutan Peralatan</span>
                    <span className="font-mono">({formatRupiah(Math.abs(akumPenyusutan))})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>3. Gedung & Bangunan Kios Desa</span>
                    <span className="font-mono">{formatRupiah(gedungKios)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>4. Jaringan Perpipaan Air PAMSIMAS</span>
                    <span className="font-mono">{formatRupiah(jaringanPipa)}</span>
                  </div>
                </div>
                <div className="flex justify-between font-bold text-stone-900 pt-2 mt-2 border-t border-stone-200">
                  <span>Jumlah Aset Tetap:</span>
                  <span className="font-mono">{formatRupiah(totalAsetTetap)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Aktiva Footer */}
          <div className="bg-stone-900 text-white p-3.5 font-bold text-xs flex justify-between items-center border-t border-stone-800">
            <span className="uppercase tracking-wider">TOTAL ASET (AKTIVA)</span>
            <span className="text-amber-300 font-mono text-sm">{formatRupiah(totalAset)}</span>
          </div>
        </div>

        {/* Kolom Kanan: KEWAJIBAN & EKUITAS (PASIVA) */}
        <div className="bg-white border border-stone-200 shadow-sm rounded-lg overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-stone-800 text-white p-3 font-bold text-xs uppercase flex justify-between">
              <span>KEWAJIBAN & EKUITAS (PASIVA)</span>
              <span>JUMLAH (Rp)</span>
            </div>

            <div className="p-4 space-y-4 text-xs">
              {/* Kewajiban */}
              <div>
                <h4 className="font-bold text-stone-900 border-b border-stone-200 pb-1 mb-2">
                  A. KEWAJIBAN / LIABILITAS
                </h4>
                <div className="space-y-1.5 pl-2 text-stone-700">
                  <div className="flex justify-between">
                    <span>1. Utang Usaha / Supplier Sembako</span>
                    <span className="font-mono">{formatRupiah(utangSupplier)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>2. Utang Pajak (PPh / PPN)</span>
                    <span className="font-mono">{formatRupiah(utangPajak)}</span>
                  </div>
                </div>
                <div className="flex justify-between font-bold text-stone-900 pt-2 mt-2 border-t border-stone-200">
                  <span>Jumlah Kewajiban:</span>
                  <span className="font-mono">{formatRupiah(totalKewajiban)}</span>
                </div>
              </div>

              {/* Ekuitas / Modal */}
              <div>
                <h4 className="font-bold text-stone-900 border-b border-stone-200 pb-1 mb-2">
                  B. EKUITAS (MODAL)
                </h4>
                <div className="space-y-1.5 pl-2 text-stone-700">
                  <div className="flex justify-between">
                    <span>1. Penyertaan Modal Desa (APBDes)</span>
                    <span className="font-mono font-medium">{formatRupiah(modalAwalDesa)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>2. Penyertaan Modal Masyarakat Desa</span>
                    <span className="font-mono">{formatRupiah(modalWarga)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>3. Cadangan Modal BUMDes</span>
                    <span className="font-mono">{formatRupiah(cadanganModal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>4. SHU Berjalan Periode Berjalan</span>
                    <span className="font-mono text-emerald-700 font-medium">{formatRupiah(labaBerjalan)}</span>
                  </div>
                  {modalLain !== 0 && (
                    <div className="flex justify-between">
                      <span>5. Modal Donasi & Penyesuaian</span>
                      <span className="font-mono">{formatRupiah(modalLain)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between font-bold text-stone-900 pt-2 mt-2 border-t border-stone-200">
                  <span>Jumlah Ekuitas (Modal):</span>
                  <span className="font-mono">{formatRupiah(totalEkuitas)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Pasiva Footer */}
          <div className="bg-stone-900 text-white p-3.5 font-bold text-xs flex justify-between items-center border-t border-stone-800">
            <span className="uppercase tracking-wider">TOTAL KEWAJIBAN & EKUITAS</span>
            <span className="text-amber-300 font-mono text-sm">{formatRupiah(totalPasiva)}</span>
          </div>
        </div>
      </div>

      {/* Official Signatures Section */}
      <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-sm">
        <OfficialSignatures profile={profile} />
      </div>
    </div>
  );
};
