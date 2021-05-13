sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/Dialog",
	"sap/m/DialogType",
	"sap/m/Button",
	"sap/m/ButtonType",
	"sap/m/Label",
	"sap/ui/model/json/JSONModel"
], function (Controller, Dialog, DialogType, Button, ButtonType, Label, JSONModel) {
	"use strict";

	return Controller.extend("Ingles.Mock.CreateEditMaterial.controller.Master", {
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();			
			this.eventBus = sap.ui.getCore().getEventBus();
			this.mode = this.getOwnerComponent().mode;
			this.modes = this.getOwnerComponent().modes;
		},

		onSearchPress: function (ev) {
			this.oRouter.navTo("searchDetail", {
				layout: "TwoColumnsMidExpanded"
			});
			this.eventBus.publish("createEditMaterial", "DataPasing", {});
		},

		onRefMaterialSelect: function (ev) {
			if (ev.getSource().getSelectedKey() === "") {
				this.getView().byId("matType").setEnabled(true);
				this.getView().byId("matCategory").setEnabled(true);
			} else {
				this.getView().byId("matType").setEnabled(false);
				this.getView().byId("matCategory").setEnabled(false);
				this.getView().byId("matType").setSelectedKey("ZHAW");
				this.getView().byId("matCategory").setSelectedKey("00");
			}
		},

		onCreateNext: function () {
			var appControl = this.getOwnerComponent().getModel("appControl").getData();
			var mRdg = appControl.sourcingTypeKey;
			var mSourcingType = ["Warehouse", "DSD", "Cross Dock"][mRdg];
			var mrefMaterial = appControl.refMaterial;
			var mText = "You have selected '" + mSourcingType + "' with reference material '" + mrefMaterial + "'";
			this.getView().setModel(new JSONModel({
				text: mText
			}), "Confirm");
			this.onCreateDialogConfirm(mText);
		},

		onCreateDialogConfirm: function (mText) {
			this.oConfirmDialog = new Dialog({
				type: DialogType.Message,
				title: "Alert",
				content: [
					new sap.m.Text({
						text: mText
					})
				],
				beginButton: new Button({
					type: ButtonType.Emphasized,
					text: "OK",
					press: function () {
						sap.ui.core.BusyIndicator.show(0);
						if (this.mode === this.modes.display) {
							this.getView().getModel("appControl").setProperty("/editable", false);
						} else {
							this.getView().getModel("appControl").setProperty("/editable", true);
						}
						this.oRouter.navTo("newMaterialData", {
							layout: sap.f.LayoutType.MidColumnFullScreen
						});
						this.oConfirmDialog.close();
					}.bind(this)
				}),
				endButton: new Button({
					text: "Cancel",
					press: function () {
						this.oConfirmDialog.close();
					}.bind(this)
				})
			});

			this.oConfirmDialog.open();
		}

	});
});