# wilayah_app

Dropdown provinsi dan kota (PHP + MySQL). Data wilayah bersumber dari wilayah.id (kode Kemendagri).

## Cara pakai
1. Salin `config.example.php` menjadi `config.php`, lalu isi kredensial database.
2. Pastikan tabel `provinsi` (kolom `id`, `nama`) dan `kota` (kolom `id`, `nama`, `provinsi_id`) tersedia.
3. Jika `kota.provinsi_id` belum terisi, jalankan `php isi_provinsi_id.php` sekali.
4. Buka `index.php` lewat server PHP, misalnya `php -S localhost:8000`.
