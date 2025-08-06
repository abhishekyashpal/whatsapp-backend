CREATE TABLE IF NOT EXISTS Messages (
    message_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    message_text TEXT,
    message_type ENUM('text', 'image', 'audio', 'video', 'file') DEFAULT 'text',
    message_status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP NULL DEFAULT NULL,
    read_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (sender_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES Users(user_id) ON DELETE CASCADE
);
