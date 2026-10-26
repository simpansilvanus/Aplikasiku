export interface BankOption {
  code: string;
  name: string;
  shortName: string;
  category: 'Himbara (BUMN)' | 'Bank Daerah (BPD)' | 'Bank Swasta Nasional' | 'Bank Syariah' | 'Lainnya';
}

export const INDONESIA_BANKS: BankOption[] = [
  // Bank BUMN / Himbara (Paling umum untuk BUMDes / Rekening Kas Desa)
  { code: '002', name: 'Bank Rakyat Indonesia (BRI)', shortName: 'Bank BRI', category: 'Himbara (BUMN)' },
  { code: '008', name: 'Bank Mandiri', shortName: 'Bank Mandiri', category: 'Himbara (BUMN)' },
  { code: '009', name: 'Bank Negara Indonesia (BNI)', shortName: 'Bank BNI', category: 'Himbara (BUMN)' },
  { code: '200', name: 'Bank Tabungan Negara (BTN)', shortName: 'Bank BTN', category: 'Himbara (BUMN)' },

  // Bank Syariah
  { code: '451', name: 'Bank Syariah Indonesia (BSI)', shortName: 'BSI', category: 'Bank Syariah' },
  { code: '147', name: 'Bank Muamalat', shortName: 'Bank Muamalat', category: 'Bank Syariah' },

  // Bank Pembangunan Daerah (BPD) - Sering menjadi mitra BUMDes & Kas Desa
  { code: '110', name: 'Bank BJB (Jawa Barat & Banten)', shortName: 'Bank BJB', category: 'Bank Daerah (BPD)' },
  { code: '111', name: 'Bank DKI (DKI Jakarta)', shortName: 'Bank DKI', category: 'Bank Daerah (BPD)' },
  { code: '112', name: 'Bank BPD DIY (Yogyakarta)', shortName: 'Bank BPD DIY', category: 'Bank Daerah (BPD)' },
  { code: '113', name: 'Bank Jateng (Jawa Tengah)', shortName: 'Bank Jateng', category: 'Bank Daerah (BPD)' },
  { code: '114', name: 'Bank Jatim (Jawa Timur)', shortName: 'Bank Jatim', category: 'Bank Daerah (BPD)' },
  { code: '115', name: 'Bank Jambi', shortName: 'Bank Jambi', category: 'Bank Daerah (BPD)' },
  { code: '116', name: 'Bank BPD Aceh', shortName: 'Bank Aceh Syariah', category: 'Bank Daerah (BPD)' },
  { code: '117', name: 'Bank Sumut', shortName: 'Bank Sumut', category: 'Bank Daerah (BPD)' },
  { code: '118', name: 'Bank Nagari (Sumatera Barat)', shortName: 'Bank Nagari', category: 'Bank Daerah (BPD)' },
  { code: '119', name: 'Bank Riau Kepri', shortName: 'Bank Riau Kepri', category: 'Bank Daerah (BPD)' },
  { code: '120', name: 'Bank Sumsel Babel', shortName: 'Bank Sumsel Babel', category: 'Bank Daerah (BPD)' },
  { code: '121', name: 'Bank Lampung', shortName: 'Bank Lampung', category: 'Bank Daerah (BPD)' },
  { code: '122', name: 'Bank Kalsel (Kalimantan Selatan)', shortName: 'Bank Kalsel', category: 'Bank Daerah (BPD)' },
  { code: '123', name: 'Bank Kalbar (Kalimantan Barat)', shortName: 'Bank Kalbar', category: 'Bank Daerah (BPD)' },
  { code: '124', name: 'Bank Kaltimtara (Kalimantan Timur & Utara)', shortName: 'Bank Kaltimtara', category: 'Bank Daerah (BPD)' },
  { code: '125', name: 'Bank Kalteng (Kalimantan Tengah)', shortName: 'Bank Kalteng', category: 'Bank Daerah (BPD)' },
  { code: '126', name: 'Bank Sulselbar (Sulawesi Selatan & Barat)', shortName: 'Bank Sulselbar', category: 'Bank Daerah (BPD)' },
  { code: '127', name: 'Bank SulutGo (Sulawesi Utara & Gorontalo)', shortName: 'Bank SulutGo', category: 'Bank Daerah (BPD)' },
  { code: '128', name: 'Bank NTB Syariah', shortName: 'Bank NTB Syariah', category: 'Bank Daerah (BPD)' },
  { code: '129', name: 'Bank BPD Bali', shortName: 'Bank BPD Bali', category: 'Bank Daerah (BPD)' },
  { code: '130', name: 'Bank NTT (Nusa Tenggara Timur)', shortName: 'Bank NTT', category: 'Bank Daerah (BPD)' },
  { code: '131', name: 'Bank Maluku Malut', shortName: 'Bank Maluku Malut', category: 'Bank Daerah (BPD)' },
  { code: '132', name: 'Bank Papua', shortName: 'Bank Papua', category: 'Bank Daerah (BPD)' },
  { code: '133', name: 'Bank Bengkulu', shortName: 'Bank Bengkulu', category: 'Bank Daerah (BPD)' },
  { code: '134', name: 'Bank Sulteng (Sulawesi Tengah)', shortName: 'Bank Sulteng', category: 'Bank Daerah (BPD)' },
  { code: '135', name: 'Bank Sultra (Sulawesi Tenggara)', shortName: 'Bank Sultra', category: 'Bank Daerah (BPD)' },

  // Bank Swasta Nasional Terkemuka
  { code: '014', name: 'Bank Central Asia (BCA)', shortName: 'Bank BCA', category: 'Bank Swasta Nasional' },
  { code: '022', name: 'Bank CIMB Niaga', shortName: 'Bank CIMB Niaga', category: 'Bank Swasta Nasional' },
  { code: '011', name: 'Bank Danamon', shortName: 'Bank Danamon', category: 'Bank Swasta Nasional' },
  { code: '013', name: 'Bank Permata', shortName: 'Bank Permata', category: 'Bank Swasta Nasional' },
  { code: '016', name: 'Maybank Indonesia', shortName: 'Maybank', category: 'Bank Swasta Nasional' },
  { code: '019', name: 'Panin Bank', shortName: 'Panin Bank', category: 'Bank Swasta Nasional' },
  { code: '028', name: 'Bank OCBC NISP', shortName: 'OCBC NISP', category: 'Bank Swasta Nasional' },
  { code: '213', name: 'Bank BTPN / Jenius', shortName: 'Bank BTPN', category: 'Bank Swasta Nasional' },
  { code: '422', name: 'Bank Mega', shortName: 'Bank Mega', category: 'Bank Swasta Nasional' },
  { code: '503', name: 'Bank Neo Commerce (BNC)', shortName: 'Bank Neo', category: 'Bank Swasta Nasional' },
  { code: '542', name: 'Bank Jago', shortName: 'Bank Jago', category: 'Bank Swasta Nasional' },
];
