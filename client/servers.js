// Copyright 2014 LastLeaf
'use strict';

fw.main(function(pg){
	$('#wrapper').html(pg.tmpl.main());
	pg.rpc('server:setPrivateKey', app.config.get('privateKey'), function(){
		pg.rpc('server:set', app.config.get('servers'), function(){
			pg.rpc('server:listenStatus', function(){
				// TODO
			});
		});
	});
	pg.on('socketDisconnect', function(){
		fw.go('/');
	});
});
