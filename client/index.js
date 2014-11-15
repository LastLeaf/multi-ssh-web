// Copyright 2014 LastLeaf
'use strict';

fw.main(function(pg){
	$('#wrapper').html(pg.tmpl.main());
	// read init val
	var $form = $('#config');
	$form.find('[name=servers]').val((app.config.get('servers') || []).join('\n'));
	$form.submit(function(e){
		e.preventDefault();
		var servers = $form.find('[name=servers]').val().match(/^.+$/mg);
		if(!servers) {
			$form.find('[name=servers]').focus();
			return;
		}
		app.config.set('servers', servers);
		var privateKey = $form.find('[name=privateKey]').val();
		if(privateKey.match(/\w/)) app.config.set('privateKey', privateKey);
		fw.go('/servers');
	});
});
