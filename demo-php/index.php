<?php
// Halaman demo: provinsi dari data.json, kota dari get_kota.php.
$data = json_decode(file_get_contents(__DIR__ . '/data.json'), true);
$provinsi = $data['provinsi'];
usort($provinsi, fn($a, $b) => strcmp($a['nama'], $b['nama']));
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
  select { width:100%; padding:12px; font-size:16px; border:1px solid var(--line); border-radius:8px; background:var(--card); color:var(--text); }
  select:disabled { opacity:.5; }
  .hasil { margin-top:20px; padding:12px; border-radius:8px; background:var(--bg); font-size:14px; min-height:20px; }
  .badge { display:inline-block; font-size:12px; color:var(--accent); margin-bottom:12px; }
</style>
</head>
<body>
<main>
  <span class="badge">DEMO PHP • data lengkap (JSON)</span>
  <h1>Pilih Provinsi dan Kota</h1>
  <p class="note">Kota otomatis menyesuaikan provinsi yang dipilih.</p>

  <div class="card">
    <label for="provinsi">Provinsi</label>
    <select id="provinsi">
      <option value="">-- Pilih provinsi --</option>
      <?php foreach ($provinsi as $p): ?>
        <option value="<?= (int) $p['id'] ?>"><?= htmlspecialchars($p['nama'], ENT_QUOTES, 'UTF-8') ?></option>
      <?php endforeach; ?>
    </select>

    <label for="kota">Kota / Kabupaten</label>
    <select id="kota" disabled>
      <option value="">-- Pilih provinsi dulu --</option>
    </select>

    <div class="hasil" id="hasil">Belum ada pilihan.</div>
  </div>
</main>

<script>
  const selProv = document.getElementById("provinsi");
  const selKota = document.getElementById("kota");
  const hasil   = document.getElementById("hasil");

  function resetKota(teks) {
    selKota.innerHTML = "";
    selKota.add(new Option(teks, ""));
    selKota.disabled = true;
  }

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
      const daftar = await res.json();

      selKota.innerHTML = "";
      selKota.add(new Option("-- Pilih kota --", ""));
      daftar.forEach(k => selKota.add(new Option(k.nama, k.id)));
      selKota.disabled = false;
    } catch (e) {
      resetKota("Gagal memuat kota");
      hasil.textContent = "Terjadi error: " + e.message;
    }
  });

  selKota.addEventListener("change", () => {
    hasil.textContent = "Provinsi: " + selProv.options[selProv.selectedIndex].text
      + " | Kota: " + selKota.options[selKota.selectedIndex].text;
  });
</script>
</body>
</html>
