const express = require('express');
const SearchController = require('../controllers/search.controllers.js')

const router = express.Router();

router.get("/:coleccion/:criterio", SearchController.search);

module.exports = router;