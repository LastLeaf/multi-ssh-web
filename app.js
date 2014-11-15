// Copyright 2014 LastLeaf
'use strict';

var fs = require('fs');

var config = {
	app: {
		title: 'multi-ssh-web',
		version: JSON.parse(fs.readFileSync('package.json').toString('utf8')).version
	},
	secret: {
		cookie: JSON.parse(fs.readFileSync('config.json').toString('utf8')).secret
	}
};

var routes = {
	global: {
		lib: 'jquery-2.1.1',
		main: 'global.js'
	},
	'*': {
		parent: 'global',
		redirect: 'index.js'
	},
	'/': {
		parent: 'global',
		main: 'index.js',
		tmpl: 'index.tmpl'
	},
	'/servers': {
		parent: 'global',
		main: 'servers.js',
		tmpl: 'servers.tmpl'
	}
};

module.exports = function(app){
	app.setConfig(config);
	app.bindDir('client', 'client');
	app.bindDir('rpc', 'rpc');
	app.bindDir('module', 'module');
	app.bindDir('static', 'static');
	app.route.setList(routes);
	app.start();
};
