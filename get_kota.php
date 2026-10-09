<?php
header('Content-Type: application/json; charset=utf-8');
$cfg = require __DIR__ . '/config.php';
$pdo = new PDO("mysql:host={$cfg['host']};dbname={$cfg['db']};charset=utf8mb4",
    $cfg['user'], $cfg['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

$provinsiId = filter_input(INPUT_GET, 'provinsi', FILTER_VALIDATE_INT);
if (!$provinsiId) {
    echo json_encode([]);
    exit;
}

$stmt = $pdo->prepare('SELECT id, nama FROM kota WHERE provinsi_id = ? ORDER BY nama');
$stmt->execute([$provinsiId]);
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_UNESCAPED_UNICODE);
