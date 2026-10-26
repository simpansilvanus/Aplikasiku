import React, { useState } from 'react';
import { X, Printer, CheckCircle, FileDown, Loader2 } from 'lucide-react';
import { Account, BumdesProfile, Transaction } from '../types';
import { formatRupiah, formatTanggalIndo, terbilang } from '../utils/formatters';
import { exportElementToPdf } from '../utils/pdfExport';
import { SAMPLE_KABUPATEN_LOGO_SVG } from '../data/sampleKabupatenLogo';

interface ReceiptModalProps {
  transaction: Transaction | null;
  profile: BumdesProfile;
  accounts: Account[];
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  profile,
  accounts,
  onClose,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!transaction) return null;

  const isMasuk = transaction.type === 'IN';
  const title = isMasuk ? 'BUKTI KAS MASUK (BKM)' : 'BUKTI KAS KELUAR (BKK)';
  const acc = accounts.find((a) => a.code === transaction.accountCode);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const cleanDoc = transaction.docNumber.replace(/[^a-zA-Z0-9]/g, '_');
      await exportElementToPdf({
        elementId: 'official-receipt',
        filename: `Kuitansi_${cleanDoc}_${profile.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        orientation: 'portrait',
        format: 'legal',
      });
    } catch (e) {
      console.error(e);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full overflow-hidden border border-stone-200">
        {/* Modal Top Toolbar (hidden when printing) */}
        <div className="bg-stone-100 border-b border-stone-200 px-4 py-2.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-stone-800">Pratinjau Kuitansi Resmi</span>
            <span className="text-[11px] font-mono bg-stone-200 px-2 py-0.5 rounded text-stone-700">
              {transaction.docNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#107c41] hover:bg-emerald-700 text-white text-xs font-semibold rounded shadow-sm transition active:scale-95"
              title="Cetak langsung kuitansi ke printer (Ctrl+P)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Kuitansi</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-stone-900 text-xs font-bold rounded shadow-sm transition active:scale-95 disabled:opacity-75"
              title="Unduh kuitansi resmi ini dalam format PDF (.pdf)"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>Unduh PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-stone-400 hover:text-stone-700 rounded transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official Receipt Body (Ukuran Kertas Legal, Huruf Arial, Kop 14pt, Isi 12pt) */}
        <div 
          className="p-8 bg-white text-stone-900 print:p-0" 
          id="official-receipt"
          style={{ fontFamily: 'Arial, sans-serif', fontSize: '12pt' }}
        >
          {/* Header Kop Surat Resmi: Logo BUMDes di Kiri, Teks di Tengah, Logo Kabupaten Mamasa di Kanan */}
          <div className="border-b-[3px] border-stone-900 pb-2 mb-1">
            <div className="flex items-center justify-between gap-3 w-full">
              {/* SEBELAH KIRI: LOGO BUMDES */}
              <div className="w-20 md:w-24 shrink-0 flex flex-col items-center justify-center text-center">
                <img
                  src={profile.logoUrl || '/logo-bumdes.jpg'}
                  alt={`Logo ${profile.name}`}
                  className="w-16 h-16 md:w-18 md:h-18 object-contain rounded-full border border-stone-200 bg-white shadow-xs"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span 
                  style={{ fontSize: '7.5pt', lineHeight: '1.2' }} 
                  className="font-bold text-emerald-800 uppercase tracking-tight mt-1 text-center"
                >
                  {profile.name}
                </span>
              </div>

              {/* DI TENGAH: TEKS KOP SURAT RESMI (UKURAN HURUF 14, HURUF ARIAL) */}
              <div className="flex-1 text-center px-1 kop-surat-header" style={{ fontFamily: 'Arial, sans-serif' }}>
                <h4 
                  style={{ fontSize: '13pt', lineHeight: '1.25' }} 
                  className="font-bold uppercase tracking-wider text-stone-800 m-0 p-0"
                >
                  PEMERINTAH {profile.district.toUpperCase().startsWith('KABUPATEN') ? profile.district.toUpperCase() : `KABUPATEN ${profile.district.toUpperCase()}`}
                </h4>
                <h3 
                  style={{ fontSize: '13pt', lineHeight: '1.25' }} 
                  className="font-bold uppercase tracking-wide text-stone-800 m-0 mt-0.5 p-0"
                >
                  KECAMATAN {profile.subdistrict.toUpperCase()} · DESA {profile.village.toUpperCase()}
                </h3>
                <h2 
                  style={{ fontSize: '14pt', lineHeight: '1.25' }} 
                  className="font-black uppercase text-emerald-950 tracking-wide mt-0.5 m-0 p-0"
                >
                  BADAN USAHA MILIK DESA (BUMDes) "{profile.name.toUpperCase()}"
                </h2>
                {profile.ahuNumber && (
                  <p 
                    style={{ fontSize: '11pt', lineHeight: '1.25' }} 
                    className="font-bold text-stone-900 mt-0.5 m-0 p-0 tracking-wide"
                  >
                    Sertifikat Pendaftaran Badan Hukum No. AHU: {profile.ahuNumber}
                  </p>
                )}
                <p 
                  style={{ fontSize: '11pt', lineHeight: '1.25' }} 
                  className="text-stone-600 italic m-0 mt-0.5 p-0"
                >
                  Sekretariat: Kantor Desa {profile.village}, Kec. {profile.subdistrict}, {profile.district}
                </p>
              </div>

              {/* SEBELAH KANAN: LOGO KABUPATEN MAMASA */}
              <div className="w-20 md:w-24 shrink-0 flex flex-col items-center justify-center text-center">
                <img
                  src={profile.regencyLogoUrl || SAMPLE_KABUPATEN_LOGO_SVG}
                  alt="Logo Kabupaten Mamasa"
                  className="w-16 h-16 md:w-18 md:h-18 object-contain border border-stone-200 bg-white p-0.5 rounded shadow-xs"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span 
                  style={{ fontSize: '7.5pt', lineHeight: '1.2' }} 
                  className="font-bold text-stone-700 uppercase tracking-tight mt-1 text-center"
                >
                  PEMKAB {profile.district.toUpperCase().replace(/^KABUPATEN\s+/i, '')}
                </span>
              </div>
            </div>
          </div>
          <div className="border-b-[1px] border-stone-900 w-full mb-4"></div>

          {/* Title & Document Number (Judul Ukuran Huruf 14) */}
          <div className="flex justify-between items-center mb-6 border-b border-stone-300 pb-2">
            <div>
              <h3 
                style={{ fontSize: '14pt' }} 
                className="font-black tracking-wide text-stone-900 uppercase m-0"
              >
                {title}
              </h3>
              <p style={{ fontSize: '12pt' }} className="text-stone-600 font-mono m-0 mt-0.5">
                No: {transaction.docNumber}
              </p>
            </div>
            <div className="text-right" style={{ fontSize: '12pt' }}>
              <div className="text-stone-500">Tanggal:</div>
              <div className="font-semibold text-stone-900">{formatTanggalIndo(transaction.date)}</div>
            </div>
          </div>

          {/* Receipt Data Table */}
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-4 gap-2 py-1.5 border-b border-stone-100">
              <span className="text-stone-500 font-medium">
                {isMasuk ? 'Telah Diterima Dari' : 'Dibayarkan Kepada'}
              </span>
              <span className="col-span-3 font-bold text-stone-900">
                : {transaction.recipientOrPayer || '-'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 py-1.5 border-b border-stone-100">
              <span className="text-stone-500 font-medium">Jumlah Uang</span>
              <span className="col-span-3 font-mono font-black text-sm text-emerald-900">
                : {formatRupiah(transaction.amount)}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 py-1.5 border-b border-stone-100">
              <span className="text-stone-500 font-medium">Terbilang</span>
              <span className="col-span-3 italic font-semibold text-stone-800 bg-stone-50 p-2 rounded border border-stone-200">
                # {terbilang(transaction.amount)} #
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 py-1.5 border-b border-stone-100">
              <span className="text-stone-500 font-medium">Untuk Pembayaran</span>
              <span className="col-span-3 font-medium text-stone-900 leading-relaxed">
                : {transaction.description}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 py-1.5 border-b border-stone-100">
              <span className="text-stone-500 font-medium">Kode Rekening</span>
              <span className="col-span-3 font-mono text-stone-700">
                : {transaction.accountCode} - {acc?.name || '-'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 py-1.5">
              <span className="text-stone-500 font-medium">Metode Kas</span>
              <span className="col-span-3 font-medium text-stone-800">
                : {transaction.paymentMethod === 'KAS' ? 'KAS TUNAI (Bendahara)' : `BANK (${profile.bankName})`}
              </span>
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-8 pt-4 border-t border-stone-300">
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div className="flex flex-col justify-between h-28">
                <div>
                  <p className="font-semibold text-stone-700">Mengetahui/Menyetujui,</p>
                  <p className="text-[10px] text-stone-500">Direktur BUMDes</p>
                </div>
                <div>
                  <p className="font-bold underline text-stone-900">{profile.director}</p>
                </div>
              </div>

              <div className="flex flex-col justify-between h-28">
                <div>
                  <p className="font-semibold text-stone-700">
                    {isMasuk ? 'Penyetor / Warga' : 'Penerima Uang'}
                  </p>
                  <p className="text-[10px] text-stone-500">Pihak Terkait</p>
                </div>
                <div>
                  <p className="font-bold underline text-stone-900">
                    {transaction.recipientOrPayer || '(..................................)'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-between h-28">
                <div>
                  <p className="font-semibold text-stone-700">Bendahara,</p>
                  <p className="text-[10px] text-stone-500">Kasir / Bendahara BUMDes</p>
                </div>
                <div>
                  <p className="font-bold underline text-stone-900">{profile.treasurer}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 border-t border-stone-200 px-4 py-2.5 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded hover:bg-stone-100 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
