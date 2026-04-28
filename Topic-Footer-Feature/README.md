# Gasing Topic Footer Feature

**Gasing Topic Footer Feature** adalah sebuah modul atau *Theme Component* terpisah (standalone) yang berfungsi untuk menampilkan *Action Bar* interaktif di bagian bawah artikel atau topik pada Discourse. 

Komponen ini dirancang secara modular agar sangat mudah diimplementasikan, disalin (copy-paste), atau dipasang di berbagai *Theme Component* Discourse lainnya di ekosistem Gasing Circle (seperti Komonitas, Gasing News, dll).

## 🌟 Fitur Utama
- **Statistik Topik**: Menampilkan jumlah Suka (Likes), Komentar (Replies), dan Dilihat (Views) di sisi kiri.
- **Aksi Cepat**: Menampilkan tombol CTA (Call-to-Action) **"↩ Balas"** berwarna biru, beserta ikon aksi **Bookmark** dan **Share** di sisi kanan.
- **Desain Modern & Responsif**: Menggunakan Flexbox untuk memposisikan baris aksi secara rapi dan profesional, sudah disesuaikan dengan *mockup* referensi Gasing Circle.
- **Independen**: Memiliki modul ikon SVG (`gc-icons.js`) sendiri, sehingga tidak bergantung pada font ikon eksternal.

## 📂 Struktur Direktori

```text
Topic-Footer-Feature/
├── about.json                  # Deklarasi standar Discourse Theme Component
├── common/
│   └── common.scss             # File styling utama (.gc-topic-footer-bar)
└── javascripts/
    └── discourse/
        └── lib/
            ├── gc-icons.js        # Kumpulan SVG Icon murni (Heart, Chat, Eye, Bookmark, dll)
            └── gc-topic-footer.js # File Logika (Fungsi untuk merender HTML string footer)
```

## 🛠️ Panduan Implementasi di Project Lain

Anda bisa memasukkan fitur ini ke project Theme Component lain (misalnya **Komonitas**) dengan 2 langkah mudah:

### 1. Pindahkan / Copy File
Pindahkan atau *copy* file-file inti dari folder ini ke dalam direktori project tujuan Anda:
- Copy `javascripts/discourse/lib/gc-topic-footer.js` & `gc-icons.js` ke folder `javascripts/discourse/lib/` di project tujuan.
- Copy isi file `common/common.scss` (atau *import* sebagai `topic-footer.scss`) ke dalam file `common/common.scss` di project tujuan.

### 2. Panggil Fungsinya di Code Anda
Di dalam script tempat Anda menyusun atau merender layout topik (misal: `gc-main-category-layout.js`), lakukan **import** modul tersebut dan panggil fungsi `buildTopicFooterHTML()`:

```javascript
// 1. Import fungsinya di bagian paling atas
import { buildTopicFooterHTML } from "../lib/gc-topic-footer";

// 2. Di dalam fungsi render / builder layout Anda:
export function renderDetailTopik(topic, firstPost) {
  
  // Konten utama artikel Anda
  let htmlArtikel = `<div class="artikel-konten">${topic.excerpt}</div>`;
  
  // Membangun Action Bar Footer secara otomatis
  let footerActionBar = buildTopicFooterHTML(topic, firstPost);

  // Kembalikan gabungan HTML
  return `
    <div class="gc-artikel-wrapper">
      ${htmlArtikel}
      
      <!-- Render Action Bar di bawah artikel -->
      ${footerActionBar}
    </div>
  `;
}
```

## 🎨 Penyesuaian Warna (CSS Variables)

Komponen ini bergantung pada variabel warna CSS berikut yang umumnya sudah ada di root project Anda. Jika belum, Anda dapat menyesuaikannya:
- `--gc-blue-primary`: Warna utama tombol "Balas"
- `--gc-blue-dark`: Warna tombol "Balas" saat *hover*
- `--gc-blue-light`: Warna latar ikon saat aktif/hover
- `--gc-text-muted`: Warna teks/ikon abu-abu
- `--gc-divider`: Warna garis pembatas bawah

*Dibuat oleh Tim Gasing Circle untuk kemudahan dan modularitas antarmuka Discourse.*
