const express = require('express');
const router = express.Router();
const trainingsController = require('../controllers/trainingsController');
const authMiddleware = require('../middleware/auth');

// Публичные маршруты
router.get('/', trainingsController.getAllTrainings);
router.get('/:id', trainingsController.getTrainingById);

// Защищённые маршруты
router.post('/', authMiddleware, trainingsController.createTraining);
router.put('/:id', authMiddleware, trainingsController.updateTraining);
router.delete('/:id', authMiddleware, trainingsController.deleteTraining);

module.exports = router;