# Langit Malam

Planetarium sederhana di browser: peta langit sesuai lokasi dan waktu, mirip aplikasi planetarium pada umumnya.

## Fitur
- 5.044 bintang (sampai magnitudo 6) dengan warna sesuai suhu bintang.
- 88 garis dan nama rasi bintang, 110 objek Messier (galaksi, nebula, gugus).
- Matahari, Bulan (lengkap dengan fasenya), dan 7 planet yang posisinya dihitung langsung.
- Langit berubah warna dari siang, senja, sampai malam. Ada juga tanah, cakrawala, dan arah mata angin.
- Kontrol waktu: maju/mundur sampai 1 minggu per detik, pilih tanggal, kembali ke sekarang.
- Lokasi dari GPS atau diisi manual. Defaultnya Jakarta.
- Cari objek, ketuk objek untuk melihat info (magnitudo, koordinat, ketinggian, jarak).
- Geser untuk memutar, scroll atau cubit untuk zoom. Keyboard: panah, `+`/`-`, spasi untuk jeda.

## Menjalankan
Buka `index.html` langsung di browser, atau jalankan server lokal:

```bash
cd planetarium && python3 -m http.server 8000
```

Lalu buka http://localhost:8000. Fitur "Pakai lokasi saya" butuh `localhost` atau HTTPS.

## Struktur
- `index.html`: tampilan dan gaya.
- `app.js`: proyeksi stereografik, gambar canvas, dan interaksi.
- `astro.js`: hitungan astronomi (waktu bintang, presesi, refraksi, orbit planet dari elemen JPL, Bulan presisi rendah).
- `data.js`: katalog bintang, rasi, dan Messier, dibuat dengan `alat/buat_data.py`.

## Akurasi
Posisi planet dan Matahari meleset kurang dari ~0,1°, Bulan ~0,1°. Hasil ini sudah dicek dengan contoh di buku *Astronomical Algorithms* (Meeus). Elemen orbit JPL berlaku untuk tahun 1800-2050.

## Lisensi data
Data bintang, rasi, dan Messier berasal dari [d3-celestial](https://github.com/ofrohn/d3-celestial) (BSD-3-Clause, © 2015 Olaf Frohn). Lihat `LISENSI-DATA.txt`.
