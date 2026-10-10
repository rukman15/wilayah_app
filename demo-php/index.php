<?php
// Halaman demo: provinsi dari data.json, kota dari get_kota.php, dengan pencarian.
$data = json_decode(file_get_contents(__DIR__ . '/data.json'), true);
$provinsi = $data['provinsi'];
usort($provinsi, fn($a, $b) => strcmp($a['nama'], $b['nama']));
$provinsiJson = json_encode(
    array_map(fn($p) => ['id' => (int) $p['id'], 'nama' => $p['nama']], $provinsi),
    JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP
);
?>
<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Demo PHP Dropdown Provinsi dan Kota</title>
<style>
  :root { --bg:#f5f7fa; --card:#fff; --text:#1d2433; --muted:#6b7280; --accent:#2563eb; --line:#d1d5db; }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) { --bg:#0f172a; --card:#1e293b; --text:#e2e8f0; --muted:#94a3b8; --accent:#60a5fa; --line:#334155; }
  }
  :root[data-theme="dark"] { --bg:#0f172a; --card:#1e293b; --text:#e2e8f0; --muted:#94a3b8; --accent:#60a5fa; --line:#334155; }
  body { margin:0; background:var(--bg); color:var(--text); font-family:system-ui,-apple-system,sans-serif; }
  main { max-width:420px; margin:0 auto; padding:16px; }
  h1 { font-size:20px; margin:24px 0 4px; }
  p.note { color:var(--muted); font-size:14px; margin:0 0 20px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:20px; }
  label { display:block; font-weight:600; font-size:14px; margin:12px 0 6px; }
  label:first-child { margin-top:0; }
  input[type="search"], select { width:100%; box-sizing:border-box; padding:12px; font-size:16px; border:1px solid var(--line); border-radius:8px; background:var(--card); color:var(--text); }
  input[type="search"] { margin-bottom:6px; }
  input[type="search"]:disabled, select:disabled { opacity:.5; }
  .hasil { margin-top:20px; padding:12px; border-radius:8px; background:var(--bg); font-size:14px; min-height:20px; }
  .badge { display:inline-block; font-size:12px; color:var(--accent); margin-bottom:12px; }
</style>
</head>
<body>
<main>
  <span class="badge">DEMO PHP • data lengkap (JSON)</span>
  <h1>Pilih Provinsi dan Kota</h1>
  <p class="note">Ketik untuk mencari, kota otomatis menyesuaikan provinsi yang dipilih.</p>

  <div class="card">
    <label for="cariProv">Cari provinsi</label>
    <input type="search" id="cariProv" placeholder="Ketik nama provinsi..." autocomplete="off">
    <select id="provinsi" aria-label="Provinsi"></select>

    <label for="cariKota">Cari kota / kabupaten</label>
    <input type="search" id="cariKota" placeholder="Ketik nama kota..." autocomplete="off" disabled>
    <select id="kota" disabled aria-label="Kota atau kabupaten"></select>

    <div class="hasil" id="hasil">Belum ada pilihan.</div>
  </div>
</main>

<script>
  const PROVINSI = <?= $provinsiJson ?>;
  let daftarKota = [];

  const cariProv = document.getElementById("cariProv");
  const cariKota = document.getElementById("cariKota");
  const selProv  = document.getElementById("provinsi");
  const selKota  = document.getElementById("kota");
  const hasil    = document.getElementById("hasil");

  // Isi ulang dropdown dengan daftar yang sudah difilter.
  // Pilihan yang sedang aktif tetap dipilih jika masih ada di hasil filter.
  function isiDropdown(sel, daftar, placeholder, kata) {
    const cari = kata.trim().toLowerCase();
    const hasilFilter = daftar.filter(x => x.nama.toLowerCase().includes(cari));
    const nilaiLama = sel.value;

    sel.innerHTML = "";
    sel.add(new Option(hasilFilter.length ? placeholder : "Tidak ada yang cocok", ""));
    hasilFilter.forEach(x => sel.add(new Option(x.nama, x.id)));

    if (hasilFilter.some(x => String(x.id) === nilaiLama)) {
      sel.value = nilaiLama;
    }
  }

  function resetKota(teks) {
    daftarKota = [];
    cariKota.value = "";
    cariKota.disabled = true;
    selKota.innerHTML = "";
    selKota.add(new Option(teks, ""));
    selKota.disabled = true;
  }

  cariProv.addEventListener("input", () => {
    isiDropdown(selProv, PROVINSI, "-- Pilih provinsi --", cariProv.value);
  });

  selProv.addEventListener("change", async () => {
    const provId = selProv.value;
    if (!provId) {
      resetKota("-- Pilih provinsi dulu --");
      hasil.textContent = "Belum ada pilihan.";
      return;
    }

    resetKota("Memuat kota...");
    hasil.textContent = "Provinsi: " + selProv.options[selProv.selectedIndex].text;

    try {
      const res = await fetch("get_kota.php?provinsi=" + encodeURIComponent(provId));
      if (!res.ok) throw new Error("HTTP " + res.status);
      daftarKota = await res.json();

      isiDropdown(selKota, daftarKota, "-- Pilih kota --", "");
      selKota.disabled = false;
      cariKota.disabled = false;
    } catch (e) {
      resetKota("Gagal memuat kota");
      hasil.textContent = "Terjadi error: " + e.message;
    }
  });

  cariKota.addEventListener("input", () => {
    isiDropdown(selKota, daftarKota, "-- Pilih kota --", cariKota.value);
  });

  selKota.addEventListener("change", () => {
    hasil.textContent = "Provinsi: " + selProv.options[selProv.selectedIndex].text
      + " | Kota: " + selKota.options[selKota.selectedIndex].text;
  });

  // Isi awal dropdown provinsi
  isiDropdown(selProv, PROVINSI, "-- Pilih provinsi --", "");
</script>
</body>
</html>
