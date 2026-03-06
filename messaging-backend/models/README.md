# Models (Legacy)

This directory previously contained Mongoose model stubs from the MongoDB era.
All data persistence now uses `services/store.js` (JSON file-backed in-memory store).

The model files were removed because they were never imported by any route or service.
Data shapes are defined inline in each route file and in `store.js`.
