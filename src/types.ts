export type TransactionType = 'IN' | 'OUT'; // IN: Penerimaan, OUT: Pengeluaran
export type PaymentMethod = 'KAS' | 'BANK'; // KAS: Tunai di Bendahara, BANK: Rekening Bank BUMDes

export interface Account {
  code: string;
  name: string;
  category: 
    | 'ASET_LANCAR' 
    | 'ASET_TETAP' 
    | 'KEWAJIBAN' 
    | 'EKUITAS' 
    | 'PENDAPATAN' 
    | 'HPP' 
    | 'BEBAN_OPERASIONAL' 
    | 'BEBAN_LAIN' 
    | 'PENDAPATAN_LAIN';
  normalBalance: 'DEBIT' | 'KREDIT';
  description?: string;
}

export interface BusinessUnit {
  id: string;
  name: string;
  manager: string;
  code: string;
}

export interface BumdesProfile {
  name: string;
  village: string;
  subdistrict: string;
  district: string;
  province: string;
  director: string;
  treasurer: string;
  supervisor: string;
  headOfVillage: string; // Penasihat / Kepala Desa
  bankName: string;
  bankAccount: string;
  fiscalYear: number;
  initialCash: number; // Saldo awal kas tunai
  initialBank: number; // Saldo awal bank
  logoUrl?: string; // URL atau base64 gambar Logo BUMDes
  regencyLogoUrl?: string; // URL atau base64 gambar Logo Kabupaten / Lambang Daerah Pemkab
  ahuNumber?: string; // Nomor Sertifikat Badan Hukum Kemenkumham (No. AHU)
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  docNumber: string; // e.g. BKM-2026/01/001, BKK-2026/01/001
  description: string;
  accountCode: string; // Akun terkait (Pendapatan/Beban/Aset/dll)
  type: TransactionType;
  paymentMethod: PaymentMethod;
  amount: number;
  unitId: string; // ID Unit Usaha atau 'kantor'
  recipientOrPayer?: string; // Diterima dari / Dibayarkan kepada
  taxType?: 'NONE' | 'PPH21' | 'PPH23' | 'PPN';
  taxAmount?: number;
  notes?: string;
  createdAt: string;
}

export type ActiveTab = 'bku' | 'cash_bank' | 'income_statement' | 'balance_sheet' | 'transactions' | 'accounts';
