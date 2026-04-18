<?php
include 'connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
  $name = $_POST['name'];
  $email = $_POST['email'];
  $message = $_POST['message'];

  $sql = "INSERT INTO messages (name, email, message) VALUES (?, ?, ?)";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param("sss", $name, $email, $message);

  if ($stmt->execute()) {
    echo "Message sent successfully!";
  } else {
    echo "Error: " . $stmt->error;
  }
}
?>
