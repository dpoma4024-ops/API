<?php
header("Content-Type: application/json");

// Simple prueba
echo json_encode([
    "status" => "online",
    "message" => "API funcionando en Railway"
]);

