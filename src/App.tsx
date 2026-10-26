import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  BookOpen, 
  Landmark, 
  TrendingUp, 
  Scale, 
  ListOrdered, 
  HelpCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  Account, 
  ActiveTab, 
  BumdesProfile, 
  BusinessUnit, 
  Transaction 
} from './types';
import { 
  DEFAULT_ACCOUNTS, 
  DEFAULT_BUSINESS_UNITS, 
  DEFAULT_PROFILE, 
  INITIAL_TRANSACTIONS 
} from './data/initialData';
import { exportToBumdesExcel } from './utils/excelExport';
import { formatRupiah, formatTanggalIndo } from './utils/formatters';

import { ExcelHeader } from './components/ExcelHeader';
import { BkuView } from './components/BkuView';
import { CashBankView } from './components/CashBankView';
import { IncomeStatementView } from './components/IncomeStatementView';
import { BalanceSheetView } from './components/BalanceSheetView';
import { TransactionsView } from './components/TransactionsView';
import { TransactionModal } from './components/TransactionModal';
import { ReceiptModal } from './components/ReceiptModal';
import { SettingsModal } from './components/SettingsModal';
import { ImportModal } from './components/ImportModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { PrintReportModal, PrintTarget } from './components/PrintReportModal';
import { AccountsTab } from './components/AccountsTab';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { User } from 'firebase/auth';
import { initAuth, saveAppDataToDrive } from './services/googleDriveService';
import { 
  loadInitialAppData, 
  saveAllDataSafely, 
  STORAGE_PROFILE_KEY, 
  STORAGE_TRANSACTIONS_KEY, 
  STORAGE_ACCOUNTS_KEY, 
  STORAGE_UNITS_KEY 
} from './utils/persistentStorage';

export default function App() {
  // State
  const [profile, setProfile] = useState<BumdesProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROFILE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PROFILE,
          ...parsed,
          logoUrl: parsed.logoUrl || '/logo-bumdes.jpg',
          regencyLogoUrl: parsed.regencyLogoUrl || '',
          ahuNumber: parsed.ahuNumber !== undefined && parsed.ahuNumber !== '' ? parsed.ahuNumber : DEFAULT_PROFILE.ahuNumber,
        };
      }
      return DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_ACCOUNTS;
    } catch {
      return DEFAULT_ACCOUNTS;
    }
  });

  const [units, setUnits] = useState<BusinessUnit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_UNITS_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_BUSINESS_UNITS;
    } catch {
      return DEFAULT_BUSINESS_UNITS;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TRANSACTIONS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  // Google Drive state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [lastDriveSync, setLastDriveSync] = useState<string | null>(null);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);

  // Active Excel Sheet Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('bku');

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Formula bar state
  const [currentCellName, setCurrentCellName] = useState<string>('BKU!A1');
  const [currentCellValue, setCurrentCellValue] = useState<string>(
    `=SUM(KAS_MASUK) - SUM(KAS_KELUAR) + SALDO_AWAL`
  );

  // Modals state
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profil' | 'logo_kabupaten' | 'akun' | 'unit'>('profil');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printTarget, setPrintTarget] = useState<PrintTarget>('bku');

  const handleOpenSettings = (tab: 'profil' | 'logo_kabupaten' | 'akun' | 'unit' = 'profil') => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  const handleOpenPrintModal = (target: PrintTarget = 'bku') => {
    setPrintTarget(target);
    setIsPrintModalOpen(true);
  };

  // Deletion and reset confirmation states
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((cur) => (cur === message ? null : cur));
    }, 3500);
  };

  // 1. Memuat data tersimpan dari IndexedDB saat aplikasi pertama dibuka / direstart
  useEffect(() => {
    loadInitialAppData().then((bundle) => {
      if (bundle) {
        if (bundle.profile) setProfile(bundle.profile);
        if (bundle.transactions && bundle.transactions.length > 0) {
          setTransactions(bundle.transactions);
        }
        if (bundle.accounts && bundle.accounts.length > 0) {
          setAccounts(bundle.accounts);
        }
        if (bundle.units && bundle.units.length > 0) {
          setUnits(bundle.units);
        }
      }
    });
  }, []);

  // 2. Mendengarkan status autentikasi Google Firebase
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // 3. Simpan redundan ke IndexedDB & LocalStorage setiap ada inputan / perubahan data
  // Memastikan data TIDAK PERNAH terhapus saat direstart atau refresh
  useEffect(() => {
    saveAllDataSafely(profile, transactions, accounts, units);
  }, [profile, transactions, accounts, units]);

  // 4. Sinkronisasi otomatis ke Google Drive jika pengguna telah terhubung
  useEffect(() => {
    if (!accessToken || !currentUser) return;

    const timeout = setTimeout(async () => {
      try {
        setIsAutoSyncing(true);
        const res = await saveAppDataToDrive(accessToken, {
          profile,
          accounts,
          units,
          transactions,
        });
        const timeStr = new Date(res.modifiedTime).toLocaleTimeString('id-ID');
        setLastDriveSync(timeStr);
      } catch (err) {
        console.warn('Auto sync Google Drive gagal:', err);
      } finally {
        setIsAutoSyncing(false);
      }
    }, 2500);

    return () => clearTimeout(timeout);
  }, [profile, transactions, accounts, units, accessToken, currentUser]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Filter by Month
      if (selectedMonth !== 'ALL') {
        const txMonth = tx.date.split('-')[1];
        if (txMonth !== selectedMonth) return false;
      }

      // Filter by Unit
      if (selectedUnit !== 'ALL' && tx.unitId !== selectedUnit) {
        return false;
      }

      // Filter by Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = tx.description.toLowerCase().includes(q);
        const matchDoc = tx.docNumber.toLowerCase().includes(q);
        const matchAcc = tx.accountCode.toLowerCase().includes(q);
        const matchPayer = (tx.recipientOrPayer || '').toLowerCase().includes(q);
        if (!matchDesc && !matchDoc && !matchAcc && !matchPayer) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, selectedMonth, selectedUnit, searchQuery]);

  // Overall Balances
  const { totalBkuSaldo, cashSaldo, bankSaldo } = useMemo(() => {
    let cash = profile.initialCash;
    let bank = profile.initialBank;

    for (const t of transactions) {
      if (t.paymentMethod === 'KAS') {
        cash += t.type === 'IN' ? t.amount : -t.amount;
      } else {
        bank += t.type === 'IN' ? t.amount : -t.amount;
      }
    }

    return {
      totalBkuSaldo: cash + bank,
      cashSaldo: cash,
      bankSaldo: bank,
    };
  }, [transactions, profile.initialCash, profile.initialBank]);

  // Human readable period label
  const periodLabel = useMemo(() => {
    if (selectedMonth === 'ALL') return `Januari - Desember ${profile.fiscalYear}`;
    const mNames: Record<string, string> = {
      '01': 'Januari',
      '02': 'Februari',
      '03': 'Maret',
      '04': 'April',
      '05': 'Mei',
      '06': 'Juni',
      '07': 'Juli',
      '08': 'Agustus',
      '09': 'September',
      '10': 'Oktober',
      '11': 'November',
      '12': 'Desember',
    };
    return `${mNames[selectedMonth] || selectedMonth} ${profile.fiscalYear}`;
  }, [selectedMonth, profile.fiscalYear]);

  // Handlers for transactions
  const handleSaveTransaction = (txData: Partial<Transaction>) => {
    if (txData.id) {
      // Edit
      setTransactions((prev) =>
        prev.map((t) => (t.id === txData.id ? ({ ...t, ...txData } as Transaction) : t))
      );
    } else {
      // New
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        date: txData.date || new Date().toISOString().split('T')[0],
        docNumber: txData.docNumber || `BKM-${Date.now()}`,
        description: txData.description || '',
        accountCode: txData.accountCode || '4.1.01',
        type: txData.type || 'IN',
        paymentMethod: txData.paymentMethod || 'KAS',
        amount: txData.amount || 0,
        unitId: txData.unitId || 'kantor',
        recipientOrPayer: txData.recipientOrPayer || '',
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (tx) {
      setTxToDelete(tx);
    }
  };

  const handleConfirmDeleteTransaction = () => {
    if (!txToDelete) return;
    const docNum = txToDelete.docNumber;
    setTransactions((prev) => prev.filter((t) => t.id !== txToDelete.id));
    setTxToDelete(null);
    showToast(`Transaksi ${docNum} berhasil dihapus dari Buku Kas Umum.`);
  };

  const handleAddUnit = (newUnit: BusinessUnit) => {
    setUnits((prev) => [...prev, newUnit]);
    showToast(`Unit Usaha "${newUnit.name}" berhasil ditambahkan.`);
  };

  const handleEditUnit = (unitId: string, updatedUnit: BusinessUnit) => {
    setUnits((prev) => prev.map((u) => (u.id === unitId ? updatedUnit : u)));
    showToast(`Unit Usaha "${updatedUnit.name}" berhasil diperbarui.`);
  };

  const handleDeleteUnit = (unitId: string) => {
    const unit = units.find((u) => u.id === unitId);
    const unitName = unit?.name || unitId;
    setUnits((prev) => prev.filter((u) => u.id !== unitId));
    if (selectedUnit === unitId) {
      setSelectedUnit('ALL');
    }
    showToast(`Unit Usaha "${unitName}" berhasil dihapus.`);
  };

  const handleAddAccount = (newAcc: Account) => {
    setAccounts((prev) => [...prev, newAcc]);
    showToast(`Kode rekening "${newAcc.code} - ${newAcc.name}" berhasil ditambahkan.`);
  };

  const handleEditAccount = (oldCode: string, updatedAcc: Account) => {
    setAccounts((prev) => prev.map((a) => (a.code === oldCode ? updatedAcc : a)));
    // If account code changed, sync transactions that used oldCode
    if (oldCode !== updatedAcc.code) {
      setTransactions((prev) =>
        prev.map((t) => (t.accountCode === oldCode ? { ...t, accountCode: updatedAcc.code } : t))
      );
    }
    showToast(`Kode rekening "${updatedAcc.code}" berhasil diperbarui.`);
  };

  const handleDeleteAccount = (code: string) => {
    const acc = accounts.find((a) => a.code === code);
    setAccounts((prev) => prev.filter((a) => a.code !== code));
    showToast(`Kode rekening "${code} - ${acc?.name || ''}" berhasil dihapus.`);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditTx(tx);
    setIsAddTxOpen(true);
  };

  const handleResetData = () => {
    setIsResetConfirmOpen(true);
  };

  const handleConfirmReset = () => {
    setProfile(DEFAULT_PROFILE);
    setAccounts(DEFAULT_ACCOUNTS);
    setUnits(DEFAULT_BUSINESS_UNITS);
    setTransactions(INITIAL_TRANSACTIONS);
    setIsResetConfirmOpen(false);
    showToast('Data pembukuan berhasil dikembalikan ke contoh bawaan BUMDes.');
  };

  const handleExportExcel = () => {
    exportToBumdesExcel({
      profile,
      accounts,
      units,
      transactions,
      filteredTransactions,
      periodLabel,
    });
  };

  const handleImportTransactions = (importedTxs: Partial<Transaction>[]) => {
    const newItems: Transaction[] = importedTxs.map((t, idx) => ({
      id: `imported-${Date.now()}-${idx}`,
      date: t.date || new Date().toISOString().split('T')[0],
      docNumber: t.docNumber || `IMP-${idx + 1}`,
      description: t.description || 'Transaksi Impor Excel',
      accountCode: t.accountCode || '4.1.01',
      type: t.type || 'IN',
      paymentMethod: t.paymentMethod || 'KAS',
      amount: t.amount || 0,
      unitId: t.unitId || 'kantor',
      recipientOrPayer: t.recipientOrPayer || '',
      createdAt: new Date().toISOString(),
    }));

    setTransactions((prev) => [...newItems, ...prev]);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans text-stone-900 selection:bg-emerald-200">
      {/* Top Excel Ribbon & Formula Bar */}
      <ExcelHeader
        profile={profile}
        units={units}
        activeTab={activeTab}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedUnit={selectedUnit}
        setSelectedUnit={setSelectedUnit}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onExportExcel={handleExportExcel}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenAddTx={() => {
          setEditTx(null);
          setIsAddTxOpen(true);
        }}
        onOpenSettings={(tab) => handleOpenSettings(tab || 'profil')}
        onOpenAddAccount={() => handleOpenSettings('akun')}
        onManageUnits={() => handleOpenSettings('unit')}
        onResetData={handleResetData}
        onOpenPrintModal={handleOpenPrintModal}
        onPrintDirect={() => {
          showToast('Membuka dialog cetak sistem... Silakan pilih perangkat printer aktif Anda.');
          window.print();
        }}
        onDownloadPdf={() => {
          const targetMap: Record<ActiveTab, PrintTarget> = {
            bku: 'bku',
            cash_bank: 'cash_bank',
            income_statement: 'income_statement',
            balance_sheet: 'balance_sheet',
            transactions: 'transactions',
            accounts: 'all',
          };
          handleOpenPrintModal(targetMap[activeTab] || 'bku');
        }}
        onOpenGoogleDrive={() => setIsDriveModalOpen(true)}
        currentUser={currentUser}
        lastDriveSync={lastDriveSync}
        isAutoSyncing={isAutoSyncing}
        totalBkuSaldo={totalBkuSaldo}
        cashSaldo={cashSaldo}
        bankSaldo={bankSaldo}
        currentCellName={currentCellName}
        currentCellValue={currentCellValue}
      />

      {/* Main Excel Sheet Tabs Bar (Top level workbook navigator) */}
      <div className="bg-stone-200 border-b border-stone-300 px-4 flex items-center gap-1 overflow-x-auto print:hidden select-none">
        <button
          onClick={() => {
            setActiveTab('bku');
            setCurrentCellName('BKU!A1');
            setCurrentCellValue('=SUM(PENERIMAAN) - SUM(PENGELUARAN) + SALDO_AWAL');
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'bku'
              ? 'bg-white text-[#107c41] border-[#107c41] shadow-sm rounded-t'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-300/60 border-transparent'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
          <span>1. Buku Kas Umum (BKU)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('cash_bank');
            setCurrentCellName('KAS_BANK!A1');
            setCurrentCellValue('=KAS_TUNAI_BENDAHARA + REKENING_BRI');
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'cash_bank'
              ? 'bg-white text-[#107c41] border-[#107c41] shadow-sm rounded-t'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-300/60 border-transparent'
          }`}
        >
          <Landmark className="w-4 h-4 text-blue-700" />
          <span>2. Pembantu Kas & Bank</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('income_statement');
            setCurrentCellName('LABA_RUGI!A1');
            setCurrentCellValue('=PENDAPATAN_USAHA - HPP - BEBAN_OPERASIONAL + LAIN_LAIN');
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'income_statement'
              ? 'bg-white text-[#107c41] border-[#107c41] shadow-sm rounded-t'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-300/60 border-transparent'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-amber-700" />
          <span>3. Laba Rugi (Hasil Usaha / SHU)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('balance_sheet');
            setCurrentCellName('NERACA!A1');
            setCurrentCellValue('=ASET_LANCAR + ASET_TETAP = KEWAJIBAN + EKUITAS');
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'balance_sheet'
              ? 'bg-white text-[#107c41] border-[#107c41] shadow-sm rounded-t'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-300/60 border-transparent'
          }`}
        >
          <Scale className="w-4 h-4 text-emerald-800" />
          <span>4. Neraca Keuangan</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('transactions');
            setCurrentCellName('JURNAL!A1');
            setCurrentCellValue(`Daftar Semua Transaksi (${transactions.length} baris)`);
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'transactions'
              ? 'bg-white text-[#107c41] border-[#107c41] shadow-sm rounded-t'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-300/60 border-transparent'
          }`}
        >
          <ListOrdered className="w-4 h-4 text-purple-700" />
          <span>5. Jurnal & Transaksi</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('accounts');
            setCurrentCellName('COA!A1');
            setCurrentCellValue(`Bagan Akun Standar BUMDes (${accounts.length} akun terdaftar)`);
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'accounts'
              ? 'bg-white text-[#107c41] border-[#107c41] shadow-sm rounded-t'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-300/60 border-transparent'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-800" />
          <span>6. Bagan Akun (COA & Kode Rekening)</span>
        </button>
      </div>

      {/* Main Content Area (Spreadsheet Paper Canvas) */}
      <main className={`flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto ${isPrintModalOpen ? 'print:hidden' : ''}`}>
        {activeTab === 'bku' && (
          <BkuView
            profile={profile}
            accounts={accounts}
            units={units}
            transactions={transactions}
            filteredTransactions={filteredTransactions}
            periodLabel={periodLabel}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onPrintReceipt={(tx) => setReceiptTx(tx)}
            onSelectCell={(cell, val) => {
              setCurrentCellName(cell);
              setCurrentCellValue(val);
            }}
            onPrint={() => handleOpenPrintModal('bku')}
            onDownloadPdf={() => handleOpenPrintModal('bku')}
            onDownloadExcel={handleExportExcel}
          />
        )}

        {activeTab === 'cash_bank' && (
          <CashBankView
            profile={profile}
            accounts={accounts}
            transactions={transactions}
            filteredTransactions={filteredTransactions}
            periodLabel={periodLabel}
            onPrint={(mode) => handleOpenPrintModal(mode || 'cash_bank')}
            onDownloadPdf={() => handleOpenPrintModal('cash_bank')}
            onDownloadExcel={handleExportExcel}
          />
        )}

        {activeTab === 'income_statement' && (
          <IncomeStatementView
            profile={profile}
            accounts={accounts}
            units={units}
            filteredTransactions={filteredTransactions}
            periodLabel={periodLabel}
            onPrint={() => handleOpenPrintModal('income_statement')}
            onDownloadPdf={() => handleOpenPrintModal('income_statement')}
            onDownloadExcel={handleExportExcel}
          />
        )}

        {activeTab === 'balance_sheet' && (
          <BalanceSheetView
            profile={profile}
            filteredTransactions={filteredTransactions}
            periodLabel={periodLabel}
            onPrint={() => handleOpenPrintModal('balance_sheet')}
            onDownloadPdf={() => handleOpenPrintModal('balance_sheet')}
            onDownloadExcel={handleExportExcel}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            profile={profile}
            accounts={accounts}
            units={units}
            transactions={transactions}
            filteredTransactions={filteredTransactions}
            onOpenAddTx={() => {
              setEditTx(null);
              setIsAddTxOpen(true);
            }}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onPrintReceipt={(tx) => setReceiptTx(tx)}
            onPrint={() => handleOpenPrintModal('transactions')}
            onDownloadPdf={() => handleOpenPrintModal('transactions')}
            onDownloadExcel={handleExportExcel}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountsTab
            profile={profile}
            accounts={accounts}
            onAddAccount={handleAddAccount}
            onEditAccount={handleEditAccount}
            onDeleteAccount={handleDeleteAccount}
            onOpenPrintModal={() => handleOpenPrintModal('all')}
            onExportExcel={handleExportExcel}
          />
        )}
      </main>

      {/* Excel Bottom Status Bar */}
      <footer className="bg-stone-200 border-t border-stone-300 px-4 py-1.5 flex flex-wrap items-center justify-between text-[11px] text-stone-600 font-mono select-none print:hidden">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-sans font-bold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>SIAP</span>
          </div>
          <span>Sheet: {activeTab.toUpperCase()}</span>
          <span>Baris: {filteredTransactions.length} Transaksi</span>
        </div>

        <div className="flex items-center gap-4 font-sans font-medium">
          <div>
            Saldo Tunai: <strong className="font-mono text-stone-800">{formatRupiah(cashSaldo)}</strong>
          </div>
          <div>
            Saldo Bank: <strong className="font-mono text-blue-800">{formatRupiah(bankSaldo)}</strong>
          </div>
          <div className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold font-mono">
            Total BKU: {formatRupiah(totalBkuSaldo)}
          </div>
        </div>
      </footer>

      {/* Modals */}
      {isAddTxOpen && (
        <TransactionModal
          isOpen={isAddTxOpen}
          onClose={() => setIsAddTxOpen(false)}
          onSave={handleSaveTransaction}
          editTx={editTx}
          accounts={accounts}
          units={units}
          profile={profile}
          existingCount={transactions.length}
        />
      )}

      {receiptTx && (
        <ReceiptModal
          transaction={receiptTx}
          profile={profile}
          accounts={accounts}
          onClose={() => setReceiptTx(null)}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          defaultTab={settingsTab}
          onClose={() => setIsSettingsOpen(false)}
          profile={profile}
          onSaveProfile={(newProf) => setProfile(newProf)}
          accounts={accounts}
          onAddAccount={handleAddAccount}
          onEditAccount={handleEditAccount}
          onDeleteAccount={handleDeleteAccount}
          units={units}
          onAddUnit={handleAddUnit}
          onEditUnit={handleEditUnit}
          onDeleteUnit={handleDeleteUnit}
        />
      )}

      {isImportOpen && (
        <ImportModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImportTransactions={handleImportTransactions}
          onDownloadTemplate={handleExportExcel}
        />
      )}

      {/* Print Report Modal */}
      {isPrintModalOpen && (
        <PrintReportModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          initialTarget={printTarget}
          profile={profile}
          accounts={accounts}
          units={units}
          transactions={transactions}
          selectedMonth={selectedMonth}
          selectedUnit={selectedUnit}
        />
      )}

      {/* Confirmation Dialog for Transaction Deletion in BKU */}
      <ConfirmDialog
        isOpen={!!txToDelete}
        title="Hapus Transaksi Buku Kas Umum"
        message="Apakah Anda yakin ingin menghapus transaksi ini dari Buku Kas Umum (BKU)? Saldo kas akan dihitung ulang secara otomatis."
        details={
          txToDelete ? (
            <div className="space-y-1.5 text-stone-700 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">No. Bukti:</span>
                <span className="font-mono font-bold text-stone-900">{txToDelete.docNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Tanggal:</span>
                <span>{formatTanggalIndo(txToDelete.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Jenis Transaksi:</span>
                <span className={`font-semibold ${txToDelete.type === 'IN' ? 'text-emerald-700' : 'text-red-700'}`}>
                  {txToDelete.type === 'IN' ? 'Kas Masuk (Penerimaan)' : 'Kas Keluar (Pengeluaran)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Nominal:</span>
                <span className="font-mono font-bold text-stone-900">{formatRupiah(txToDelete.amount)}</span>
              </div>
              <div className="pt-1 border-t border-stone-200 mt-1">
                <span className="text-stone-500">Uraian: </span>
                <span className="italic text-stone-800">{txToDelete.description}</span>
              </div>
            </div>
          ) : null
        }
        confirmText="Ya, Hapus Transaksi"
        cancelText="Batal"
        danger={true}
        onConfirm={handleConfirmDeleteTransaction}
        onClose={() => setTxToDelete(null)}
      />

      {/* Confirmation Dialog for Reset Data */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Kembalikan ke Data Contoh BUMDes"
        message="Tindakan ini akan mengembalikan seluruh data transaksi, akun, dan profil ke format contoh awal BUMDes. Data transaksi yang Anda tambahkan akan digantikan."
        confirmText="Ya, Reset Data"
        cancelText="Batal"
        danger={true}
        onConfirm={handleConfirmReset}
        onClose={() => setIsResetConfirmOpen(false)}
      />

      {/* Google Drive Sync & Backup Modal */}
      {isDriveModalOpen && (
        <GoogleDriveModal
          isOpen={isDriveModalOpen}
          onClose={() => setIsDriveModalOpen(false)}
          currentUser={currentUser}
          accessToken={accessToken}
          onAuthSuccess={(user, token) => {
            setCurrentUser(user);
            setAccessToken(token);
            showToast(`Terhubung ke Google Drive (${user.email})`);
          }}
          onSignOut={() => {
            setCurrentUser(null);
            setAccessToken(null);
            showToast('Telah keluar dari akun Google Drive.');
          }}
          profile={profile}
          accounts={accounts}
          units={units}
          transactions={transactions}
          onRestoreData={(data) => {
            setProfile(data.profile);
            setAccounts(data.accounts);
            setUnits(data.units);
            setTransactions(data.transactions);
            saveAllDataSafely(data.profile, data.transactions, data.accounts, data.units);
            showToast('Data pembukuan berhasil diselaraskan dari Google Drive!');
          }}
          lastDriveSync={lastDriveSync}
          setLastDriveSync={setLastDriveSync}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-12 right-6 z-[70] bg-stone-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs flex items-center gap-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
