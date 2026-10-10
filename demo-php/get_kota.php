<?php
// Endpoint kota dari data.json (tanpa database).
// Pemakaian: get_kota.php?provinsi=32
header('Content-Type: application/json; charset=utf-8');

$provinsiId = filter_input(INPUT_GET, 'provinsi', FILTER_VALIDATE_INT);
if ($provinsiId === false || $provinsiId === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Parameter provinsi tidak valid'], JSON_UNESCAPED_UNICODE);
    exit;
}

$data = json_decode(file_get_contents(__DIR__ . '/data.json'), true);

$hasil = array_values(array_filter(
    $data['kota'],
    fn($k) => $k['provinsi_id'] === $provinsiId
));
usort($hasil, fn($a, $b) => strcmp($a['nama'], $b['nama']));

echo json_encode(
    array_map(fn($k) => ['id' => $k['id'], 'nama' => $k['nama']], $hasil),
    JSON_UNESCAPED_UNICODE
);
