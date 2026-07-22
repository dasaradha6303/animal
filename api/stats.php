<?php
require_once __DIR__ . '/../config.php';

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
$conn->set_charset('utf8mb4');

$stats = [];

$r1 = $conn->query("SELECT COUNT(*) as c FROM animals WHERE adoption_status='available'");
$stats['available'] = $r1->fetch_assoc()['c'];

$r2 = $conn->query("SELECT COUNT(*) as c FROM animals WHERE adoption_status='adopted'");
$stats['adopted'] = $r2->fetch_assoc()['c'];

$r3 = $conn->query("SELECT COUNT(*) as c FROM wild_alerts WHERE verified=1");
$stats['alerts'] = $r3->fetch_assoc()['c'];

$r4 = $conn->query("SELECT COUNT(*) as c FROM dead_reports WHERE status='completed'");
$stats['resolved'] = $r4->fetch_assoc()['c'];

$recent = $conn->query('SELECT * FROM animals ORDER BY created_at DESC LIMIT 4')->fetch_all(MYSQLI_ASSOC);

jsonResponse(['stats' => $stats, 'recent_animals' => $recent]);

$conn->close();
?>
