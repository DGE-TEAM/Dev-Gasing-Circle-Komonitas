# Gasing Circle - Community Category Layout

Sebuah *Discourse Theme Component* khusus yang dirancang untuk menggantikan tampilan halaman kategori utama (secara default menargetkan slug `/c/komunitas` dan `/c/general`) pada platform forum Gasing Circle.

Komponen ini akan menutupi/mengganti antarmuka tampilan kategori standar bawaan dari Discourse (termasuk *Air Theme*) dan merendernya menjadi *custom layout* yang terdiri dari *Hero banner* yang modern serta *grid* sub-kategori yang interaktif.

## Fitur Utama

- **Custom Hero Banner**: Menampilkan *banner hero gradient* lengkap dengan maskot/ikon, *greeting*, dan deskripsi singkat.
- **Dynamic Subcategory Grid**: Menampilkan sub-kategori ke dalam format *card*. Komponen akan otomatis membagi daftar sub-kategori ke dalam dua kelompok utama (menggunakan heuristik pada slug):
  - **Konsep Dasar Matematika** (untuk slug yang mengandung kata `bilangan`, `bakalkubagi`, atau `pede`)
  - **Diskusi Umum** (untuk sub-kategori lainnya)
- **Visualisasi Ikon & Warna Kustom**: Setiap *card* sub-kategori memiliki konfigurasi palet warna (*background*, *border*, ikon) dan SVG kustom berdasarkan slug spesifik.
- **Real-Time Notification Badge (TopicTrackingState)**: Angka topik yang belum terbaca (*New* atau *Unread*) akan otomatis tampil di sebelah masing-masing nama kategori. Pembaruan terjadi secara *real-time* memanfaatkan instansi `TopicTrackingState` bawaan Discourse tanpa perlu *reload* halaman.
- **Smart Data Fetching**: Mengambil data utama secara lokal via `site.categories` untuk performa cepat (*zero loading* saat navigasi *history*), sambil melakukan proses *fetch* secara asinkron (di *background*) untuk memvalidasi pembaruan angka jumlah topik agar selalu akurat.
- **Seamless Integrations**: Komponen ini menyuntikkan kelas `.gc-community-active` pada `<body>` saat berada di kategori target, sehingga CSS dapat menyembunyikan seluruh UI bawaan Discourse termasuk *Header navigasi* utama (`#d-header`), kontainer (*container*) standar, daftar topik (`.topic-list`), dan elemen *discovery* lainnya. Hal ini menciptakan pengalaman *full-page* (satu halaman penuh) yang imersif tanpa mempengaruhi *style* di konfigurasi global forum.

## Struktur Direktori

- `about.json`: Konfigurasi meta data tema komponen.
- `common/common.scss`: Aturan *styling* (CSS) khusus untuk komponen ini. Bertugas untuk menyembunyikan (*hide*) komponen *default view* Discourse dan merapihkan seluruh tampilan secara penuh dan responsif.
- `javascripts/discourse/initializers/gc-community-layout.js`: Mengandung seluruh logika bisnis untuk *rendering* tata letak (Hero + Dynamic Grid), memuat state notifikasi yang *real-time*, dan mengelompokkan kategori.
- `javascripts/discourse/templates/connectors/discovery-list-container-top/gc-community-layout.hbs`: Menambahkan kontainer kosong (`<div id="gc-community-layout"></div>`) di injeksi template bawaan Discourse sebagai media sisipan *layout* milik Javascript Initializer.

## Persyaratan
- Discourse versi terbaru dengan dukungan Javascript API initializer.
- Karena bersifat dinamis dan langsung melakukan *injection* pada halaman, fungsionalitas ini akan selalu aktif dengan mode spesifik apabila *URL* sesuai dengan daftar parameter `TARGET_SLUGS`. Mengedit daftar `TARGET_SLUGS` pada berkas `.js` direkomendasikan jika ingin menambahkan atau mengubah *slug* kategori yang ingin ditargetkan layaknya fungsi *Home*.

## Cara Perawatan
Kondisi saat ini memiliki konfigurasi *hardcode* dalam berkas `gc-community-layout.js` untuk pengaturan **IKON (ICONS)** dan **PALET (PALETTES)** spesifik yang didasarkan oleh pencocokan kata pada *slugs*. Bila ada sub-kategori baru yang memiliki warna / ikon khas, harus didaftarkan pada variabel terkait di `gc-community-layout.js`.