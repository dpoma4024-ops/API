<?php
// Temporary redirect to the migrated public folder after project reorganization.
// Hosting providers that use the project root as DocumentRoot will hit this file.
// This file redirects to `src/frontend/public/index.html` if it exists.

$target = 'src/frontend/public/index.html';
$full = __DIR__ . DIRECTORY_SEPARATOR . $target;

if (file_exists($full)) {
    // Use a 302 redirect so it's easy to change while testing.
    header('Location: /' . str_replace(DIRECTORY_SEPARATOR, '/', $target));
    exit;
}

http_response_code(404);
echo 'Archivo de entrada no encontrado. Comprueba que `src/frontend/public/index.html` existe o configura el DocumentRoot del hosting para apuntar al directorio correcto.';
