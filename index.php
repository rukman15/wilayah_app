<?php
$cfg = require __DIR__ . '/config.php';
$pdo = new PDO("mysql:host={$cfg['host']};dbname={$cfg['db']};charset=utf8mb4",
    $cfg['user'], $cfg['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$provinsi = $pdo->query('SELECT id, nama FROM provinsi ORDER BY nama')->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pilih Provinsi dan Kota</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 480px; margin: 40px auto; padding: 0 16px; }
    label { display: block; margin-top: 16px; font-weight: 600; }
    select { width: 100%; padding: 10px; margin-top: 6px; font-size: 16px; }
  </style>
</head>
<body>
  <h2>Pilih Wilayah</h2>
  <label for="provinsi">Provinsi</label>
  <select id="provinsi">
    <option value="">-- Pilih provinsi --</option>
    <?php foreach ($provinsi as $p): ?>
      <option value="<?= $p['id'] ?>"><?= htmlspecialchars($p['nama']) ?></option>
    <?php endforeach; ?>
  </select>
  <label for="kota">Kabupaten / Kota</label>
  <select id="kota" disabled><option value="">-- Pilih kota --</option></select>
  <script>
    const selProv = document.getElementById('provinsi');
    const selKota = document.getElementById('kota');
    selProv.addEventListener('change', async function () {
      selKota.innerHTML = '<option value="">-- Pilih kota --</option>';
      selKota.disabled = !this.value;
      if (!this.value) return;
      const res = await fetch('get_kota.php?provinsi=' + encodeURIComponent(this.value));
      const data = await res.json();
      data.forEach(k => selKota.add(new Option(k.nama, k.id)));
      selKota.disabled = false;
    });
  </script>
</body>
</html>
