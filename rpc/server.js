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
		conn.ssh[server].on('execError', function(cmd, err){
			if(!conn.ssh[server]) return;
			conn.sshEvent.emit('ev', ['execError', server, cmd, err.message]);
		});
		conn.ssh[server].on('execDone', function(cmd){
			if(!conn.ssh[server]) return;
			conn.sshEvent.emit('ev', ['execDone', server, cmd]);
		});
		conn.ssh[server].on('execFail', function(cmd, code, signal){
			if(!conn.ssh[server]) return;
			conn.sshEvent.emit('ev', ['execFail', server, cmd, code, signal]);
		});
		conn.ssh[server].on('execStdout', function(cmd, data){
			if(!conn.ssh[server]) return;
			conn.sshEvent.emit('ev', ['execStdout', server, cmd, data.toString('utf8')]);
		});
		conn.ssh[server].on('execStderr', function(cmd, data){
			if(!conn.ssh[server]) return;
			conn.sshEvent.emit('ev', ['execStderr', server, cmd, data.toString('utf8')]);
		});
	});
	res();
};

exports.listenStatus = function(conn, res){
	if(!conn.inited) return res.err('');
	var obj = {};
	for(var k in conn.ssh) {
		obj[k] = conn.ssh[k].connected;
	}
	res(obj);
	conn.sshEvent.on('ev', function(args){
		conn.msg.apply(conn, args);
	});
};

exports.execCommands = function(conn, res, servers, commands, args){
	if(servers.constructor !== Array) return res.err('');
	// parse commands
	var cmds = String(commands).match(/^.+$/mg) || [];
	var args = String(args).match(/^.+$/mg) || [];
	if(args.length && servers.length !== args.length) return res.err('Rows of args should be equal to the count of servers.');
	// run in each server
	servers.forEach(function(server){
		if(!conn.ssh.hasOwnProperty(server)) return;
		var argv = (args.shift() || '').split('\t');
		var ssh = conn.ssh[server];
		var cur = 0;
		var nextCmd = function(){
			if(cur >= cmds.length) return;
			var cmd = cmds[cur++];
			cmd = cmd.replace(/\$./g, function(ori){
				var n = ori.charCodeAt(1) - 48;
				if(n < 0 || n > 9) return ori[1];
				if(n) return argv[n-1];
				return server;
			});
			ssh.exec(cmd, function(err, stream){
				if(!stream) return;
				stream.on('exit', function(code, signal){
					if(!code && !signal) nextCmd();
				});
			});
		};
		nextCmd();
	});
	res();
};
