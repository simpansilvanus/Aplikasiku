import React from 'react';
import { BumdesProfile } from '../types';
import { SAMPLE_KABUPATEN_LOGO_SVG } from '../data/sampleKabupatenLogo';

interface KopSuratProps {
  profile: BumdesProfile;
  documentTitle: string;
  documentSubtitle?: string;
  periodLabel?: string;
  showLogo?: boolean;
}

export const KopSurat: React.FC<KopSuratProps> = ({
  profile,
  documentTitle,
  documentSubtitle,
  periodLabel,
  showLogo = true,
}) => {
  const logoSrc = profile.logoUrl || '/logo-bumdes.jpg';
  const regencyLogoSrc = profile.regencyLogoUrl || SAMPLE_KABUPATEN_LOGO_SVG;

  // Format penamaan kabupaten
  const districtName = profile.district.toUpperCase().startsWith('KABUPATEN')
    ? profile.district.toUpperCase()
    : `KABUPATEN ${profile.district.toUpperCase()}`;

  const cleanDistrictShort = profile.district.toUpperCase().replace(/^KABUPATEN\s+/i, '');

  return (
    <div className="w-full mb-6" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* KOP SURAT RESMI: LOGO BUMDES DI SEBELAH KIRI, TEKS RESMI DI TENGAH, LOGO KABUPATEN MAMASA DI SEBELAH KANAN */}
      <div className="flex items-center justify-between gap-2 md:gap-4 mb-2.5 w-full">
        {/* SEBELAH KIRI: LOGO BUMDES */}
        <div className="w-24 md:w-28 shrink-0 flex flex-col items-center justify-center text-center">
          {showLogo ? (
            <>
              <img
                src={logoSrc}
                alt={`Logo BUMDes ${profile.name}`}
                className="w-18 h-18 md:w-22 md:h-22 object-contain rounded-full shadow-xs border border-stone-200 bg-white"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span 
                style={{ fontSize: '8pt', lineHeight: '1.2' }} 
                className="font-bold text-emerald-900 uppercase tracking-tight mt-1 text-center"
              >
                {profile.name}
              </span>
            </>
          ) : (
            <div className="w-20 h-20"></div>
          )}
        </div>

        {/* DI TENGAH: TEKS KOP SURAT RESMI (UKURAN HURUF 14, JENIS HURUF ARIAL) */}
        <div 
          className="flex-1 text-center px-1 md:px-3 kop-surat-header" 
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          <h4 
            style={{ fontSize: '14pt', lineHeight: '1.25' }} 
            className="font-bold tracking-wider text-stone-900 uppercase m-0 p-0"
          >
            PEMERINTAH {districtName}
          </h4>
          <h3 
            style={{ fontSize: '14pt', lineHeight: '1.25' }} 
            className="font-bold tracking-wide text-stone-900 uppercase mt-0.5 m-0 p-0"
          >
            KECAMATAN {profile.subdistrict.toUpperCase()} · DESA {profile.village.toUpperCase()}
          </h3>
          <h1 
            style={{ fontSize: '14pt', lineHeight: '1.25' }} 
            className="font-black uppercase tracking-wide text-emerald-950 mt-1 m-0 p-0"
          >
            BADAN USAHA MILIK DESA (BUMDes) "{profile.name.toUpperCase()}"
          </h1>
          {profile.ahuNumber && (
            <p 
              style={{ fontSize: '12pt', lineHeight: '1.25' }} 
              className="font-bold text-stone-900 mt-0.5 m-0 p-0 tracking-wide"
            >
              Sertifikat Pendaftaran Badan Hukum No. AHU: {profile.ahuNumber}
            </p>
          )}
          <p 
            style={{ fontSize: '12pt', lineHeight: '1.25' }} 
            className="text-stone-700 mt-0.5 m-0 p-0"
          >
            Badan Usaha Milik Desa berdasarkan PP No. 11 Th 2021 & Permendesa PDTT
          </p>
          <p 
            style={{ fontSize: '12pt', lineHeight: '1.25' }} 
            className="text-stone-600 italic mt-0.5 m-0 p-0"
          >
            Sekretariat: Kantor Desa {profile.village}, Kec. {profile.subdistrict}, {profile.district}, Prov. {profile.province}
          </p>
        </div>

        {/* SEBELAH KANAN: LOGO KABUPATEN MAMASA */}
        <div className="w-24 md:w-28 shrink-0 flex flex-col items-center justify-center text-center">
          {showLogo ? (
            <>
              <img
                src={regencyLogoSrc}
                alt={`Logo ${districtName}`}
                className="w-18 h-18 md:w-22 md:h-22 object-contain shadow-xs border border-stone-200 bg-white p-1 rounded"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span 
                style={{ fontSize: '8pt', lineHeight: '1.2' }} 
                className="font-bold text-stone-700 uppercase tracking-tight mt-1 text-center"
              >
                PEMKAB {cleanDistrictShort}
              </span>
            </>
          ) : (
            <div className="w-20 h-20"></div>
          )}
        </div>
      </div>

      {/* Garis Ganda Standar Kop Surat Resmi (Tebal & Tipis) */}
      <div className="border-b-[3px] border-stone-900 w-full mb-[2px] mt-2"></div>
      <div className="border-b-[1px] border-stone-900 w-full mb-4"></div>

      {/* Judul Dokumen Pembukuan (Ukuran Huruf 14) */}
      <div className="text-center py-2 bg-stone-50/80 rounded border border-stone-200/80 print:bg-transparent print:border-none">
        <h2 
          style={{ fontSize: '14pt', lineHeight: '1.3' }} 
          className="kop-surat-title font-black tracking-wider text-stone-900 uppercase m-0 p-0"
        >
          {documentTitle}
        </h2>
        {documentSubtitle && (
          <p 
            style={{ fontSize: '12pt', lineHeight: '1.3' }} 
            className="font-semibold text-emerald-900 mt-0.5 m-0 p-0"
          >
            {documentSubtitle}
          </p>
        )}
        <div 
          style={{ fontSize: '12pt' }} 
          className="flex items-center justify-center gap-3 font-medium text-stone-700 mt-1"
        >
          {periodLabel && (
            <span>
              Periode: <strong className="text-stone-900 font-bold">{periodLabel}</strong>
            </span>
          )}
          <span>•</span>
          <span>
            Tahun Anggaran: <strong className="text-stone-900 font-bold">{profile.fiscalYear}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
