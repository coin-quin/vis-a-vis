/*
* Copyright (c) TUT Tampere University of Technology 2014-2015.
* All rights reserved.
* This software has been developed in Tekes-TIVIT project Need-for-Speed.
* All rule set in consortium agreement of Need-for-Speed project apply.
*
* Main authors: Antti Luoto, Anna-Liisa Mattila, Henri Terho
*/

var express = require('express');
var router = express.Router();


//serve HTML content 
router.get('/', function(req, res) {
  res.sendfile('./frontend/views/index.html');
});

router.get('/issue-timeline', function(req, res) {
  res.sendfile('./frontend/views/issue-timeline.html');
});

router.get('/amount-timeline', function(req, res) {
  res.sendfile('./frontend/views/amount-timeline.html');
});

router.get('/custom-timeline', function(req, res) {
  res.sendfile('./frontend/views/custom-timeline.html');
});

router.get('/session-timeframe', function(req, res) {
  res.sendfile('./frontend/views/session-timeframe.html');
});

router.get('/user-timeframe', function(req, res) {
  res.sendfile('./frontend/views/user-timeframe.html');
});

module.exports = router;