<?php
namespace App\Helpers;

class Validator {
    public static function sanitize($data) {
        if (is_array($data)) {
            foreach ($data as $key => $value) {
                $data[$key] = self::sanitize($value);
            }
            return $data;
        }
        return htmlspecialchars(strip_tags(trim($data)));
    }

    public static function validate($data, $rules) {
        $errors = [];

        foreach ($rules as $field => $rule) {
            $value = $data[$field] ?? null;
            $ruleParts = explode('|', $rule);

            foreach ($ruleParts as $part) {
                if ($part === 'required' && empty($value)) {
                    $errors[$field] = "$field is required";
                }
                // Add more validation rules as needed (e.g., email, numeric, etc.)
                if ($part === 'numeric' && !empty($value) && !is_numeric($value)) {
                     $errors[$field] = "$field must be a number";
                }
            }
        }

        return $errors;
    }
}
