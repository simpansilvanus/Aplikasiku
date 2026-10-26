import React, { useState, useEffect } from 'react';
import { X, Save, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Account, BumdesProfile, BusinessUnit, Transaction, TransactionType, PaymentMethod } from '../types';

interface TransactionModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSave: (tx: Partial<Transaction>) => void;
  editTx: Transaction | null;
  accounts: Account[];
  units: BusinessUnit[];
  profile: BumdesProfile;
  existingCount: number;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen = true,
  onClose,
  onSave,
  editTx,
  accounts,
  units,
  profile,
  existingCount,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [type, setType] = useState<TransactionType>(editTx ? editTx.type : 'IN');
  const [date, setDate] = useState<string>(editTx ? editTx.date : todayStr);
  const [docNumber, setDocNumber] = useState<string>('');
  const [accountCode, setAccountCode] = useState<string>(
    editTx ? editTx.accountCode : '4.1.01'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    editTx ? editTx.paymentMethod : 'KAS'
  );
  const [unitId, setUnitId] = useState<string>(editTx ? editTx.unitId : 'unit-air');
  const [amount, setAmount] = useState<string>(editTx ? String(editTx.amount) : '');
  const [description, setDescription] = useState<string>(editTx ? editTx.description : '');
  const [recipientOrPayer, setRecipientOrPayer] = useState<string>(
    editTx?.recipientOrPayer || ''
  );

  // Auto-generate doc number when type or date changes (only if adding new)
  useEffect(() => {
    if (editTx) {
      setDocNumber(editTx.docNumber);
    } else {
      const prefix = type === 'IN' ? 'BKM' : 'BKK';
      const year = date.split('-')[0] || profile.fiscalYear;
      const month = date.split('-')[1] || '01';
      const seq = String(existingCount + 1).padStart(3, '0');
      setDocNumber(`${prefix}-${year}/${month}/${seq}`);

      // Auto pick default account based on type
      if (type === 'IN') {
        setAccountCode('4.1.01'); // Pendapatan default
      } else {
        setAccountCode('5.2.03'); // Beban default
      }
    }
  }, [type, date, editTx, existingCount, profile.fiscalYear]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Nominal transaksi harus lebih besar dari 0!');
      return;
    }
    if (!description.trim()) {
      alert('Uraian transaksi tidak boleh kosong!');
      return;
    }

    onSave({
      id: editTx ? editTx.id : undefined,
      type,
      date,
      docNumber,
      accountCode,
      paymentMethod,
      unitId,
      amount: numAmount,
      description: description.trim(),
      recipientOrPayer: recipientOrPayer.trim(),
    });
    onClose();
  };

  // Group accounts for clean selector
  const categorizedAccounts = {
    'Pendapatan Usaha (4.1)': accounts.filter((a) => a.category === 'PENDAPATAN'),
    'Harga Pokok Penjualan (5.1)': accounts.filter((a) => a.category === 'HPP'),
    'Beban Operasional & Kantor (5.2)': accounts.filter((a) => a.category === 'BEBAN_OPERASIONAL'),
    'Aset & Kas (1.1 - 1.2)': accounts.filter((a) => a.category === 'ASET_LANCAR' || a.category === 'ASET_TETAP'),
    'Kewajiban & Modal (2.1 - 3.1)': accounts.filter((a) => a.category === 'KEWAJIBAN' || a.category === 'EKUITAS'),
    'Pendapatan & Beban Lain (4.2 - 5.2)': accounts.filter((a) => a.category === 'PENDAPATAN_LAIN' || a.category === 'BEBAN_LAIN'),
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="bg-[#107c41] text-white px-5 py-3.5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm">
              {editTx ? 'Edit Transaksi BUMDes' : 'Catat Transaksi Baru (BKU)'}
            </h3>
            <p className="text-xs text-emerald-100">
              Formulir Bukti Kas Masuk (BKM) & Bukti Kas Keluar (BKK)
            </p>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-sans">
          {/* Transaction Type Segmented Toggle */}
          <div>
            <label className="block text-stone-700 font-semibold mb-1.5">
              Jenis Transaksi Kas:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('IN')}
                className={`py-2 px-3 rounded-md font-semibold flex items-center justify-center gap-1.5 border transition ${
                  type === 'IN'
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                Penerimaan / Kas Masuk (BKM)
              </button>
              <button
                type="button"
                onClick={() => setType('OUT')}
                className={`py-2 px-3 rounded-md font-semibold flex items-center justify-center gap-1.5 border transition ${
                  type === 'OUT'
                    ? 'bg-red-700 text-white border-red-800 shadow-sm'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                Pengeluaran / Kas Keluar (BKK)
              </button>
            </div>
          </div>

          {/* Row: Tanggal & No. Bukti */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                Tanggal Transaksi <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-stone-300 rounded text-stone-800 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                Nomor Bukti Kas <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="BKM-2026/01/001"
                className="w-full px-3 py-1.5 border border-stone-300 rounded text-stone-800 font-mono font-bold focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Row: Metode & Unit Usaha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                Metode Kas / Pembukuan <span className="text-red-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-1.5 border border-stone-300 rounded text-stone-800 font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="KAS">Kas Tunai (di Bendahara)</option>
                <option value="BANK">{profile.bankName || 'Rekening Bank'} ({profile.bankAccount})</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                Unit Usaha Terkait <span className="text-red-500">*</span>
              </label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full px-3 py-1.5 border border-stone-300 rounded text-stone-800 font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Akun / Rekening BUMDes */}
          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Kode Rekening / Akun BUMDes <span className="text-red-500">*</span>
            </label>
            <select
              value={accountCode}
              onChange={(e) => setAccountCode(e.target.value)}
              className="w-full px-3 py-1.5 border border-stone-300 rounded text-stone-800 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            >
              {Object.entries(categorizedAccounts).map(([groupName, accs]) => (
                <optgroup key={groupName} label={groupName}>
                  {accs.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code} - {a.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Nominal Rupiah */}
          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Nominal Transaksi (Rp) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-stone-400 font-bold">Rp</span>
              <input
                type="number"
                required
                min="1"
                step="1"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-stone-300 rounded text-stone-900 font-mono font-bold text-base focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Uraian Transaksi */}
          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Uraian Transaksi / Keterangan <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Penerimaan pembayaran rekening air PAMSIMAS dusun 2..."
              className="w-full px-3 py-2 border border-stone-300 rounded text-stone-800 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Diterima dari / Dibayarkan kepada */}
          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              {type === 'IN' ? 'Telah Diterima Dari (Penyetor):' : 'Dibayarkan Kepada (Penerima):'}
            </label>
            <input
              type="text"
              value={recipientOrPayer}
              onChange={(e) => setRecipientOrPayer(e.target.value)}
              placeholder={
                type === 'IN'
                  ? 'Nama warga / pelanggan / kolektor...'
                  : 'Nama toko / rekanan / pengurus...'
              }
              className="w-full px-3 py-1.5 border border-stone-300 rounded text-stone-800 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 text-stone-700 rounded hover:bg-stone-100 font-medium transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#107c41] hover:bg-emerald-700 text-white rounded font-bold shadow transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Transaksi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
