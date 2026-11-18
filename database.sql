-- ERU Emergency Response Unit database (MySQL / MariaDB, XAMPP)
CREATE DATABASE IF NOT EXISTS eru_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eru_db;
SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS assignments, incidents, units, stations, admins, login_attempts;
SET FOREIGN_KEY_CHECKS=1;

CREATE TABLE admins(id INT AUTO_INCREMENT PRIMARY KEY,username VARCHAR(30) NOT NULL UNIQUE,password_hash VARCHAR(255) NOT NULL) ENGINE=InnoDB;
CREATE TABLE login_attempts(id INT AUTO_INCREMENT PRIMARY KEY,ip VARCHAR(45) NOT NULL,attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,INDEX(ip,attempted_at)) ENGINE=InnoDB;
CREATE TABLE stations(id VARCHAR(8) PRIMARY KEY,city VARCHAR(40) NOT NULL,name VARCHAR(80) NOT NULL,lat DECIMAL(9,6) NOT NULL,lng DECIMAL(9,6) NOT NULL) ENGINE=InnoDB;
CREATE TABLE units(id VARCHAR(32) PRIMARY KEY,station_id VARCHAR(8) NOT NULL,type ENUM('fire','police','medical','drrmo') NOT NULL,name VARCHAR(60) NOT NULL,status ENUM('available','dispatched') NOT NULL DEFAULT 'available',
  FOREIGN KEY(station_id) REFERENCES stations(id) ON DELETE CASCADE,INDEX(type,status)) ENGINE=InnoDB;
CREATE TABLE incidents(id INT AUTO_INCREMENT PRIMARY KEY,ref VARCHAR(12) NOT NULL UNIQUE,name VARCHAR(60) NOT NULL,phone CHAR(11) NOT NULL,
  type ENUM('fire','crime','medical','traffic','disaster') NOT NULL,description VARCHAR(300) NOT NULL DEFAULT '',address VARCHAR(120) NOT NULL DEFAULT '',
  lat DECIMAL(9,6) NOT NULL,lng DECIMAL(9,6) NOT NULL,accuracy FLOAT NULL,city VARCHAR(40) NOT NULL,status ENUM('pending','assigned','resolved') NOT NULL DEFAULT 'pending',
  ip VARCHAR(45) NOT NULL DEFAULT '',created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,INDEX(created_at),INDEX(status),INDEX(ip,created_at)) ENGINE=InnoDB;
CREATE TABLE assignments(id INT AUTO_INCREMENT PRIMARY KEY,incident_id INT NOT NULL,unit_id VARCHAR(32) NOT NULL,assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(incident_id) REFERENCES incidents(id) ON DELETE CASCADE,FOREIGN KEY(unit_id) REFERENCES units(id) ON DELETE CASCADE) ENGINE=InnoDB;

-- Admin login: username Ak-47 / password admin123 (stored as a password hash, not plain text)
INSERT INTO admins(username,password_hash) VALUES('Ak-47','$2b$12$DwOHhEaAhtXST6V0bni9fuQiW4mEgNRvfv3DA56xznFugyXNcH/fe');

-- Sample stations (edit names/coordinates to your real stations)
INSERT INTO stations(id,city,name,lat,lng) VALUES
('mnd','Mandaue City','Mandaue Central Response Station',10.323600,123.922300),
('lil','Liloan','Liloan Response Station',10.399200,123.998300),
('con','Consolacion','Consolacion Response Station',10.376700,123.956400);
INSERT INTO units(id,station_id,type,name) VALUES
('mnd-fire-1','mnd','fire','Fire Unit 1'),
('mnd-fire-2','mnd','fire','Fire Unit 2'),
('mnd-police-1','mnd','police','Police Unit 1'),
('mnd-police-2','mnd','police','Police Unit 2'),
('mnd-medical-1','mnd','medical','Ambulance / Medical Unit 1'),
('mnd-medical-2','mnd','medical','Ambulance / Medical Unit 2'),
('mnd-drrmo-1','mnd','drrmo','DRRMO Rescue Unit 1'),
('mnd-drrmo-2','mnd','drrmo','DRRMO Rescue Unit 2'),
('lil-fire-1','lil','fire','Fire Unit 1'),
('lil-fire-2','lil','fire','Fire Unit 2'),
('lil-police-1','lil','police','Police Unit 1'),
('lil-police-2','lil','police','Police Unit 2'),
('lil-medical-1','lil','medical','Ambulance / Medical Unit 1'),
('lil-medical-2','lil','medical','Ambulance / Medical Unit 2'),
('lil-drrmo-1','lil','drrmo','DRRMO Rescue Unit 1'),
('lil-drrmo-2','lil','drrmo','DRRMO Rescue Unit 2'),
('con-fire-1','con','fire','Fire Unit 1'),
('con-fire-2','con','fire','Fire Unit 2'),
('con-police-1','con','police','Police Unit 1'),
('con-police-2','con','police','Police Unit 2'),
('con-medical-1','con','medical','Ambulance / Medical Unit 1'),
('con-medical-2','con','medical','Ambulance / Medical Unit 2'),
('con-drrmo-1','con','drrmo','DRRMO Rescue Unit 1'),
('con-drrmo-2','con','drrmo','DRRMO Rescue Unit 2');
