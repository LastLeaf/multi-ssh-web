// Copyright 2014 LastLeaf
'use strict';

// init fw.mpa
var fw = require('fw.mpa');
var config = JSON.parse(require('fs').readFileSync('config.json').toString('utf8'));

// start with two apps
process.chdir(__dirname);
fw({
	ip: config.ip || '127.0.0.1',
	port: config.port || 1180,
	app: 'app.js'
});
