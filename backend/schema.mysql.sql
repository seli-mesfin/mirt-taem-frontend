-- MySQL schema for a catering marketplace (customers ↔ catering providers) with an admin module.
-- Notes:
-- - Uses InnoDB + foreign keys.
-- - Stores monetary amounts as DECIMAL to avoid floating point errors.
-- - Stores commission as both (rate snapshot) and (computed amount) per order for auditability.
-- - Uses normalized order items to avoid storing arrays in a single column.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Create a dedicated database (optional).
CREATE DATABASE IF NOT EXISTS catering_marketplace
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE catering_marketplace;

-- ---------------------------------------------------------------------------
-- Admins: administrators of the marketplace.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  admin_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'admin', 'finance', 'support') NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (admin_id),
  UNIQUE KEY uq_admins_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Marketplace administrators (login + role).';

-- ---------------------------------------------------------------------------
-- Commission settings: configurable platform commission rate.
-- This supports rate changes over time while keeping an audit trail.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS commission_settings (
  commission_setting_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  commission_rate_percent DECIMAL(5,2) NOT NULL, -- e.g. 10.00 for 10%
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  effective_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  effective_to TIMESTAMP NULL DEFAULT NULL,
  created_by_admin_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (commission_setting_id),
  KEY idx_commission_settings_active (is_active, effective_from),
  CONSTRAINT fk_commission_settings_created_by_admin
    FOREIGN KEY (created_by_admin_id) REFERENCES admins(admin_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT chk_commission_rate_percent
    CHECK (commission_rate_percent >= 0.00 AND commission_rate_percent <= 100.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Commission rate history; keep one active row for current rate.';

-- Seed a default commission rate (10%). Safe to run multiple times.
INSERT INTO commission_settings (commission_rate_percent, is_active, created_by_admin_id)
SELECT 10.00, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM commission_settings WHERE is_active = 1);

-- ---------------------------------------------------------------------------
-- Users: customers using the marketplace.
-- Includes status control (active/suspended).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NULL,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Customers who place catering orders.';

-- ---------------------------------------------------------------------------
-- Caterers: catering service providers.
-- Includes status control (active/suspended).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS caterers (
  caterer_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  business_name VARCHAR(200) NOT NULL,
  contact_name VARCHAR(150) NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NULL,
  password_hash VARCHAR(255) NOT NULL,
  location VARCHAR(200) NULL,
  status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (caterer_id),
  UNIQUE KEY uq_caterers_email (email),
  KEY idx_caterers_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Catering providers who fulfill orders.';

-- ---------------------------------------------------------------------------
-- Orders: core transaction record, visible to admins for monitoring.
-- Stores the commission rate snapshot and computed admin commission per order.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  order_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  caterer_id BIGINT UNSIGNED NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  commission_rate_percent_snapshot DECIMAL(5,2) NOT NULL,
  admin_commission DECIMAL(12,2) NOT NULL,
  status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (order_id),
  KEY idx_orders_user (user_id, created_at),
  KEY idx_orders_caterer (caterer_id, created_at),
  KEY idx_orders_status (status, created_at),
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_orders_caterer
    FOREIGN KEY (caterer_id) REFERENCES caterers(caterer_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT chk_orders_total_amount
    CHECK (total_amount >= 0.00),
  CONSTRAINT chk_orders_commission_rate_snapshot
    CHECK (commission_rate_percent_snapshot >= 0.00 AND commission_rate_percent_snapshot <= 100.00),
  CONSTRAINT chk_orders_admin_commission
    CHECK (admin_commission >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Orders placed by users to caterers; includes admin commission.';

-- ---------------------------------------------------------------------------
-- Order items: normalized line items (menu/services) per order.
-- Keeps the schema scalable without storing arrays or JSON blobs.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  order_item_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  item_name VARCHAR(200) NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  line_total DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (order_item_id),
  KEY idx_order_items_order (order_id),
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT chk_order_items_quantity
    CHECK (quantity >= 1),
  CONSTRAINT chk_order_items_unit_price
    CHECK (unit_price >= 0.00),
  CONSTRAINT chk_order_items_line_total
    CHECK (line_total >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Line items for each order (menu items/services).';

-- ---------------------------------------------------------------------------
-- Payments: payment tracking + admin earnings reporting.
-- One order can have multiple payment attempts/records.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  payment_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method ENUM('card', 'bank_transfer', 'cash', 'mobile_money', 'other') NOT NULL,
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  provider_reference VARCHAR(255) NULL,
  paid_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (payment_id),
  KEY idx_payments_order (order_id, created_at),
  KEY idx_payments_status (payment_status, created_at),
  CONSTRAINT fk_payments_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT chk_payments_amount
    CHECK (amount >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Payments for orders; used to track payment status and revenue.';

-- ---------------------------------------------------------------------------
-- Helpful views (optional): current commission rate.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_current_commission_rate AS
SELECT commission_rate_percent
FROM commission_settings
WHERE is_active = 1
ORDER BY effective_from DESC
LIMIT 1;

-- ---------------------------------------------------------------------------
-- Sample queries: calculate total admin earnings.
-- ---------------------------------------------------------------------------

-- 1) Total admin commission from completed orders.
--    (Uses stored admin_commission for auditability.)
--    If you want "earned" only when paid, see query (2).
SELECT
  COALESCE(SUM(o.admin_commission), 0.00) AS total_admin_earnings
FROM orders o
WHERE o.status = 'completed';

-- 2) Total admin commission for orders that have at least one PAID payment.
--    (Prevents counting unpaid completed orders.)
SELECT
  COALESCE(SUM(o.admin_commission), 0.00) AS total_admin_earnings_paid
FROM orders o
WHERE o.status = 'completed'
  AND EXISTS (
    SELECT 1
    FROM payments p
    WHERE p.order_id = o.order_id
      AND p.payment_status = 'paid'
  );

-- 3) Monthly admin earnings trend (completed orders).
SELECT
  DATE_FORMAT(o.created_at, '%Y-%m') AS month,
  COALESCE(SUM(o.admin_commission), 0.00) AS admin_earnings
FROM orders o
WHERE o.status = 'completed'
GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
ORDER BY month;

