const express = require('express');
const router  = express.Router();
const { getHospitals, getTimings, saveTimings } = require('../controllers/hospitalController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/',                   authenticateToken,                        getHospitals);
router.get('/:name/timings',      authenticateToken,                        getTimings);
router.put('/:name/timings',      authenticateToken, authorizeRole('hospital'), saveTimings);

module.exports = router;
