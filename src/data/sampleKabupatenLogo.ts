// Contoh Lambang Daerah Pemerintah Kabupaten (Format SVG Data URL)
// Menampilkan Perisai Pemda dengan Bintang Emas, Padi & Kapas, Rantai Persatuan, dan Pita Daerah

export const SAMPLE_KABUPATEN_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 280" width="240" height="280">
  <!-- Perisai Dasar -->
  <path d="M 120 10 L 220 50 C 220 170 170 230 120 270 C 70 230 20 170 20 50 Z" 
        fill="#0b6e4f" stroke="#e0a920" stroke-width="7" />
  
  <!-- Lapisan Dalam Perisai -->
  <path d="M 120 22 L 208 58 C 208 162 165 218 120 254 C 75 218 32 162 32 58 Z" 
        fill="#f8fafc" stroke="#334155" stroke-width="2" />
        
  <!-- Bidang Langit & Gunung -->
  <path d="M 40 125 Q 120 110 200 125 L 200 180 C 170 215 130 240 120 245 C 110 240 70 215 40 180 Z" 
        fill="#38bdf8" />
  <polygon points="120,80 70,145 170,145" fill="#047857" stroke="#065f46" stroke-width="2" />
  <polygon points="120,80 105,145 135,145" fill="#10b981" />
  
  <!-- Gelombang Air / Laut -->
  <path d="M 50 160 Q 80 150 120 160 T 190 160 L 190 175 Q 155 185 120 175 T 50 175 Z" fill="#0284c7" />
  <path d="M 60 175 Q 90 168 120 175 T 180 175 L 175 190 Q 145 198 120 190 T 65 190 Z" fill="#0369a1" />

  <!-- Bintang Segi Lima Emas di Puncak -->
  <polygon points="120,32 125,47 141,47 128,56 133,71 120,62 107,71 112,56 99,47 115,47" 
           fill="#f59e0b" stroke="#b45309" stroke-width="1.5" />

  <!-- Padi (Kiri) -->
  <g fill="#eab308" stroke="#ca8a04" stroke-width="1">
    <ellipse cx="65" cy="85" rx="5" ry="8" transform="rotate(-25 65 85)" />
    <ellipse cx="58" cy="100" rx="5" ry="8" transform="rotate(-15 58 100)" />
    <ellipse cx="55" cy="118" rx="5" ry="8" transform="rotate(-5 55 118)" />
    <ellipse cx="56" cy="136" rx="5" ry="8" transform="rotate(10 56 136)" />
    <ellipse cx="62" cy="154" rx="5" ry="8" transform="rotate(25 62 154)" />
    <ellipse cx="73" cy="170" rx="5" ry="8" transform="rotate(40 73 170)" />
    <ellipse cx="88" cy="184" rx="5" ry="8" transform="rotate(55 88 184)" />
  </g>

  <!-- Kapas (Kanan) -->
  <g fill="#ffffff" stroke="#15803d" stroke-width="2">
    <circle cx="175" cy="88" r="7" />
    <circle cx="182" cy="106" r="7" />
    <circle cx="184" cy="125" r="7" />
    <circle cx="181" cy="144" r="7" />
    <circle cx="173" cy="162" r="7" />
    <circle cx="158" cy="178" r="7" />
    <circle cx="140" cy="190" r="7" />
  </g>
  <g fill="#15803d">
    <polygon points="175,88 171,94 179,94" />
    <polygon points="182,106 178,112 186,112" />
    <polygon points="184,125 180,131 188,131" />
    <polygon points="181,144 177,150 185,150" />
    <polygon points="173,162 169,168 177,168" />
  </g>

  <!-- Pita Kuning Semboyan Daerah di Bawah -->
  <path d="M 45 210 Q 120 230 195 210 L 205 235 Q 120 255 35 235 Z" 
        fill="#f59e0b" stroke="#b45309" stroke-width="2" />
  <path d="M 35 235 L 20 220 L 45 210 Z" fill="#d97706" />
  <path d="M 205 235 L 220 220 L 195 210 Z" fill="#d97706" />
  
  <text x="120" y="228" font-family="Arial, sans-serif" font-size="11" font-weight="bold" 
        text-anchor="middle" fill="#78350f" letter-spacing="1">
    KABUPATEN MAMASA
  </text>
</svg>
`)}`;
