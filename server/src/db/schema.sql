DROP TABLE IF EXISTS reviews, condition_logs, bookings, items, categories, users CASCADE;
CREATE TABLE users(
 id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(150) NOT NULL UNIQUE,
 password_hash TEXT NOT NULL, phone VARCHAR(20), area VARCHAR(100),
 role VARCHAR(10) NOT NULL DEFAULT 'member' CHECK (role IN ('member','admin')),
 is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE categories(id SERIAL PRIMARY KEY, name VARCHAR(60) NOT NULL UNIQUE);
CREATE TABLE items(
 id SERIAL PRIMARY KEY, owner_id INT NOT NULL REFERENCES users(id),
 category_id INT NOT NULL REFERENCES categories(id), title VARCHAR(120) NOT NULL, description TEXT,
 condition VARCHAR(8) NOT NULL CHECK (condition IN ('new','good','fair')),
 max_days INT NOT NULL CHECK (max_days > 0), pickup_area VARCHAR(100), image_url TEXT,
 is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE bookings(
 id SERIAL PRIMARY KEY, item_id INT NOT NULL REFERENCES items(id), borrower_id INT NOT NULL REFERENCES users(id),
 start_date DATE NOT NULL, end_date DATE NOT NULL,
 status VARCHAR(12) NOT NULL DEFAULT 'REQUESTED'
  CHECK (status IN ('REQUESTED','APPROVED','REJECTED','CANCELLED','PICKED_UP','RETURNED')),
 message TEXT, reject_reason TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW(),
 CHECK (end_date >= start_date));
CREATE INDEX idx_bookings_item_status ON bookings(item_id, status);
CREATE TABLE condition_logs(
 id SERIAL PRIMARY KEY, booking_id INT NOT NULL REFERENCES bookings(id),
 stage VARCHAR(10) NOT NULL CHECK (stage IN ('handover','return')),
 condition VARCHAR(8) CHECK (condition IN ('new','good','fair')), note TEXT,
 logged_by INT NOT NULL REFERENCES users(id), logged_at TIMESTAMP DEFAULT NOW(),
 UNIQUE (booking_id, stage));
CREATE TABLE reviews(
 id SERIAL PRIMARY KEY, booking_id INT NOT NULL REFERENCES bookings(id),
 reviewer_id INT NOT NULL REFERENCES users(id), reviewee_id INT NOT NULL REFERENCES users(id),
 rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5), comment TEXT, created_at TIMESTAMP DEFAULT NOW(),
 UNIQUE (booking_id, reviewer_id));
