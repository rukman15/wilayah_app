# Latihan Skill Claude Code

Repo ini dipakai untuk mencoba semua skill yang tersedia. Cara pakainya: salin salah satu prompt di bawah ke Claude, lalu lihat hasilnya. Prompt yang diawali `/` dipanggil sebagai slash command.

Bahan latihan:
- `latihan/contoh-app/`: server Node.js kecil yang **sengaja** berisi bug dan celah keamanan.
- `latihan/data/penjualan.csv`: data penjualan contoh untuk grafik, spreadsheet, dan dokumen.

Centang kotak `[ ]` kalau latihannya sudah dicoba.

## 1. Kode dan kualitas

- [ ] **run**: "Jalankan `latihan/contoh-app` lalu coba endpoint `/kota?provinsi=Bali` dan `/total`."
- [ ] **code-review**: `/code-review medium latihan/contoh-app`. Seharusnya ketemu bug `i <= data.length`.
- [ ] **security-review**: `/security-review`. Seharusnya ketemu API key yang ditulis langsung di kode, command injection di `/ping`, dan XSS di `/kota`.
- [ ] **simplify**: `/simplify`. Misalnya `totalKota()` bisa diganti `data.length`.
- [ ] **init**: `/init` untuk membuat `CLAUDE.md` berisi penjelasan repo ini.

## 2. Reverse engineering (REA)

- [ ] **reverse-engineer-anything**: "Pakai REA untuk analisis aplikasi JavaScript di `latihan/contoh-app`. Jelaskan endpoint dan alur datanya beserta evidence-nya."
- [ ] "Pakai REA untuk mengaudit `latihan/contoh-app` dengan audit-release-exposure."

### Android (REA + JADX)

Persiapan, sekali per sesi baru:
1. Jalankan `scripts/pasang-jadx.sh`. Skrip ini mengunduh JADX headless MCP 0.7.1 ke `~/.cache/rea/` dan mengecek SHA-256-nya.
2. Taruh file APK di `latihan/android/`, misalnya `latihan/android/app.apk`. Pakai APK buatan sendiri atau aplikasi open source (misalnya dari F-Droid). File `.apk` tidak ikut di-commit.
3. Kalau tool Android belum muncul, restart sesi supaya server REA membaca `REA_JADX_MCP_JAR`.

Latihan:
- [ ] "Cek kesiapan REA untuk Android dengan `rea doctor --provider jadx`."
- [ ] "Pakai REA `inspect_android_package` untuk `latihan/android/app.apk`. Jelaskan nama paket, izin, dan activity yang ada."
- [ ] "Cari class yang berhubungan dengan login atau network dengan `search_android_classes`."
- [ ] "Decompile method `onCreate` dari MainActivity dengan `inspect_android_method`."
- [ ] "Siapa saja yang memanggil method itu? Pakai `trace_android_references`."
- [ ] "Cek tanda tangan APK dengan `inspect_apk_signature`."
- [ ] "Apakah APK ini memakai library native (.so)? Pakai `inspect_android_jni_bindings`."
- [ ] Lanjutan, di komputer sendiri dengan HP/emulator via ADB: "Jalankan aplikasinya dengan `start_adb_app`, lalu baca `read_adb_logcat` dan ambil `capture_adb_screen`."

## 3. Grafik dan halaman (Artifact)

- [ ] **dataviz**: "Buat grafik penjualan per bulan per provinsi dari `latihan/data/penjualan.csv`."
- [ ] **artifact-design**: "Buat halaman dashboard penjualan dari CSV itu."
- [ ] **artifact-diagramming**: "Gambarkan diagram alur request di `contoh-app/server.js`."
- [ ] **artifact-capabilities**: "Buat halaman checklist latihan ini yang bisa dicentang dan tersimpan."

## 4. Dokumen dan file kantor

- [ ] **docs**: "Buat dokumen laporan penjualan Q1 2026 dari CSV."
- [ ] **docx**: "Buat laporan yang sama sebagai file Word (.docx)."
- [ ] **xlsx**: "Ubah CSV jadi Excel dengan kolom total (jumlah × harga) dan ringkasan per provinsi."
- [ ] **pptx**: "Buat presentasi 5 slide (.pptx) tentang hasil penjualan."
- [ ] **pdf**: "Ubah laporan penjualan jadi PDF."
- [ ] **google-workspace**: "Buat Google Sheet dari CSV penjualan." (butuh akses Google Drive)

## 5. Riset dan AI

- [ ] **deep-research**: "Riset sumber data wilayah administrasi Indonesia yang resmi dan bandingkan."
- [ ] **claude-api**: "Buat skrip Python yang memakai Claude API untuk merangkum CSV penjualan."

## 6. Database (Supabase)

- [ ] **supabase-postgres-best-practices**: "Rancang tabel `provinsi`, `kota`, dan `penjualan` untuk Postgres beserta index dan RLS."
- [ ] **supabase**: "Buat migrasi Supabase dari rancangan tadi." (butuh project Supabase)

## 7. Konfigurasi Claude Code

- [ ] **update-config**: "Izinkan perintah `npm` dan `node` tanpa minta izin."
- [ ] **fewer-permission-prompts**: `/fewer-permission-prompts`
- [ ] **session-start-hook**: "Buat SessionStart hook yang menjalankan `node --check` pada `contoh-app`."
- [ ] **keybindings-help**: "Ganti shortcut submit jadi ctrl+enter."
- [ ] **plugin-authoring**: "Buat status line yang menampilkan nama branch."
- [ ] **loop**: `/loop 10m cek apakah contoh-app masih bisa di-start`

## 8. Membuat skill sendiri

- [ ] **skill-creator**: "Buat skill `wilayah-helper` yang tahu cara menambah data provinsi dan kota ke `wilayah.json`."
