import React, { useState, useRef } from 'react';
import { 
  X, 
  Save, 
  Plus, 
  Building2, 
  UserCheck, 
  BookOpen, 
  Trash2, 
  Upload, 
  RotateCcw,
  Edit3,
  Check,
  Landmark,
  AlertCircle,
  Shield,
  Image as ImageIcon,
  ExternalLink,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Account, BumdesProfile, BusinessUnit } from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import { INDONESIA_BANKS } from '../data/bankList';
import { SAMPLE_KABUPATEN_LOGO_SVG } from '../data/sampleKabupatenLogo';

interface SettingsModalProps {
  isOpen?: boolean;
  onClose: () => void;
  profile: BumdesProfile;
  onSaveProfile: (profile: BumdesProfile) => void;
  accounts: Account[];
  onAddAccount: (acc: Account) => void;
  onEditAccount?: (oldCode: string, acc: Account) => void;
  onDeleteAccount?: (code: string) => void;
  units: BusinessUnit[];
  onAddUnit: (unit: BusinessUnit) => void;
  onEditUnit?: (unitId: string, unit: BusinessUnit) => void;
  onDeleteUnit: (unitId: string) => void;
  defaultTab?: 'profil' | 'logo_kabupaten' | 'akun' | 'unit';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen = true,
  onClose,
  profile,
  onSaveProfile,
  accounts,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  units,
  onAddUnit,
  onEditUnit,
  onDeleteUnit,
  defaultTab = 'profil',
}) => {
  const [activeTab, setActiveTab] = useState<'profil' | 'logo_kabupaten' | 'akun' | 'unit'>(defaultTab);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const regencyFileInputRef = useRef<HTMLInputElement>(null);
  const ahuInputRef = useRef<HTMLInputElement>(null);

  // Form state profile
  const [formProfile, setFormProfile] = useState<BumdesProfile>({ ...profile });
  const [regencyUrlInput, setRegencyUrlInput] = useState('');
  const [showUrlField, setShowUrlField] = useState(false);

  // Bank selection state
  // Check if current bankName matches any item in bank list
  const isCustomBank = !INDONESIA_BANKS.some((b) => b.name === formProfile.bankName || b.shortName === formProfile.bankName);
  const [selectedBankType, setSelectedBankType] = useState<string>(() => {
    const found = INDONESIA_BANKS.find(
      (b) => b.name === formProfile.bankName || b.shortName === formProfile.bankName
    );
    return found ? found.name : isCustomBank && formProfile.bankName ? 'LAINNYA' : 'Bank Rakyat Indonesia (BRI)';
  });
  const [customBankName, setCustomBankName] = useState<string>(
    isCustomBank ? formProfile.bankName : ''
  );

  // Form state new account
  const [newAccCode, setNewAccCode] = useState('');
  const [newAccName, setNewAccName] = useState('');
  const [newAccCategory, setNewAccCategory] = useState<Account['category']>('PENDAPATAN');
  const [newAccDesc, setNewAccDesc] = useState('');
  const [editingAccCode, setEditingAccCode] = useState<string | null>(null);
  const [editAccForm, setEditAccForm] = useState<Account | null>(null);

  // Form state new unit
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitManager, setNewUnitManager] = useState('');
  const [newUnitCode, setNewUnitCode] = useState('');

  // Unit editing state
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editUnitName, setEditUnitName] = useState('');
  const [editUnitManager, setEditUnitManager] = useState('');
  const [editUnitCode, setEditUnitCode] = useState('');

  // Deletion state
  const [unitToDelete, setUnitToDelete] = useState<BusinessUnit | null>(null);
  const [accToDelete, setAccToDelete] = useState<Account | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage((cur) => (cur === msg ? null : cur));
    }, 3000);
  };

  const handleBankSelectChange = (value: string) => {
    setSelectedBankType(value);
    if (value === 'LAINNYA') {
      setFormProfile((prev) => ({ ...prev, bankName: customBankName || 'Bank Lain' }));
    } else {
      setFormProfile((prev) => ({ ...prev, bankName: value }));
    }
  };

  const handleCustomBankChange = (name: string) => {
    setCustomBankName(name);
    setFormProfile((prev) => ({ ...prev, bankName: name }));
  };

  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSaveProfile(formProfile);
    onClose();
  };

  const handleRegencyFileUpload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar yang valid (PNG, JPG, SVG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const result = reader.result as string;
        setFormProfile((prev) => ({ ...prev, regencyLogoUrl: result }));
        showStatus('Logo Kabupaten berhasil diunggah!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetRegencyLogo = () => {
    setFormProfile((prev) => ({ ...prev, regencyLogoUrl: '' }));
    showStatus('Logo Kabupaten telah dihapus.');
  };

  const handleUseSampleRegencyLogo = () => {
    setFormProfile((prev) => ({ ...prev, regencyLogoUrl: SAMPLE_KABUPATEN_LOGO_SVG }));
    showStatus('Contoh lambang resmi daerah berhasil dipasang!');
  };

  const handleApplyRegencyUrl = () => {
    const url = regencyUrlInput.trim();
    if (!url) return;
    setFormProfile((prev) => ({ ...prev, regencyLogoUrl: url }));
    setRegencyUrlInput('');
    setShowUrlField(false);
    showStatus('Logo Kabupaten berhasil dipasang dari URL.');
  };

  // AKUN HANDLERS
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newAccCode.trim();
    const cleanName = newAccName.trim();
    if (!cleanCode || !cleanName) return;

    if (accounts.some((a) => a.code.toLowerCase() === cleanCode.toLowerCase())) {
      alert(`Kode rekening "${cleanCode}" sudah ada! Gunakan kode lain.`);
      return;
    }

    const isCredit = ['PENDAPATAN', 'EKUITAS', 'KEWAJIBAN', 'PENDAPATAN_LAIN'].includes(newAccCategory);
    onAddAccount({
      code: cleanCode,
      name: cleanName,
      category: newAccCategory,
      normalBalance: isCredit ? 'KREDIT' : 'DEBIT',
      description: newAccDesc.trim() || undefined,
    });
    setNewAccCode('');
    setNewAccName('');
    setNewAccDesc('');
    showStatus(`Akun rekening ${cleanCode} - ${cleanName} berhasil ditambahkan!`);
  };

  const handleStartEditAcc = (acc: Account) => {
    setEditingAccCode(acc.code);
    setEditAccForm({ ...acc });
  };

  const handleSaveEditAcc = () => {
    if (!editAccForm || !editingAccCode) return;
    const cleanCode = editAccForm.code.trim();
    const cleanName = editAccForm.name.trim();
    if (!cleanCode || !cleanName) return;

    if (onEditAccount) {
      onEditAccount(editingAccCode, {
        ...editAccForm,
        code: cleanCode,
        name: cleanName,
      });
    }
    setEditingAccCode(null);
    setEditAccForm(null);
    showStatus(`Rekening ${cleanCode} berhasil diperbarui.`);
  };

  // UNIT HANDLERS
  const handleCreateUnit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newUnitName.trim();
    if (!cleanName) return;

    const newUnit: BusinessUnit = {
      id: `unit-${Date.now()}`,
      name: cleanName,
      manager: newUnitManager.trim() || 'Pengelola Unit',
      code: newUnitCode.trim().toUpperCase() || 'UNT',
    };

    onAddUnit(newUnit);
    setNewUnitName('');
    setNewUnitManager('');
    setNewUnitCode('');
    showStatus(`Unit usaha "${cleanName}" berhasil ditambahkan!`);
  };

  const handleStartEditUnit = (u: BusinessUnit) => {
    setEditingUnitId(u.id);
    setEditUnitName(u.name);
    setEditUnitManager(u.manager);
    setEditUnitCode(u.code);
  };

  const handleSaveEditUnit = (u: BusinessUnit) => {
    const cleanName = editUnitName.trim();
    if (!cleanName) return;

    if (onEditUnit) {
      onEditUnit(u.id, {
        ...u,
        name: cleanName,
        manager: editUnitManager.trim() || 'Pengelola Unit',
        code: editUnitCode.trim().toUpperCase() || u.code,
      });
    }
    setEditingUnitId(null);
    showStatus(`Unit Usaha "${cleanName}" berhasil diperbarui.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full overflow-hidden border border-stone-200">
        <div className="bg-[#107c41] text-white px-5 py-3.5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm">Pengaturan Lembaga BUMDes & Master Data</h3>
            <p className="text-xs text-emerald-100">
              Identitas Desa, Bank Operasional, Bagan Akun (COA), & Unit Usaha
            </p>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notification */}
        {statusMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Tab selection */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-5 pt-2 text-xs font-semibold gap-3 sm:gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profil')}
            className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'profil'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Profil & Bank BUMDes
          </button>
          <button
            onClick={() => setActiveTab('logo_kabupaten')}
            className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'logo_kabupaten'
                ? 'border-emerald-700 text-emerald-800 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-600" />
            <span>Tambah Logo Kabupaten</span>
            {formProfile.regencyLogoUrl ? (
              <span className="w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-emerald-200" title="Logo Kabupaten aktif"></span>
            ) : (
              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px] font-bold">Baru</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('akun')}
            className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'akun'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Kode Rekening / COA ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab('unit')}
            className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'unit'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Unit Usaha ({units.length})
          </button>
        </div>

        {/* Tab Content: Profile & Bank */}
        {activeTab === 'profil' && (
          <form onSubmit={handleSaveProfile} className="p-5 space-y-4 text-xs font-sans max-h-[560px] overflow-y-auto">
            {/* Bagian Logo: BUMDes & Logo Kabupaten */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Card 1: Logo BUMDes */}
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 flex flex-col justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  <img
                    src={formProfile.logoUrl || '/logo-bumdes.jpg'}
                    alt="Logo BUMDes"
                    className="w-14 h-14 rounded-full object-contain border-2 border-emerald-600 bg-white shadow-xs flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div>
                    <h4 className="font-bold text-stone-800 text-xs">1. Logo Resmi BUMDes</h4>
                    <p className="text-[10.5px] text-stone-500 mt-0.5 leading-tight">
                      Diletakkan di atas Kop Surat BKU, Laporan & Kuitansi.
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                setFormProfile((prev) => ({ ...prev, logoUrl: reader.result as string }));
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1 px-2 py-1 bg-white border border-stone-300 rounded font-semibold text-stone-700 hover:bg-stone-100 transition shadow-xs text-[10.5px]"
                      >
                        <Upload className="w-3 h-3 text-emerald-700" />
                        <span>Ganti Logo BUMDes</span>
                      </button>
                      {formProfile.logoUrl && formProfile.logoUrl !== '/logo-bumdes.jpg' && (
                        <button
                          type="button"
                          onClick={() => setFormProfile((prev) => ({ ...prev, logoUrl: '/logo-bumdes.jpg' }))}
                          className="flex items-center gap-0.5 px-1.5 py-1 text-stone-500 hover:text-stone-800 transition text-[10.5px]"
                          title="Reset Logo BUMDes"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Logo Pemerintah Kabupaten */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 flex flex-col justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg border-2 border-amber-500 bg-white shadow-xs flex-shrink-0 flex items-center justify-center overflow-hidden p-1">
                    {formProfile.regencyLogoUrl ? (
                      <img
                        src={formProfile.regencyLogoUrl}
                        alt="Logo Kabupaten"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Shield className="w-7 h-7 text-amber-500/70" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-amber-950 text-xs flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-amber-700" />
                        <span>2. Logo Pemerintah Kabupaten</span>
                      </h4>
                      {formProfile.regencyLogoUrl && (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-stone-600 mt-0.5 leading-tight">
                      Lambang daerah Pemda pada Kop Surat resmi BUMDes.
                    </p>

                    <div className="flex items-center flex-wrap gap-1.5 mt-2">
                      <input
                        type="file"
                        ref={regencyFileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleRegencyFileUpload(file);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => regencyFileInputRef.current?.click()}
                        className="flex items-center gap-1 px-2 py-1 bg-white border border-amber-300 rounded font-bold text-amber-900 hover:bg-amber-50 transition shadow-xs text-[10.5px]"
                        title="Unggah file gambar logo kabupaten"
                      >
                        <Upload className="w-3 h-3 text-amber-700" />
                        <span>{formProfile.regencyLogoUrl ? 'Ganti Logo Kab.' : '+ Tambah Logo Kab.'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('logo_kabupaten')}
                        className="flex items-center gap-1 px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold transition shadow-xs text-[10.5px]"
                        title="Buka menu lengkap pengaturan logo kabupaten"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Atur Menu Lengkap</span>
                      </button>

                      {formProfile.regencyLogoUrl && (
                        <button
                          type="button"
                          onClick={handleResetRegencyLogo}
                          className="flex items-center gap-0.5 px-1.5 py-1 text-stone-500 hover:text-red-700 transition text-[10.5px]"
                          title="Hapus Logo Kabupaten"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Identitas BUMDes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-stone-700 font-semibold mb-1">Nama Resmi BUMDes</label>
                <input
                  type="text"
                  required
                  value={formProfile.name}
                  onChange={(e) => setFormProfile({ ...formProfile, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Desa</label>
                <input
                  type="text"
                  required
                  value={formProfile.village}
                  onChange={(e) => setFormProfile({ ...formProfile, village: e.target.value })}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Kecamatan</label>
                <input
                  type="text"
                  required
                  value={formProfile.subdistrict}
                  onChange={(e) => setFormProfile({ ...formProfile, subdistrict: e.target.value })}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Kabupaten</label>
                <input
                  type="text"
                  required
                  value={formProfile.district}
                  onChange={(e) => setFormProfile({ ...formProfile, district: e.target.value })}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Tahun Anggaran</label>
                <input
                  type="number"
                  required
                  value={formProfile.fiscalYear}
                  onChange={(e) =>
                    setFormProfile({ ...formProfile, fiscalYear: parseInt(e.target.value) || 2026 })
                  }
                  className="w-full px-3 py-1.5 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* Nomor Sertifikat Badan Hukum Kemenkumham RI (Nomor AHU) */}
            <div className="bg-emerald-50/70 border border-emerald-300 rounded-lg p-3.5 space-y-2.5 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-700 text-white rounded-md shrink-0 shadow-xs">
                    <Shield className="w-4 h-4 text-emerald-100" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                      <span>Nomor Sertifikat Badan Hukum Kemenkumham (No. AHU)</span>
                      <span className="px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded text-[9.5px] font-bold">
                        Wajib PP 11/2021
                      </span>
                    </h4>
                    <p className="text-[10.5px] text-stone-600 mt-0.5 leading-tight">
                      Nomor registrasi AHU akan dicantumkan secara otomatis pada setiap cetakan dokumen (BKU, Kas/Bank, Laba Rugi, Neraca, Jurnal, dan Kuitansi).
                    </p>
                  </div>
                </div>

                {formProfile.ahuNumber ? (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold text-[10px] flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Terdaftar
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded font-bold text-[10px] shrink-0">
                    Belum Diatur
                  </span>
                )}
              </div>

              {/* Form Input No. AHU & Tombol Aksi */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <div className="flex-1 relative">
                  <input
                    ref={ahuInputRef}
                    type="text"
                    value={formProfile.ahuNumber || ''}
                    onChange={(e) => setFormProfile({ ...formProfile, ahuNumber: e.target.value })}
                    placeholder="Contoh: AHU-01428.AH.01.33.TAHUN 2023"
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 focus:border-emerald-600 rounded font-mono font-bold text-stone-900 text-xs uppercase focus:outline-none focus:ring-1 focus:ring-emerald-600 tracking-wide"
                  />
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (!formProfile.ahuNumber) {
                        setFormProfile({ ...formProfile, ahuNumber: 'AHU-01428.AH.01.33.TAHUN 2023' });
                        showStatus('Nomor AHU berhasil ditambahkan!');
                      }
                      ahuInputRef.current?.focus();
                      ahuInputRef.current?.select();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-xs shadow-xs transition active:scale-95"
                    title="Tambah atau ubah Nomor AHU"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{formProfile.ahuNumber ? 'Ubah No. AHU' : '+ Tambah No. AHU'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormProfile({ ...formProfile, ahuNumber: 'AHU-01428.AH.01.33.TAHUN 2023' });
                      showStatus('Contoh format resmi Nomor AHU Kemenkumham RI berhasil dipasang!');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-900 rounded font-semibold text-xs transition shadow-xs"
                    title="Pasang contoh nomor AHU BUMDes resmi Kemenkumham RI"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Contoh Resmi</span>
                  </button>

                  {formProfile.ahuNumber && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormProfile({ ...formProfile, ahuNumber: '' });
                        showStatus('Nomor AHU telah dikosongkan.');
                      }}
                      className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded transition"
                      title="Kosongkan Nomor AHU"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-stone-500 pt-0.5">
                <span>
                  Standar Format Sertifikat: <strong className="font-mono text-stone-700">AHU-xxxxx.AH.01.33.TAHUN YYYY</strong>
                </span>
                {formProfile.ahuNumber && (
                  <span className="text-emerald-700 font-semibold">
                    ✓ Akan tercetak di seluruh dokumen & kuitansi
                  </span>
                )}
              </div>
            </div>

            {/* Pilihan Jenis Bank BUMDes (Permintaan User: untuk nama Bank, buat pilihan jenis Bank) */}
            <div className="border-t border-stone-200 pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Landmark className="w-4 h-4 text-blue-700" />
                <h4 className="font-bold text-stone-800">Rekening Bank Operasional BUMDes</h4>
              </div>

              <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-800 font-semibold mb-1">
                      Pilihan Jenis Bank <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedBankType}
                      onChange={(e) => handleBankSelectChange(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded text-stone-900 font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <optgroup label="Bank BUMN / Himbara (Paling Banyak Digunakan BUMDes)">
                        {INDONESIA_BANKS.filter((b) => b.category === 'Himbara (BUMN)').map((b) => (
                          <option key={b.code} value={b.name}>
                            {b.name} ({b.shortName})
                          </option>
                        ))}
                      </optgroup>

                      <optgroup label="Bank Pembangunan Daerah (BPD)">
                        {INDONESIA_BANKS.filter((b) => b.category === 'Bank Daerah (BPD)').map((b) => (
                          <option key={b.code} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                      </optgroup>

                      <optgroup label="Bank Syariah">
                        {INDONESIA_BANKS.filter((b) => b.category === 'Bank Syariah').map((b) => (
                          <option key={b.code} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                      </optgroup>

                      <optgroup label="Bank Swasta Nasional">
                        {INDONESIA_BANKS.filter((b) => b.category === 'Bank Swasta Nasional').map((b) => (
                          <option key={b.code} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                      </optgroup>

                      <optgroup label="Lainnya">
                        <option value="LAINNYA">Bank Lainnya (Tulis Manual)</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-800 font-semibold mb-1">
                      Nama Bank / Kantor Cabang Operasional <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Cth: Bank BRI Unit Balla / Bank Jateng Cabang Sukamaju"
                      value={formProfile.bankName}
                      onChange={(e) => {
                        setFormProfile({ ...formProfile, bankName: e.target.value });
                        if (selectedBankType === 'LAINNYA') {
                          setCustomBankName(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-stone-700 font-medium mb-1">Nomor Rekening Bank</label>
                    <input
                      type="text"
                      required
                      placeholder="XXXX-XX-XXXXXX-XX-X"
                      value={formProfile.bankAccount}
                      onChange={(e) => setFormProfile({ ...formProfile, bankAccount: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-medium mb-1">
                      Saldo Awal Kas Tunai (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      value={formProfile.initialCash}
                      onChange={(e) =>
                        setFormProfile({ ...formProfile, initialCash: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-medium mb-1">
                      Saldo Awal Rekening Bank (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      value={formProfile.initialBank}
                      onChange={(e) =>
                        setFormProfile({ ...formProfile, initialBank: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded font-mono font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Penanggung Jawab Tanda Tangan */}
            <div className="border-t border-stone-200 pt-3">
              <h4 className="font-bold text-stone-800 mb-2">Penanggung Jawab Laporan (Tanda Tangan)</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">
                    Penasihat (Kepala Desa)
                  </label>
                  <input
                    type="text"
                    required
                    value={formProfile.headOfVillage}
                    onChange={(e) => setFormProfile({ ...formProfile, headOfVillage: e.target.value })}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-medium mb-1">Direktur BUMDes</label>
                  <input
                    type="text"
                    required
                    value={formProfile.director}
                    onChange={(e) => setFormProfile({ ...formProfile, director: e.target.value })}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-medium mb-1">Bendahara BUMDes</label>
                  <input
                    type="text"
                    required
                    value={formProfile.treasurer}
                    onChange={(e) => setFormProfile({ ...formProfile, treasurer: e.target.value })}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-medium mb-1">Badan Pengawas</label>
                  <input
                    type="text"
                    required
                    value={formProfile.supervisor}
                    onChange={(e) => setFormProfile({ ...formProfile, supervisor: e.target.value })}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </div>

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
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab Content: Tambah Logo Kabupaten (Permintaan User: "pada pengaturan, tambahkan menu tambah logo kabupaten") */}
        {activeTab === 'logo_kabupaten' && (
          <div className="p-5 space-y-4 text-xs font-sans max-h-[560px] overflow-y-auto">
            {/* Header info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0 mt-0.5">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-amber-950 text-sm">
                    Menu Tambah & Atur Logo Pemerintah Kabupaten
                  </h4>
                  {formProfile.regencyLogoUrl ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Logo Aktif Terpasang
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-stone-200 text-stone-700 rounded font-medium text-[10px]">
                      Belum Diunggah
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-amber-900/80 mt-1 leading-relaxed">
                  Lambang resmi daerah Pemerintah Kabupaten akan ditampilkan secara otomatis di atas Kop Surat pada Buku Kas Umum (BKU), Laporan Laba Rugi, Neraca Keuangan, Kuitansi Kas (BKM/BKK), dan seluruh berkas unduhan PDF Legal maupun cetak printer.
                </p>
              </div>
            </div>

            {/* Grid 2 Kolom: Kolom Unggah & Kolom Pratinjau Kop Surat */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kolom Kiri: Form & Tombol Unggah Logo Kabupaten */}
              <div className="space-y-3.5">
                <div className="border border-stone-200 rounded-lg p-3.5 bg-stone-50/70 space-y-3">
                  <h5 className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-700" />
                    <span>Unggah Berkas Gambar Logo Kabupaten</span>
                  </h5>

                  {/* Dropzone / Upload Box */}
                  <div
                    onClick={() => regencyFileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-300 hover:border-amber-500 bg-white hover:bg-amber-50/30 rounded-lg p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
                  >
                    {formProfile.regencyLogoUrl ? (
                      <div className="relative group">
                        <img
                          src={formProfile.regencyLogoUrl}
                          alt="Logo Kabupaten"
                          className="w-20 h-20 object-contain p-1 rounded border border-stone-200 bg-white shadow-xs"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="mt-1 text-[11px] font-bold text-amber-800 group-hover:underline">
                          Klik untuk ganti file gambar lain
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 group-hover:scale-105 transition">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-800 text-xs">
                            Klik di sini untuk memilih file Logo Kabupaten
                          </p>
                          <p className="text-[10.5px] text-stone-500 mt-0.5">
                            Mendukung file PNG (latar transparan), JPG, SVG, WebP (Maks 2MB)
                          </p>
                        </div>
                      </>
                    )}

                    <input
                      type="file"
                      ref={regencyFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleRegencyFileUpload(file);
                      }}
                    />
                  </div>

                  {/* Tombol Aksi Tambahan */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => regencyFileInputRef.current?.click()}
                      className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#107c41] hover:bg-emerald-700 text-white rounded font-bold shadow-xs transition text-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{formProfile.regencyLogoUrl ? 'Ganti File Logo' : '+ Pilih File Logo'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleUseSampleRegencyLogo}
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded font-bold transition shadow-xs text-xs"
                      title="Gunakan contoh Lambang Daerah resmi Indonesia (format vektor SVG)"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-stone-950" />
                      <span>Gunakan Contoh Lambang</span>
                    </button>
                  </div>

                  {/* Pilihan Input URL Gambar */}
                  <div className="pt-2 border-t border-stone-200">
                    {!showUrlField ? (
                      <button
                        type="button"
                        onClick={() => setShowUrlField(true)}
                        className="text-[11px] text-stone-600 hover:text-emerald-700 flex items-center gap-1 font-semibold"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Atau masukkan tautan/URL gambar logo...</span>
                      </button>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-stone-700">
                          Tautan / URL Gambar Logo Kabupaten:
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="url"
                            placeholder="https://.../logo-kabupaten.png"
                            value={regencyUrlInput}
                            onChange={(e) => setRegencyUrlInput(e.target.value)}
                            className="flex-1 px-2.5 py-1 text-xs bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600"
                          />
                          <button
                            type="button"
                            onClick={handleApplyRegencyUrl}
                            className="px-3 py-1 bg-stone-800 text-white rounded text-xs font-semibold hover:bg-black"
                          >
                            Terapkan
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowUrlField(false)}
                            className="px-2 py-1 text-stone-500 hover:text-stone-800 text-xs"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {formProfile.regencyLogoUrl && (
                    <div className="pt-2 border-t border-stone-200 flex justify-end">
                      <button
                        type="button"
                        onClick={handleResetRegencyLogo}
                        className="flex items-center gap-1 text-[11px] text-red-600 hover:text-red-800 font-semibold"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus / Kosongkan Logo Kabupaten</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Edit Cepat Nama Kabupaten */}
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Nama Kabupaten pada Kop Surat:
                  </label>
                  <input
                    type="text"
                    value={formProfile.district}
                    onChange={(e) => setFormProfile({ ...formProfile, district: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded text-xs font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    placeholder="Contoh: Kabupaten Mamasa"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    Teks ini dicetak tepat di bawah logo pada baris pertama Kop Surat.
                  </p>
                </div>
              </div>

              {/* Kolom Kanan: Pratinjau Nyata Kop Surat Resmi */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-stone-700 flex items-center justify-between">
                  <span>Pratinjau Nyata Kop Surat Resmi:</span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Standar PP No. 11 Th 2021
                  </span>
                </div>

                {/* Mock Paper Kop Surat */}
                <div 
                  className="bg-white border-2 border-stone-300 rounded-lg p-4 shadow-sm text-center select-none"
                  style={{ fontFamily: 'Arial, sans-serif' }}
                >
                  {/* Kop Surat: Logo BUMDes di Kiri, Teks di Tengah, Logo Kabupaten Mamasa di Kanan */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {/* Sebelah Kiri: Logo BUMDes */}
                    <div className="w-16 shrink-0 flex flex-col items-center justify-center">
                      <img
                        src={formProfile.logoUrl || '/logo-bumdes.jpg'}
                        alt="Logo BUMDes"
                        className="w-12 h-12 object-contain rounded-full shadow-xs border border-stone-200 bg-white"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="text-[7.5px] font-bold text-emerald-800 uppercase tracking-tight mt-0.5 leading-tight">
                        {formProfile.name}
                      </span>
                    </div>

                    {/* Di Tengah: Teks Kop Surat */}
                    <div className="flex-1 text-center px-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-800 leading-tight">
                        PEMERINTAH {formProfile.district.toUpperCase().startsWith('KABUPATEN') ? formProfile.district.toUpperCase() : `KABUPATEN ${formProfile.district.toUpperCase()}`}
                      </div>
                      <div className="text-[9px] font-bold uppercase tracking-wide text-stone-700 leading-tight mt-0.5">
                        KECAMATAN {formProfile.subdistrict.toUpperCase()} · DESA {formProfile.village.toUpperCase()}
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-wide text-emerald-950 leading-tight mt-0.5">
                        BADAN USAHA MILIK DESA (BUMDes) "{formProfile.name.toUpperCase()}"
                      </div>
                      {formProfile.ahuNumber && (
                        <div className="text-[8px] font-bold text-stone-900 mt-0.5 leading-tight tracking-tight">
                          Sertifikat Pendaftaran Badan Hukum No. AHU: {formProfile.ahuNumber}
                        </div>
                      )}
                      <div className="text-[7.5px] text-stone-600 italic mt-0.5 leading-tight">
                        Sekretariat: Kantor Desa {formProfile.village}, Kec. {formProfile.subdistrict}, {formProfile.district}
                      </div>
                    </div>

                    {/* Sebelah Kanan: Logo Kabupaten Mamasa */}
                    <div className="w-16 shrink-0 flex flex-col items-center justify-center">
                      <img
                        src={formProfile.regencyLogoUrl || SAMPLE_KABUPATEN_LOGO_SVG}
                        alt="Logo Kabupaten Mamasa"
                        className="w-12 h-12 object-contain shadow-xs border border-stone-200 bg-white p-0.5 rounded"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="text-[7.5px] font-bold text-stone-600 uppercase tracking-tight mt-0.5 leading-tight">
                        PEMKAB {formProfile.district.toUpperCase().replace(/^KABUPATEN\s+/i, '')}
                      </span>
                    </div>
                  </div>

                  {/* Garis Ganda Resmi */}
                  <div className="border-b-[2px] border-stone-900 w-full mt-2 mb-[1px]"></div>
                  <div className="border-b-[0.5px] border-stone-900 w-full mb-2"></div>

                  {/* Mock Isi Dokumen */}
                  <div className="bg-stone-50 rounded py-1 px-2 border border-stone-200">
                    <span className="text-[9px] font-bold uppercase text-stone-800">
                      BUKU KAS UMUM (BKU) / LAPORAN PERTANGGUNGJAWABAN
                    </span>
                    <span className="block text-[8px] text-stone-500">
                      Tahun Anggaran {formProfile.fiscalYear}
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-[10.5px] text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Logo yang Anda atur tersimpan otomatis pada sistem dan siap dicetak/diunduh.</span>
                </div>
              </div>
            </div>

            {/* Tombol Simpan Tab Logo Kabupaten */}
            <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-stone-300 text-stone-700 rounded hover:bg-stone-100 font-medium transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleSaveProfile()}
                className="px-5 py-2 bg-[#107c41] hover:bg-emerald-700 text-white rounded font-bold shadow transition flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan Logo Kabupaten</span>
              </button>
            </div>
          </div>
        )}
        {activeTab === 'akun' && (
          <div className="p-5 space-y-4 text-xs font-sans max-h-[560px] overflow-y-auto">
            {/* Form Tambah Kode Rekening BUMDes */}
            <form onSubmit={handleCreateAccount} className="p-3.5 bg-emerald-50/60 border border-emerald-300 rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-700" />
                  <span>Tambah Kode Rekening BUMDes Baru</span>
                </h4>
                <span className="text-[10px] text-emerald-700 font-medium">Bagan Akun Standar Kemendesa PDTT</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Kode Rekening (cth: 4.1.05)"
                  value={newAccCode}
                  onChange={(e) => setNewAccCode(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-stone-300 rounded font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                <input
                  type="text"
                  required
                  placeholder="Nama Rekening Akun"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-stone-300 rounded font-medium focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                <select
                  value={newAccCategory}
                  onChange={(e) => setNewAccCategory(e.target.value as Account['category'])}
                  className="px-2.5 py-1.5 bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="PENDAPATAN">4.1 Pendapatan Usaha</option>
                  <option value="HPP">5.1 Harga Pokok Penjualan (HPP)</option>
                  <option value="BEBAN_OPERASIONAL">5.2 Beban Operasional</option>
                  <option value="ASET_LANCAR">1.1 Aset Lancar / Kas / Bank</option>
                  <option value="ASET_TETAP">1.2 Aset Tetap</option>
                  <option value="KEWAJIBAN">2.1 Kewajiban / Utang</option>
                  <option value="EKUITAS">3.1 Ekuitas / Modal Desa</option>
                  <option value="PENDAPATAN_LAIN">4.2 Pendapatan Lain-lain</option>
                  <option value="BEBAN_LAIN">5.3 Beban Lain-lain & Bank</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Keterangan singkat peruntukan rekening (opsional)..."
                  value={newAccDesc}
                  onChange={(e) => setNewAccDesc(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-stone-300 rounded text-[11px] focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold transition flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Simpan Akun</span>
                </button>
              </div>
            </form>

            {/* List accounts with edit and delete */}
            <div className="border border-stone-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 font-semibold text-stone-700 border-b border-stone-200">
                  <tr>
                    <th className="py-2 px-3 w-24">Kode</th>
                    <th className="py-2 px-3">Nama Akun</th>
                    <th className="py-2 px-3">Kategori</th>
                    <th className="py-2 px-3 w-16 text-center">Saldo</th>
                    <th className="py-2 px-3 w-20 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {accounts.map((a) => {
                    const isEditing = editingAccCode === a.code;

                    if (isEditing && editAccForm) {
                      return (
                        <tr key={a.code} className="bg-amber-50">
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={editAccForm.code}
                              onChange={(e) => setEditAccForm({ ...editAccForm, code: e.target.value })}
                              className="w-full px-1.5 py-1 bg-white border border-stone-300 rounded font-mono font-bold text-xs"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={editAccForm.name}
                              onChange={(e) => setEditAccForm({ ...editAccForm, name: e.target.value })}
                              className="w-full px-1.5 py-1 bg-white border border-stone-300 rounded font-medium text-xs"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <select
                              value={editAccForm.category}
                              onChange={(e) => {
                                const newCat = e.target.value as Account['category'];
                                const isKredit = ['PENDAPATAN', 'EKUITAS', 'KEWAJIBAN', 'PENDAPATAN_LAIN'].includes(newCat);
                                setEditAccForm({
                                  ...editAccForm,
                                  category: newCat,
                                  normalBalance: isKredit ? 'KREDIT' : 'DEBIT',
                                });
                              }}
                              className="w-full px-1.5 py-1 bg-white border border-stone-300 rounded text-[11px]"
                            >
                              <option value="PENDAPATAN">Pendapatan Usaha</option>
                              <option value="HPP">HPP</option>
                              <option value="BEBAN_OPERASIONAL">Beban Operasional</option>
                              <option value="ASET_LANCAR">Aset Lancar</option>
                              <option value="ASET_TETAP">Aset Tetap</option>
                              <option value="KEWAJIBAN">Kewajiban</option>
                              <option value="EKUITAS">Ekuitas</option>
                              <option value="PENDAPATAN_LAIN">Pendapatan Lain</option>
                              <option value="BEBAN_LAIN">Beban Lain</option>
                            </select>
                          </td>
                          <td className="py-1.5 px-2 text-center font-mono text-[10px]">
                            {editAccForm.normalBalance}
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={handleSaveEditAcc}
                                className="p-1 bg-emerald-700 text-white rounded hover:bg-emerald-800"
                                title="Simpan"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAccCode(null);
                                  setEditAccForm(null);
                                }}
                                className="p-1 bg-stone-200 text-stone-700 rounded hover:bg-stone-300"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={a.code} className="hover:bg-stone-50">
                        <td className="py-1.5 px-3 font-mono font-medium text-stone-800">{a.code}</td>
                        <td className="py-1.5 px-3 text-stone-900 font-medium">{a.name}</td>
                        <td className="py-1.5 px-3 text-stone-600 text-[11px]">{a.category}</td>
                        <td className="py-1.5 px-3 font-mono text-[11px] text-center text-stone-500">{a.normalBalance}</td>
                        <td className="py-1.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditAcc(a)}
                              className="p-1 text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition"
                              title={`Edit ${a.code}`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {onDeleteAccount && (
                              <button
                                type="button"
                                onClick={() => setAccToDelete(a)}
                                className="p-1 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded transition"
                                title={`Hapus ${a.code}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Dialog konfirmasi hapus akun */}
            <ConfirmDialog
              isOpen={!!accToDelete}
              title="Hapus Kode Rekening Akun"
              message={`Hapus rekening "${accToDelete?.code} - ${accToDelete?.name}" dari daftar bagan akun BUMDes?`}
              confirmText="Ya, Hapus Akun"
              cancelText="Batal"
              onConfirm={() => {
                if (accToDelete && onDeleteAccount) {
                  onDeleteAccount(accToDelete.code);
                  setAccToDelete(null);
                  showStatus(`Rekening ${accToDelete.code} berhasil dihapus.`);
                }
              }}
              onClose={() => setAccToDelete(null)}
            />
          </div>
        )}

        {/* Tab Content: Unit Usaha (Tambahkan, Edit, Hapus) */}
        {activeTab === 'unit' && (
          <div className="p-5 space-y-4 text-xs font-sans max-h-[560px] overflow-y-auto">
            {/* Form Tambah Unit Usaha Baru */}
            <form onSubmit={handleCreateUnit} className="p-3.5 bg-stone-50 border border-stone-200 rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-stone-800 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-700" />
                  <span>Tambahkan Unit Usaha BUMDes Baru</span>
                </h4>
                <span className="text-[10px] text-stone-500">Unit Usaha Otonom / Divisi</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nama Unit Usaha (cth: Unit Wisata Desa)"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-stone-300 rounded font-medium focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                <input
                  type="text"
                  placeholder="Nama Penanggung Jawab / Manajer"
                  value={newUnitManager}
                  onChange={(e) => setNewUnitManager(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                <input
                  type="text"
                  placeholder="Kode Singkat (cth: WST)"
                  value={newUnitCode}
                  onChange={(e) => setNewUnitCode(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-stone-300 rounded font-mono uppercase focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambahkan Unit Usaha</span>
                </button>
              </div>
            </form>

            {/* Daftar Unit Usaha dengan Opsi Edit dan Hapus */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider px-1">
                Daftar Unit Usaha Aktif ({units.length}):
              </div>

              {units.map((u) => {
                const isEditing = editingUnitId === u.id;

                if (isEditing) {
                  return (
                    <div
                      key={u.id}
                      className="p-3 bg-amber-50/80 border-2 border-amber-300 rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                        <span>Edit Data Unit Usaha</span>
                        <span className="font-mono text-stone-500">ID: {u.id}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] text-stone-600 font-medium mb-0.5">Nama Unit Usaha</label>
                          <input
                            type="text"
                            required
                            value={editUnitName}
                            onChange={(e) => setEditUnitName(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-stone-300 rounded font-semibold text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-stone-600 font-medium mb-0.5">Penanggung Jawab</label>
                          <input
                            type="text"
                            value={editUnitManager}
                            onChange={(e) => setEditUnitManager(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-stone-600 font-medium mb-0.5">Kode Singkat</label>
                          <input
                            type="text"
                            value={editUnitCode}
                            onChange={(e) => setEditUnitCode(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-stone-300 rounded font-mono uppercase text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingUnitId(null)}
                          className="px-3 py-1 bg-white border border-stone-300 text-stone-700 rounded font-medium text-xs hover:bg-stone-50"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEditUnit(u)}
                          className="px-3.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Simpan Perubahan</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={u.id}
                    className="p-3 border border-stone-200 rounded-lg flex items-center justify-between bg-white hover:border-stone-300 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{u.name}</span>
                        <span className="px-2 py-0.5 bg-stone-100 rounded text-stone-700 font-mono font-bold text-[10px]">
                          {u.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">Penanggung Jawab: {u.manager}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEditUnit(u)}
                        title={`Edit Unit Usaha: ${u.name}`}
                        className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition"
                        aria-label={`Edit ${u.name}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setUnitToDelete(u)}
                        title={`Hapus Unit Usaha: ${u.name}`}
                        className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded transition"
                        aria-label={`Hapus ${u.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Confirmation Dialog for Unit Deletion */}
            <ConfirmDialog
              isOpen={!!unitToDelete}
              title="Hapus Unit Usaha"
              message={`Apakah Anda yakin ingin menghapus unit usaha "${unitToDelete?.name}"?`}
              details={
                unitToDelete ? (
                  <div className="space-y-1 text-stone-700 text-xs">
                    <div>
                      Kode Unit: <strong className="font-mono">{unitToDelete.code}</strong>
                    </div>
                    <div>
                      Penanggung Jawab: <strong>{unitToDelete.manager}</strong>
                    </div>
                    <p className="mt-1 text-[11px] text-stone-500 italic">
                      Transaksi yang sudah ada tidak akan terhapus dan akan tetap tersimpan di Buku Kas.
                    </p>
                  </div>
                ) : null
              }
              confirmText="Ya, Hapus Unit"
              cancelText="Batal"
              onConfirm={() => {
                if (unitToDelete) {
                  onDeleteUnit(unitToDelete.id);
                  setUnitToDelete(null);
                }
              }}
              onClose={() => setUnitToDelete(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
