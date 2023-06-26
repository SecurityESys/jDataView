(function (factory) {
	var global = this || window.global || window;


	if (NODE || typeof exports === 'object') {
		module.exports = factory(global);
	} else
	if (BROWSER) {
		if (typeof define === 'function' && define.amd) {
			define([], function () {
				return factory(global);
			});
		}
		else {
			global.jDataView = factory(global);
		}
	}
}(function (global) {

'use strict';
