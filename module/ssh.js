// Copyright 2014 LastLeaf
'use strict';

var RECONNECT_INTERVAL = 5000;

var EventEmitter = require('events').EventEmitter;
var Connection = require('ssh2');

module.exports = function(app, cb){
	cb(function(addr, privkey){
		// parse addr
		var host = addr;
		var port = 22;
		var user = 'root';
		var match = addr.match(/^([^@]*)@?([^\:]+)\:?([0-9]*)$/);
		if(match) {
			if(match[1]) user = match[1];
			host = match[2];
			if(match[3]) port = match[3];
		}
		// create ssh connection
		var conn = null;
		var connected = false;
		var ev = new EventEmitter();
		var reconnect = function(){
			var thisConn = conn = new Connection();
			conn.on('ready', function() {
				connected = true;
				ev.emit('connected');
			});
			var disconnected = function(err){
				if(destroyed || conn !== thisConn) return;
				conn.end();
				conn = null;
				connected = false;
				setTimeout(reconnect, RECONNECT_INTERVAL);
				ev.emit('disconnected', err);
			};
			conn.on('error', disconnected);
			conn.on('close', disconnected);
			conn.connect({
				host: host,
				port: port,
				username: user,
				privateKey: privkey
			});
			return conn;
		};
		// destroy
		var destroyed = false;
		var destroy = function(){
			if(destroyed) return;
			destroyed = true;
			connected = false;
			if(conn) conn.end();
		};
		// exec proxy
		var executing = false;
		var exec = function(command, cb){
			ev.emit('execStart', command);
			if(!connected || executing) {
				setTimeout(function(){
					var err = new Error('Connection not available.');
					ev.emit('execError', err);
					cb(err);
				}, 0);
				return;
			}
			executing = true;
			conn.exec(command, function(err, stream){
				executing = false;
				if(!err) {
					stream.on('exit', function(code, signal){
						if(!code && !signal) {
							ev.emit('execDone');
						} else {
							ev.emit('execFail', code, signal);
						}
					});
				} else {
					ev.emit('execError', err);
				}
				cb(err, stream);
			});
		};
		// return api
		reconnect();
		return Object.create(ev, {
			connected: {
				get: function(){ return connected; },
				set: function(){}
			},
			exec: {
				get: function(){ return exec; },
				set: function(){}
			},
			destroy: {
				get: function(){ return destroy; },
				set: function(){}
			}
		});
	});
};
