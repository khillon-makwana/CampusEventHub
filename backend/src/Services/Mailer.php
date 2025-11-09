<?php
namespace App\Services;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use Dotenv\Dotenv;

class Mailer {
    private $mailer;

    public function __construct(){
        $dotenv = Dotenv::createImmutable(__DIR__ . '/../../');
        $dotenv->load();

        $this->mailer = new PHPMailer(true);
        $this->mailer->isSMTP();
        $this->mailer->Host = $_ENV['MAIL_HOST'];
        $this->mailer->SMTPAuth = true;
        $this->mailer->Username = $_ENV['MAIL_USERNAME'];
        $this->mailer->Password = $_ENV['MAIL_PASSWORD'];

        // Gmail requires SMTPS for port 465 or STARTTLS for 587
        if ((int)$_ENV['MAIL_PORT'] === 465) {
            $this->mailer->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        } else {
            $this->mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        }

        $this->mailer->Port = (int)($_ENV['MAIL_PORT'] ?? 587);
        $this->mailer->setFrom($_ENV['MAIL_FROM'], $_ENV['MAIL_FROM_NAME'] ?? 'EventHub');
        $this->mailer->isHTML(true);
    }

    public function send(string $to, string $toName, string $subject, string $body): bool {
        try {
            $this->mailer->clearAddresses();
            $this->mailer->addAddress($to, $toName);
            $this->mailer->Subject = $subject;
            $this->mailer->Body = $body;

            if (!$this->mailer->send()) {
                throw new Exception("Mailer Error: " . $this->mailer->ErrorInfo);
            }

            return true;
        } catch (Exception $e) {
            // Throw so register.php can include the error in JSON
            throw new Exception($e->getMessage());
        }
    }
}

