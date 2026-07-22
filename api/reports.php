<?php
require_once __DIR__ . '/../config.php';

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
$conn->set_charset('utf8mb4');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $conn->query('SELECT * FROM dead_reports ORDER BY created_at DESC LIMIT 50');
        jsonResponse($stmt->fetch_all(MYSQLI_ASSOC));
        break;

    case 'POST':
        $input = getInput();
        $trackingId = 'DR-' . date('Y') . '-' . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
        $stmt = $conn->prepare('INSERT INTO dead_reports (tracking_id, reporter_name, contact, location, lat, lng, animal_type, image_url, description, occurred_at, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
        $stmt->bind_param('ssssddsssss',
            $trackingId, $input['reporter_name'], $input['contact'],
            $input['location'], $input['lat'], $input['lng'],
            $input['animal_type'], $input['image_url'], $input['description'],
            $input['occurred_at'], $input['status']
        );
        if ($stmt->execute()) {
            $id = $conn->insert_id;
            $row = $conn->query("SELECT * FROM dead_reports WHERE id = $id")->fetch_assoc();
            jsonResponse($row, 201);
        } else {
            jsonResponse(['error' => 'Failed to submit report'], 500);
        }
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}

$conn->close();
?>
