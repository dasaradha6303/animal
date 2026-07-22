-- Animal Rescue & Public Safety Portal — MySQL Schema

CREATE DATABASE IF NOT EXISTS animal_rescue_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE animal_rescue_portal;

-- Animals table
CREATE TABLE IF NOT EXISTS animals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  breed VARCHAR(150) NOT NULL,
  animal_type ENUM('Dog','Cat','Bird','Rabbit','Other') NOT NULL,
  age_years DECIMAL(4,1) NOT NULL DEFAULT 0,
  gender ENUM('Male','Female','Unknown') NOT NULL,
  shelter_name VARCHAR(200) NOT NULL,
  location VARCHAR(255) NOT NULL,
  image_url VARCHAR(500),
  description TEXT,
  adoption_status ENUM('available','pending','adopted') NOT NULL DEFAULT 'available',
  vaccinated BOOLEAN NOT NULL DEFAULT FALSE,
  sterilized BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Dead animal reports
CREATE TABLE IF NOT EXISTS dead_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tracking_id VARCHAR(20) NOT NULL,
  reporter_name VARCHAR(100),
  contact VARCHAR(100),
  location VARCHAR(255) NOT NULL,
  lat DOUBLE,
  lng DOUBLE,
  animal_type VARCHAR(50) NOT NULL,
  image_url VARCHAR(500),
  description TEXT,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending','assigned','in_progress','completed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Wild animal alerts
CREATE TABLE IF NOT EXISTS wild_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  animal_type VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  lat DOUBLE,
  lng DOUBLE,
  severity ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  description TEXT,
  image_url VARCHAR(500),
  sighted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX animals_status_idx ON animals(adoption_status);
CREATE INDEX animals_type_idx ON animals(animal_type);
CREATE INDEX animals_created_at_idx ON animals(created_at DESC);
CREATE INDEX dead_reports_status_idx ON dead_reports(status);
CREATE INDEX dead_reports_created_at_idx ON dead_reports(created_at DESC);
CREATE INDEX wild_alerts_severity_idx ON wild_alerts(severity);
CREATE INDEX wild_alerts_created_at_idx ON wild_alerts(created_at DESC);
