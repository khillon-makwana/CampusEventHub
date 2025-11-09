<?php
namespace App\Models;

use App\Config\Database;
use PDO;

class PasswordReset {
    private $db;
    public function __construct(){
        $this->db = Database::getConnection();
    }

    public function create(string $email, string $token, string $expiresAt) : bool {
        $stmt = $this->db->prepare("INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)");
        return $stmt->execute([$email, $token, $expiresAt]);
    }

    public function findByToken(string $token) : array|false {
        $stmt = $this->db->prepare("SELECT * FROM password_resets WHERE token = ? LIMIT 1");
        $stmt->execute([$token]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: false;
    }

    public function deleteById(int $id) : bool {
        $stmt = $this->db->prepare("DELETE FROM password_resets WHERE id = ?");
        return $stmt->execute([$id]);
    }
}

