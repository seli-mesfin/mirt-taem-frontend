-- XAMPP/MySQL schema for CaterLink Ethiopia
-- Tables requested: providers, users, admins, orders

CREATE DATABASE IF NOT EXISTS caterlink_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE caterlink_db;

-- -----------------------------
-- Admins table
-- -----------------------------
CREATE TABLE IF NOT EXISTS admins (
  admin_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'admin') NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (admin_id)
) ENGINE=InnoDB;

-- -----------------------------
-- Users table (customers)
-- -----------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  password VARCHAR(255) NOT NULL,
  status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB;

-- -----------------------------
-- Providers table (caterers)
-- -----------------------------
CREATE TABLE IF NOT EXISTS providers (
  provider_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  business_name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  location VARCHAR(255),
  category VARCHAR(100),
  starting_price_per_person DECIMAL(10,2) DEFAULT 0.00,
  image_url TEXT,
  description TEXT,
  status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (provider_id)
) ENGINE=InnoDB;

-- -----------------------------
-- Orders table
-- -----------------------------
CREATE TABLE IF NOT EXISTS orders (
  order_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  provider_id INT UNSIGNED NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  admin_commission DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (order_id),
  KEY idx_orders_user_id (user_id),
  KEY idx_orders_provider_id (provider_id),
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_orders_provider
    FOREIGN KEY (provider_id) REFERENCES providers(provider_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Optional seed admin
INSERT INTO admins (name, email, password, role)
SELECT 'System Admin', 'admin@caterlink.et', 'admin123', 'super_admin'
WHERE NOT EXISTS (
  SELECT 1 FROM admins WHERE email = 'admin@caterlink.et'
);

