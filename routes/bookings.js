const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookingsController');
const authMiddleware = require('../middleware/auth');

// Все маршруты бронирования требуют авторизации
router.get('/', authMiddleware, bookingsController.getUserBookings);
router.post('/', authMiddleware, bookingsController.createBooking);
router.delete('/:bookingId', authMiddleware, bookingsController.cancelBooking);

module.exports = router;