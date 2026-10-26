import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Tag, 
  Check, 
  X, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Download,
  Filter
} from 'lucide-react';
import { Account, BumdesProfile } from '../types';
import { ConfirmDialog } from './ConfirmDialog';

interface AccountsTabProps {
  profile: BumdesProfile;
  accounts: Account[];
  onAddAccount: (acc: Account) => void;
  onEditAccount: (oldCode: string, acc: Account) => void;
  onDeleteAccount: (code: string) => void;
  onOpenPrintModal?: () => void;
  onExportExcel?: () => void;
}

export const AccountsTab: React.FC<AccountsTabProps> = ({
  profile,
  accounts,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onOpenPrintModal,
  onExportExcel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal or Inline Add form state
  const [isAdding, setIsAdding] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<Account['category']>('PENDAPATAN');
  const [newNormalBalance, setNewNormalBalance] = useState<'DEBIT' | 'KREDIT'>('KREDIT');
  const [newDesc, setNewDesc] = useState('');

  // Editing state
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Account>({
    code: '',
    name: '',
    category: 'PENDAPATAN',
    normalBalance: 'KREDIT',
    description: '',
  });

  // Deleting state
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [alertError, setAlertError] = useState<string | null>(null);

  // Auto set normal balance when category changes in add form
  const handleCategoryChange = (cat: Account['category']) => {
    setNewCategory(cat);
    if (['PENDAPATAN', 'EKUITAS', 'KEWAJIBAN', 'PENDAPATAN_LAIN'].includes(cat)) {
      setNewNormalBalance('KREDIT');
    } else {
      setNewNormalBalance('DEBIT');
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertError(null);

    const cleanCode = newCode.trim();
    const cleanName = newName.trim();

    if (!cleanCode || !cleanName) {
      setAlertError('Kode Rekening dan Nama Akun wajib diisi.');
      return;
    }

    if (accounts.some((a) => a.code.toLowerCase() === cleanCode.toLowerCase())) {
      setAlertError(`Kode rekening "${cleanCode}" sudah digunakan. Gunakan kode unik lain.`);
      return;
    }

    onAddAccount({
      code: cleanCode,
      name: cleanName,
      category: newCategory,
      normalBalance: newNormalBalance,
      description: newDesc.trim() || undefined,
    });

    setNewCode('');
    setNewName('');
    setNewDesc('');
    setIsAdding(false);
  };

  const handleStartEdit = (acc: Account) => {
    setEditingCode(acc.code);
    setEditForm({ ...acc });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCode) return;
    setAlertError(null);

    const cleanCode = editForm.code.trim();
    const cleanName = editForm.name.trim();

    if (!cleanCode || !cleanName) {
      setAlertError('Kode Rekening dan Nama Akun tidak boleh kosong.');
      return;
    }

    // If code changed, check conflict
    if (cleanCode !== editingCode && accounts.some((a) => a.code.toLowerCase() === cleanCode.toLowerCase())) {
      setAlertError(`Kode rekening "${cleanCode}" sudah digunakan akun lain.`);
      return;
    }

    onEditAccount(editingCode, {
      ...editForm,
      code: cleanCode,
      name: cleanName,
      description: editForm.description?.trim() || undefined,
    });

    setEditingCode(null);
  };

  const categoryLabels: Record<Account['category'], string> = {
    ASET_LANCAR: '1.1 Aset Lancar / Kas / Bank',
    ASET_TETAP: '1.2 Aset Tetap & Peralatan',
    KEWAJIBAN: '2.1 Kewajiban / Utang',
    EKUITAS: '3.1 Ekuitas & Modal Desa',
    PENDAPATAN: '4.1 Pendapatan Usaha BUMDes',
    HPP: '5.1 Harga Pokok Penjualan (HPP)',
    BEBAN_OPERASIONAL: '5.2 Beban Operasional',
    PENDAPATAN_LAIN: '4.2 Pendapatan Lain-lain',
    BEBAN_LAIN: '5.3 Beban Lain-lain & Bank',
  };

  const filteredAccounts = accounts.filter((a) => {
    if (selectedCategory !== 'ALL' && a.category !== selectedCategory) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        a.code.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Official Header Card */}
      <div className="bg-white border border-stone-200 shadow-sm p-6 rounded-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#107c41]"></div>

        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-stone-100 print:hidden">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Bagan Akun Standar (Chart of Accounts / COA) · {accounts.length} Akun Terdaftar</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenPrintModal && (
              <button
                onClick={onOpenPrintModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs rounded-lg shadow-sm transition active:scale-95"
              >
                <span>Cetak / Pratinjau COA</span>
              </button>
            )}
            {onExportExcel && (
              <button
                onClick={onExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-sm transition active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Excel</span>
              </button>
            )}
          </div>
        </div>

        {/* Kop Surat Header */}
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-4 mb-4 gap-4">
          <div className="flex-shrink-0">
            <img
              src={profile.logoUrl || '/logo-bumdes.jpg'}
              alt={`Logo ${profile.name}`}
              className="w-16 h-16 md:w-20 md:h-20 object-contain rounded-full border border-stone-200 shadow-sm bg-white"
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
            <p className="text-xs text-stone-600 mt-0.5">
              Bagan Akun Standar & Kode Rekening Pembukuan Keuangan BUMDes
            </p>
          </div>

          <div className="w-16 md:w-20 flex-shrink-0 hidden sm:block opacity-0"></div>
        </div>

        <div className="flex items-center justify-between text-xs font-semibold text-stone-800 px-2">
          <div>
            <span className="text-stone-500">MASTER DATA:</span>{' '}
            <span className="text-emerald-900 font-bold text-sm">
              DAFTAR KODE REKENING / BAGAN AKUN RESMI (COA)
            </span>
          </div>
          <div>
            <span className="text-stone-500">TAHUN BUKU:</span> {profile.fiscalYear}
          </div>
        </div>
      </div>

      {/* Alert Error Message */}
      {alertError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{alertError}</span>
          </div>
          <button onClick={() => setAlertError(null)} className="text-red-500 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Cari kode atau nama rekening akun..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded pl-8 pr-3 py-1.5 text-xs text-stone-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-stone-300 rounded px-2.5 py-1.5 text-xs text-stone-800 font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none"
          >
            <option value="ALL">Semua Kategori Akun ({accounts.length})</option>
            {Object.entries(categoryLabels).map(([catKey, catLabel]) => (
              <option key={catKey} value={catKey}>
                {catLabel}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setIsAdding(true);
            setEditingCode(null);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-md font-semibold text-xs shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kode Rekening</span>
        </button>
      </div>

      {/* Form Tambah Kode Rekening Baru */}
      {isAdding && (
        <form
          onSubmit={handleCreateSubmit}
          className="p-4 bg-emerald-50/70 border-2 border-emerald-500/50 rounded-lg shadow-sm space-y-3 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
            <h4 className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>Formulir Tambah Kode Rekening BUMDes Baru</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-stone-400 hover:text-stone-700 text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                Kode Rekening <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Cth: 4.1.05 / 5.2.10"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded font-mono font-bold focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
              <span className="text-[10px] text-stone-500">Format standar: digit.digit.digit</span>
            </div>

            <div className="md:col-span-2">
              <label className="block text-stone-700 font-semibold mb-1">
                Nama Rekening Akun <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Cth: Pendapatan Sewa Gudang / Beban Pemeliharaan Pompa"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                Kelompok Kategori <span className="text-red-500">*</span>
              </label>
              <select
                value={newCategory}
                onChange={(e) => handleCategoryChange(e.target.value as Account['category'])}
                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                {Object.entries(categoryLabels).map(([catKey, catLabel]) => (
                  <option key={catKey} value={catKey}>
                    {catLabel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Saldo Normal</label>
              <select
                value={newNormalBalance}
                onChange={(e) => setNewNormalBalance(e.target.value as 'DEBIT' | 'KREDIT')}
                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded font-mono text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="DEBIT">DEBIT (Aset / Beban / HPP)</option>
                <option value="KREDIT">KREDIT (Pendapatan / Kewajiban / Modal)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-stone-700 font-semibold mb-1">Deskripsi / Catatan Tambahan (Opsional)</label>
              <input
                type="text"
                placeholder="Keterangan peruntukan rekening akun ini..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-emerald-200">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 border border-stone-300 bg-white text-stone-700 rounded font-medium text-xs hover:bg-stone-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-xs shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Kode Rekening Baru</span>
            </button>
          </div>
        </form>
      )}

      {/* Tabel Bagan Akun */}
      <div className="bg-white border border-stone-200 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead>
              <tr className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200 text-center">
                <th className="w-12 py-2.5">No</th>
                <th className="w-28 py-2.5 text-left pl-3">Kode Akun</th>
                <th className="py-2.5 text-left pl-3">Nama Rekening BUMDes</th>
                <th className="py-2.5 text-left pl-3">Kategori Laporan</th>
                <th className="w-24 py-2.5 text-center">Saldo Normal</th>
                <th className="py-2.5 text-left pl-3">Keterangan</th>
                <th className="w-24 py-2.5 text-center print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredAccounts.map((acc, idx) => {
                const isEditing = editingCode === acc.code;

                if (isEditing) {
                  return (
                    <tr key={acc.code} className="bg-amber-50/70 border-y-2 border-amber-300">
                      <td className="py-2 px-2 text-center font-mono text-stone-500">{idx + 1}</td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={editForm.code}
                          onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-stone-300 rounded font-mono font-bold text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-stone-300 rounded font-semibold text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={editForm.category}
                          onChange={(e) => {
                            const newCat = e.target.value as Account['category'];
                            setEditForm({
                              ...editForm,
                              category: newCat,
                              normalBalance: ['PENDAPATAN', 'EKUITAS', 'KEWAJIBAN', 'PENDAPATAN_LAIN'].includes(newCat)
                                ? 'KREDIT'
                                : 'DEBIT',
                            });
                          }}
                          className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs"
                        >
                          {Object.entries(categoryLabels).map(([ck, cl]) => (
                            <option key={ck} value={ck}>
                              {cl}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <select
                          value={editForm.normalBalance}
                          onChange={(e) => setEditForm({ ...editForm, normalBalance: e.target.value as 'DEBIT' | 'KREDIT' })}
                          className="px-2 py-1 bg-white border border-stone-300 rounded font-mono text-xs"
                        >
                          <option value="DEBIT">DEBIT</option>
                          <option value="KREDIT">KREDIT</option>
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={editForm.description || ''}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="p-1 bg-emerald-700 text-white rounded hover:bg-emerald-800"
                            title="Simpan perubahan"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCode(null)}
                            className="p-1 bg-stone-200 text-stone-700 rounded hover:bg-stone-300"
                            title="Batal edit"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={acc.code} className="hover:bg-stone-50 transition">
                    <td className="py-2 px-2 text-center font-mono text-stone-400">{idx + 1}</td>
                    <td className="py-2 px-3 font-mono font-bold text-stone-900 bg-stone-50/50">
                      {acc.code}
                    </td>
                    <td className="py-2 px-3 font-semibold text-stone-900">
                      {acc.name}
                    </td>
                    <td className="py-2 px-3 text-stone-600">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                        {categoryLabels[acc.category] || acc.category}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-xs">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          acc.normalBalance === 'DEBIT'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {acc.normalBalance}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-stone-500 text-[11px]">
                      {acc.description || '-'}
                    </td>
                    <td className="py-2 px-3 text-center print:hidden">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(acc)}
                          className="p-1 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition"
                          title={`Edit Akun ${acc.code}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setAccountToDelete(acc)}
                          className="p-1 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded transition"
                          title={`Hapus Akun ${acc.code}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    Tidak ada kode rekening akun yang sesuai kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog for Deleting Account */}
      <ConfirmDialog
        isOpen={!!accountToDelete}
        title="Hapus Kode Rekening Akun"
        message={`Apakah Anda yakin ingin menghapus rekening akun "${accountToDelete?.code} - ${accountToDelete?.name}"?`}
        details={
          accountToDelete ? (
            <div className="space-y-1 text-stone-700 text-xs">
              <div>Kode: <strong className="font-mono">{accountToDelete.code}</strong></div>
              <div>Nama: <strong>{accountToDelete.name}</strong></div>
              <div>Kategori: <strong>{categoryLabels[accountToDelete.category]}</strong></div>
              <p className="mt-1 text-[11px] text-amber-700 italic">
                Pastikan tidak ada transaksi aktif yang sedang menggunakan kode akun ini.
              </p>
            </div>
          ) : null
        }
        confirmText="Ya, Hapus Akun"
        cancelText="Batal"
        onConfirm={() => {
          if (accountToDelete) {
            onDeleteAccount(accountToDelete.code);
            setAccountToDelete(null);
          }
        }}
        onClose={() => setAccountToDelete(null)}
      />
    </div>
  );
};
