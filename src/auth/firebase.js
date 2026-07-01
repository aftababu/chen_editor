import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
// CREATE DATABASE food_traceability_db
//     WITH
//     OWNER = postgres
//     ENCODING = 'UTF8'
//     CONNECTION LIMIT = -1;

// CREATE TABLE stakeholder_roles (
//     role_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
//     role_name VARCHAR(50) NOT NULL
// );

// CREATE TABLE stakeholders (
//     stakeholder_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
//     name VARCHAR(100) NOT NULL,
//     role_id INT NOT NULL,
//     location VARCHAR(255) NOT NULL,
//     contact_email VARCHAR(100) NOT NULL,
//     join_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
// );

// CREATE TABLE products (
//     product_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
//     name VARCHAR(100) NOT NULL,
//     category VARCHAR(50) NOT NULL,
//     ideal_temp_min DECIMAL(5,2) NOT NULL,
//     ideal_temp_max DECIMAL(5,2) NOT NULL,
//     shelf_life_days INT NOT NULL
// );

// CREATE TABLE batches (
//     batch_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
//     product_id INT NOT NULL,
//     producer_id INT NOT NULL,
//     production_date TIMESTAMPTZ NOT NULL,
//     expiry_date TIMESTAMPTZ NOT NULL,
//     current_status VARCHAR(50) DEFAULT 'At Producer' NOT NULL
// );

// CREATE TABLE shipments (
//     shipment_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
//     batch_id INT NOT NULL,
//     sender_id INT NOT NULL,
//     receiver_id INT NOT NULL,
//     dispatch_time TIMESTAMPTZ NOT NULL,
//     arrival_time TIMESTAMPTZ,
//     transit_status VARCHAR(50) DEFAULT 'In Transit' NOT NULL
// );

// CREATE TABLE safety_inspections (
//     inspection_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
//     batch_id INT NOT NULL,
//     inspector_id INT NOT NULL,
//     inspection_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
//     recorded_temp DECIMAL(5,2) NOT NULL,
//     pass_fail VARCHAR(10) NOT NULL,
//     remarks TEXT
// );

// CREATE TABLE system_alerts (
//     alert_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
//     batch_id INT NOT NULL,
//     alert_type VARCHAR(100) NOT NULL,
//     alert_message TEXT,
//     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
// );
// -- ====================================================================
// -- Script: 03_constraints.sql
// -- Description: Applies Foreign Keys, UNIQUE, and CHECK constraints.
// -- ====================================================================

// -- Foreign Keys
// ALTER TABLE stakeholders ADD CONSTRAINT fk_stakeholder_role FOREIGN KEY (role_id) REFERENCES stakeholder_roles(role_id);
// ALTER TABLE batches ADD CONSTRAINT fk_batch_product FOREIGN KEY (product_id) REFERENCES products(product_id);
// ALTER TABLE batches ADD CONSTRAINT fk_batch_producer FOREIGN KEY (producer_id) REFERENCES stakeholders(stakeholder_id);
// ALTER TABLE shipments ADD CONSTRAINT fk_shipment_batch FOREIGN KEY (batch_id) REFERENCES batches(batch_id);
// ALTER TABLE shipments ADD CONSTRAINT fk_shipment_sender FOREIGN KEY (sender_id) REFERENCES stakeholders(stakeholder_id);
// ALTER TABLE shipments ADD CONSTRAINT fk_shipment_receiver FOREIGN KEY (receiver_id) REFERENCES stakeholders(stakeholder_id);
// ALTER TABLE safety_inspections ADD CONSTRAINT fk_inspection_batch FOREIGN KEY (batch_id) REFERENCES batches(batch_id);
// ALTER TABLE safety_inspections ADD CONSTRAINT fk_inspection_inspector FOREIGN KEY (inspector_id) REFERENCES stakeholders(stakeholder_id);
// ALTER TABLE system_alerts ADD CONSTRAINT fk_alert_batch FOREIGN KEY (batch_id) REFERENCES batches(batch_id);

// -- Unique Constraints
// ALTER TABLE stakeholder_roles ADD CONSTRAINT uq_role_name UNIQUE (role_name);
// ALTER TABLE stakeholders ADD CONSTRAINT uq_contact_email UNIQUE (contact_email);

// -- CHECK Constraints
// ALTER TABLE products ADD CONSTRAINT chk_temp_range CHECK (ideal_temp_max > ideal_temp_min);
// ALTER TABLE batches ADD CONSTRAINT chk_expiry_date CHECK (expiry_date > production_date);
// ALTER TABLE batches ADD CONSTRAINT chk_batch_status CHECK (current_status IN ('At Producer', 'In Transit', 'At Retailer', 'Quarantined', 'Recalled', 'Sold'));
// ALTER TABLE shipments ADD CONSTRAINT chk_arrival_time CHECK (arrival_time IS NULL OR arrival_time >= dispatch_time);
// ALTER TABLE shipments ADD CONSTRAINT chk_transit_status CHECK (transit_status IN ('In Transit', 'Delivered', 'Delayed', 'Lost'));
// ALTER TABLE safety_inspections ADD CONSTRAINT chk_pass_fail CHECK (pass_fail IN ('PASS', 'FAIL'));

// CREATE OR REPLACE FUNCTION get_remaining_shelf_life(p_batch_id INT)
// RETURNS INT
// LANGUAGE plpgsql
// AS $$
// DECLARE
//     v_expiry_date TIMESTAMPTZ;
//     v_days_left INT;
// BEGIN
//     SELECT expiry_date INTO v_expiry_date FROM batches WHERE batch_id = p_batch_id;

//     IF NOT FOUND THEN
//         RAISE EXCEPTION 'Batch ID % not found.', p_batch_id;
//     END IF;

//     v_days_left := EXTRACT(DAY FROM (v_expiry_date - CURRENT_TIMESTAMP));
//     RETURN v_days_left;
// END;
// $$;
// CREATE OR REPLACE PROCEDURE record_shipment_arrival(
//     p_shipment_id INT,
//     p_arrival_time TIMESTAMPTZ
// )
// LANGUAGE plpgsql
// AS $$
// DECLARE
//     v_batch_id INT;
// BEGIN
//     -- Update shipment record
//     UPDATE shipments
//     SET arrival_time = p_arrival_time, transit_status = 'Delivered'
//     WHERE shipment_id = p_shipment_id
//     RETURNING batch_id INTO v_batch_id;

//     -- Automatically update batch status
//     UPDATE batches
//     SET current_status = 'At Receiver'
//     WHERE batch_id = v_batch_id;

//     COMMIT;
// END;
// $$;
// CREATE OR REPLACE FUNCTION trg_audit_safety_inspection()
// RETURNS TRIGGER
// LANGUAGE plpgsql
// AS $$
// BEGIN
//     -- If the inspection result is FAIL
//     IF NEW.pass_fail = 'FAIL' THEN
//         -- 1. Quarantine the batch
//         UPDATE batches
//         SET current_status = 'Quarantined'
//         WHERE batch_id = NEW.batch_id;

//         -- 2. Log an alert in the system
//         INSERT INTO system_alerts (batch_id, alert_type, alert_message)
//         VALUES (NEW.batch_id, 'SAFETY_VIOLATION',
//                 'Batch Quarantined. Failed inspection. Temp recorded: ' || NEW.recorded_temp);
//     END IF;

//     RETURN NEW;
// END;
// $$;

// CREATE TRIGGER after_inspection_insert
// AFTER INSERT ON safety_inspections
// FOR EACH ROW
// EXECUTE FUNCTION trg_audit_safety_inspection();
