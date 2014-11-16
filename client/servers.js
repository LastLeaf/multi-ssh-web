// Copyright 2014 LastLeaf
'use strict';

fw.main(function(pg){
	fw.loadingLogo.show();
	// parse servers
	var serverStrs = app.config.get('servers');
	var servers = [];
	for(var i=0; i<serverStrs.length; i++) {
		var str = serverStrs[i];
		var match = str.match(/\{([0-9]+)\,([0-9]+)\}/);
		if(!match) servers.push(str);
		else {
			for(var j=Number(match[1]); j<=Number(match[2]); j++) {
				servers.push( str.replace(/\{[0-9]+\,[0-9]+\}/, j) );
			}
		}
	}
	// init connection
	pg.rpc('server:setPrivateKey', app.config.get('privateKey'), function(){
		pg.rpc('server:set', servers, function(){
			pg.rpc('server:listenStatus', function(status){
				initPage(status);
			});
		});
	});
	pg.on('socketDisconnect', function(){
		if(!pg.destroyed) fw.go('/');
	});
	// history obj
	var history = {};
	servers.forEach(function(server){
		history[server] = [];
	});
	// connected
	var initPage = function(status){

		// init page structure
		fw.loadingLogo.hide();
		$('#wrapper').html(pg.tmpl.main(status));
		var $statusList = $('#statusList');
		var $statusButtons = $('#statusButtons');

		// status listeners
		pg.msg('connected', function(server){
			$statusList.find('[server="'+server+'"]').removeClass('status-disconnected status-busy status-error').addClass('status-connected');
		});
		pg.msg('disconnected', function(server){
			$statusList.find('[server="'+server+'"]').removeClass('status-connected status-busy status-error').addClass('status-disconnected');
		});
		pg.msg('execStart', function(server, command){
			$statusList.find('[server="'+server+'"]').removeClass('status-connected status-disconnected status-error').addClass('status-busy')
			.attr('title', command);
			history[server].push({ type: 'execStart', text: command });
			historyUpdated(server);
		});
		pg.msg('execDone', function(server, command){
			$statusList.find('[server="'+server+'"]').removeClass('status-disconnected status-busy status-error').addClass('status-connected');
			history[server].push({ type: 'execDone', text: 'Done.' });
			historyUpdated(server);
		});
		pg.msg('execError', function(server, command, err){
			$statusList.find('[server="'+server+'"]').removeClass('status-connected status-disconnected status-busy').addClass('status-error')
			.attr('title', command + '\n' + err);
			history[server].push({ type: 'execError', text: err });
			historyUpdated(server);
		});
		pg.msg('execFail', function(server, command, code, signal){
			$statusList.find('[server="'+server+'"]').removeClass('status-connected status-disconnected status-busy').addClass('status-error')
			.attr('title', command + '\nExit Code: ' + code + ' Signal: ' + signal);
			history[server].push({ type: 'execFail', text: 'Exit Code: ' + code + ' Signal: ' + signal });
			historyUpdated(server);
		});
		pg.msg('execStdout', function(server, command, data){
			history[server].push({ type: 'execStdout', text: data });
			historyUpdated(server);
		});
		pg.msg('execStderr', function(server, command, data){
			history[server].push({ type: 'execStderr', text: data });
			historyUpdated(server);
		});

		// select/unselect
		$statusList.on('click', '[server]', function(e){
			var $server = $(this);
			if($server.hasClass('status-busy')) $server.removeClass('status-selected');
			else $server.toggleClass('status-selected');
		});
		$statusButtons.find('.statusSelectAll').click(function(e){
			$statusList.find('[server]').addClass('status-selected').filter('.status-busy').removeClass('status-selected');
		});
		$statusButtons.find('.statusSelectNone').click(function(e){
			$statusList.find('[server]').removeClass('status-selected');
		});

		// command
		var prevCommands = '';
		var prevArgs = '';
		$statusButtons.find('.statusCommand').click(function(e){
			var servers = [];
			$statusList.find('.status-selected').each(function(){
				servers.push($(this).attr('server'));
			});
			var $form = $('#main').html(pg.tmpl.commands({
				servers: servers,
				serverCount: servers.length
			}));
			$form.find('.commandsSubmit').click(function(e){
				$statusList.find('.status-selected').removeClass('status-selected');
				var $btn = $(this).attr('disabled', true);
				pg.rpc('server:execCommands', servers, $form.find('[name=commands]').val(), $form.find('[name=args]').val(), function(){
					$form.find('textarea').attr('disabled', true);
				}, function(err){
					$btn.removeAttr('disabled');
					if(err) {
						$form.find('[name=args]').val( 'Error: ' + err + '\n\n' + $form.find('[name=args]').val() ).focus();
					}
				});
			});
			$form.find('[name=commands]').val(prevCommands).change(function(){
				prevCommands = $(this).val();
			});
			$form.find('[name=args]').val(prevArgs).change(function(){
				prevArgs = $(this).val();
			});
			currentHistory = '';
		});

		// show history
		var currentHistory = '';
		$statusList.on('dblclick', '[server]', function(e){
			var server = $(this).attr('server');
			var $main = $('#main').html(pg.tmpl.history({
				server: server,
				history: history[server]
			}));
			$main.find('.historyClear').click(function(e){
				history[server] = [];
				$('#main').html('');
			});
			$main.find('.historyCommand').submit(function(e){
				e.preventDefault();
				var $form = $(this);
				var cmd = $form.find('[type=text]').val();
				$form.find('[type=submit]').attr('disabled', true);
				pg.rpc('server:execCommands', [server], cmd, '', function(){
					$form.find('[type=text]').val('');
					$form.find('[type=submit]').removeAttr('disabled');
				}, function(){
					$form.find('[type=submit]').removeAttr('disabled');
				});
			});
			currentHistory = server;
		});
		var historyUpdated = function(server){
			if(currentHistory !== server) return;
			var item = history[server][ history[server].length - 1 ];
			$(pg.tmpl.historyItem(item)).insertBefore($('#main').find('.historyCommand'));
		};
	};
});
