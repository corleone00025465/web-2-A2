const express = require('express');
const controller = require('../controllers/eventController');

const router = express.Router();

router.get('/categories', controller.categories);
router.get('/organisations', controller.organisations);
router.get('/search', controller.search);
router.get('/', controller.list);
router.get('/:id', controller.getById);

router.all('*', (_req, res) => {
  res.set('Allow', 'GET').status(405).json({ error: 'Method not allowed in Assessment 2' });
});

module.exports = router;
