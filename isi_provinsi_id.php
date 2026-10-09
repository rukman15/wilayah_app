<?php
// Jalankan sekali: php isi_provinsi_id.php
// Mengisi kota.provinsi_id dengan mencocokkan nama dari wilayah.id.
$cfg = require __DIR__ . '/config.php';
$pdo = new PDO("mysql:host={$cfg['host']};dbname={$cfg['db']};charset=utf8mb4",
    $cfg['user'], $cfg['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

function normal(string $s): string {
    $s = mb_strtoupper(trim($s), 'UTF-8');
    $s = preg_replace('/^(KABUPATEN|KOTA|KAB\.?)\s+/', '', $s);
    return preg_replace('/\s+/', ' ', $s);
}

function ambilData(string $url): array {
    $json = file_get_contents($url);
    if ($json === false) {
        throw new RuntimeException("Gagal mengambil: $url");
    }
    return json_decode($json, true)['data'];
}

$provMap = [];
foreach ($pdo->query('SELECT id, nama FROM provinsi') as $p) {
    $provMap[normal($p['nama'])] = (int)$p['id'];
}

$kotaMap = [];
foreach ($pdo->query('SELECT id, nama FROM kota WHERE provinsi_id IS NULL') as $k) {
    $kotaMap[normal($k['nama'])][] = (int)$k['id'];
}

$upd = $pdo->prepare('UPDATE kota SET provinsi_id = ? WHERE id = ?');
$laporan = ['cocok' => 0, 'ambigu' => [], 'tidakCocok' => [], 'provinsiTidakCocok' => []];

foreach (ambilData('https://wilayah.id/api/provinces.json') as $p) {
    $provId = $provMap[normal($p['name'])] ?? null;
    if ($provId === null) {
        $laporan['provinsiTidakCocok'][] = $p['name'];
        continue;
    }
    foreach (ambilData("https://wilayah.id/api/regencies/{$p['code']}.json") as $k) {
        $ids = $kotaMap[normal($k['name'])] ?? [];
        if (count($ids) === 1) {
            $upd->execute([$provId, $ids[0]]);
            $laporan['cocok']++;
        } elseif (count($ids) > 1) {
            $laporan['ambigu'][] = "{$p['name']}: {$k['name']}";
        } else {
            $laporan['tidakCocok'][] = "{$p['name']}: {$k['name']}";
        }
    }
}

header('Content-Type: text/plain; charset=utf-8');
echo json_encode($laporan, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
