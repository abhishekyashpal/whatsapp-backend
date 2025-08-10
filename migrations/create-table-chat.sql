CREATE TABLE Chats (
    chat_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    is_group BOOLEAN DEFAULT FALSE,
    chat_group_name VARCHAR(255), -- Group name if is_group = TRUE
    created_by BIGINT NOT NULL, -- User ID of creator
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,    
    INDEX idx_is_group (is_group),
    FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE CASCADE
);
