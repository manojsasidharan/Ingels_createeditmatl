/*global QUnit*/

sap.ui.define([
	"Ingles/Mock/CreateEditMaterial/controller/CreateEditMaterial.controller"
], function (Controller) {
	"use strict";

	QUnit.module("CreateEditMaterial Controller");

	QUnit.test("I should test the CreateEditMaterial controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});