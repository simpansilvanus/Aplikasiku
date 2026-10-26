import React from 'react';
import { BumdesProfile } from '../types';
import { formatTanggalIndo } from '../utils/formatters';

interface OfficialSignaturesProps {
  profile: BumdesProfile;
  dateStr?: string;
  treasurerTitle?: string;
  notes?: string;
}

export const OfficialSignatures: React.FC<OfficialSignaturesProps> = ({
  profile,
  dateStr,
  treasurerTitle = 'Bendahara BUMDes',
  notes,
}) => {
  const displayDate = dateStr || new Date().toISOString().split('T')[0];

  return (
    <div 
      className="w-full mt-8 pt-4 break-inside-avoid page-break-inside-avoid official-signatures-container"
      style={{ fontFamily: 'Arial, sans-serif', fontSize: '12pt' }}
    >
      {notes && (
        <div style={{ fontSize: '11pt' }} className="text-stone-600 italic mb-4 border-l-2 border-stone-300 pl-2">
          {notes}
        </div>
      )}

      {/* Tanggal & Tempat Pengesahan (Ukuran Huruf 12) */}
      <div style={{ fontSize: '12pt' }} className="text-right text-stone-800 font-medium mb-4">
        {profile.village}, {formatTanggalIndo(displayDate)}
      </div>

      {/* 3 Kolom Tanda Tangan (Ukuran Huruf 12) */}
      <div className="grid grid-cols-3 gap-4 text-center">
        {/* Kolom 1: Penasihat / Kepala Desa */}
        <div className="flex flex-col justify-between h-36 px-2">
          <div>
            <p style={{ fontSize: '12pt' }} className="font-semibold text-stone-800 m-0">Mengetahui,</p>
            <p style={{ fontSize: '12pt' }} className="text-stone-700 font-medium m-0">Penasihat / Kepala Desa</p>
          </div>
          <div>
            <p style={{ fontSize: '12pt' }} className="font-bold underline text-stone-900 tracking-wide m-0">
              {profile.headOfVillage}
            </p>
            <p style={{ fontSize: '11pt' }} className="text-stone-600 m-0 mt-0.5">Kepala Desa {profile.village}</p>
          </div>
        </div>

        {/* Kolom 2: Direktur BUMDes */}
        <div className="flex flex-col justify-between h-36 px-2">
          <div>
            <p style={{ fontSize: '12pt' }} className="font-semibold text-stone-800 m-0">Menyetujui,</p>
            <p style={{ fontSize: '12pt' }} className="text-stone-700 font-medium m-0">Direktur BUMDes</p>
          </div>
          <div>
            <p style={{ fontSize: '12pt' }} className="font-bold underline text-stone-900 tracking-wide m-0">
              {profile.director}
            </p>
            <p style={{ fontSize: '11pt' }} className="text-stone-600 m-0 mt-0.5">Direktur Utama</p>
          </div>
        </div>

        {/* Kolom 3: Bendahara BUMDes */}
        <div className="flex flex-col justify-between h-36 px-2">
          <div>
            <p style={{ fontSize: '12pt' }} className="font-semibold text-stone-800 m-0">Dibuat Oleh,</p>
            <p style={{ fontSize: '12pt' }} className="text-stone-700 font-medium m-0">{treasurerTitle}</p>
          </div>
          <div>
            <p style={{ fontSize: '12pt' }} className="font-bold underline text-stone-900 tracking-wide m-0">
              {profile.treasurer}
            </p>
            <p style={{ fontSize: '11pt' }} className="text-stone-600 m-0 mt-0.5">Bendahara Operasional</p>
          </div>
        </div>
      </div>
    </div>
  );
};
