const express = require('express');
const router  = express.Router();
const { getVaccines, addVaccine, updateVaccine, deleteVaccine } = require('../controllers/vaccineController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/',    authenticateToken,                        getVaccines);
router.post('/',   authenticateToken, authorizeRole('hospital'), addVaccine);
router.put('/:id', authenticateToken, authorizeRole('hospital'), updateVaccine);
router.delete('/:id', authenticateToken, authorizeRole('hospital'), deleteVaccine);

module.exports = router;
