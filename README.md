# Gasing Circle - Community Category Layout

Sebuah *Discourse Theme Component* khusus yang dirancang untuk menggantikan tampilan halaman kategori utama (secara default menargetkan slug `/c/komunitas` dan `/c/general`) pada platform forum Gasing Circle.

Komponen ini akan menutupi/mengganti antarmuka tampilan kategori standar bawaan dari Discourse (termasuk *Air Theme*) dan merendernya menjadi *custom layout* yang terdiri dari *Hero banner* yang modern serta *grid* sub-kategori yang interaktif.

## Fitur Utama

- **Custom Hero Banner**: Menampilkan *banner hero gradient* lengkap dengan maskot/ikon, *greeting*, dan deskripsi singkat.
- **Dynamic Subcategory Grid**: Menampilkan sub-kategori ke dalam format *card*. Komponen akan otomatis membagi daftar sub-kategori ke dalam dua kelompok utama (menggunakan heuristik pada slug):
  - **Konsep Dasar Matematika** (untuk slug yang mengandung kata `bilangan`, `bakalkubagi`, atau `pede`)
  - **Diskusi Umum** (untuk sub-kategori lainnya)
- **Visualisasi Ikon & Warna Kustom**: Setiap *card* sub-kategori memiliki konfigurasi palet warna (*background*, *border*, latar ikon) yang spesifik untuk setiap *slug*. Untuk ikonnya, administrator dapat mengunggah gambar pilihan (*custom icon image*) secara langsung lewat panel pengaturan *Theme Component* Discourse (*settings*), atau jika ditiadakan, secara otomatis akan merender ikon SVG default.
- **Real-Time Notification Badge (TopicTrackingState)**: Angka topik yang belum terbaca (*New* atau *Unread*) akan otomatis tampil di sebelah masing-masing nama kategori. Pembaruan terjadi secara *real-time* memanfaatkan instansi `TopicTrackingState` bawaan Discourse tanpa perlu *reload* halaman.
- **Smart Data Fetching**: Mengambil data utama secara lokal via `site.categories` untuk performa cepat (*zero loading* saat navigasi *history*), sambil melakukan proses *fetch* secara asinkron (di *background*) untuk memvalidasi pembaruan angka jumlah topik agar selalu akurat.
- **Seamless Integrations**: Komponen ini menyuntikkan kelas `.gc-community-active` pada `<body>` saat berada di kategori target, sehingga CSS dapat menyembunyikan seluruh UI bawaan Discourse termasuk *Header navigasi* utama (`#d-header`), kontainer (*container*) standar, daftar topik (`.topic-list`), dan elemen *discovery* lainnya. Hal ini menciptakan pengalaman *full-page* (satu halaman penuh) yang imersif tanpa mempengaruhi *style* di konfigurasi global forum.

## Struktur Direktori

- `about.json`: Konfigurasi meta data tema komponen.
- `settings.yml`: Pemetaan konfigurasi *Theme Settings* admin, tempat registrasi variabel unggahan (*upload type*) untuk memodifikasi ikon (*mengenal_bilangan_icon*, *bakalkubagi_icon*, dsb) dari UI Discourse.
- `common/common.scss`: Aturan *styling* (CSS) khusus untuk komponen ini. Bertugas untuk menyembunyikan (*hide*) komponen *default view* Discourse dan merapihkan seluruh tampilan secara penuh dan responsif.
- `javascripts/discourse/lib/gc-category-config.js`: Menjadi sumber kebenaran tunggal (*Single Source of Truth*) untuk semua pemetaan *slug* ke palet warna, pengelompokan (*grouping*), parameter tata letak target (*TARGET_SLUGS*), dan konfigurasi pengaturan ikon bawaan admin.
- `javascripts/discourse/initializers/gc-community-layout.js`: Mengandung seluruh logika bisnis untuk pembangunan markah (*HTML renderer*), verifikasi pengaturan parameter UI administrator, serta *state* notifikasi yang *real-time*.
- `javascripts/discourse/templates/connectors/discovery-list-container-top/gc-community-layout.hbs`: Menambahkan kontainer kosong (`<div id="gc-community-layout"></div>`) di injeksi template bawaan Discourse sebagai media sisipan *layout* milik Javascript Initializer.

## Persyaratan
- Discourse versi terbaru dengan dukungan Javascript API initializer.
- Karena bersifat dinamis dan langsung melakukan *injection* pada halaman, fungsionalitas ini akan selalu aktif dengan mode spesifik apabila *URL* sesuai dengan daftar parameter `TARGET_SLUGS`. Mengedit variabel konfigurasi `TARGET_SLUGS` pada berkas `gc-category-config.js` di dalam *library* direkomendasikan jika ingin menambahkan atau mengubah *slug* kategori yang ingin ditargetkan layaknya halaman *Home*.

## Cara Perawatan
Kondisi saat ini telah mengelola sistem konfigurasinya lewat berkas tersendiri (`lib/gc-category-config.js`) sebagai *Single Source of Truth*. 
Apabila kelak ada sub-kategori baru yang memiliki warna atau ikon khas:
1. Daftarkan entri baru Anda ke `CATEGORY_CONFIG` di `gc-category-config.js`. Tentukan nama kelas grup-nya di `CATEGORY_GROUPS`.
2. Jika Anda menginginkan ikonnya bisa diubah via pengaturan kustom admin panel, atur parameter `settingKey` dan pastikan nama konfigurasinya sudah diregistrasikan di file konfigurasi YAML (*settings.yml*) bawaan *theme component*.
3. Sistem secara otomatis akan menampilkan unggahan gambar tipe (admin UI) dari *settings.yml* selama file tersedia, sebaliknya akan otomatis memuat konfigurasi `icon` SVG khusus yang dicatat di config.