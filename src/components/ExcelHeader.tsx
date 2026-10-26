import React, { useState, useRef, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  PlusCircle, 
  Printer, 
  Settings, 
  RotateCcw, 
  Search, 
  Filter, 
  CheckCircle2, 
  ChevronDown, 
  Layers, 
  BookOpen, 
  Landmark, 
  TrendingUp, 
  Scale, 
  ListOrdered, 
  Wallet,
  Eye,
  FileDown,
  Building2,
  Shield,
  Cloud
} from 'lucide-react';
import { User } from 'firebase/auth';
import { ActiveTab, BumdesProfile, BusinessUnit } from '../types';
import { PrintTarget } from './PrintReportModal';
import { formatRupiah } from '../utils/formatters';

interface ExcelHeaderProps {
  profile: BumdesProfile;
  units: BusinessUnit[];
  activeTab: ActiveTab;
  selectedMonth: string;
  setSelectedMonth: (val: string) => void;
  selectedUnit: string;
  setSelectedUnit: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onExportExcel: () => void;
  onOpenImport: () => void;
  onOpenAddTx: () => void;
  onOpenSettings: (tab?: 'profil' | 'logo_kabupaten' | 'akun' | 'unit') => void;
  onOpenAddAccount?: () => void;
  onManageUnits?: () => void;
  onResetData: () => void;
  onOpenPrintModal: (target?: PrintTarget) => void;
  onPrintDirect?: () => void;
  onDownloadPdf?: () => void;
  onOpenGoogleDrive?: () => void;
  currentUser?: User | null;
  lastDriveSync?: string | null;
  isAutoSyncing?: boolean;
  totalBkuSaldo: number;
  cashSaldo: number;
  bankSaldo: number;
  currentCellName: string;
  currentCellValue: string;
}

export const ExcelHeader: React.FC<ExcelHeaderProps> = ({
  profile,
  units,
  activeTab,
  selectedMonth,
  setSelectedMonth,
  selectedUnit,
  setSelectedUnit,
  searchQuery,
  setSearchQuery,
  onExportExcel,
  onOpenImport,
  onOpenAddTx,
  onOpenSettings,
  onOpenAddAccount,
  onManageUnits,
  onResetData,
  onOpenPrintModal,
  onPrintDirect,
  onDownloadPdf,
  onOpenGoogleDrive,
  currentUser,
  lastDriveSync,
  isAutoSyncing,
  totalBkuSaldo,
  cashSaldo,
  bankSaldo,
  currentCellName,
  currentCellValue,
}) => {
  const [isPrintMenuOpen, setIsPrintMenuOpen] = useState(false);
  const printMenuRef = useRef<HTMLDivElement>(null);

  // Close print dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setIsPrintMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const months = [
    { value: 'ALL', label: 'Semua Periode (1 Tahun)' },
    { value: '01', label: 'Januari 2026' },
    { value: '02', label: 'Februari 2026' },
    { value: '03', label: 'Maret 2026' },
    { value: '04', label: 'April 2026' },
    { value: '05', label: 'Mei 2026' },
    { value: '06', label: 'Juni 2026' },
    { value: '07', label: 'Juli 2026' },
    { value: '08', label: 'Agustus 2026' },
    { value: '09', label: 'September 2026' },
    { value: '10', label: 'Oktober 2026' },
    { value: '11', label: 'November 2026' },
    { value: '12', label: 'Desember 2026' },
  ];

  const logoSrc = profile.logoUrl || '/logo-bumdes.jpg';

  // Map active tab to print target
  const getActiveTabTarget = (): PrintTarget => {
    switch (activeTab) {
      case 'bku': return 'bku';
      case 'cash_bank': return 'cash_bank';
      case 'income_statement': return 'income_statement';
      case 'balance_sheet': return 'balance_sheet';
      case 'transactions': return 'transactions';
      default: return 'bku';
    }
  };

  const getActiveTabLabel = (): string => {
    switch (activeTab) {
      case 'bku': return 'Buku Kas Umum (BKU)';
      case 'cash_bank': return 'Pembantu Kas & Bank';
      case 'income_statement': return 'Laba Rugi (Hasil Usaha)';
      case 'balance_sheet': return 'Neraca Keuangan';
      case 'transactions': return 'Jurnal & Transaksi';
      default: return 'Pembukuan Aktif';
    }
  };

  return (
    <header className="bg-white border-b border-emerald-800/20 select-none print:hidden">
      {/* Top Application Bar - Excel Green Styling with Official Logo */}
      <div className="bg-[#107c41] text-white px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Logo Lembaga: Logo Kabupaten (jika diunggah) & Logo BUMDes */}
          <div className="flex items-center gap-1.5">
            {profile.regencyLogoUrl ? (
              <div
                className="relative group cursor-pointer"
                onClick={() => onOpenSettings('logo_kabupaten')}
                title={`Logo Pemerintah ${profile.district} - Klik untuk ganti / atur`}
              >
                <img
                  src={profile.regencyLogoUrl}
                  alt={`Logo Pemerintah ${profile.district}`}
                  className="w-10 h-10 rounded-md object-contain border-2 border-amber-300 shadow bg-white p-0.5 flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            ) : null}

            <div
              className="relative group cursor-pointer"
              onClick={() => onOpenSettings('profil')}
              title={`Logo ${profile.name} - Klik untuk pengaturan profil / ganti logo`}
            >
              <img
                src={logoSrc}
                alt={`Logo ${profile.name}`}
                className="w-10 h-10 rounded-full object-cover border-2 border-amber-300 shadow bg-white flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-bold text-sm tracking-wide">{profile.name}</span>
              <span className="text-xs bg-emerald-900/70 border border-emerald-700/50 px-2 py-0.5 rounded text-emerald-100 font-mono">
                TA {profile.fiscalYear}
              </span>
              {profile.ahuNumber ? (
                <button
                  type="button"
                  onClick={() => onOpenSettings('profil')}
                  className="text-[11px] bg-emerald-950/80 hover:bg-emerald-900 border border-amber-400/50 px-2 py-0.5 rounded text-amber-200 font-mono flex items-center gap-1 transition shadow-xs cursor-pointer"
                  title={`Badan Hukum Kemenkumham RI: ${profile.ahuNumber}. Klik untuk ubah di Pengaturan.`}
                >
                  <Shield className="w-3 h-3 text-amber-400" />
                  <span>No. AHU: {profile.ahuNumber}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenSettings('profil')}
                  className="text-[10.5px] bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold px-2 py-0.5 rounded flex items-center gap-1 transition shadow-xs cursor-pointer"
                  title="Klik untuk menambahkan No. AHU Badan Hukum Kemenkumham"
                >
                  <PlusCircle className="w-3 h-3 text-stone-900" />
                  <span>+ Tambah No. AHU</span>
                </button>
              )}
            </div>
            <p className="text-xs text-emerald-100">
              {profile.village}, {profile.subdistrict}, {profile.district} · Standar Kemendesa PDTT
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar with Print, Print Preview, Download PDF, Download Excel, Google Drive */}
        <div className="flex items-center flex-wrap gap-2">
          {/* TOMBOL GOOGLE DRIVE */}
          {onOpenGoogleDrive && (
            <button
              onClick={onOpenGoogleDrive}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold shadow-xs transition active:scale-95 ${
                currentUser
                  ? 'bg-emerald-900/90 hover:bg-emerald-950 text-emerald-100 border border-emerald-600/70'
                  : 'bg-white hover:bg-stone-100 text-stone-900 border border-stone-300'
              }`}
              title={
                currentUser
                  ? `Google Drive Terhubung (${currentUser.email}) • Terakhir Sinkron: ${lastDriveSync || 'Otomatis'}. Klik untuk kelola cadangan.`
                  : 'Hubungkan dan Simpan Aplikasi BUMDes ke Google Drive Anda'
              }
            >
              <Cloud className={`w-3.5 h-3.5 ${currentUser ? 'text-emerald-300' : 'text-blue-600'}`} />
              <span>{currentUser ? 'Google Drive Aktif' : 'Simpan ke Drive'}</span>
              {currentUser && isAutoSyncing && (
                <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" title="Sedang menyinkronkan..."></span>
              )}
            </button>
          )}

          <button
            onClick={onOpenAddTx}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-stone-900 rounded shadow-sm transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Catat Transaksi</span>
          </button>

          {/* 1. TOMBOL PRINT PREVIEW */}
          <button
            onClick={() => onOpenPrintModal(getActiveTabTarget())}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 border border-emerald-500/40 text-white rounded shadow-sm transition active:scale-95"
            title="Buka Print Preview A4 Resmi & Pengaturan Cetak"
          >
            <Eye className="w-3.5 h-3.5 text-amber-300" />
            <span>Print Preview</span>
          </button>

          {/* 2. TOMBOL PRINT (CETAK KE PRINTER AKTIF KOMPUTER) */}
          <button
            onClick={onPrintDirect || (() => window.print())}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 border border-emerald-500/40 text-white rounded shadow-sm transition active:scale-95"
            title="Cetak langsung ke semua perangkat printer komputer yang terhubung (USB, Wi-Fi, LAN, Bluetooth) - Ctrl+P"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print (Cetak)</span>
          </button>

          {/* 3. TOMBOL DOWNLOAD PDF (SIMPAN KE DRIVE KOMPUTER) */}
          <button
            onClick={onDownloadPdf || (() => onOpenPrintModal(getActiveTabTarget()))}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-stone-950 rounded shadow-sm transition active:scale-95"
            title="Unduh & Simpan Dokumen PDF ini ke Drive Komputer (Drive C:, D:, atau Folder Unduhan)"
          >
            <FileDown className="w-4 h-4 text-stone-950" />
            <span>Download PDF</span>
          </button>

          {/* 4. TOMBOL DOWNLOAD EXCEL (.XLSX) */}
          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40 rounded shadow-sm transition active:scale-95"
            title="Unduh seluruh buku laporan ke format Microsoft Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Excel</span>
          </button>

          {/* DEDICATED MENU PRINT DROPDOWN */}
          <div className="relative" ref={printMenuRef}>
            <button
              onClick={() => setIsPrintMenuOpen(!isPrintMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white rounded shadow-sm transition active:scale-95 border border-emerald-600/50"
              title="Menu Lengkap Cetak Dokumen Keuangan & BKU BUMDes"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300" />
              <span>Menu Cetak</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-emerald-200" />
            </button>

            {/* Dropdown Menu Items */}
            {isPrintMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-lg shadow-2xl border border-stone-200 py-1.5 z-50 text-stone-800 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 flex items-center justify-between">
                  <span>PILIH PEMBUKUAN UNTUK DICETAK / PDF</span>
                  <Printer className="w-3 h-3 text-emerald-700" />
                </div>

                {/* Print Current Sheet */}
                <button
                  onClick={() => {
                    setIsPrintMenuOpen(false);
                    onOpenPrintModal(getActiveTabTarget());
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-emerald-950 font-bold flex items-center gap-2 border-b border-stone-100"
                >
                  <Eye className="w-4 h-4 text-emerald-700" />
                  <div>
                    <div>Print Preview ({getActiveTabLabel()})</div>
                    <div className="text-[10px] text-stone-500 font-normal">Pratinjau A4, Cetak & Download PDF</div>
                  </div>
                </button>

                {/* Specific Books */}
                <button
                  onClick={() => {
                    setIsPrintMenuOpen(false);
                    onOpenPrintModal('bku');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-stone-100 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>1. Buku Kas Umum (BKU)</span>
                </button>

                <button
                  onClick={() => {
                    setIsPrintMenuOpen(false);
                    onOpenPrintModal('cash');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-stone-100 flex items-center gap-2"
                >
                  <Wallet className="w-4 h-4 text-amber-600" />
                  <span>2. Cetak Buku Pembantu Kas Tunai</span>
                </button>

                <button
                  onClick={() => {
                    setIsPrintMenuOpen(false);
                    onOpenPrintModal('bank');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-stone-100 flex items-center gap-2"
                >
                  <Landmark className="w-4 h-4 text-blue-600" />
                  <span>3. Cetak Buku Pembantu Bank</span>
                </button>

                <button
                  onClick={() => {
                    setIsPrintMenuOpen(false);
                    onOpenPrintModal('cash_bank');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-stone-100 flex items-center gap-2"
                >
                  <Landmark className="w-4 h-4 text-emerald-700" />
                  <span>4. Cetak Kas & Bank Bersama</span>
                </button>

                <button
                  onClick={() => {
                    setIsPrintMenuOpen(false);
                    onOpenPrintModal('income_statement');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-stone-100 flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4 text-amber-700" />
                  <span>5. Cetak Laba Rugi (Hasil Usaha/SHU)</span>
                </button>

                <button
                  onClick={() => {
                    setIsPrintMenuOpen(false);
                    onOpenPrintModal('balance_sheet');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-stone-100 flex items-center gap-2"
                >
                  <Scale className="w-4 h-4 text-emerald-800" />
                  <span>6. Cetak Neraca Keuangan</span>
                </button>

                <button
                  onClick={() => {
                    setIsPrintMenuOpen(false);
                    onOpenPrintModal('transactions');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-stone-100 flex items-center gap-2"
                >
                  <ListOrdered className="w-4 h-4 text-purple-700" />
                  <span>7. Cetak Jurnal Semua Transaksi</span>
                </button>

                {/* Print All / Bundle */}
                <div className="border-t border-stone-200 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setIsPrintMenuOpen(false);
                      onOpenPrintModal('all');
                    }}
                    className="w-full text-left px-3 py-2 bg-emerald-50 hover:bg-emerald-100/80 font-bold text-emerald-900 flex items-center gap-2"
                  >
                    <Layers className="w-4 h-4 text-emerald-700" />
                    <div>
                      <div>Cetak Bendel Lengkap (Semua Buku)</div>
                      <div className="text-[10px] text-emerald-700 font-normal">
                        Laporan Pertanggungjawaban Tahunan
                      </div>
                    </div>
                  </button>
                </div>

                {/* Device & Drive Connectivity Info */}
                <div className="border-t border-stone-200 mt-1 pt-1.5 px-3 py-2 bg-stone-50 text-[10px] text-stone-600 rounded-b-lg space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-stone-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    <span>Terkoneksi ke Semua Printer Komputer</span>
                  </div>
                  <p className="text-[9.5px] text-stone-500 leading-tight">
                    Mendukung printer USB (Epson, Canon, HP), printer jaringan Wi-Fi/LAN kantor, & penyimpanan PDF ke Drive.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Menu Pilihan: Kode Rekening BUMDes */}
          <button
            onClick={() => onOpenSettings('akun')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-500/40 rounded shadow-sm transition active:scale-95"
            title="Kelola & Tambahkan Kode Rekening BUMDes (Bagan Akun / COA)"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-200" />
            <span>+ Kode Rekening</span>
          </button>

          {/* Menu Pilihan: Unit Usaha (Edit, Hapus, Tambahkan) */}
          <button
            onClick={() => onOpenSettings('unit')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-500/40 rounded shadow-sm transition active:scale-95"
            title="Kelola Unit Usaha BUMDes: Tambahkan, Edit Penanggung Jawab, atau Hapus Unit"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-200" />
            <span>Unit Usaha ({units.length})</span>
          </button>

          {/* Menu Pilihan: Tambah Logo Kabupaten */}
          <button
            onClick={() => onOpenSettings('logo_kabupaten')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-500/40 rounded shadow-sm transition active:scale-95"
            title="Tambah atau Ganti Logo Lambang Daerah Pemerintah Kabupaten untuk Kop Surat Resmi"
          >
            <Shield className="w-3.5 h-3.5 text-amber-300" />
            <span>+ Logo Kabupaten</span>
          </button>

          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-emerald-700 hover:bg-emerald-600 text-white rounded transition"
            title="Impor file Excel atau CSV"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Impor Data</span>
          </button>

          <button
            onClick={() => onOpenSettings('profil')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-emerald-700 hover:bg-emerald-600 text-white rounded transition"
            title="Pengaturan Lembaga, Pilihan Bank & Master Data"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Pengaturan</span>
          </button>

          <button
            onClick={onResetData}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded transition"
            title="Reset ke data contoh BUMDes"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Formula Ribbon Bar */}
      <div className="bg-stone-50 border-b border-stone-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-stone-600 font-medium">
            <Filter className="w-3.5 h-3.5 text-stone-500" />
            <span>Filter:</span>
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white border border-stone-300 rounded px-2.5 py-1 text-stone-800 font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="bg-white border border-stone-300 rounded px-2.5 py-1 text-stone-800 font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none"
          >
            <option value="ALL">Semua Unit Usaha ({units.length})</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2 top-1.5" />
            <input
              type="text"
              placeholder="Cari transaksi / no bukti / akun..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-stone-300 rounded pl-7 pr-2.5 py-1 text-stone-800 w-56 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Real-time Balance Indicators (Menyesuaikan dengan nama Bank terpilih) */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500">Kas Tunai:</span>
            <span className="font-semibold text-stone-800">{formatRupiah(cashSaldo)}</span>
          </div>
          <span className="text-stone-300">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500">{profile.bankName || 'Kas Bank'}:</span>
            <span className="font-semibold text-blue-700">{formatRupiah(bankSaldo)}</span>
          </div>
          <span className="text-stone-300">|</span>
          <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <span className="text-emerald-800 font-medium">Saldo BKU:</span>
            <span className="font-bold text-emerald-900">{formatRupiah(totalBkuSaldo)}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Excel Formula Bar */}
      <div className="bg-white border-b border-stone-200 px-4 py-1.5 flex items-center gap-2 font-mono text-xs text-stone-700">
        <div className="w-16 px-2 py-0.5 bg-stone-100 border border-stone-300 rounded text-center font-semibold text-stone-600">
          {currentCellName || 'BKU-A1'}
        </div>
        <div className="text-stone-400 select-none font-sans font-bold italic">fx</div>
        <div className="flex-1 px-2.5 py-0.5 bg-white border border-stone-200 rounded text-stone-700 truncate">
          {currentCellValue || '=SUM(PENERIMAAN) - SUM(PENGELUARAN) + SALDO_AWAL'}
        </div>
      </div>
    </header>
  );
};
