sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel"
], function (Controller, Fragment, JSONModel) {
	"use strict";

	return Controller.extend("Ingles.AddOn.CreateEditMaterial.controller.CreateEditMaterial", {
		onInit: function () {
			this.getView().getControlsByFieldGroupId("lbl").forEach(function(mLbl) {
				mLbl.setTooltip(mLbl.getText());
			});
		},
		
		onProductAttributesPress: function() {
			if (!this.PADialog) {
				var that = this;
				Fragment.load({
					id: "PADialog",
					name: "Ingles.AddOn.CreateEditMaterial.fragment.ProductAttributes",
					controller: this
				}).then(function (oDialog) {
					that.PADialog = oDialog;
					that.getView().addDependent(that.PADialog);
					that.PADialog.open();
				});
			} else {
				this.PADialog.open();
			}
		},
		
		onProductAttributesCancel: function() {
			this.PADialog.close();
		},
		
		onCostUpdatesPress: function() {
			if (!this.CUDialog) {
				var that = this;
				Fragment.load({
					id: "CUDialog",
					name: "Ingles.AddOn.CreateEditMaterial.fragment.CostUpdates",
					controller: this
				}).then(function (oDialog) {
					that.CUDialog = oDialog;
					that.getView().addDependent(that.CUDialog);
					that.CUDialog.open();
				});
			} else {
				this.CUDialog.open();
			}
		},
		
		onCostUpdatesCancel: function() {
			this.CUDialog.close();
		},
		
		onVendorFundingPress: function() {
			if (!this.VFDialog) {
				var that = this;
				Fragment.load({
					id: "VFDialog",
					name: "Ingles.AddOn.CreateEditMaterial.fragment.VendorFunding",
					controller: this
				}).then(function (oDialog) {
					that.VFDialog = oDialog;
					that.getView().addDependent(that.VFDialog);
					that.VFDialog.open();
				});
			} else {
				this.VFDialog.open();
			}
		},
		
		onVendorFundingCancel: function() {
			this.VFDialog.close();
		},
		
		onAccountingViewPress: function() {
			if (!this.AVDialog) {
				var that = this;
				Fragment.load({
					id: "AVDialog",
					name: "Ingles.AddOn.CreateEditMaterial.fragment.AccountingView",
					controller: this
				}).then(function (oDialog) {
					that.AVDialog = oDialog;
					that.getView().addDependent(that.AVDialog);
					that.AVDialog.open();
				});
			} else {
				this.AVDialog.open();
			}
		},
		
		onAccountingViewCancel: function() {
			this.AVDialog.close();
		}
	});
});