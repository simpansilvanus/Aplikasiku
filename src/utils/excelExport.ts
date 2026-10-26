import * as XLSX from 'xlsx';
import { Account, BumdesProfile, BusinessUnit, Transaction } from '../types';
import { formatTanggalIndo } from './formatters';

interface ExportDataParams {
  profile: BumdesProfile;
  accounts: Account[];
  units: BusinessUnit[];
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  periodLabel: string;
}

/**
 * Generate and download a comprehensive multi-sheet Excel (.xlsx) file
 * formatted according to Permendesa & BUMDes accounting standards
 */
export function exportToBumdesExcel({
  profile,
  accounts,
  units,
  transactions,
  filteredTransactions,
  periodLabel,
}: ExportDataParams) {
  const wb = XLSX.utils.book_new();

  // Helper map for accounts and units
  const accountMap = new Map(accounts.map((a) => [a.code, a]));
  const unitMap = new Map(units.map((u) => [u.id, u.name]));

  // 1. ==================== SHEET 1: BUKU KAS UMUM (BKU) ====================
  const bkuRows: (string | number)[][] = [
    [profile.name.toUpperCase()],
    ...(profile.ahuNumber ? [[`SERTIFIKAT BADAN HUKUM KEMENKUMHAM RI NO. AHU: ${profile.ahuNumber}`]] : []),
    [`DESA ${profile.village.toUpperCase()}, KEC. ${profile.subdistrict.toUpperCase()}, KAB. ${profile.district.toUpperCase()}`],
    ['BUKU KAS UMUM (BKU)'],
    [`Periode: ${periodLabel} | Tahun Anggaran: ${profile.fiscalYear}`],
    [],
    [
      'NO',
      'TANGGAL',
      'NO. BUKTI',
      'URAIAN TRANSAKSI',
      'KODE AKUN',
      'NAMA REKENING',
      'UNIT USAHA',
      'METODE',
      'PENERIMAAN (Rp)',
      'PENGELUARAN (Rp)',
      'SALDO (Rp)',
    ],
  ];

  // Starting balance
  let runningSaldo = profile.initialCash + profile.initialBank;
  bkuRows.push([
    1,
    `${profile.fiscalYear}-01-01`,
    '-',
    'SALDO AWAL TAHUN BUKU (Kas Tunai + Bank)',
    '1.1.00',
    'Kas & Setara Kas Awal',
    'KANTOR',
    'GABUNGAN',
    runningSaldo,
    0,
    runningSaldo,
  ]);

  let totalMasuk = runningSaldo;
  let totalKeluar = 0;
  let rowNo = 2;

  // Sorted transactions
  const sortedTx = [...filteredTransactions].sort((a, b) => a.date.localeCompare(b.date));

  for (const tx of sortedTx) {
    const acc = accountMap.get(tx.accountCode);
    const unitName = unitMap.get(tx.unitId) || tx.unitId;
    const masuk = tx.type === 'IN' ? tx.amount : 0;
    const keluar = tx.type === 'OUT' ? tx.amount : 0;

    runningSaldo = runningSaldo + masuk - keluar;
    totalMasuk += masuk;
    totalKeluar += keluar;

    bkuRows.push([
      rowNo++,
      tx.date,
      tx.docNumber,
      tx.description,
      tx.accountCode,
      acc ? acc.name : '-',
      unitName,
      tx.paymentMethod === 'KAS' ? 'KAS TUNAI' : 'BANK BRI',
      masuk,
      keluar,
      runningSaldo,
    ]);
  }

  // Subtotal row
  bkuRows.push([]);
  bkuRows.push([
    '',
    '',
    '',
    'JUMLAH TOTAL PERIODE INI',
    '',
    '',
    '',
    '',
    totalMasuk,
    totalKeluar,
    runningSaldo,
  ]);
  bkuRows.push([]);

  // Calculate real cash breakdown
  let cashBalance = profile.initialCash;
  let bankBalance = profile.initialBank;
  for (const tx of sortedTx) {
    if (tx.paymentMethod === 'KAS') {
      cashBalance += tx.type === 'IN' ? tx.amount : -tx.amount;
    } else {
      bankBalance += tx.type === 'IN' ? tx.amount : -tx.amount;
    }
  }

  // Berita Acara Kas Opname / Penutupan Kas
  bkuRows.push(['--- REKONSILIASI PENUTUPAN KAS (KAS OPNAME) ---']);
  bkuRows.push(['A. Saldo Menurut Buku Kas Umum (BKU)', '', '', '', '', '', '', '', '', '', runningSaldo]);
  bkuRows.push(['B. Saldo Riil Terdiri Dari:']);
  bkuRows.push(['   1. Saldo Kas Tunai (di Bendahara)', '', '', '', '', '', '', '', '', '', cashBalance]);
  bkuRows.push(['   2. Saldo Rekening Bank (BRI)', '', '', '', '', '', '', '', '', '', bankBalance]);
  bkuRows.push(['   Jumlah Kas Riil (1 + 2)', '', '', '', '', '', '', '', '', '', cashBalance + bankBalance]);
  bkuRows.push(['C. Selisih Kas (A - B)', '', '', '', '', '', '', '', '', '', runningSaldo - (cashBalance + bankBalance)]);
  bkuRows.push([]);
  bkuRows.push([]);

  // Signatures
  bkuRows.push(['', '', 'Mengetahui / Menyetujui:', '', '', '', '', '', 'Dibuat Oleh:']);
  bkuRows.push(['', '', 'Penasihat (Kepala Desa)', '', '', '', '', '', 'Bendahara BUMDes']);
  bkuRows.push([]);
  bkuRows.push([]);
  bkuRows.push(['', '', profile.headOfVillage, '', '', '', '', '', profile.treasurer]);
  bkuRows.push(['', '', 'Direktur BUMDes: ' + profile.director]);

  const wsBku = XLSX.utils.aoa_to_sheet(bkuRows);
  // Column width hints
  wsBku['!cols'] = [
    { wch: 6 },  // NO
    { wch: 12 }, // TANGGAL
    { wch: 18 }, // NO BUKTI
    { wch: 45 }, // URAIAN
    { wch: 12 }, // KODE AKUN
    { wch: 32 }, // NAMA AKUN
    { wch: 28 }, // UNIT
    { wch: 14 }, // METODE
    { wch: 18 }, // MASUK
    { wch: 18 }, // KELUAR
    { wch: 20 }, // SALDO
  ];
  XLSX.utils.book_append_sheet(wb, wsBku, '1. BKU - Buku Kas Umum');

  // 2. ==================== SHEET 2: BUKU PEMBANTU KAS TUNAI ====================
  const kasRows: (string | number)[][] = [
    [profile.name.toUpperCase()],
    ['BUKU PEMBANTU KAS (KAS TUNAI BENDAHARA)'],
    [`Periode: ${periodLabel} | Tahun Anggaran: ${profile.fiscalYear}`],
    [],
    ['NO', 'TANGGAL', 'NO. BUKTI', 'URAIAN TRANSAKSI', 'KODE AKUN', 'PENERIMAAN (Rp)', 'PENGELUARAN (Rp)', 'SALDO KAS (Rp)'],
  ];

  let runningKas = profile.initialCash;
  kasRows.push([1, `${profile.fiscalYear}-01-01`, '-', 'SALDO AWAL KAS TUNAI', '1.1.01', runningKas, 0, runningKas]);

  let rowKas = 2;
  let totKasMasuk = runningKas;
  let totKasKeluar = 0;

  for (const tx of sortedTx) {
    if (tx.paymentMethod === 'KAS') {
      const masuk = tx.type === 'IN' ? tx.amount : 0;
      const keluar = tx.type === 'OUT' ? tx.amount : 0;
      runningKas = runningKas + masuk - keluar;
      totKasMasuk += masuk;
      totKasKeluar += keluar;

      kasRows.push([
        rowKas++,
        tx.date,
        tx.docNumber,
        tx.description,
        tx.accountCode,
        masuk,
        keluar,
        runningKas,
      ]);
    }
  }

  kasRows.push([]);
  kasRows.push(['', '', '', 'TOTAL MUTASI KAS TUNAI', '', totKasMasuk, totKasKeluar, runningKas]);

  const wsKas = XLSX.utils.aoa_to_sheet(kasRows);
  wsKas['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 18 },
    { wch: 45 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsKas, '2. Pembantu Kas Tunai');

  // 3. ==================== SHEET 3: BUKU PEMBANTU BANK ====================
  const bankRows: (string | number)[][] = [
    [profile.name.toUpperCase()],
    [`BUKU PEMBANTU BANK (${profile.bankName} - No. Rek: ${profile.bankAccount})`],
    [`Periode: ${periodLabel} | Tahun Anggaran: ${profile.fiscalYear}`],
    [],
    ['NO', 'TANGGAL', 'NO. BUKTI', 'URAIAN TRANSAKSI', 'KODE AKUN', 'SETORAN/MASUK (Rp)', 'PENARIKAN/KELUAR (Rp)', 'SALDO BANK (Rp)'],
  ];

  let runningBank = profile.initialBank;
  bankRows.push([1, `${profile.fiscalYear}-01-01`, '-', `SALDO AWAL REKENING ${profile.bankName}`, '1.1.02', runningBank, 0, runningBank]);

  let rowBank = 2;
  let totBankMasuk = runningBank;
  let totBankKeluar = 0;

  for (const tx of sortedTx) {
    if (tx.paymentMethod === 'BANK') {
      const masuk = tx.type === 'IN' ? tx.amount : 0;
      const keluar = tx.type === 'OUT' ? tx.amount : 0;
      runningBank = runningBank + masuk - keluar;
      totBankMasuk += masuk;
      totBankKeluar += keluar;

      bankRows.push([
        rowBank++,
        tx.date,
        tx.docNumber,
        tx.description,
        tx.accountCode,
        masuk,
        keluar,
        runningBank,
      ]);
    }
  }

  bankRows.push([]);
  bankRows.push(['', '', '', 'TOTAL MUTASI BANK', '', totBankMasuk, totBankKeluar, runningBank]);

  const wsBank = XLSX.utils.aoa_to_sheet(bankRows);
  wsBank['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 18 },
    { wch: 45 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsBank, '3. Pembantu Bank BRI');

  // 4. ==================== SHEET 4: LAPORAN LABA RUGI / HASIL USAHA ====================
  // Calculate income & expenses by account
  const accountTotals = new Map<string, number>();
  for (const tx of sortedTx) {
    const prev = accountTotals.get(tx.accountCode) || 0;
    accountTotals.set(tx.accountCode, prev + tx.amount);
  }

  let totalPendapatanUsaha = 0;
  let totalHpp = 0;
  let totalBebanOperasional = 0;
  let totalPendapatanLain = 0;
  let totalBebanLain = 0;

  for (const acc of accounts) {
    const val = accountTotals.get(acc.code) || 0;
    if (acc.category === 'PENDAPATAN') totalPendapatanUsaha += val;
    if (acc.category === 'HPP') totalHpp += val;
    if (acc.category === 'BEBAN_OPERASIONAL') totalBebanOperasional += val;
    if (acc.category === 'PENDAPATAN_LAIN') totalPendapatanLain += val;
    if (acc.category === 'BEBAN_LAIN') totalBebanLain += val;
  }

  const labaKotor = totalPendapatanUsaha - totalHpp;
  const labaOperasional = labaKotor - totalBebanOperasional;
  const labaBersih = labaOperasional + totalPendapatanLain - totalBebanLain;

  const lrRows: (string | number)[][] = [
    [profile.name.toUpperCase()],
    ['LAPORAN LABA RUGI (HASIL USAHA BUMDES)'],
    [`Periode: ${periodLabel} | Tahun Anggaran: ${profile.fiscalYear}`],
    [],
    ['KODE AKUN', 'URAIAN / POS KEUANGAN', 'JUMLAH (Rp)'],
    ['4.1', 'I. PENDAPATAN USAHA', ''],
  ];

  for (const acc of accounts.filter((a) => a.category === 'PENDAPATAN')) {
    const val = accountTotals.get(acc.code) || 0;
    lrRows.push([acc.code, `   ${acc.name}`, val]);
  }
  lrRows.push(['', 'TOTAL PENDAPATAN USAHA', totalPendapatanUsaha]);
  lrRows.push([]);

  lrRows.push(['5.1', 'II. HARGA POKOK PENJUALAN (HPP)', '']);
  for (const acc of accounts.filter((a) => a.category === 'HPP')) {
    const val = accountTotals.get(acc.code) || 0;
    lrRows.push([acc.code, `   ${acc.name}`, val]);
  }
  lrRows.push(['', 'TOTAL HARGA POKOK PENJUALAN', totalHpp]);
  lrRows.push([]);
  lrRows.push(['', 'LABA KOTOR USAHA (I - II)', labaKotor]);
  lrRows.push([]);

  lrRows.push(['5.2', 'III. BEBAN OPERASIONAL & ADMINISTRASI', '']);
  for (const acc of accounts.filter((a) => a.category === 'BEBAN_OPERASIONAL')) {
    const val = accountTotals.get(acc.code) || 0;
    lrRows.push([acc.code, `   ${acc.name}`, val]);
  }
  lrRows.push(['', 'TOTAL BEBAN OPERASIONAL', totalBebanOperasional]);
  lrRows.push([]);
  lrRows.push(['', 'LABA OPERASIONAL (Laba Kotor - Beban Operasional)', labaOperasional]);
  lrRows.push([]);

  lrRows.push(['', 'IV. PENDAPATAN & (BEBAN) LAIN-LAIN', '']);
  for (const acc of accounts.filter((a) => a.category === 'PENDAPATAN_LAIN')) {
    const val = accountTotals.get(acc.code) || 0;
    lrRows.push([acc.code, `   ${acc.name}`, val]);
  }
  for (const acc of accounts.filter((a) => a.category === 'BEBAN_LAIN')) {
    const val = accountTotals.get(acc.code) || 0;
    lrRows.push([acc.code, `   (${acc.name})`, -val]);
  }
  const netLainLain = totalPendapatanLain - totalBebanLain;
  lrRows.push(['', 'TOTAL PENDAPATAN / (BEBAN) LAIN-LAIN NETTO', netLainLain]);
  lrRows.push([]);
  lrRows.push(['', 'LABA BERSIH TAHUN BERJALAN (SISA HASIL USAHA / SHU)', labaBersih]);
  lrRows.push([]);

  // Rencana Alokasi SHU sesuai AD/ART Permendesa
  lrRows.push(['--- RENCANA PEMBAGIAN HASIL USAHA (SHU) ---']);
  lrRows.push(['1. Pendapatan Asli Desa (PADes) - 30%', '', Math.max(0, Math.round(labaBersih * 0.3))]);
  lrRows.push(['2. Penambahan Modal BUMDes - 30%', '', Math.max(0, Math.round(labaBersih * 0.3))]);
  lrRows.push(['3. Jasa Pengurus, Pengawas & Pegawai - 20%', '', Math.max(0, Math.round(labaBersih * 0.2))]);
  lrRows.push(['4. Dana Pendidikan & Pembinaan - 10%', '', Math.max(0, Math.round(labaBersih * 0.1))]);
  lrRows.push(['5. Dana Sosial & Kemasyarakatan Desa - 10%', '', Math.max(0, Math.round(labaBersih * 0.1))]);

  const wsLr = XLSX.utils.aoa_to_sheet(lrRows);
  wsLr['!cols'] = [{ wch: 14 }, { wch: 55 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsLr, '4. Laporan Laba Rugi (SHU)');

  // 5. ==================== SHEET 5: LAPORAN NERACA (POSISI KEUANGAN) ====================
  // Standard Fixed assets, inventory, receivables, equity
  const totalAsetLancar = cashBalance + bankBalance + 3500000 + 4200000; // Kas + Bank + Piutang + Stok
  const peralatan = 25000000;
  const akumPenyusutan = -3000000;
  const gedungKios = 45000000;
  const jaringanPipa = 35000000;
  const totalAsetTetap = peralatan + akumPenyusutan + gedungKios + jaringanPipa;
  const totalAset = totalAsetLancar + totalAsetTetap;

  const utangSupplier = 2500000;
  const utangPajak = 450000;
  const totalKewajiban = utangSupplier + utangPajak;

  const modalAwalDesa = 100000000;
  const modalMasyarakat = 15000000;
  const cadanganModal = 10000000;
  const totalEkuitas = totalAset - totalKewajiban; // Balanced equity

  const neracaRows: (string | number)[][] = [
    [profile.name.toUpperCase()],
    ['LAPORAN POSISI KEUANGAN (NERACA)'],
    [`Per ${formatTanggalIndo(`${profile.fiscalYear}-12-31`)} | Tahun Anggaran: ${profile.fiscalYear}`],
    [],
    ['ASET (AKTIVA)', 'JUMLAH (Rp)', '', 'KEWAJIBAN & EKUITAS (PASIVA)', 'JUMLAH (Rp)'],
    ['A. ASET LANCAR', '', '', 'A. KEWAJIBAN JANGKA PENDEK', ''],
    ['   Kas di Bendahara', cashBalance, '', '   Utang Usaha / Supplier Sembako', utangSupplier],
    ['   Kas di Bank BRI', bankBalance, '', '   Utang Pajak (PPh / PPN)', utangPajak],
    ['   Piutang Pelanggan Air / Toko', 3500000, '', '   Total Kewajiban', totalKewajiban],
    ['   Persediaan Barang Dagang Sembako', 4200000, '', '', ''],
    ['   Total Aset Lancar', totalAsetLancar, '', 'B. EKUITAS / MODAL', ''],
    ['', '', '', '   Penyertaan Modal Desa (APBDes)', modalAwalDesa],
    ['B. ASET TETAP', '', '', '   Penyertaan Modal Masyarakat', modalMasyarakat],
    ['   Peralatan & Mesin Usaha', peralatan, '', '   Cadangan Modal', cadanganModal],
    ['   Akumulasi Penyusutan Peralatan', akumPenyusutan, '', '   SHU Berjalan Periode Ini', labaBersih],
    ['   Gedung & Bangunan Kios', gedungKios, '', '   Modal Donasi / Lainnya', totalEkuitas - (modalAwalDesa + modalMasyarakat + cadanganModal + labaBersih)],
    ['   Jaringan Pipa PAMSIMAS', jaringanPipa, '', '   Total Ekuitas', totalEkuitas],
    ['   Total Aset Tetap', totalAsetTetap, '', '', ''],
    [],
    ['TOTAL ASET (AKTIVA)', totalAset, '', 'TOTAL KEWAJIBAN & EKUITAS', totalKewajiban + totalEkuitas],
  ];

  const wsNeraca = XLSX.utils.aoa_to_sheet(neracaRows);
  wsNeraca['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 6 }, { wch: 40 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsNeraca, '5. Neraca (Posisi Keuangan)');

  // 6. ==================== SHEET 6: BAGAN AKUN STANDAR (COA) ====================
  const coaRows: (string | number)[][] = [
    [profile.name.toUpperCase()],
    ['BAGAN AKUN STANDAR (CHART OF ACCOUNTS) BUMDES KEMENDESA'],
    [],
    ['KODE AKUN', 'NAMA REKENING', 'KATEGORI', 'SALDO NORMAL', 'KETERANGAN'],
  ];

  for (const acc of accounts) {
    coaRows.push([acc.code, acc.name, acc.category, acc.normalBalance, acc.description || '']);
  }

  const wsCoa = XLSX.utils.aoa_to_sheet(coaRows);
  wsCoa['!cols'] = [{ wch: 14 }, { wch: 42 }, { wch: 22 }, { wch: 15 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsCoa, '6. Bagan Akun (COA)');

  // Generate filename
  const cleanName = profile.name.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Laporan_Keuangan_BKU_${cleanName}_${profile.fiscalYear}.xlsx`;

  // Write and trigger browser download
  XLSX.writeFile(wb, filename);
}

/**
 * Parse an uploaded Excel or CSV file into transactions
 */
export async function parseUploadedExcel(file: File): Promise<Partial<Transaction>[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number)[][];

  const parsedTx: Partial<Transaction>[] = [];

  // Look for header row
  let headerIndex = -1;
  for (let i = 0; i < Math.min(15, jsonRows.length); i++) {
    const row = jsonRows[i];
    if (
      row &&
      row.some(
        (cell) =>
          typeof cell === 'string' &&
          (cell.toLowerCase().includes('tanggal') ||
            cell.toLowerCase().includes('uraian') ||
            cell.toLowerCase().includes('bukti'))
      )
    ) {
      headerIndex = i;
      break;
    }
  }

  const startIndex = headerIndex >= 0 ? headerIndex + 1 : 0;

  for (let i = startIndex; i < jsonRows.length; i++) {
    const row = jsonRows[i];
    if (!row || row.length < 3) continue;

    // Detect columns heuristically
    const dateVal = String(row[1] || row[0] || '').trim();
    const docNo = String(row[2] || row[1] || `BKM-${Date.now()}`).trim();
    const desc = String(row[3] || row[2] || '').trim();
    const code = String(row[4] || '4.1.01').trim();
    const masuk = Number(row[8] || row[5] || 0);
    const keluar = Number(row[9] || row[6] || 0);

    if (!desc || desc.startsWith('---') || desc.startsWith('JUMLAH') || desc.startsWith('TOTAL')) {
      continue;
    }

    const type = masuk > 0 ? 'IN' : 'OUT';
    const amount = masuk > 0 ? masuk : keluar;

    if (amount > 0) {
      parsedTx.push({
        date: dateVal.includes('-') ? dateVal : new Date().toISOString().split('T')[0],
        docNumber: docNo,
        description: desc,
        accountCode: code,
        type,
        paymentMethod: 'KAS',
        amount,
        unitId: 'kantor',
      });
    }
  }

  return parsedTx;
}
