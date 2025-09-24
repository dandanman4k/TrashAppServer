const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const app = express();
const port = 3000;
 
app.post('/upload', upload.single('image'), async (req, res) => {
  const { userId, latitude, longitude, trashTypes } = req.body;
  const parsedTrashTypes = typeof trashTypes === 'string' ? JSON.parse(trashTypes) : trashTypes;
  const fileLocation = req.file?.path || null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find nearby existing location (within 10 meters)
    const locationQuery = await client.query(
      `SELECT id FROM "TrashLocation"
       WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($1, $2), 4326), 10)
       LIMIT 1`,
      [longitude, latitude]
    );

    let locationId;
    if (locationQuery.rowCount > 0) {
      locationId = locationQuery.rows[0].id;
    } else {
      const newLocation = await client.query(
        `INSERT INTO "TrashLocation" (location)
         VALUES (ST_SetSRID(ST_MakePoint($1, $2), 4326))
         RETURNING id`,
        [longitude, latitude]
      );
      locationId = newLocation.rows[0].id;
    }


    const submissionInsert = await client.query(
      `INSERT INTO "TrashSubmission" (userId, locationId)
       VALUES ($1, $2) RETURNING id`,
      [userId, locationId]
    );
    const submissionId = submissionInsert.rows[0].id;

    if (fileLocation) {
      await client.query(
        `INSERT INTO "Images" (submissionId, fileLocation)
         VALUES ($1, $2)`,
        [submissionId, fileLocation]
      );
    }

    for (const [typeId, amount] of Object.entries(parsedTrashTypes)) {
      await client.query(
        `INSERT INTO "TrashSubmissionTrashType" (submissionId, trashTypeId, amount)
         VALUES ($1, $2, $3)`,
        [submissionId, typeId, amount]
      );
    }


    await client.query('COMMIT');
    res.status(201).json({ message: 'Data submitted', locationId });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to upload data' });

  } finally {
    client.release();
  }
});


//To get the average amount per trash type per location
/*
SELECT
  tl.id AS location_id,
  tt.label AS trash_type,
  AVG(tstt.amount)::numeric(10,2) AS average_amount
FROM TrashSubmissionTrashType tstt
JOIN TrashSubmission ts ON ts.id = tstt.submissionId
JOIN TrashLocation tl ON tl.id = ts.locationId
JOIN TrashType tt ON tt.id = tstt.trashTypeId
GROUP BY tl.id, tt.label
ORDER BY tl.id, tt.label;
*/