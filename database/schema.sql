-- Stocks Portfolio Management System Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS portfolio_db;
USE portfolio_db;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- Stocks table
CREATE TABLE stocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(15,4) NOT NULL,
    purchase_price DECIMAL(15,4) NOT NULL,
    current_price DECIMAL(15,4),
    purchase_date DATE NOT NULL,
    sector VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_symbol (user_id, symbol),
    INDEX idx_sector (sector),
    INDEX idx_purchase_date (purchase_date)
);

-- Stock price history table (for tracking price changes)
CREATE TABLE stock_price_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_id INT NOT NULL,
    price DECIMAL(15,4) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,
    INDEX idx_stock_date (stock_id, recorded_at)
);

-- User preferences table
CREATE TABLE user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_preference (user_id, preference_key)
);

-- Portfolio snapshots table (for performance tracking)
CREATE TABLE portfolio_snapshots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    snapshot_date DATE NOT NULL,
    total_stocks_value DECIMAL(15,4) DEFAULT 0,
    total_portfolio_value DECIMAL(15,4) NOT NULL,
    total_gain_loss DECIMAL(15,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, snapshot_date),
    INDEX idx_snapshot_date (snapshot_date)
);

-- Insert sample data (optional)
-- You can uncomment and modify these after creating your user account

-- Sample user (password is 'password123' hashed with bcrypt)
-- INSERT INTO users (username, email, password, first_name, last_name) VALUES 
-- ('demo_user', 'demo@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqyc.k8/SjWmykKqyAdyb3S', 'Demo', 'User');

-- Sample stocks
-- INSERT INTO stocks (user_id, symbol, company_name, quantity, purchase_price, current_price, purchase_date, sector) VALUES
-- (1, 'AAPL', 'Apple Inc.', 10, 150.00, 175.00, '2024-01-15', 'Technology'),
-- (1, 'GOOGL', 'Alphabet Inc.', 5, 2800.00, 2950.00, '2024-02-01', 'Technology'),
-- (1, 'MSFT', 'Microsoft Corporation', 8, 300.00, 340.00, '2024-01-20', 'Technology');
