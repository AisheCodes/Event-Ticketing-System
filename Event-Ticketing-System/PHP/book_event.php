<?php
include 'connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $event_id = $_POST['event_id'];
    $name = $_POST['customer_name'];
    $email = $_POST['customer_email'];
    $tickets = $_POST['tickets_booked'];

    $stmt = $conn->prepare("INSERT INTO bookings (event_id, customer_name, customer_email, tickets_booked) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("issi", $event_id, $name, $email, $tickets);

    if ($stmt->execute()) {
        echo "Booking successful!";
    } else {
        echo "Error: " . $stmt->error;
    }
}
?>
