// Copyright 2014 LastLeaf
'use strict';

fw.main(function(pg){
	window.app = {};
	// init local storage visitor
	app.config = {
		get: function(key){
			return JSON.parse(localStorage.getItem('multi-ssh-web') || '{}')[key];
		},
		set: function(key, value){
			var config = JSON.parse(localStorage.getItem('multi-ssh-web') || '{}');
			config[key] = value;
			localStorage.setItem('multi-ssh-web', JSON.stringify(config));
		},
		delete: function(key, value){
			var config = JSON.parse(localStorage.getItem('multi-ssh-web') || '{}');
			delete config[key];
			localStorage.setItem('multi-ssh-web', JSON.stringify(config));
		}
	};
	// init page structure
	$('body').append('<div id="wrapper" class="wrapper"></div>');
	pg.on('childLoadStart', function(){
		$('#wrapper').html('');
	});
});
