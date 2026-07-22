<?php
require_once __DIR__ . '/../config.php';

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
$conn->set_charset('utf8mb4');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $conn->query('SELECT * FROM animals ORDER BY created_at DESC');
        jsonResponse($stmt->fetch_all(MYSQLI_ASSOC));
        break;

    case 'POST':
        $input = getInput();
        $stmt = $conn->prepare('INSERT INTO animals (name, breed, animal_type, age_years, gender, shelter_name, location, image_url, description, adoption_status, vaccinated, sterilized) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
        $stmt->bind_param('sssdsissssii',
            $input['name'], $input['breed'], $input['animal_type'],
            $input['age_years'], $input['gender'], $input['shelter_name'],
            $input['location'], $input['image_url'], $input['description'],
            $input['adoption_status'], $input['vaccinated'], $input['sterilized']
        );
        if ($stmt->execute()) {
            jsonResponse(['id' => $conn->insert_id, 'message' => 'Animal created'], 201);
        } else {
            jsonResponse(['error' => 'Failed to create animal'], 500);
        }
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}

$conn->close();
?>
