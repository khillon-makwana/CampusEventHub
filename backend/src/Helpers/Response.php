<?php
namespace App\Helpers;

class Response {
    public static function json($data, $status = 200) {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    public static function error($message, $status = 500, $details = null) {
        $response = [
            'success' => false,
            'error' => $message
        ];

        if ($details) {
            $response['details'] = $details;
        }

        self::json($response, $status);
    }
}
