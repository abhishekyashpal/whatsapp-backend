CREATE TABLE IF NOT EXISTS Contacts (
    contact_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    owner_user_id BIGINT NOT NULL,             
    contact_user_id BIGINT DEFAULT NULL,       
    contact_name VARCHAR(255) NOT NULL,       
    contact_mobile VARCHAR(20) NOT NULL,       
    is_registered BOOLEAN NOT NULL DEFAULT 0,  
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,    
    FOREIGN KEY (owner_user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (contact_user_id) REFERENCES Users(user_id) ON DELETE SET NULL
);
