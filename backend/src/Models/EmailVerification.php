<?php
namespace App\Models;

use App\Config\Database;
use PDO;

class EmailVerification {
    private $db;
    public function __construct(){
        $this->db = Database::getConnection();
    }

    public function create(int $userId, string $code) : bool {
        $stmt = $this->db->prepare("INSERT INTO email_verification (user_id, code) VALUES (?, ?)");
        return $stmt->execute([$userId, $code]);
    }

    public function findByCode(string $code) : array|false {
        $stmt = $this->db->prepare("SELECT * FROM email_verification WHERE code = ? LIMIT 1");
        $stmt->execute([$code]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: false;
    }

    public function deleteById(int $id) : bool {
        $stmt = $this->db->prepare("DELETE FROM email_verification WHERE id = ?");
        return $stmt->execute([$id]);
    }
}

