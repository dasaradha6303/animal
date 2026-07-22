<?php
require_once __DIR__ . '/../config.php';

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
$conn->set_charset('utf8mb4');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $conn->query('SELECT * FROM wild_alerts ORDER BY created_at DESC');
        jsonResponse($stmt->fetch_all(MYSQLI_ASSOC));
        break;

    case 'POST':
        $input = getInput();
        $stmt = $conn->prepare('INSERT INTO wild_alerts (animal_type, location, lat, lng, severity, description, image_url, sighted_at, verified) VALUES (?,?,?,?,?,?,?,?,?)');
        $stmt->bind_param('sssdssss',
            $input['animal_type'], $input['location'], $input['lat'], $input['lng'],
            $input['severity'], $input['description'], $input['image_url'],
            $input['sighted_at'], $input['verified']
        );
        if ($stmt->execute()) {
            $id = $conn->insert_id;
            $row = $conn->query("SELECT * FROM wild_alerts WHERE id = $id")->fetch_assoc();
            jsonResponse($row, 201);
        } else {
            jsonResponse(['error' => 'Failed to submit alert'], 500);
        }
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}

$conn->close();
?>
