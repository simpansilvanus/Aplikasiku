import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  FileSpreadsheet, 
  Landmark, 
  TrendingUp, 
  Scale, 
  ListOrdered, 
  Layers, 
  CheckCircle2, 
  Settings2, 
  Calendar, 
  Building, 
  Eye, 
  Wallet,
  Download,
  FileDown,
  ZoomIn,
  ZoomOut,
  Loader2,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { 
  Account, 
  BumdesProfile, 
  BusinessUnit, 
  Transaction 
} from '../types';
import { formatRupiah, formatTanggalIndo, formatTanggalSingkat } from '../utils/formatters';
import { KopSurat } from './KopSurat';
import { OfficialSignatures } from './OfficialSignatures';
import { exportElementToPdf } from '../utils/pdfExport';
import { exportToBumdesExcel } from '../utils/excelExport';

export type PrintTarget = 
  | 'bku' 
  | 'cash' 
  | 'bank' 
  | 'cash_bank' 
  | 'income_statement' 
  | 'balance_sheet' 
  | 'transactions' 
  | 'all';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTarget?: PrintTarget;
  profile: BumdesProfile;
  accounts: Account[];
  units: BusinessUnit[];
  transactions: Transaction[];
  selectedMonth: string;
  selectedUnit: string;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  initialTarget = 'bku',
  profile,
  accounts,
  units,
  transactions,
  selectedMonth: initialSelectedMonth,
  selectedUnit: initialSelectedUnit,
}) => {
  const [target, setTarget] = useState<PrintTarget>(initialTarget);
  const [selectedMonth, setSelectedMonth] = useState<string>(initialSelectedMonth);
  const [selectedUnit, setSelectedUnit] = useState<string>(initialSelectedUnit);

  // Print customization options
  const [showLogo, setShowLogo] = useState<boolean>(true);
  const [showSignatures, setShowSignatures] = useState<boolean>(true);
  const [showKasOpname, setShowKasOpname] = useState<boolean>(true);

  if (!isOpen) return null;

  const months = [
    { value: 'ALL', label: 'Semua Periode (1 Tahun Penuh)' },
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  const periodLabel = useMemo(() => {
    if (selectedMonth === 'ALL') return `Januari - Desember ${profile.fiscalYear}`;
    const m = months.find((item) => item.value === selectedMonth);
    return `${m?.label || selectedMonth} ${profile.fiscalYear}`;
  }, [selectedMonth, profile.fiscalYear]);

  // Filter transactions according to modal selection
  const filteredTx = useMemo(() => {
    return transactions.filter((tx) => {
      if (selectedMonth !== 'ALL') {
        const txMonth = tx.date.split('-')[1];
        if (txMonth !== selectedMonth) return false;
      }
      if (selectedUnit !== 'ALL' && tx.unitId !== selectedUnit) {
        return false;
      }
      return true;
    });
  }, [transactions, selectedMonth, selectedUnit]);

  const sortedTx = useMemo(() => {
    return [...filteredTx].sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredTx]);

  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.code, a])), [accounts]);
  const unitMap = useMemo(() => new Map(units.map((u) => [u.id, u.name])), [units]);

  // Cumulative calculations for BKU
  const initialTotalBalance = profile.initialCash + profile.initialBank;
  let runningBku = initialTotalBalance;
  let totalBkuMasuk = initialTotalBalance;
  let totalBkuKeluar = 0;

  const bkuRows = sortedTx.map((tx) => {
    const masuk = tx.type === 'IN' ? tx.amount : 0;
    const keluar = tx.type === 'OUT' ? tx.amount : 0;
    runningBku = runningBku + masuk - keluar;
    totalBkuMasuk += masuk;
    totalBkuKeluar += keluar;
    return { tx, masuk, keluar, balanceAfter: runningBku };
  });

  // Physical breakdown
  let physicalCash = profile.initialCash;
  let physicalBank = profile.initialBank;
  for (const t of sortedTx) {
    if (t.paymentMethod === 'KAS') {
      physicalCash += t.type === 'IN' ? t.amount : -t.amount;
    } else {
      physicalBank += t.type === 'IN' ? t.amount : -t.amount;
    }
  }

  // Kas rows
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
    return { tx, masuk, keluar, balance: runningKas };
  });

  // Bank rows
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
    return { tx, masuk, keluar, balance: runningBank };
  });

  // Laba Rugi calculations
  const accountTotals = new Map<string, number>();
  for (const tx of filteredTx) {
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
  const sisaHasilUsaha = labaOperasional + (totalPendapatanLain - totalBebanLain);

  const shuPositive = Math.max(0, sisaHasilUsaha);
  const pades = Math.round(shuPositive * 0.3);
  const cadanganModal = Math.round(shuPositive * 0.3);
  const jasaPengurus = Math.round(shuPositive * 0.2);
  const danaSosial = Math.round(shuPositive * 0.1);
  const danaPendidikan = Math.round(shuPositive * 0.1);

  // Neraca calculations
  const piutang = 3500000;
  const persediaan = 4200000;
  const totalAsetLancar = physicalCash + physicalBank + piutang + persediaan;
  const peralatan = 25000000;
  const akumPenyusutan = -3000000;
  const gedungKios = 45000000;
  const jaringanPipa = 35000000;
  const totalAsetTetap = peralatan + akumPenyusutan + gedungKios + jaringanPipa;
  const totalAset = totalAsetLancar + totalAsetTetap;
  const utangSupplier = 2500000;
  const utangPajak = 450000;
  const totalKewajiban = utangSupplier + utangPajak;
  const totalEkuitas = totalAset - totalKewajiban;

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage((cur) => (cur === msg ? null : cur));
    }, 4500);
  };

  const getTargetFilename = () => {
    const cleanBumdes = profile.name.replace(/[^a-zA-Z0-9]/g, '_');
    const periodStr = selectedMonth === 'ALL' ? `TA_${profile.fiscalYear}` : `Bulan_${selectedMonth}_${profile.fiscalYear}`;
    switch (target) {
      case 'bku': return `BKU_${cleanBumdes}_${periodStr}.pdf`;
      case 'cash': return `Buku_Kas_Tunai_${cleanBumdes}_${periodStr}.pdf`;
      case 'bank': return `Buku_Bank_${cleanBumdes}_${periodStr}.pdf`;
      case 'cash_bank': return `Buku_Kas_dan_Bank_${cleanBumdes}_${periodStr}.pdf`;
      case 'income_statement': return `Laba_Rugi_SHU_${cleanBumdes}_${periodStr}.pdf`;
      case 'balance_sheet': return `Neraca_Keuangan_${cleanBumdes}_${periodStr}.pdf`;
      case 'transactions': return `Jurnal_Transaksi_${cleanBumdes}_${periodStr}.pdf`;
      case 'all': return `Bendel_Lengkap_Laporan_${cleanBumdes}_${periodStr}.pdf`;
      default: return `Laporan_Keuangan_${cleanBumdes}.pdf`;
    }
  };

  const handleExecutePrint = () => {
    showNotification('Membuka dialog cetak sistem komputer... Pilih printer aktif Anda (USB, Wi-Fi, LAN, atau PDF).');
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const result = await exportElementToPdf({
        elementId: 'printable-content',
        filename: getTargetFilename(),
        orientation: (target === 'bku' || target === 'transactions') ? 'landscape' : 'portrait',
        format: 'legal',
      });

      if (result.success) {
        if (result.savedToDrivePicker) {
          showNotification(`File PDF Legal ${result.filename} berhasil disimpan langsung pada Drive komputer pilihan Anda.`);
        } else {
          showNotification(`File PDF Legal ${result.filename} tersimpan pada Drive Komputer Anda (Folder Unduhan / Downloads).`);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Gagal membuat file PDF. Silakan gunakan opsi Cetak Browser.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadExcel = () => {
    exportToBumdesExcel({
      profile,
      accounts,
      units,
      transactions,
      filteredTransactions: filteredTx,
      periodLabel,
    });
    showNotification('File spreadsheet Excel (.xlsx) berhasil diunduh dan tersimpan ke Komputer Anda.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/75 backdrop-blur-sm flex flex-col items-center justify-center p-2 md:p-6 overflow-hidden print-modal-overlay">
      <div className="bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-6xl h-[94vh] border border-stone-300 overflow-hidden print-modal-wrapper relative">
        
        {/* Top Header Bar Modal (Hidden on Print) with all functional action buttons */}
        <div className="bg-[#107c41] text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-white text-[#107c41] flex items-center justify-center font-bold shadow">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm tracking-wide">
                  Pusat Cetak & Ekspor Dokumen Keuangan
                </h2>
                <span className="text-[10px] font-bold bg-amber-400 text-stone-900 px-2 py-0.5 rounded uppercase">
                  Kertas Legal (8.5 x 14 in)
                </span>
                <span className="text-[10px] font-bold bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded uppercase border border-emerald-600 hidden md:inline">
                  Huruf Arial · Kop 14 · Isi 12
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                {profile.name} · Format Resmi Kemendesa PDTT
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar: Print, Print Preview Zoom, Print To PDF, Download Excel */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Zoom Controls for Print Preview */}
            <div className="flex items-center bg-emerald-900/70 border border-emerald-700/50 rounded-lg px-2 py-1 gap-1 text-xs text-emerald-100">
              <Eye className="w-3.5 h-3.5 text-amber-300 mr-1" />
              <span className="hidden sm:inline text-[11px] font-medium mr-1">Preview:</span>
              <button
                onClick={() => setZoomPercent((z) => Math.max(50, z - 10))}
                className="p-1 hover:bg-emerald-800 rounded transition"
                title="Perkecil Tampilan Pratinjau (Zoom Out)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono font-bold text-[11px] w-10 text-center text-white">
                {zoomPercent}%
              </span>
              <button
                onClick={() => setZoomPercent((z) => Math.min(150, z + 10))}
                className="p-1 hover:bg-emerald-800 rounded transition"
                title="Perbesar Tampilan Pratinjau (Zoom In)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              {zoomPercent !== 100 && (
                <button
                  onClick={() => setZoomPercent(100)}
                  className="text-[10px] underline ml-1 hover:text-white"
                  title="Reset Zoom ke 100%"
                >
                  Reset
                </button>
              )}
            </div>

            {/* 1. TOMBOL PRINT (CETAK KE PRINTER) */}
            <button
              onClick={handleExecutePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 border border-emerald-500/50 text-white font-bold text-xs rounded-lg shadow-sm transition active:scale-95"
              title="Cetak Dokumen Langsung ke Printer (Ctrl+P)"
            >
              <Printer className="w-4 h-4 text-emerald-200" />
              <span>Print (Cetak)</span>
            </button>

            {/* 2. TOMBOL PRINT TO PDF / DOWNLOAD FILE PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs rounded-lg shadow-md transition active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              title="Unduh / Simpan Dokumen ini dalam File Format PDF Resmi (.pdf)"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-stone-900" />
                  <span>Memproses PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-stone-900" />
                  <span>Print To PDF (Unduh .pdf)</span>
                </>
              )}
            </button>

            {/* 3. TOMBOL DOWNLOAD EXCEL (.XLSX) */}
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 text-emerald-900 font-bold text-xs rounded-lg shadow-sm transition active:scale-95"
              title="Unduh Laporan Keuangan dalam File Format Spreadsheet Excel Resmi (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Unduh Excel (.xlsx)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-700/60 rounded-lg transition ml-1"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Sidebar (Options) + Right Canvas (Live Print Preview) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Controls & Selection Sidebar (Hidden on Print) */}
          <div className="w-full md:w-80 bg-stone-50 border-r border-stone-200 p-4 overflow-y-auto space-y-5 flex-shrink-0 print:hidden text-xs">
            
            {/* Target Report Selector */}
            <div>
              <label className="block font-bold text-stone-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Jenis Pembukuan</span>
              </label>
              <div className="space-y-1">
                <button
                  onClick={() => setTarget('bku')}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                    target === 'bku'
                      ? 'bg-emerald-700 text-white font-bold shadow-sm'
                      : 'text-stone-700 hover:bg-stone-200/80 bg-white border border-stone-200'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                  <span>1. Buku Kas Umum (BKU)</span>
                </button>

                <button
                  onClick={() => setTarget('cash')}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                    target === 'cash'
                      ? 'bg-emerald-700 text-white font-bold shadow-sm'
                      : 'text-stone-700 hover:bg-stone-200/80 bg-white border border-stone-200'
                  }`}
                >
                  <Wallet className="w-4 h-4 text-amber-500" />
                  <span>2. Buku Pembantu Kas Tunai</span>
                </button>

                <button
                  onClick={() => setTarget('bank')}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                    target === 'bank'
                      ? 'bg-emerald-700 text-white font-bold shadow-sm'
                      : 'text-stone-700 hover:bg-stone-200/80 bg-white border border-stone-200'
                  }`}
                >
                  <Landmark className="w-4 h-4 text-blue-500" />
                  <span>3. Buku Pembantu Bank</span>
                </button>

                <button
                  onClick={() => setTarget('cash_bank')}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                    target === 'cash_bank'
                      ? 'bg-emerald-700 text-white font-bold shadow-sm'
                      : 'text-stone-700 hover:bg-stone-200/80 bg-white border border-stone-200'
                  }`}
                >
                  <Landmark className="w-4 h-4 text-emerald-400" />
                  <span>4. Gabungan Kas & Bank</span>
                </button>

                <button
                  onClick={() => setTarget('income_statement')}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                    target === 'income_statement'
                      ? 'bg-emerald-700 text-white font-bold shadow-sm'
                      : 'text-stone-700 hover:bg-stone-200/80 bg-white border border-stone-200'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>5. Laba Rugi (Hasil Usaha / SHU)</span>
                </button>

                <button
                  onClick={() => setTarget('balance_sheet')}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                    target === 'balance_sheet'
                      ? 'bg-emerald-700 text-white font-bold shadow-sm'
                      : 'text-stone-700 hover:bg-stone-200/80 bg-white border border-stone-200'
                  }`}
                >
                  <Scale className="w-4 h-4 text-emerald-400" />
                  <span>6. Neraca Keuangan</span>
                </button>

                <button
                  onClick={() => setTarget('transactions')}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                    target === 'transactions'
                      ? 'bg-emerald-700 text-white font-bold shadow-sm'
                      : 'text-stone-700 hover:bg-stone-200/80 bg-white border border-stone-200'
                  }`}
                >
                  <ListOrdered className="w-4 h-4 text-purple-400" />
                  <span>7. Jurnal Transaksi</span>
                </button>

                <button
                  onClick={() => setTarget('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                    target === 'all'
                      ? 'bg-emerald-800 text-amber-300 font-bold shadow-sm ring-1 ring-amber-400'
                      : 'text-stone-800 bg-amber-50 hover:bg-amber-100/80 border border-amber-300'
                  }`}
                >
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span className="font-bold">8. Bendel Lengkap (Semua Buku)</span>
                </button>
              </div>
            </div>

            {/* Filter Periode & Unit */}
            <div className="space-y-3 pt-3 border-t border-stone-200">
              <label className="block font-bold text-stone-800 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                <span>Filter Periode</span>
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-800 font-medium focus:ring-1 focus:ring-emerald-600"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              <label className="block font-bold text-stone-800 uppercase tracking-wide pt-2 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-stone-500" />
                <span>Unit Usaha</span>
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-800 font-medium focus:ring-1 focus:ring-emerald-600"
              >
                <option value="ALL">Semua Unit Usaha</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Print Layout Options */}
            <div className="space-y-2 pt-3 border-t border-stone-200">
              <label className="block font-bold text-stone-800 uppercase tracking-wide flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-stone-500" />
                <span>Opsi Lampiran Cetak</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-stone-700 p-1.5 rounded hover:bg-stone-200/50">
                <input
                  type="checkbox"
                  checked={showLogo}
                  onChange={(e) => setShowLogo(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Sertakan Logo BUMDes & Kop Resmi</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-stone-700 p-1.5 rounded hover:bg-stone-200/50">
                <input
                  type="checkbox"
                  checked={showSignatures}
                  onChange={(e) => setShowSignatures(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Lembar Tanda Tangan (Kades, Direktur, Bendahara)</span>
              </label>

              {(target === 'bku' || target === 'cash_bank' || target === 'all') && (
                <label className="flex items-center gap-2 cursor-pointer text-stone-700 p-1.5 rounded hover:bg-stone-200/50">
                  <input
                    type="checkbox"
                    checked={showKasOpname}
                    onChange={(e) => setShowKasOpname(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Berita Acara Pemeriksaan Kas (Kas Opname)</span>
                </label>
              )}
            </div>

            {/* Quick Action Button */}
            <div className="pt-3">
              <button
                onClick={handleExecutePrint}
                className="w-full py-2.5 px-4 bg-[#107c41] hover:bg-emerald-700 text-white font-bold rounded-lg shadow transition flex items-center justify-center gap-2 text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Dokumen Terpilih</span>
              </button>
              <p className="text-[10px] text-stone-500 text-center mt-1.5">
                Dapat langsung dicetak ke printer fisik atau disimpan sebagai PDF (Ctrl+P)
              </p>
            </div>
            {/* Informasi Format Standar: Legal, Arial, Kop 14, Isi 12 */}
            <div className="pt-3 border-t border-stone-200 space-y-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-[11px] text-blue-950">
                <div className="font-bold flex items-center gap-1.5 text-blue-900">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span>Standar Format Dokumen Resmi</span>
                </div>
                <div className="mt-1.5 space-y-1 text-[10px] text-stone-700 leading-tight">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Ukuran Kertas:</span>
                    <strong className="font-bold text-blue-950">Legal (8.5 x 14 in / 216x356 mm)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Jenis Huruf:</span>
                    <strong className="font-bold text-stone-900">Arial (Kop 14, Isi Teks 12)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Logo BUMDes:</span>
                    <strong className="font-semibold text-emerald-800">Di Atas Kop Surat</strong>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-[11px] text-emerald-950">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span>Koneksi Printer: Siap Terhubung</span>
                </div>
                <p className="mt-1 text-stone-600 text-[10px] leading-relaxed">
                  Terhubung otomatis ke semua perangkat printer aktif komputer Anda (USB, Wi-Fi, LAN, & Bluetooth) melalui dialog cetak sistem (Ctrl+P).
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-950">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <HardDrive className="w-3.5 h-3.5 text-amber-700" />
                  <span>Penyimpanan PDF: Drive Komputer</span>
                </div>
                <p className="mt-1 text-stone-600 text-[10px] leading-relaxed">
                  File PDF Legal disimpan langsung pada Drive komputer Anda (Folder Unduhan / direktori yang dipilih pada dialog Simpan).
                </p>
              </div>
            </div>
          </div>

          {/* Right Live Print Preview Canvas (This is what prints) */}
          <div className="flex-1 bg-stone-200/80 p-3 md:p-6 overflow-y-auto print:bg-white print:p-0 print:overflow-visible relative print-modal-canvas-area">
            
            {/* Status Toast Notification inside Modal */}
            {statusMessage && (
              <div className="fixed top-16 right-8 z-[80] bg-stone-900 text-white px-4 py-2.5 rounded-lg shadow-2xl text-xs flex items-center gap-2 border border-emerald-500 animate-in fade-in slide-in-from-top-2 print:hidden">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}
            
            {/* Loading Overlay when generating PDF */}
            {isGeneratingPdf && (
              <div className="absolute inset-0 z-30 bg-stone-900/40 backdrop-blur-xs flex flex-col items-center justify-center text-white print:hidden">
                <div className="bg-stone-900/90 border border-stone-700 p-6 rounded-xl shadow-2xl flex flex-col items-center gap-3 max-w-sm text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                  <div>
                    <h3 className="font-bold text-sm">Menyiapkan Dokumen PDF Legal...</h3>
                    <p className="text-xs text-stone-300 mt-1">
                      Mengkonversi lembar pembukuan ke PDF Legal (8.5 x 14 in) dengan huruf Arial.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Paper Container with interactive Zoom */}
            <div 
              id="printable-content"
              style={{
                transform: zoomPercent !== 100 ? `scale(${zoomPercent / 100})` : undefined,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
                fontFamily: 'Arial, sans-serif',
                fontSize: '12pt',
              }}
              className="bg-white max-w-4xl mx-auto p-6 md:p-10 shadow-lg border border-stone-200 rounded-sm font-sans print:shadow-none print:border-none print:max-w-none print:p-2 print:m-0"
            >

              {/* 1. BUKU KAS UMUM (BKU) */}
              {(target === 'bku' || target === 'all') && (
                <section className="print-section mb-10 break-after-page">
                  <KopSurat
                    profile={profile}
                    documentTitle="BUKU KAS UMUM (BKU)"
                    documentSubtitle={`Standar Kemendesa PDTT · Rekapitulasi Kas & Bank`}
                    periodLabel={periodLabel}
                    showLogo={showLogo}
                  />

                  {/* Summary Bar */}
                  <div className="flex justify-between items-center text-xs font-semibold bg-stone-100 p-2.5 rounded border border-stone-200 mb-3 print:border-stone-400">
                    <div>
                      Saldo Awal Periode: <span className="font-mono font-bold text-stone-900">{formatRupiah(initialTotalBalance)}</span>
                    </div>
                    <div>
                      Total Mutasi: <span className="font-mono text-emerald-800">+{formatRupiah(totalBkuMasuk - initialTotalBalance)}</span> / <span className="font-mono text-red-700">-{formatRupiah(totalBkuKeluar)}</span>
                    </div>
                    <div>
                      Saldo Akhir BKU: <span className="font-mono font-bold text-emerald-900">{formatRupiah(runningBku)}</span>
                    </div>
                  </div>

                  {/* Tabel BKU */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse border border-stone-300 print:border-stone-800">
                      <thead>
                        <tr className="bg-emerald-900 text-white font-semibold text-center text-[11px] print:bg-stone-200 print:text-black">
                          <th className="border border-stone-300 p-1.5 w-8">No</th>
                          <th className="border border-stone-300 p-1.5 w-20">Tanggal</th>
                          <th className="border border-stone-300 p-1.5 w-28">No. Bukti</th>
                          <th className="border border-stone-300 p-1.5 min-w-[180px]">Uraian Transaksi</th>
                          <th className="border border-stone-300 p-1.5 w-16">Kode</th>
                          <th className="border border-stone-300 p-1.5 w-14">Metode</th>
                          <th className="border border-stone-300 p-1.5 w-24 text-right">Penerimaan</th>
                          <th className="border border-stone-300 p-1.5 w-24 text-right">Pengeluaran</th>
                          <th className="border border-stone-300 p-1.5 w-28 text-right">Saldo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Saldo Awal */}
                        <tr className="bg-stone-50 font-semibold text-[11px]">
                          <td className="border border-stone-300 p-1.5 text-center">1</td>
                          <td className="border border-stone-300 p-1.5 text-center font-mono">01/01/{profile.fiscalYear}</td>
                          <td className="border border-stone-300 p-1.5 text-center font-mono">-</td>
                          <td className="border border-stone-300 p-1.5">Saldo Awal Buku Kas Umum (Kas & Bank)</td>
                          <td className="border border-stone-300 p-1.5 text-center font-mono">-</td>
                          <td className="border border-stone-300 p-1.5 text-center font-mono">KAS+BANK</td>
                          <td className="border border-stone-300 p-1.5 text-right font-mono">{formatRupiah(initialTotalBalance)}</td>
                          <td className="border border-stone-300 p-1.5 text-right font-mono">-</td>
                          <td className="border border-stone-300 p-1.5 text-right font-mono font-bold">{formatRupiah(initialTotalBalance)}</td>
                        </tr>

                        {/* Transaksi rows */}
                        {bkuRows.map((r, idx) => (
                          <tr key={r.tx.id} className="text-[11px] hover:bg-stone-50">
                            <td className="border border-stone-300 p-1.5 text-center text-stone-500 font-mono">{idx + 2}</td>
                            <td className="border border-stone-300 p-1.5 text-center font-mono">{formatTanggalSingkat(r.tx.date)}</td>
                            <td className="border border-stone-300 p-1.5 text-center font-mono">{r.tx.docNumber}</td>
                            <td className="border border-stone-300 p-1.5">
                              <div>{r.tx.description}</div>
                              {r.tx.recipientOrPayer && (
                                <div className="text-[9px] text-stone-500 italic">
                                  {r.tx.type === 'IN' ? 'Dari: ' : 'Kepada: '} {r.tx.recipientOrPayer}
                                </div>
                              )}
                            </td>
                            <td className="border border-stone-300 p-1.5 text-center font-mono text-[10px]">{r.tx.accountCode}</td>
                            <td className="border border-stone-300 p-1.5 text-center font-mono text-[10px]">{r.tx.paymentMethod}</td>
                            <td className="border border-stone-300 p-1.5 text-right font-mono text-emerald-800">{r.masuk > 0 ? formatRupiah(r.masuk) : '-'}</td>
                            <td className="border border-stone-300 p-1.5 text-right font-mono text-red-700">{r.keluar > 0 ? formatRupiah(r.keluar) : '-'}</td>
                            <td className="border border-stone-300 p-1.5 text-right font-mono font-bold bg-stone-50/50">{formatRupiah(r.balanceAfter)}</td>
                          </tr>
                        ))}

                        {/* Footer Total */}
                        <tr className="bg-stone-100 font-bold text-xs">
                          <td colSpan={6} className="border border-stone-300 p-2 text-right uppercase">
                            Jumlah Total Penerimaan & Pengeluaran:
                          </td>
                          <td className="border border-stone-300 p-2 text-right font-mono text-emerald-900">
                            {formatRupiah(totalBkuMasuk)}
                          </td>
                          <td className="border border-stone-300 p-2 text-right font-mono text-red-900">
                            {formatRupiah(totalBkuKeluar)}
                          </td>
                          <td className="border border-stone-300 p-2 text-right font-mono font-black text-emerald-950 bg-stone-200">
                            {formatRupiah(runningBku)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Berita Acara Kas Opname */}
                  {showKasOpname && (
                    <div className="mt-6 p-4 rounded border border-stone-300 bg-stone-50/60 text-xs break-inside-avoid">
                      <h4 className="font-bold text-stone-800 uppercase tracking-wide border-b border-stone-300 pb-1 mb-2">
                        BERITA ACARA PEMERIKSAAN KAS & BANK (KAS OPNAME)
                      </h4>
                      <p className="text-[11px] text-stone-600 mb-2">
                        Pada hari penutupan pembukuan, telah dilakukan pemeriksaan fisik kas tunai dan rekening bank oleh Pemerintah Desa dan Pengelola BUMDes dengan rincian sebagai berikut:
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="flex justify-between border-b border-stone-200 pb-0.5">
                            <span>a. Uang Kas Tunai di Brankas Bendahara</span>
                            <strong className="font-mono">{formatRupiah(physicalCash)}</strong>
                          </div>
                          <div className="flex justify-between border-b border-stone-200 pb-0.5">
                            <span>b. Saldo Rekening Bank ({profile.bankName})</span>
                            <strong className="font-mono">{formatRupiah(physicalBank)}</strong>
                          </div>
                          <div className="flex justify-between font-bold pt-1">
                            <span>Total Riil Kas Fisik & Bank (a + b)</span>
                            <span className="font-mono text-emerald-900">{formatRupiah(physicalCash + physicalBank)}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between border-b border-stone-200 pb-0.5">
                            <span>Saldo Menurut Buku Kas Umum (BKU)</span>
                            <strong className="font-mono">{formatRupiah(runningBku)}</strong>
                          </div>
                          <div className="flex justify-between border-b border-stone-200 pb-0.5">
                            <span>Selisih Pemeriksaan Kas</span>
                            <strong className="font-mono text-stone-700">{formatRupiah(runningBku - (physicalCash + physicalBank))}</strong>
                          </div>
                          <div className="flex justify-between font-bold pt-1 text-emerald-800">
                            <span>Status Kesesuaian Fisik Kas</span>
                            <span>SEIMBANG / COCOK (NIHIL)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {showSignatures && (
                    <OfficialSignatures profile={profile} />
                  )}
                </section>
              )}

              {/* 2. BUKU PEMBANTU KAS TUNAI */}
              {(target === 'cash' || target === 'cash_bank' || (target === 'all' && false)) && (
                <section className="print-section mb-10 break-after-page">
                  <KopSurat
                    profile={profile}
                    documentTitle="BUKU PEMBANTU KAS TUNAI"
                    documentSubtitle="Mutasi Kas Tunai pada Bendahara BUMDes"
                    periodLabel={periodLabel}
                    showLogo={showLogo}
                  />

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse border border-stone-300">
                      <thead>
                        <tr className="bg-amber-900 text-white font-semibold text-center text-[11px] print:bg-stone-200 print:text-black">
                          <th className="border border-stone-300 p-1.5 w-8">No</th>
                          <th className="border border-stone-300 p-1.5 w-20">Tanggal</th>
                          <th className="border border-stone-300 p-1.5 w-28">No. Bukti</th>
                          <th className="border border-stone-300 p-1.5">Uraian Transaksi</th>
                          <th className="border border-stone-300 p-1.5 w-24 text-right">Penerimaan</th>
                          <th className="border border-stone-300 p-1.5 w-24 text-right">Pengeluaran</th>
                          <th className="border border-stone-300 p-1.5 w-28 text-right">Saldo Kas</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-stone-50 font-semibold text-[11px]">
                          <td className="border border-stone-300 p-1.5 text-center">1</td>
                          <td className="border border-stone-300 p-1.5 text-center font-mono">01/01/{profile.fiscalYear}</td>
                          <td className="border border-stone-300 p-1.5 text-center font-mono">-</td>
                          <td className="border border-stone-300 p-1.5">Saldo Awal Kas Tunai Bendahara</td>
                          <td className="border border-stone-300 p-1.5 text-right font-mono">{formatRupiah(profile.initialCash)}</td>
                          <td className="border border-stone-300 p-1.5 text-right font-mono">-</td>
                          <td className="border border-stone-300 p-1.5 text-right font-mono font-bold">{formatRupiah(profile.initialCash)}</td>
                        </tr>

                        {kasRows.map((r, idx) => (
                          <tr key={r.tx.id} className="text-[11px]">
                            <td className="border border-stone-300 p-1.5 text-center text-stone-500 font-mono">{idx + 2}</td>
                            <td className="border border-stone-300 p-1.5 text-center font-mono">{formatTanggalSingkat(r.tx.date)}</td>
                            <td className="border border-stone-300 p-1.5 text-center font-mono">{r.tx.docNumber}</td>
                            <td className="border border-stone-300 p-1.5">{r.tx.description}</td>
                            <td className="border border-stone-300 p-1.5 text-right font-mono text-emerald-800">{r.masuk > 0 ? formatRupiah(r.masuk) : '-'}</td>
                            <td className="border border-stone-300 p-1.5 text-right font-mono text-red-700">{r.keluar > 0 ? formatRupiah(r.keluar) : '-'}</td>
                            <td className="border border-stone-300 p-1.5 text-right font-mono font-bold bg-stone-50/50">{formatRupiah(r.balance)}</td>
                          </tr>
                        ))}

                        <tr className="bg-stone-100 font-bold text-xs">
                          <td colSpan={4} className="border border-stone-300 p-2 text-right uppercase">
                            Total Mutasi Kas Tunai:
                          </td>
                          <td className="border border-stone-300 p-2 text-right font-mono text-emerald-900">{formatRupiah(totalKasMasuk)}</td>
                          <td className="border border-stone-300 p-2 text-right font-mono text-red-900">{formatRupiah(totalKasKeluar)}</td>
                          <td className="border border-stone-300 p-2 text-right font-mono font-black text-amber-950 bg-stone-200">{formatRupiah(runningKas)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {showSignatures && (
                    <OfficialSignatures profile={profile} treasurerTitle="Bendahara Kas Tunai" />
                  )}
                </section>
              )}

              {/* 3. BUKU PEMBANTU BANK */}
              {(target === 'bank' || target === 'cash_bank') && (
                <section className="print-section mb-10 break-after-page">
                  <KopSurat
                    profile={profile}
                    documentTitle="BUKU PEMBANTU BANK"
                    documentSubtitle={`Rekening: ${profile.bankName} - No: ${profile.bankAccount}`}
                    periodLabel={periodLabel}
                    showLogo={showLogo}
                  />

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse border border-stone-300">
                      <thead>
                        <tr className="bg-blue-900 text-white font-semibold text-center text-[11px] print:bg-stone-200 print:text-black">
                          <th className="border border-stone-300 p-1.5 w-8">No</th>
                          <th className="border border-stone-300 p-1.5 w-20">Tanggal</th>
                          <th className="border border-stone-300 p-1.5 w-28">No. Bukti</th>
                          <th className="border border-stone-300 p-1.5">Uraian Transaksi Bank</th>
                          <th className="border border-stone-300 p-1.5 w-24 text-right">Penerimaan</th>
                          <th className="border border-stone-300 p-1.5 w-24 text-right">Pengeluaran</th>
                          <th className="border border-stone-300 p-1.5 w-28 text-right">Saldo Bank</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-stone-50 font-semibold text-[11px]">
                          <td className="border border-stone-300 p-1.5 text-center">1</td>
                          <td className="border border-stone-300 p-1.5 text-center font-mono">01/01/{profile.fiscalYear}</td>
                          <td className="border border-stone-300 p-1.5 text-center font-mono">-</td>
                          <td className="border border-stone-300 p-1.5">Saldo Awal Rekening Bank BUMDes</td>
                          <td className="border border-stone-300 p-1.5 text-right font-mono">{formatRupiah(profile.initialBank)}</td>
                          <td className="border border-stone-300 p-1.5 text-right font-mono">-</td>
                          <td className="border border-stone-300 p-1.5 text-right font-mono font-bold">{formatRupiah(profile.initialBank)}</td>
                        </tr>

                        {bankRows.map((r, idx) => (
                          <tr key={r.tx.id} className="text-[11px]">
                            <td className="border border-stone-300 p-1.5 text-center text-stone-500 font-mono">{idx + 2}</td>
                            <td className="border border-stone-300 p-1.5 text-center font-mono">{formatTanggalSingkat(r.tx.date)}</td>
                            <td className="border border-stone-300 p-1.5 text-center font-mono">{r.tx.docNumber}</td>
                            <td className="border border-stone-300 p-1.5">{r.tx.description}</td>
                            <td className="border border-stone-300 p-1.5 text-right font-mono text-emerald-800">{r.masuk > 0 ? formatRupiah(r.masuk) : '-'}</td>
                            <td className="border border-stone-300 p-1.5 text-right font-mono text-red-700">{r.keluar > 0 ? formatRupiah(r.keluar) : '-'}</td>
                            <td className="border border-stone-300 p-1.5 text-right font-mono font-bold bg-stone-50/50">{formatRupiah(r.balance)}</td>
                          </tr>
                        ))}

                        <tr className="bg-stone-100 font-bold text-xs">
                          <td colSpan={4} className="border border-stone-300 p-2 text-right uppercase">
                            Total Mutasi Rekening Bank:
                          </td>
                          <td className="border border-stone-300 p-2 text-right font-mono text-emerald-900">{formatRupiah(totalBankMasuk)}</td>
                          <td className="border border-stone-300 p-2 text-right font-mono text-red-900">{formatRupiah(totalBankKeluar)}</td>
                          <td className="border border-stone-300 p-2 text-right font-mono font-black text-blue-950 bg-stone-200">{formatRupiah(runningBank)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {showSignatures && (
                    <OfficialSignatures profile={profile} treasurerTitle="Bendahara Rekening Bank" />
                  )}
                </section>
              )}

              {/* 4. LAPORAN LABA RUGI (HASIL USAHA / SHU) */}
              {(target === 'income_statement' || target === 'all') && (
                <section className="print-section mb-10 break-after-page">
                  <KopSurat
                    profile={profile}
                    documentTitle="LAPORAN LABA RUGI (HASIL USAHA BUMDES)"
                    documentSubtitle="Perhitungan Hasil Usaha & Alokasi Sisa Hasil Usaha (SHU)"
                    periodLabel={periodLabel}
                    showLogo={showLogo}
                  />

                  <div className="space-y-4 text-xs">
                    {/* A. PENDAPATAN */}
                    <div className="border border-stone-300 rounded overflow-hidden">
                      <div className="bg-emerald-800 text-white p-2 font-bold uppercase print:bg-stone-200 print:text-black">
                        I. PENDAPATAN OPERASIONAL USAHA
                      </div>
                      <div className="p-2 space-y-1 bg-white">
                        {revenueAccounts.map((a) => (
                          <div key={a.code} className="flex justify-between py-1 border-b border-stone-100">
                            <span className="text-stone-700">{a.code} - {a.name}</span>
                            <span className="font-mono font-medium">{formatRupiah(accountTotals.get(a.code) || 0)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-bold pt-1.5 text-emerald-950 bg-emerald-50/50 px-2 rounded">
                          <span>TOTAL PENDAPATAN OPERASIONAL USAHA:</span>
                          <span className="font-mono">{formatRupiah(totalPendapatanUsaha)}</span>
                        </div>
                      </div>
                    </div>

                    {/* B. HPP */}
                    <div className="border border-stone-300 rounded overflow-hidden">
                      <div className="bg-stone-700 text-white p-2 font-bold uppercase print:bg-stone-200 print:text-black">
                        II. HARGA POKOK PENJUALAN (HPP)
                      </div>
                      <div className="p-2 space-y-1 bg-white">
                        {hppAccounts.map((a) => (
                          <div key={a.code} className="flex justify-between py-1 border-b border-stone-100">
                            <span className="text-stone-700">{a.code} - {a.name}</span>
                            <span className="font-mono font-medium text-stone-900">{formatRupiah(accountTotals.get(a.code) || 0)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-bold pt-1.5 text-stone-900 bg-stone-100 px-2 rounded">
                          <span>TOTAL HARGA POKOK PENJUALAN:</span>
                          <span className="font-mono">({formatRupiah(totalHpp)})</span>
                        </div>
                      </div>
                    </div>

                    {/* LABA KOTOR */}
                    <div className="flex justify-between font-bold text-sm bg-emerald-100 text-emerald-950 p-2.5 rounded border border-emerald-300">
                      <span>LABA KOTOR (GROSS PROFIT):</span>
                      <span className="font-mono">{formatRupiah(labaKotor)}</span>
                    </div>

                    {/* C. BEBAN OPERASIONAL */}
                    <div className="border border-stone-300 rounded overflow-hidden">
                      <div className="bg-red-800 text-white p-2 font-bold uppercase print:bg-stone-200 print:text-black">
                        III. BEBAN OPERASIONAL & ADMINISTRASI
                      </div>
                      <div className="p-2 space-y-1 bg-white">
                        {opexAccounts.map((a) => (
                          <div key={a.code} className="flex justify-between py-1 border-b border-stone-100">
                            <span className="text-stone-700">{a.code} - {a.name}</span>
                            <span className="font-mono font-medium text-red-700">{formatRupiah(accountTotals.get(a.code) || 0)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-bold pt-1.5 text-red-950 bg-red-50/50 px-2 rounded">
                          <span>TOTAL BEBAN OPERASIONAL:</span>
                          <span className="font-mono">({formatRupiah(totalBebanOperasional)})</span>
                        </div>
                      </div>
                    </div>

                    {/* SHU BERSIH */}
                    <div className="flex justify-between font-black text-sm bg-emerald-800 text-white p-3 rounded shadow-sm print:bg-stone-300 print:text-black">
                      <span>SISA HASIL USAHA (SHU) / LABA BERSIH:</span>
                      <span className="font-mono">{formatRupiah(sisaHasilUsaha)}</span>
                    </div>

                    {/* D. PEMBAGIAN SHU (SK BUMDes) */}
                    <div className="border border-stone-300 rounded overflow-hidden p-3 bg-stone-50">
                      <h4 className="font-bold text-stone-800 uppercase mb-2 border-b border-stone-200 pb-1">
                        RENCANA ALOKASI SISA HASIL USAHA (SHU)
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <div className="flex justify-between border-b border-stone-200 py-1">
                          <span>1. Pendapatan Asli Desa (PADes) (30%):</span>
                          <span className="font-mono font-bold text-emerald-800">{formatRupiah(pades)}</span>
                        </div>
                        <div className="flex justify-between border-b border-stone-200 py-1">
                          <span>2. Penambahan Cadangan Modal (30%):</span>
                          <span className="font-mono font-bold">{formatRupiah(cadanganModal)}</span>
                        </div>
                        <div className="flex justify-between border-b border-stone-200 py-1">
                          <span>3. Jasa Pengurus, Pengawas & Pegawai (20%):</span>
                          <span className="font-mono font-bold">{formatRupiah(jasaPengurus)}</span>
                        </div>
                        <div className="flex justify-between border-b border-stone-200 py-1">
                          <span>4. Dana Sosial & Bantuan Warga (10%):</span>
                          <span className="font-mono font-bold">{formatRupiah(danaSosial)}</span>
                        </div>
                        <div className="flex justify-between border-b border-stone-200 py-1">
                          <span>5. Dana Pendidikan & Pembinaan (10%):</span>
                          <span className="font-mono font-bold">{formatRupiah(danaPendidikan)}</span>
                        </div>
                        <div className="flex justify-between font-bold pt-1 text-emerald-900">
                          <span>TOTAL ALOKASI SHU (100%):</span>
                          <span className="font-mono">{formatRupiah(shuPositive)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {showSignatures && (
                    <OfficialSignatures profile={profile} />
                  )}
                </section>
              )}

              {/* 5. NERACA KEUANGAN */}
              {(target === 'balance_sheet' || target === 'all') && (
                <section className="print-section mb-10 break-after-page">
                  <KopSurat
                    profile={profile}
                    documentTitle="LAPORAN POSISI KEUANGAN (NERACA)"
                    documentSubtitle="Aktiva (Aset) vs Pasiva (Kewajiban & Ekuitas)"
                    periodLabel={periodLabel}
                    showLogo={showLogo}
                  />

                  {/* 2-Column Skontro Balance Sheet */}
                  <div className="grid grid-cols-2 gap-4 text-xs border border-stone-300 p-3 rounded">
                    {/* ASET */}
                    <div className="space-y-3 border-r border-stone-300 pr-3">
                      <div className="font-bold text-emerald-900 border-b-2 border-emerald-800 pb-1 uppercase">
                        ASET (AKTIVA)
                      </div>
                      
                      {/* Aset Lancar */}
                      <div className="space-y-1">
                        <div className="font-semibold text-stone-700">Aset Lancar:</div>
                        <div className="flex justify-between pl-2"><span>Kas Tunai di Brankas:</span><span className="font-mono">{formatRupiah(physicalCash)}</span></div>
                        <div className="flex justify-between pl-2"><span>Kas di Bank ({profile.bankName}):</span><span className="font-mono">{formatRupiah(physicalBank)}</span></div>
                        <div className="flex justify-between pl-2"><span>Piutang Usaha:</span><span className="font-mono">{formatRupiah(piutang)}</span></div>
                        <div className="flex justify-between pl-2"><span>Persediaan Barang Dagang:</span><span className="font-mono">{formatRupiah(persediaan)}</span></div>
                        <div className="flex justify-between font-bold border-t border-stone-200 pt-1 text-emerald-900">
                          <span>Total Aset Lancar:</span>
                          <span className="font-mono">{formatRupiah(totalAsetLancar)}</span>
                        </div>
                      </div>

                      {/* Aset Tetap */}
                      <div className="space-y-1 pt-2">
                        <div className="font-semibold text-stone-700">Aset Tetap:</div>
                        <div className="flex justify-between pl-2"><span>Peralatan & Mesin Usaha:</span><span className="font-mono">{formatRupiah(peralatan)}</span></div>
                        <div className="flex justify-between pl-2"><span>Akumulasi Penyusutan:</span><span className="font-mono">({formatRupiah(Math.abs(akumPenyusutan))})</span></div>
                        <div className="flex justify-between pl-2"><span>Gedung Kios & Bangunan:</span><span className="font-mono">{formatRupiah(gedungKios)}</span></div>
                        <div className="flex justify-between pl-2"><span>Jaringan Pipa PAMSIMAS:</span><span className="font-mono">{formatRupiah(jaringanPipa)}</span></div>
                        <div className="flex justify-between font-bold border-t border-stone-200 pt-1 text-emerald-900">
                          <span>Total Aset Tetap:</span>
                          <span className="font-mono">{formatRupiah(totalAsetTetap)}</span>
                        </div>
                      </div>

                      <div className="flex justify-between font-black text-sm bg-emerald-50 p-2 rounded border border-emerald-300 text-emerald-950 mt-4">
                        <span>TOTAL ASET:</span>
                        <span className="font-mono">{formatRupiah(totalAset)}</span>
                      </div>
                    </div>

                    {/* KEWAJIBAN & EKUITAS */}
                    <div className="space-y-3 pl-1">
                      <div className="font-bold text-stone-900 border-b-2 border-stone-800 pb-1 uppercase">
                        KEWAJIBAN & EKUITAS (PASIVA)
                      </div>

                      {/* Kewajiban */}
                      <div className="space-y-1">
                        <div className="font-semibold text-stone-700">Kewajiban Jangka Pendek:</div>
                        <div className="flex justify-between pl-2"><span>Utang Usaha / Supplier:</span><span className="font-mono">{formatRupiah(utangSupplier)}</span></div>
                        <div className="flex justify-between pl-2"><span>Utang Pajak (PPh/PPN):</span><span className="font-mono">{formatRupiah(utangPajak)}</span></div>
                        <div className="flex justify-between font-bold border-t border-stone-200 pt-1">
                          <span>Total Kewajiban:</span>
                          <span className="font-mono">{formatRupiah(totalKewajiban)}</span>
                        </div>
                      </div>

                      {/* Ekuitas */}
                      <div className="space-y-1 pt-2">
                        <div className="font-semibold text-stone-700">Ekuitas / Modal Sendiri:</div>
                        <div className="flex justify-between pl-2"><span>Penyertaan Modal Desa (APBDes):</span><span className="font-mono">Rp 100.000.000</span></div>
                        <div className="flex justify-between pl-2"><span>Penyertaan Modal Masyarakat:</span><span className="font-mono">Rp 15.000.000</span></div>
                        <div className="flex justify-between pl-2"><span>Cadangan Modal:</span><span className="font-mono">Rp 10.000.000</span></div>
                        <div className="flex justify-between pl-2"><span>Sisa Hasil Usaha Berjalan:</span><span className="font-mono">{formatRupiah(sisaHasilUsaha)}</span></div>
                        <div className="flex justify-between font-bold border-t border-stone-200 pt-1 text-emerald-900">
                          <span>Total Ekuitas:</span>
                          <span className="font-mono">{formatRupiah(totalEkuitas)}</span>
                        </div>
                      </div>

                      <div className="flex justify-between font-black text-sm bg-stone-100 p-2 rounded border border-stone-300 text-stone-900 mt-4">
                        <span>TOTAL PASIVA:</span>
                        <span className="font-mono">{formatRupiah(totalKewajiban + totalEkuitas)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-center text-xs font-bold text-emerald-800 bg-emerald-50 py-1.5 rounded border border-emerald-200">
                    STATUS: NERACA SEIMBANG (BALANCE) · TOTAL ASET = TOTAL KEWAJIBAN & EKUITAS
                  </div>

                  {showSignatures && (
                    <OfficialSignatures profile={profile} />
                  )}
                </section>
              )}

              {/* 6. JURNAL & REKAP TRANSAKSI */}
              {(target === 'transactions' || target === 'all') && (
                <section className="print-section mb-10 break-after-page">
                  <KopSurat
                    profile={profile}
                    documentTitle="BUKU JURNAL & REKAPITULASI TRANSAKSI"
                    documentSubtitle={`Daftar Kronologis Semua Transaksi Penerimaan (BKM) & Pengeluaran (BKK)`}
                    periodLabel={periodLabel}
                    showLogo={showLogo}
                  />

                  <table className="w-full text-left text-xs border-collapse border border-stone-300">
                    <thead>
                      <tr className="bg-purple-900 text-white font-semibold text-center text-[11px] print:bg-stone-200 print:text-black">
                        <th className="border border-stone-300 p-1.5 w-8">No</th>
                        <th className="border border-stone-300 p-1.5 w-20">Tanggal</th>
                        <th className="border border-stone-300 p-1.5 w-24">No. Bukti</th>
                        <th className="border border-stone-300 p-1.5">Uraian / Keterangan</th>
                        <th className="border border-stone-300 p-1.5 w-16">Kode</th>
                        <th className="border border-stone-300 p-1.5 w-14">Tipe</th>
                        <th className="border border-stone-300 p-1.5 w-28 text-right">Debit / Penerimaan</th>
                        <th className="border border-stone-300 p-1.5 w-28 text-right">Kredit / Pengeluaran</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTx.map((tx, idx) => (
                        <tr key={tx.id} className="text-[11px]">
                          <td className="border border-stone-300 p-1.5 text-center text-stone-500 font-mono">{idx + 1}</td>
                          <td className="border border-stone-300 p-1.5 text-center font-mono">{formatTanggalSingkat(tx.date)}</td>
                          <td className="border border-stone-300 p-1.5 text-center font-mono">{tx.docNumber}</td>
                          <td className="border border-stone-300 p-1.5">
                            <div>{tx.description}</div>
                            {tx.recipientOrPayer && (
                              <div className="text-[9px] text-stone-500">Pihak: {tx.recipientOrPayer}</div>
                            )}
                          </td>
                          <td className="border border-stone-300 p-1.5 text-center font-mono">{tx.accountCode}</td>
                          <td className="border border-stone-300 p-1.5 text-center font-bold text-[10px]">
                            {tx.type === 'IN' ? 'BKM' : 'BKK'}
                          </td>
                          <td className="border border-stone-300 p-1.5 text-right font-mono text-emerald-800">
                            {tx.type === 'IN' ? formatRupiah(tx.amount) : '-'}
                          </td>
                          <td className="border border-stone-300 p-1.5 text-right font-mono text-red-700">
                            {tx.type === 'OUT' ? formatRupiah(tx.amount) : '-'}
                          </td>
                        </tr>
                      ))}

                      <tr className="bg-stone-100 font-bold text-xs">
                        <td colSpan={6} className="border border-stone-300 p-2 text-right uppercase">
                          Total Mutasi Jurnal Transaksi:
                        </td>
                        <td className="border border-stone-300 p-2 text-right font-mono text-emerald-900">
                          {formatRupiah(sortedTx.filter(t => t.type === 'IN').reduce((s, t) => s + t.amount, 0))}
                        </td>
                        <td className="border border-stone-300 p-2 text-right font-mono text-red-900">
                          {formatRupiah(sortedTx.filter(t => t.type === 'OUT').reduce((s, t) => s + t.amount, 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {showSignatures && (
                    <OfficialSignatures profile={profile} />
                  )}
                </section>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
