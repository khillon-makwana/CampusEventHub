<?php
namespace App\Models;

use App\Config\Database;
use PDO;

class User {
    private $db;
    public function __construct(){
        $this->db = Database::getConnection();
    }

    public function create(string $fullname, string $email, string $passwordHash) : int|false {
        $stmt = $this->db->prepare("INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)");
        $ok = $stmt->execute([$fullname, $email, $passwordHash]);
        if ($ok) return (int)$this->db->lastInsertId();
        return false;
    }

    public function findByEmail(string $email) : array|false {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: false;
    }

    public function findById(int $id) : array|false {
        $stmt = $this->db->prepare("SELECT id, fullname, email, is_verified, created_at FROM users WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: false;
    }

    public function verify(int $id) : bool {
        $stmt = $this->db->prepare("UPDATE users SET is_verified = 1 WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function updatePassword(int $id, string $passwordHash) : bool {
        $stmt = $this->db->prepare("UPDATE users SET password = ? WHERE id = ?");
        return $stmt->execute([$passwordHash, $id]);
    }
}

