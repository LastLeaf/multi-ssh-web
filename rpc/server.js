// Copyright 2014 LastLeaf
'use strict';

var EventEmitter = require('events').EventEmitter;

var ssh = fw.module('ssh.js');

exports.setPrivateKey = function(conn, res, privateKey){
	conn.privateKey = String(privateKey);
	res();
};

exports.set = function(conn, res, servers){
	if(servers.constructor !== Array) return res.err('');
	// init conn events
	if(!conn.inited) {
		conn.on('close', function(){
			for(var k in conn.ssh) {
				conn.ssh[k].destroy();
			}
		});
		conn.ssh = {};
		conn.sshEvent = new EventEmitter();
		conn.inited = true;
	}
	// disconnect old servers
	for(var k in conn.ssh) {
		for(var j=0; j<servers.length; j++) {
			if(k === servers[j]) break;
		}
		if(j === servers.length) {
			conn.ssh[k].destroy();
		}
	}
	conn.ssh = {};
	// set and connect
	servers.forEach(function(server){
		if(conn.ssh[server]) return;
		conn.ssh[server] = ssh(server, conn.privateKey);
		conn.ssh[server].on('connected', function(){
			if(!conn.ssh[server]) return;
			conn.sshEvent.emit('ev', ['connected', server]);
		});
		conn.ssh[server].on('disconnected', function(err){
			if(!conn.ssh[server]) return;
			conn.sshEvent.emit('ev', ['disconnected', server, err.message]);
		});
		conn.ssh[server].on('execStart', function(cmd){
			if(!conn.ssh[server]) return;
			conn.sshEvent.emit('ev', ['execStart', server, cmd]);
		});
		conn.ssh[server].on('execError', function(){
			if(!conn.ssh[server]) return;
			conn.sshEvent.emit('ev', ['execError', server, err.message]);
		});
		conn.ssh[server].on('execDone', function(){
			if(!conn.ssh[server]) return;
			conn.sshEvent.emit('ev', ['execDone', server]);
		});
		conn.ssh[server].on('execFail', function(code, signal){
			if(!conn.ssh[server]) return;
			conn.sshEvent.emit('ev', ['execFail', server, code, signal]);
		});
	});
	res();
};

exports.listenStatus = function(conn, res){
	if(!conn.inited) return res.err('');
	res();
	conn.sshEvent.on('ev', function(args){
		conn.msg.apply(conn, args);
	});
};
