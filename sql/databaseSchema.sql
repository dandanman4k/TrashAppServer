-- Users table: holds user info
CREATE TABLE Users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT
);

-- TrashType: defines what trash types are allowed
CREATE TABLE TrashType (
  id VARCHAR PRIMARY KEY, -- e.g. 'plasticBottle', 'can'
  label TEXT NOT NULL      -- Human-readable name
);

-- TrashLocation: represents a real-world geolocation
CREATE TABLE TrashLocation (
  id BIGSERIAL PRIMARY KEY,
  location GEOGRAPHY(Point, 4326) NOT NULL
);

-- TrashSubmission: each user submission at a location
CREATE TABLE TrashSubmission (
  id BIGSERIAL PRIMARY KEY,
  userId BIGINT REFERENCES Users(id) ON DELETE CASCADE,
  locationId BIGINT REFERENCES TrashLocation(id) ON DELETE CASCADE,
  submittedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Images: each image is linked to a submission (not directly to TrashLocation)
CREATE TABLE Images (
  id BIGSERIAL PRIMARY KEY,
  submissionId BIGINT REFERENCES TrashSubmission(id) ON DELETE CASCADE,
  fileLocation TEXT NOT NULL
);

-- SubmissionTrashType: stores each trash type and its amount for a submission
CREATE TABLE TrashSubmissionTrashType (
  id BIGSERIAL PRIMARY KEY,
  submissionId BIGINT REFERENCES TrashSubmission(id) ON DELETE CASCADE,
  trashTypeId VARCHAR REFERENCES TrashType(id),
  amount BIGINT NOT NULL
);
