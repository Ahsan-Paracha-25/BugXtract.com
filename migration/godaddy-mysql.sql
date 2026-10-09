-- BugXtract GoDaddy Hosted MySQL schema and public seed
-- Import into the empty GoDaddy Hosted Database.
-- Admin password is intentionally not included; create it through /admin.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS site_pricing (
  id INT NOT NULL PRIMARY KEY,
  content LONGTEXT NOT NULL,
  updated_at VARCHAR(64) NOT NULL,
  updated_by VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_credentials (
  id INT NOT NULL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  salt VARCHAR(255) NOT NULL,
  password_hash VARCHAR(512) NOT NULL,
  iterations INT NOT NULL DEFAULT 100000,
  recovery_used TINYINT NOT NULL DEFAULT 0,
  updated_at VARCHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_auth_attempts (
  ip_hash VARCHAR(255) NOT NULL PRIMARY KEY,
  failures INT NOT NULL,
  window_started BIGINT NOT NULL,
  blocked_until BIGINT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_reviews (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL DEFAULT '',
  role VARCHAR(255) NOT NULL DEFAULT '',
  company VARCHAR(255) NOT NULL DEFAULT '',
  headline TEXT NOT NULL,
  body TEXT NOT NULL,
  rating DECIMAL(3,1) NOT NULL DEFAULT 0,
  image_key VARCHAR(512) NOT NULL DEFAULT '',
  published TINYINT NOT NULL DEFAULT 0,
  created_at VARCHAR(64) NOT NULL,
  updated_at VARCHAR(64) NOT NULL,
  INDEX idx_customer_reviews_published_updated (published, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_settings (
  id INT NOT NULL PRIMARY KEY,
  recipient_email VARCHAR(255) NOT NULL,
  relay_url TEXT NULL,
  updated_at VARCHAR(64) NOT NULL,
  updated_by VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_submission_limits (
  ip_hash VARCHAR(255) NOT NULL PRIMARY KEY,
  submissions INT NOT NULL,
  window_started BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO contact_settings (id, recipient_email, relay_url, updated_at, updated_by)
VALUES (1, 'hello@bugxtract.com', NULL, UTC_TIMESTAMP(), 'migration')
ON DUPLICATE KEY UPDATE recipient_email = VALUES(recipient_email);

INSERT INTO site_pricing (id, content, updated_at, updated_by)
VALUES (1, '{"plans":[{"id":"free","name":"Free QA Trial","price":"$0","billing":"One-time evaluation","hours":"2 hours","originalPrice":"$30–$60"},{"id":"starter","name":"Starter QA","price":"$90–$180","billing":"Per project","hours":"6–12 hours","originalPrice":"$150–$300"},{"id":"professional","name":"Professional QA","price":"$300–$600","billing":"Per project","hours":"20–40 hours","originalPrice":"$500–$1000","popular":true},{"id":"complete","name":"Complete QA","price":"$900–$1800","billing":"Per scoped engagement","hours":"60–120 hours","originalPrice":"$1500–$3000"}],"retainers":[{"id":"essential","name":"Essential","hours":"20 hours / month","price":"$260 / month"},{"id":"growth","name":"Growth","hours":"40 hours / month","price":"$520 / month"},{"id":"dedicated","name":"Dedicated","hours":"80 hours / month","price":"$1040 / month"}]}', UTC_TIMESTAMP(), 'migration')
ON DUPLICATE KEY UPDATE content = VALUES(content), updated_at = VALUES(updated_at), updated_by = VALUES(updated_by);

INSERT INTO customer_reviews (id, customer_name, role, company, headline, body, rating, image_key, published, created_at, updated_at)
VALUES
('4c2a0574-ee28-4afa-b461-69de919b611d','Daniel Thompson','Technical Lead','', 'A Dependable Partner for API and Integration Testing', 'Our platform relies on multiple APIs and third-party integrations, so reliability was a major concern. The QA team performed extensive API testing, covering request validation, response accuracy, error handling, authentication, and complex integration scenarios. Their systematic approach uncovered issues that could have impacted our production environment. We were particularly impressed with their technical expertise, responsiveness, and clear defect documentation.', 5.0, 'review-e22fd7c6-9f66-4978-800c-d063d81ed018.jpg', 1, UTC_TIMESTAMP(), UTC_TIMESTAMP()),
('7d2feb44-99cc-486f-9759-95ddceb2501f','Mohammed Al-Dossari','IT Director','Riyadh Digital Finance', 'A Trusted QA Partner for Complex Enterprise Systems', 'We worked with the team to validate our enterprise management system and its integrations with multiple third-party services. Their testing covered user permissions, financial reporting, API responses, and critical business workflows. They consistently delivered clear bug reports and valuable insights. Their professionalism, technical understanding, and dedication to software quality made the entire engagement a positive experience.', 5.0, 'review-2b38314b-3dd9-45fa-9bef-68ca4ab8e7ff.jpg', 1, UTC_TIMESTAMP(), UTC_TIMESTAMP()),
('be0f3603-6625-4076-9887-855775cc6cea','Sarah Mitchell','Chief Technology Officer','MediBridge', 'Exceptional Quality Assurance for Our Web Platform', 'We partnered with the team to thoroughly test our web application before launch, and the results were outstanding. Their attention to detail, structured testing approach, and ability to identify critical bugs significantly improved our platform stability and user experience. Communication was excellent throughout the project, and every issue was documented with clear reproduction steps. Highly recommended for any business that values software quality.', 5.0, 'review-529627b2-bb39-4cef-a472-e7dbd56a0bd9.jpg', 1, UTC_TIMESTAMP(), UTC_TIMESTAMP())
ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at);
