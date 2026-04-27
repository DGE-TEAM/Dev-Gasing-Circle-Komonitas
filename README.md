# Gasing Circle - Unified Community Layout

**Versi Component:** Unified  
**Author:** Digital Gasing Edukasi Team  
**Platform:** Discourse Theme Component

---

The **Unified Community Layout** adalah satu Discourse Theme Component yang mengintegrasikan tiga area forum Gasing Circle dengan layout kustom, dashboard, dan hero banner masing-masing — dalam satu proyek yang kohesif.

## 🚀 Fitur Utama

Component ini mengelola tiga area forum dengan layout yang berbeda:

### 1. Main Category Dashboard — `/c/general`

Menggantikan tampilan default Discourse di halaman kategori utama (`/c/general`) dengan dashboard komunitas interaktif.

- **Trending & Terbaru** — Feed topik live diambil via Discourse API
- **Panduan Komunitas** — Accordion interaktif yang memuat topik dari tag `panduan`
- **Challenge Bulan Ini** — Section dinamis dengan fire-level icons berdasarkan jumlah likes
- Dikendalikan oleh: `gc-main-category-layout.js` + connector `discovery-list-container-top/gc-main-category-layout.hbs`

### 2. Forum Category Layout — `/c/general/forum`

Custom hero banner dan grid sub-kategori saat pengguna membuka hub forum utama.

- **Badge unread/new** per sub-kategori, diambil real-time dari `TopicTrackingState` Discourse
- Sub-kategori dikelompokkan berdasarkan grup: *Konsep Dasar Matematika* dan *Diskusi Umum*
- Konfigurasi ikon, warna, dan gradien per sub-kategori terpusat di `gc-category-config.js`
- Dikendalikan oleh: `gc-forum-layout.js` + connector `discovery-list-container-top/gc-forum-layout.hbs`

### 3. Forum SubCategory Layout — `/c/general/forum/<slug>`

Hero banner visual dan filter bar kustom untuk setiap halaman sub-kategori.

- **Hero banner** dengan dekorasi simbol matematika (bisa dimatikan via settings)
- **Breadcrumb navigation**: `Komonitas › Forum › <Nama Kategori>`
- **Filter pills**: Latest, Most Replies, Trending
- **Search bar** inline untuk memfilter topik secara real-time tanpa navigasi
- **Tombol "Buat Thread"** yang langsung menarget `category_id` yang benar
- Dikendalikan oleh: `gasing-layout.js` + `gasing-card-enhancer.js`

---

## 📂 Struktur Direktori

```text
Unified-Theme/
├── about.json
├── settings.yml
├── README.md
├── common/
│   ├── common.scss             # Semua styling untuk ketiga layout (±51 KB)
│   └── head_tag.html           # Custom head tag / external fonts
├── locales/
│   └── en.yml                  # Terjemahan & label settings
└── javascripts/discourse/
    ├── api-initializers/
    │   ├── gasing-layout.js            # SubCategory: routing, body class, filter bar, card enhancer
    │   ├── gasing-card-enhancer.js     # Enhances topic-list-item cards di halaman sub-kategori
    │   └── gc-main-category-layout.js  # Main Dashboard: routing + fetch API
    ├── initializers/
    │   └── gc-forum-layout.js          # Forum Layout: routing, DOM render, TopicTrackingState
    ├── lib/
    │   └── gc-category-config.js       # Konfigurasi terpusat: ikon, warna, slug, group per sub-kategori
    ├── connectors/
    │   ├── above-main-container/
    │   │   ├── gasing-hero-banner.js   # Glimmer component: hero banner sub-kategori
    │   │   └── gasing-hero-banner.hbs  # Template hero banner
    │   ├── bread-crumbs/
    │   │   ├── gasing-filter-bar.js    # Glimmer component: filter bar (diinjeksi via JS)
    │   │   └── gasing-filter-bar.hbs
    │   └── discovery-list-container-top/
    │       └── gc-main-category-layout.js  # Outlet router: Main Dashboard atau Forum Layout
    └── templates/connectors/
        └── discovery-list-container-top/
            ├── gc-main-category-layout.hbs # Template dashboard utama
            └── gc-forum-layout.hbs         # Template forum hub grid
```

---

## 🧠 Routing & Isolasi Layout

Karena ketiga layout menarget URL yang berdekatan, isolasi dilakukan melalui **body class** dan **CSS scoping**:

| Layout | URL Target | Body Class | File Utama |
|---|---|---|---|
| Main Dashboard | `/c/general` (strict) | `.gc-community-active` | `gc-main-category-layout.js` |
| Forum Hub | `/c/general/forum` (exact) | `.gc-forum-active` | `gc-forum-layout.js` |
| SubCategory | URL dari `target_categories` setting | `.gasing-layout-active` | `gasing-layout.js` |

Semua CSS menggunakan body class tersebut sebagai parent selector sehingga styling tiap layout **tidak saling bocor**.

---

## 📦 Sub-Kategori yang Didukung

Dikonfigurasi di `gc-category-config.js` dan `settings.yml`:

| Slug | Grup | Gradien Default |
|---|---|---|
| `mengenal-bilangan` | Konsep Dasar Matematika | `#4C1D95` → `#8B5CF6` |
| `bakalkubagi` | Konsep Dasar Matematika | `#065F46` → `#10B981` |
| `bilangan-bulat` | Konsep Dasar Matematika | `#78350F` → `#F59E0B` |
| `pede` | Konsep Dasar Matematika | `#9D174D` → `#EC4899` |
| `ruang-guru` | Diskusi Umum | `#312E81` → `#6366F1` |
| `topik-santai` | Diskusi Umum | `#7C2D12` → `#F97316` |

---

## ⚙️ Konfigurasi (Settings)

Dapat diubah dari **Discourse Admin › Customize › Themes**:

### Ikon Sub-Kategori (Upload)
| Setting | Keterangan |
|---|---|
| `mengenal_bilangan_icon` | Ikon untuk sub-kategori Mengenal Bilangan |
| `bakalkubagi_icon` | Ikon untuk sub-kategori BakalKuBagi |
| `pede_icon` | Ikon untuk sub-kategori PEDE |
| `bilangan_bulat_icon` | Ikon untuk sub-kategori Bilangan Bulat |
| `ruang_guru_icon` | Ikon untuk sub-kategori Ruang Guru |
| `topik_santai_icon` | Ikon untuk sub-kategori Topik Santai |

### Gradien Banner per Sub-Kategori
Setiap sub-kategori memiliki pasangan `_gradient_start` dan `_gradient_end` (format hex, contoh: `#BE185D`).

### Pengaturan Global
| Setting | Default | Keterangan |
|---|---|---|
| `target_categories` | `general/mengenal-bilangan\|general/bakalkubagi\|...` | Slug sub-kategori yang menggunakan SubCategory Layout |
| `banner_gradient_start` | `#3DD9A8` | Warna gradien kiri hero banner |
| `banner_gradient_end` | `#1FB98A` | Warna gradien kanan hero banner |
| `banner_text_color` | `#FFFFFF` | Warna teks judul di banner |
| `primary_accent_color` | `#2563EB` | Warna tombol dan link aktif |
| `show_math_decoration` | `true` | Tampilkan simbol matematika di background banner |
| `pin_icon_color` | `#6366F1` | Warna indikator topik yang di-pin |

---

## 🛠️ Development Lokal

Gunakan Discourse Theme CLI untuk development:

```bash
# Masuk ke direktori component
cd "Unified-Theme"

# Jalankan watcher (satu perintah untuk semua layout)
discourse_theme watch .
```

> Dengan project yang sudah tergabung menjadi satu, kamu hanya perlu menjalankan **satu watcher**, tidak perlu tiga seperti sebelumnya.

### Menambah Sub-Kategori Baru

1. Tambahkan entri baru di `gc-category-config.js` (ikon, warna palette, gradien, grup)
2. Tambahkan setting ikon dan gradien di `settings.yml`
3. Tambahkan slug ke nilai default `target_categories` di `settings.yml`
4. Tambahkan terjemahan di `locales/en.yml` jika diperlukan

---

## 🔗 Referensi

- [Discourse Theme Component Guide](https://meta.discourse.org/t/beginners-guide-to-using-discourse-themes/91966)
- [Discourse Plugin Outlet Reference](https://meta.discourse.org/t/list-of-plugin-outlet-hooks/32727)
- [Discourse Theme CLI](https://meta.discourse.org/t/discourse-theme-cli/82950)
