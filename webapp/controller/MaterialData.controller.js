sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/m/MessageToast",
	"sap/ui/model/ListBinding",
	//"sap/ui/comp/filterbar/FilterBar",
	"Ingles/AddOn/CreateEditMaterial/controller/ValueHelper",
	// "sap/m/Input",
	// "sap/m/SearchField",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (Controller, Fragment, JSONModel, History, MessageToast, ListBinding, ValueHelper, Filter, FilterOperator) {
	"use strict";

	return Controller.extend("Ingles.AddOn.CreateEditMaterial.controller.MaterialData", {
		onInit: function () {
			this.getView().getControlsByFieldGroupId("lbl").forEach(function (mLbl) {
				mLbl.setTooltip(mLbl.getText());
			});

			this.getView().setModel(new JSONModel([{}, {}]), "VendorFundsModel");
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("newMaterialData").attachPatternMatched(this._onObjectMatched, this);
			oRouter.getRoute("currentMaterialData").attachPatternMatched(this._onObjectMatched, this);

			var globalsiteblock = this.getView().byId("globalSiteBlock"),
				globalsiteblockexcp = this.getView().byId("globalSiteBlockException");

			this.siteList = this.getOwnerComponent().getModel("MasterDataModel").getProperty("/siteList");

			globalsiteblock.addValidator(function (args) {
				var siteData = this.siteList.filter(function (obj) {
					return obj.site === args.text;
				});
				if (siteData.length > 0) {
					return new sap.m.Token({
						key: args.text,
						text: siteData[0].name
					});
				} else return null;

			}.bind(this));

			globalsiteblockexcp.addValidator(function (args) {
				var siteData = this.siteList.filter(function (obj) {
					return obj.site === args.text;
				});
				if (siteData.length > 0) {
					return new sap.m.Token({
						key: args.text,
						text: siteData[0].name
					});
				} else return null;
			}.bind(this));

			this._vendorValueHelp = new ValueHelper(this, 'VENDOR');
			this._siteValueHelp = new ValueHelper(this, 'SITE');

		},

		onValueHelpVendor: function (oEvent) {
			this._vendorValueHelp.openValueHelp(oEvent);
		},

		onValueHelpSite: function (oEvent) {
			this._siteValueHelp.openValueHelp(oEvent);
		},

		showPageHeader: function (mode, editable) {
			if ((mode !== "CREATE") || (mode === "CREATE" && editable === false)) {
				return true;
			} else {
				return false;
			}
		},

		_onObjectMatched: function (oEvent) {
			var matData = {};
			var dataFound = false;
			var modes = this.getOwnerComponent().modes;
			var matnr = oEvent.getParameters().arguments.matnr;
			var commonData = this.getOwnerComponent().getModel("TestDataModel").getData();
			var costUpdate = this.getOwnerComponent().getModel("CostUpdatesModel").getData();
			var otherCondition = this.getOwnerComponent().getModel("OtherConditionsModel").getData();
			var appControl = this.getOwnerComponent().getModel("appControl").getData();
			var referenceSet = commonData.referenceSet;
			for (var i = 0; i < referenceSet.length; i++) {
				if ((appControl.mode === modes.create &&
						referenceSet[i].refMaterial === appControl.refMaterial &&
						referenceSet[i].materialGroup === appControl.materialGroup) || (appControl.mode !== modes.create &&
						referenceSet[i].matnr.toString() === matnr)) {
					matData = JSON.parse(JSON.stringify(referenceSet[i]));
					/*					matData.sourcingType = appControl.sourcingType;
										matData.refMaterial = appControl.refMaterial;
										matData.materialGroup = appControl.materialGroup;
										matData.materialType = appControl.materialType;
										matData.materialCategory = appControl.materialCategory;*/
					var today = this.getOwnerComponent().getToday();
					var enddate = "9999-12-31";
					var fnago = this.getOwnerComponent().getFortnightAgo();
					if (appControl.mode === modes.create) { //Clearing for create mock demo
						matData.sourcingType = appControl.sourcingType;
						matData.sourcingTypeKey = appControl.sourcingTypeKey;
						matData.purchasing.selectionCriteria.infoRec = "";
						matData.purchasing.selectionCriteria.matnr = "";
						matData.purchasing.selectionCriteria.vendorItem = "";
						matData.purchasing.sourcingDetails.underDelvTol = 0;
						matData.logistics.forecastParam.actWeeklyMvmt = "";
						matData.attributes.location = "";
						matData.accounting.currency = "";
						matData.accounting.totStock = "";
						matData.accounting.pricePerUnit = "";
						matData.accounting.priceUnit = "";
						matData.accounting.invValue = "";
						matData.purchasing.genData.whMovingAvgCost = "";
						matData.logistics.forecastParam.lastForecast = "";
						matData.posGlobal.blockedFrom = today;
						matData.posGlobal.authSellinStore = false;
					} else {
						matData.purchasing.headerInfo = this.getHeaderInfo(matData);
						matData.purchasing.vendorStoreBlocks = JSON.parse(JSON.stringify(commonData.vendorStoreBlocks));
					}
					matData.validity.validFrom = today;
					matData.validity.validTo = enddate;
					matData.validity.purchStatusFrom = today;
					matData.validity.billStatusFrom = today;
					matData.purchasing.conditionDetails.validTo = enddate;
					matData.logistics.genlControlParam.fromDate = today;

					var costUpdateArray = [];
					for (var j = 0; j < costUpdate.length; j++) {
						if (costUpdate[j].WHOnly) {
							if (matData.sourcingTypeKey === 0) {
								costUpdateArray.push(costUpdate[j]);
							}
						} else costUpdateArray.push(costUpdate[j]);

					}
					var sum = matData.purchasing.conditionDetails.netPrice;
					for (j = 0; j < costUpdateArray.length; j = j + 1) {
						if (costUpdateArray[j].isSubItem === true) {
							costUpdateArray[j].Cost = sum.toFixed(2);
						} else {
							sum = sum + parseFloat(costUpdateArray[j].Cost);
							costUpdateArray[j].FromDate = today;
							costUpdateArray[j].ToDate = enddate;
						}
					}
					matData.purchasing.conditionDetails.costUpdates = costUpdateArray;

					var otherConditionsArray = [];
					for (j = 0; j < otherCondition.length; j++) {
						if (otherCondition[j].Name === "Performance Allowance" || otherCondition[j].Name === "WH Up-Charge") {
							if (matData.sourcingTypeKey === 0) {
								otherConditionsArray.push(otherCondition[j]);
							}
						} else otherConditionsArray.push(otherCondition[j]);

					}
					matData.purchasing.conditionDetails.otherCondition = otherConditionsArray;

					matData.posStates = JSON.parse(JSON.stringify(commonData.posStates));
					matData.posFlags = JSON.parse(JSON.stringify(commonData.posFlags));
					matData.posStores = JSON.parse(JSON.stringify(commonData.posStores));
					matData.posStores.block.validFrom = today;
					matData.posStores.sellingPeriod.validFrom = fnago;
					matData.priceFamily = JSON.parse(JSON.stringify(commonData.priceFamily));
					matData.consumption = JSON.parse(JSON.stringify(commonData.consumption));

					for (i = 0; i < commonData.scaleNutrientSet.length; i++) {
						if (matData.matnr === commonData.scaleNutrientSet[i].matnr) {
							matData.nutrientData = JSON.parse(JSON.stringify(commonData.scaleNutrientSet[i].nutrientData));
							matData.scaleData = JSON.parse(JSON.stringify(commonData.scaleNutrientSet[i].scaleData));
							break;
						}

					}
					dataFound = true;
					break;
				}
			}
			this.getOwnerComponent().setModel(new JSONModel(matData), "material");

			if (dataFound) {
				var globalsiteblock = this.getView().byId("globalSiteBlock"),
					globalsiteblockexcp = this.getView().byId("globalSiteBlockException");
				globalsiteblock.destroyTokens();
				globalsiteblockexcp.destroyTokens();
				matData.posGlobal.blockData.blockedSites.forEach(function (obj) {
					globalsiteblock.addToken(new sap.m.Token({
						key: obj.key,
						text: obj.text
					}));
				});
				matData.posGlobal.blockData.blockedSitesExceptions.forEach(function (obj) {
					globalsiteblockexcp.addToken(new sap.m.Token({
						key: obj.key,
						text: obj.text
					}));
				});
			}

			var oUPCMsgLabel = this.getView().byId("UPCmessage");
			var upcmessage = this.validateUPC(matData.uomEAN, matData.sourcingTypeKey, matData.baseUoM);
			if (upcmessage !== "") {
				oUPCMsgLabel.setText(upcmessage);
				oUPCMsgLabel.setRequired(true);
			} else {
				oUPCMsgLabel.setText(upcmessage);
				oUPCMsgLabel.setRequired(false);
			}

			var UoMData = {
				"rows": (matData.uomEAN !== undefined) ? JSON.parse(JSON.stringify(matData.uomEAN)) : []
			};
			this.getOwnerComponent().setModel(new JSONModel(UoMData), "UoMData");
			var oUoMModel = this.getView().getModel("UoMData");
			var binding1 = new ListBinding(oUoMModel, "/rows");
			binding1.attachChange(
				function (event) {
					var UoMs = event.getSource().getModel().getProperty("/rows");
					var message = this.validateUPC(UoMs, matData.sourcingTypeKey, matData.baseUoM);
					if (message !== "") {
						oUPCMsgLabel.setText(message);
						oUPCMsgLabel.setRequired(true);
					} else {
						oUPCMsgLabel.setText(message);
						oUPCMsgLabel.setRequired(false);
					}
				}.bind(this));

			sap.ui.core.BusyIndicator.hide();
		},

		validateUPC: function (UoMs, sourcingTypeKey, baseUoM) {
			var message = "";
			var mandatoryUnits = [];
			//Additional mandatory UoMs based on sourcing type
			switch (sourcingTypeKey) {
			case 0:
				mandatoryUnits = [{
					uom: "CAR",
					desc: "Carton"
				}, {
					uom: "ZSP",
					desc: "Shp Pk"
				}];
				break;
			}
			//Set base UoM  as mandatory
			switch (baseUoM) {
			case "EA":
				mandatoryUnits.push({
					uom: "EA",
					desc: "Each"
				});
				break;
			case "LB":
				mandatoryUnits.push({
					uom: "LB",
					desc: "Pound"
				});
				break;
			case "OZ":
				mandatoryUnits.push({
					uom: "OZ",
					desc: "Ounce"
				});
				break;
			}
			for (var i in UoMs) {
				for (var j in mandatoryUnits) {
					if (UoMs[i].altUoM === mandatoryUnits[j].uom) {
						delete mandatoryUnits[j];
					}
				}
			}
			for (i in mandatoryUnits) {
				if (mandatoryUnits[i] !== undefined) {
					message = (message !== "") ? message + ", " + mandatoryUnits[i].desc : mandatoryUnits[i].desc;
				}
			}

			if (message !== "") {
				message = "Mandatory alternate UoM missing:-" + message;
			}
			return message;
		},

		getHeaderInfo: function (matData) {
			var headerInfo = {};
			headerInfo.vendor = matData.purchasing.selectionCriteria.vendor + " " + matData.purchasing.selectionCriteria.vendorText;
			headerInfo.status = "Active";
			headerInfo.material = matData.purchasing.selectionCriteria.matnr + " " + matData.generalData.description;
			headerInfo.size = matData.generalData.size;
			for (var i = 0; i < matData.uomEAN.length; i++) {
				if ((matData.uomEAN[i].altUoM === "CAR" && matData.sourcingTypeKey === 0) ||
					(matData.uomEAN[i].altUoM === matData.baseUoM && matData.sourcingTypeKey !== 0)) {
					headerInfo.pack = matData.uomEAN[i].number;
					headerInfo.UPC = matData.uomEAN[i].UPC;
					break;
				}
			}
			return headerInfo;
		},

		isWarehouseSourceType: function (sType) {
			return (window.parseInt(sType) === 0) ? true : false;
		},

		costUpdateChange: function () {

			var oModel = this.getView().getModel("material");
			var conditionDetails = oModel.getProperty("/purchasing/conditionDetails");
			var sum = conditionDetails.netPrice;
			for (var j = 0; j < conditionDetails.costUpdates.length; j = j + 1) {
				if (conditionDetails.costUpdates[j].isSubItem === true) {
					conditionDetails.costUpdates[j].Cost = sum.toFixed(2);
				} else {
					sum = sum + parseFloat(conditionDetails.costUpdates[j].Cost);
				}
			}
			oModel.setProperty("/purchasing/conditionDetails", conditionDetails);
		},

		onSave: function () {
			var oModel = this.getView().getModel("material");
			var matnr = oModel.getProperty("/matnr");
			var msg = matnr;
			switch (this.getOwnerComponent().mode) {
			case this.getOwnerComponent().modes.create:

				msg = "Material # " + msg + " created";
				break;
			case this.getOwnerComponent().modes.edit:
				msg = "Material # " + msg + " saved";
				break;
			}
			MessageToast.show(msg);
			this.getView().getModel("material").setProperty("/purchasing/selectionCriteria/infoRec", "112233");
			this.getView().getModel("material").setProperty("/purchasing/selectionCriteria/matnr", matnr);
			this.getView().getModel("appControl").setProperty("/editable", false);
		},

		onNavBack: function () {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				sap.ui.core.BusyIndicator.show(0);
				var oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("master", {
					layout: "OneColumn"
				}, true);
			}
		},

		onGlobalBlockChange: function (oEvent) {
			var oMatModel = this.getView().getModel("material");
			var siteList = this.getView().getModel("MasterDataModel").getProperty("/siteList");
			var oControl = oEvent.getSource().getName();
			var globalBlock = false;
			var siteBlocked = false;
			var exceptions = oMatModel.getProperty("/posGlobal/blockData/blockedSitesExceptions");
			var site = oMatModel.getProperty("/posStores/accessParameters/site");
			if (oControl === "globalSiteBlock" || oControl === "globalZoneBlock" || oControl === "globalSiteBlockException") {
				globalBlock = oMatModel.getProperty("/posGlobal/blockData/globalBlock");
			} else {
				globalBlock = oEvent.getSource().getState();
			}
			if (exceptions !== undefined && exceptions.filter(function (obj) {
					return obj.key === site;
				}).length > 0)
				siteBlocked = false;
			else if (globalBlock === true) {
				this.getView().byId("globalZoneBlock").clearSelection();
				this.getView().byId("globalSiteBlock").removeAllTokens();
				oMatModel.setProperty("/posGlobal/blockData/blockedSites", []);
				siteBlocked = true;
			} else {
				var blockedSites = oMatModel.getProperty("/posGlobal/blockData/blockedSites");
				var blockedZones = oMatModel.getProperty("/posGlobal/blockData/blockedZones");
				if (blockedSites !== undefined && blockedSites.filter(function (obj) {
						return obj.key === site;
					}).length > 0)
					siteBlocked = true;
				else {
					var siteData = siteList.filter(function (obj) {
						return obj.site === site;
					});
					for (var c = 0; c < blockedZones.length; c = c + 1) {
						if (blockedZones[c] === siteData[0].zone) {
							siteBlocked = true;
							break;
						}
					}
				}
			}
			oMatModel.setProperty("/posStores/block/storeBlocked", siteBlocked);
			if (siteBlocked === true) {
				oMatModel.setProperty("/posStores/sellingPeriod/status", "B - Inactive");
			} else {
				oMatModel.setProperty("/posStores/sellingPeriod/status", "A - Active");
			}
		},

		onOpenProductAttributes: function () {
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

		onCloseProductAttributes: function () {
			this.PADialog.close();
		},

		onOpenTextInput: function (oEvent, textType) {
			if (this.TxtDialog) {
				this.TxtDialog.destroy();
			}

			this.TxtDialog = new sap.ui.xmlfragment("EANDialog", "Ingles.AddOn.CreateEditMaterial.fragment.Texts", this);
			this.getView().addDependent(this.TxtDialog);
			var textArea;
			switch (textType) {
			case 'BASIC':
				var textAreaIdprefix = "BasicTxtArea_";
				var texts = [];
				texts = this.getView().getModel("material").getProperty("/texts");
				if (texts === undefined || texts.length === 0) {
					texts.push({
						textID: "T1",
						textName: "Basic Text",
						contents: "testing basic text input"
					});
					this.getView().getModel("material").setProperty("/texts", texts);
				}
				if (texts.length === 1) {
					textArea = new sap.m.TextArea(textAreaIdprefix + texts[0].textID);
					textArea.bindProperty("value", "material>/texts/0/contents");
					textArea.setWidth("600px");
					textArea.setRows(12);
					textArea.addStyleClass("sapUiTinyMargin");
					this.TxtDialog.setTitle("Basic Text");
					this.TxtDialog.addContent(textArea);
				}
				// else {

				// }				
				break;
			case 'INGREDIENT':
				textArea = new sap.m.TextArea("ingredientsText");
				textArea.bindProperty("value", "material>/ingredients");
				textArea.setWidth("600px");
				textArea.setRows(12);
				textArea.addStyleClass("sapUiTinyMargin");
				this.TxtDialog.setTitle("Ingredients");
				this.TxtDialog.addContent(textArea);
				break;
			}

			this.TxtDialog.open();
		},

		onCloseTextInput: function () {
			this.TxtDialog.close();
		},

		onOpenConsumptionData: function () {
			if (this.getView().getModel("appControl").getData().mode === "CREATE") {
				MessageToast.show("Consumption data not available in create mode");
				return;
			}

			if (!this.CDDialog) {
				this.CDDialog = new sap.ui.xmlfragment("CDDialog", "Ingles.AddOn.CreateEditMaterial.fragment.ConsumptionData", this);
				this.getView().addDependent(this.CDDialog);
			}
			this.CDDialog.open();

		},

		onCloseConsumptionData: function () {
			this.CDDialog.close();
		},

		onOpenCostUpdates: function () {
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

		onCloseCostUpdates: function () {
			this.CUDialog.close();
		},

		onOpenVendorFunding: function () {
			if (!this.VFDialog) {
				var that = this;
				Fragment.load({
					id: "VFDialog",
					name: "Ingles.AddOn.CreateEditMaterial.fragment.OtherConditions",
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

		onCloseVendorFunding: function () {
			this.VFDialog.close();
		},

		onOpenPriceHistory: function () {
			if (this.getView().getModel("appControl").getData().mode === "CREATE") {
				MessageToast.show("Price history data not available in create mode");
				return;
			}
			if (!this.PHDialog) {
				var that = this;
				Fragment.load({
					id: "PHDialog",
					name: "Ingles.AddOn.CreateEditMaterial.fragment.MaterialPriceHistory",
					controller: this
				}).then(function (oDialog) {
					that.PHDialog = oDialog;
					that.getView().addDependent(that.PHDialog);
					that.PHDialog.open();
				});
			} else {
				this.PHDialog.open();
			}
		},

		onClosePriceHistory: function () {
			this.PHDialog.close();
		},

		onAccountingViewPress: function () {
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

		onAccountingViewCancel: function () {
			this.AVDialog.close();
		},

		onOpenVendorStoreBlocks: function () {
			if (this.getView().getModel("appControl").getData().mode === "CREATE") {
				MessageToast.show("Vendor Receiving Blocks can be maintained in edit mode only");
				return;
			}
			if (!this.VSBDialog) {
				var that = this;
				Fragment.load({
					id: "VSBDialog",
					name: "Ingles.AddOn.CreateEditMaterial.fragment.VendorBlockStores",
					controller: this
				}).then(function (oDialog) {
					that.VSBDialog = oDialog;
					that.getView().addDependent(that.VSBDialog);
					that.VSBDialog.open();
				});
			} else {
				this.VSBDialog.open();
			}
		},

		onCloseVendorStoreBlocks: function () {
			this.VSBDialog.close();
		},

		onAppendVendorStoreBlock: function () {
			var oTable = sap.ui.core.Fragment.byId("VSBDialog", "vendorStoreBlocksTable");
			var oModel = this.getView().getModel("material");
			var sPath = "/purchasing/vendorStoreBlocks";
			var rcount = oModel.getProperty(sPath).length;
			var frow = oTable.getFirstVisibleRow();
			var visibleRowCount = oTable.getVisibleRowCount();
			var lrow = frow + visibleRowCount;
			if (lrow <= rcount) {
				frow = rcount - visibleRowCount + 1;
			}
			oModel.getProperty(sPath).push({});
			oModel.refresh();
			oTable.setFirstVisibleRow(frow);
		},

		onDeleteVendorStoreBlock: function (evt) {
			var oTable = sap.ui.core.Fragment.byId("VSBDialog", "vendorStoreBlocksTable");
			var oModel = this.getView().getModel("material");
			var sPath = "/purchasing/vendorStoreBlocks";
			var indices = oTable.getSelectedIndices();
			indices.sort(function (a, b) {
				return b - a;
			});
			for (var i = 0; i < indices.length; i++) {
				oModel.getProperty(sPath).splice(indices[i], 1);
			}
			oModel.refresh();
			oTable.clearSelection();
		},

		onPriceFamilyPress: function () {
			if (!this.PFDialog) {
				var that = this;
				Fragment.load({
					id: "PFDialog",
					name: "Ingles.AddOn.CreateEditMaterial.fragment.PriceFamily",
					controller: this
				}).then(function (oDialog) {
					that.PFDialog = oDialog;
					that.getView().addDependent(that.PFDialog);
					that.PFDialog.open();
				});
			} else {
				this.PFDialog.open();
			}
		},

		onPriceFamilyCancel: function () {
			this.PFDialog.close();
		},

		onOpenVendorCopy: function () {
			if (this.getView().getModel("appControl").getData().mode === "CREATE") {
				MessageToast.show("Vendor copy feature not available in create mode");
				return;
			}
			if (!this.VCDialog) {
				var that = this;
				Fragment.load({
					id: "VCDialog",
					name: "Ingles.AddOn.CreateEditMaterial.fragment.VendorCopy",
					controller: this
				}).then(function (oDialog) {
					that.VCDialog = oDialog;
					that.getView().addDependent(that.VCDialog);
					that.VCDialog.open();
				});
			} else {
				this.VCDialog.open();
			}
		},

		onCloseVendorCopy: function () {
			this.VCDialog.close();
		},

		onAppendVendorCopy: function () {
			var oTable = sap.ui.core.Fragment.byId("VCDialog", "addlVendorTbl");
			var firstrow = oTable.getFirstVisibleRow();
			var visRowCount = oTable.getVisibleRowCount();
			var oModel = this.getView().getModel("material");
			var sPath = "/purchasing/addlVendor";
			var rcount = this.getView().getModel("material").getProperty(sPath).length;
			var lrow = firstrow + visRowCount;
			if (lrow <= rcount) {
				firstrow = rcount - visRowCount + 1;
			}
			oModel.getProperty(sPath).push({
				lifnr: "",
				name1: ""
			});
			oModel.refresh();
			oTable.setFirstVisibleRow(firstrow);

		},

		onDeleteVendorCopy: function (evt) {
			var oTable = sap.ui.core.Fragment.byId("VCDialog", "addlVendorTbl");
			var oModel = this.getView().getModel("material");
			var sPath = "/purchasing/addlVendor";
			var indices = oTable.getSelectedIndices();
			indices.sort(function (a, b) {
				return b - a;
			});
			for (var i = 0; i < indices.length; i++) {
				oModel.getProperty(sPath).splice(indices[i], 1);
			}
			oModel.refresh();
			oTable.clearSelection();
		},

		onOpenAddlEAN: function (oEvent) {
			if (!this.EANDialog) {
				this.EANDialog = new sap.ui.xmlfragment("EANDialog", "Ingles.AddOn.CreateEditMaterial.fragment.AddlEAN", this);
				this.getView().addDependent(this.EANDialog);
			}
			this.EANDialog.open();
		},

		onCloseAddlEAN: function () {
			this.EANDialog.close();
		},

		onAppendAddlEAN: function () {
			var oTable = sap.ui.core.Fragment.byId("EANDialog", "AddlEANTable");
			var oModel = this.getView().getModel("material");
			var sPath = "/addlEAN";
			var rcount = oModel.getProperty(sPath).length;
			var frow = oTable.getFirstVisibleRow();
			var visibleRowCount = oTable.getVisibleRowCount();
			var lrow = frow + visibleRowCount;
			if (lrow <= rcount) {
				frow = rcount - visibleRowCount + 1;
			}
			oModel.getProperty(sPath).push({
				altUoM: "",
				mainEAN: false,
				EAN: ""
			});
			oModel.refresh();
			oTable.setFirstVisibleRow(frow);
		},

		onDeleteAddlEAN: function (evt) {
			var oTable = sap.ui.core.Fragment.byId("EANDialog", "AddlEANTable");
			var oModel = this.getView().getModel("material");
			var sPath = "/addlEAN";
			var indices = oTable.getSelectedIndices();
			indices.sort(function (a, b) {
				return b - a;
			});
			for (var i = 0; i < indices.length; i++) {
				oModel.getProperty(sPath).splice(indices[i], 1);
			}
			oModel.refresh();
			oTable.clearSelection();
		},

		onAppendUoMEAN: function () {
			var oTable = this.getView().byId("UoMEANTable");
			var firstrow = oTable.getFirstVisibleRow();
			var visRowCount = oTable.getVisibleRowCount();
			var oModel = this.getView().getModel("UoMData");
			var sPath = "/rows";
			var rcount = this.getView().getModel("UoMData").getProperty(sPath).length;
			var lrow = firstrow + visRowCount;
			if (lrow <= rcount) {
				firstrow = rcount - visRowCount + 1;
			}
			oModel.getProperty(sPath).push({});
			oModel.refresh();
			oTable.setFirstVisibleRow(firstrow);

		},

		onDeleteUoMEAN: function (evt) {
			var oTable = this.getView().byId("UoMEANTable");
			var oModel = this.getView().getModel("UoMData");
			var sPath = "/rows";
			var indices = oTable.getSelectedIndices();
			indices.sort(function (a, b) {
				return b - a;
			});
			for (var i = 0; i < indices.length; i++) {
				oModel.getProperty(sPath).splice(indices[i], 1);
			}
			oModel.refresh();
			oTable.clearSelection();
		},

		// onValueHelpVendor: function (oEvent) {
		// 	var oControl = oEvent.getSource();
		// 	if (this._oVendorValueHelp) {
		// 		this._oVendorValueHelp.destroy();
		// 	}
		// 	var filterItems = [];
		// 	var columns = [{
		// 		label: "Vendor ID",
		// 		template: "vendor"
		// 	}, {
		// 		label: "Vendor Name",
		// 		template: "vendorName"
		// 	}, {
		// 		label: "Sales Person",
		// 		template: "salesPerson"
		// 	}, {
		// 		label: "Telephone",
		// 		template: "telephone"
		// 	}];
		// 	for (var i = 0; i < columns.length; i++) {
		// 		filterItems.push(new sap.ui.comp.filterbar.FilterGroupItem({
		// 			groupTitle: "Group",
		// 			groupName: "gn1",
		// 			name: columns[i].template,
		// 			label: columns[i].label,
		// 			control: new Input(columns[i].template)
		// 		}));
		// 	}

		// 	this._oBasicVendorSearchField = new SearchField({
		// 		showSearchButton: false
		// 	});

		// 	var oFilterBar = new FilterBar("vendorFilterBar", {
		// 		advancedMode: true,
		// 		filterGroupItems: filterItems,
		// 		basicSearch: this._oBasicVendorSearchField,
		// 		showClearOnFB: true
		// 	});

		// 	oFilterBar.attachSearch(function () {
		// 		var aSearchQuery = this._oBasicVendorSearchField.getValue();
		// 		var aSelectionSet = oEvent.getParameter("selectionSet");
		// 		var oCols = this._oVendorValueHelp.data("cols");
		// 		var aFilters = aSelectionSet.reduce(function (aResult, ofilterControl) {
		// 			if (ofilterControl.getValue()) {
		// 				aResult.push(new Filter({
		// 					path: ofilterControl.getId(),
		// 					operator: FilterOperator.Contains,
		// 					value1: ofilterControl.getValue()
		// 				}));
		// 			}

		// 			return aResult;
		// 		}, []);
		// 		var bFilters = [];
		// 		if (aSearchQuery !== "" && aSearchQuery !== undefined) {
		// 			for (i = 0; i < oCols.length; i++) {
		// 				bFilters.push(new Filter({
		// 					path: oCols[i].template,
		// 					operator: FilterOperator.Contains,
		// 					value1: aSearchQuery
		// 				}));
		// 			}
		// 			aFilters.push(new Filter({
		// 				filters: bFilters,
		// 				and: false
		// 			}));
		// 		}
		// 		var finalFilter = new Filter({
		// 			filters: aFilters,
		// 			and: true
		// 		});
		// 		this._oVendorValueHelp.getTable().bindRows({
		// 			path: "/vendors",
		// 			filters: finalFilter
		// 		});
		// 		this._oVendorValueHelp.update();

		// 	}.bind(this));

		// 	oFilterBar.attachClear(function (oFBEvent) {
		// 		var aSelSet = oEvent.getParameter("selectionSet");
		// 		for (i = 0; i < aSelSet.length; i++) {
		// 			aSelSet[i].setValue();
		// 		}
		// 		this._oBasicVendorSearchField.setValue("");
		// 		oEvent.getSource().search();
		// 		//	this._oVendorValueHelp.getTable().bindRows("/vendors");
		// 	}.bind(this));

		// 	this._oVendorValueHelp = new ValueHelpDialog("VendorValueHelp", {
		// 		title: "Vendor",
		// 		supportMultiselect: false,
		// 		key: "vendor",
		// 		descriptionKey: "vendorName",
		// 		ok: function (okEvent) {
		// 			var seln = okEvent.getParameters("tokens").tokens[0].getCustomData()[0].getValue();
		// 			oControl.setValue(seln.vendor);
		// 			oControl.setDescription(seln.vendorName);
		// 			if (oControl.getBinding("value").getContext().getPath() === "/purchasing/selectionCriteria" && seln !== undefined) {
		// 				var oModel = oControl.getBinding("value").getContext().getModel();
		// 				oModel.setProperty("/purchasing/genData/salesPerson", seln.salesPerson);
		// 				oModel.setProperty("/purchasing/genData/telephone", seln.telephone);
		// 			}
		// 			this._oVendorValueHelp.close();
		// 		}.bind(this),
		// 		cancel: function (closeEvent) {
		// 			this._oVendorValueHelp.close();
		// 		}.bind(this)
		// 	});

		// 	this._oVendorValueHelp.setFilterBar(oFilterBar);
		// 	this._oVendorValueHelp.addCustomData(new sap.ui.core.CustomData({
		// 		key: "cols",
		// 		value: columns
		// 	}));
		// 	this.getView().addDependent(this._oVendorValueHelp);
		// 	var oColModel = new JSONModel();
		// 	oColModel.setData({
		// 		cols: columns
		// 	});
		// 	var oTable = this._oVendorValueHelp.getTable();
		// 	oTable.setModel(oColModel, "columns");
		// 	oTable.setModel(this.getView().getModel("MasterDataModel"));
		// 	oTable.bindRows("/vendors");

		// 	this._oVendorValueHelp.open();
		// },

		// onValueHelpSite: function (oEvent) {
		// 	var oControl = oEvent.getSource();
		// 	var isMulti = false;
		// 	if (oControl.getName() === "globalSiteBlock" || oControl.getName() === "globalSiteBlockException") {
		// 		isMulti = true;
		// 	}

		// 	if (this._oSiteValueHelp) {
		// 		this._oSiteValueHelp.destroy();
		// 	}
		// 	var filterItems = [];
		// 	var columns = [{
		// 		label: "Site",
		// 		template: "site"
		// 	}, {
		// 		label: "Site Name",
		// 		template: "name"
		// 	}, {
		// 		label: "Zone",
		// 		template: "zone"
		// 	}, {
		// 		label: "State",
		// 		template: "state"
		// 	}];

		// 	for (var i = 0; i < columns.length; i++) {
		// 		filterItems.push(new sap.ui.comp.filterbar.FilterGroupItem({
		// 			groupTitle: "Group",
		// 			groupName: "gn1",
		// 			name: columns[i].template,
		// 			label: columns[i].label,
		// 			control: new Input(columns[i].template)
		// 		}));
		// 	}

		// 	this._oBasicSiteSearchField = new SearchField({
		// 		showSearchButton: false
		// 	});

		// 	var oFilterBar = new FilterBar("singleSiteFilterBar", {
		// 		advancedMode: true,
		// 		filterGroupItems: filterItems,
		// 		basicSearch: this._oBasicSiteSearchField,
		// 		showClearOnFB: true
		// 	});

		// 	oFilterBar.attachSearch(function (searchEvent) {
		// 		var aSearchQuery = this._oBasicSiteSearchField.getValue();
		// 		var aSelectionSet = searchEvent.getParameter("selectionSet");
		// 		var oCols = this._oSiteValueHelp.data("cols");
		// 		var aFilters = aSelectionSet.reduce(function (aResult, ofilterControl) {
		// 			if (ofilterControl.getValue()) {
		// 				aResult.push(new Filter({
		// 					path: ofilterControl.getId(),
		// 					operator: FilterOperator.Contains,
		// 					value1: ofilterControl.getValue()
		// 				}));
		// 			}

		// 			return aResult;
		// 		}, []);
		// 		var bFilters = [];
		// 		if (aSearchQuery !== "" && aSearchQuery !== undefined) {
		// 			for (i = 0; i < oCols.length; i++) {
		// 				bFilters.push(new Filter({
		// 					path: oCols[i].template,
		// 					operator: FilterOperator.Contains,
		// 					value1: aSearchQuery
		// 				}));
		// 			}
		// 			aFilters.push(new Filter({
		// 				filters: bFilters,
		// 				and: false
		// 			}));
		// 		}
		// 		var finalFilter = new Filter({
		// 			filters: aFilters,
		// 			and: true
		// 		});
		// 		this._oSiteValueHelp.getTable().bindRows({
		// 			path: "/siteList",
		// 			filters: finalFilter
		// 		});
		// 		this._oSiteValueHelp.update();

		// 	}.bind(this));

		// 	oFilterBar.attachClear(function (oFBEvent) {
		// 		var aSelSet = oEvent.getParameter("selectionSet");
		// 		for (i = 0; i < aSelSet.length; i++) {
		// 			aSelSet[i].setValue();
		// 		}
		// 		this._oBasicSiteSearchField.setValue("");
		// 		oEvent.getSource().search();
		// 	}.bind(this));

		// 	this._oSiteValueHelp = new ValueHelpDialog("SiteValueHelp", {
		// 		title: "Site",
		// 		supportMultiselect: isMulti,
		// 		key: "site",
		// 		descriptionKey: "name",
		// 		ok: function (okEvent) {
		// 			if (!isMulti) {
		// 				var seln = okEvent.getParameters("tokens").tokens[0].getCustomData()[0].getValue();
		// 				oControl.setValue(seln.site);
		// 				oControl.setDescription(seln.name);
		// 			} else {
		// 				var sPath = "";
		// 				var oControlId = "";
		// 				switch (oControl.getName()) {
		// 				case "globalSiteBlock":
		// 					oControlId = "globalSiteBlock";
		// 					sPath = "/posGlobal/blockData/blockedSites";
		// 					break;
		// 				case "globalSiteBlockException":
		// 						oControlId = "globalSiteBlockException";
		// 					sPath = "/posGlobal/blockData/blockedSitesExceptions";
		// 					break;
		// 				}
		// 				oControl.setTokens(okEvent.getParameter("tokens"));
		// 				var aContexts = [];
		// 				okEvent.getParameter("tokens").forEach(function (oToken) {
		// 					aContexts.push({
		// 						key: oToken.getKey(),
		// 						text: oToken.getText()
		// 					});
		// 				});
		// 				if (sPath !== "") {
		// 					this.getView().getModel("material").setProperty(sPath, aContexts);
		// 					this.getView().byId(oControlId).fireSubmit();
		// 				}
		// 			}
		// 			this._oSiteValueHelp.close();
		// 		}.bind(this),
		// 		cancel: function (closeEvent) {
		// 			this._oSiteValueHelp.close();
		// 		}.bind(this)
		// 	});
		// 	if (isMulti) {
		// 		this._oSiteValueHelp.setTokens(oControl.getTokens());
		// 	}
		// 	this._oSiteValueHelp.setFilterBar(oFilterBar);
		// 	this._oSiteValueHelp.addCustomData(new sap.ui.core.CustomData({
		// 		key: "cols",
		// 		value: columns
		// 	}));
		// 	this.getView().addDependent(this._oSiteValueHelp);
		// 	var oColModel = new JSONModel();
		// 	oColModel.setData({
		// 		cols: columns
		// 	});
		// 	var oTable = this._oSiteValueHelp.getTable();
		// 	oTable.setModel(oColModel, "columns");
		// 	oTable.setModel(this.getView().getModel("MasterDataModel"));
		// 	oTable.bindRows("/siteList");

		// 	this._oSiteValueHelp.open();
		// },

		filterNutrientData: function (oEvent) {
			var sQuery = oEvent.getParameter("query");

			if (sQuery) {
				var oFilter = new Filter([
					new Filter("code", FilterOperator.Contains, sQuery),
					new Filter("desc", FilterOperator.Contains, sQuery)
				], false);
			}

			this.byId("nutrientDataTable").getBinding().filter(oFilter);

		},

		tokenUpdate: function (oEvent, oPath) {
			var sType = oEvent.getParameter("type"),
				aAddedTokens = oEvent.getParameter("addedTokens"),
				aRemovedTokens = oEvent.getParameter("removedTokens"),
				oModel = this.getView().getModel("material"),
				aContexts = oModel.getProperty(oPath);

			switch (sType) {
				// add new context to the data of the model, when new token is being added
			case "added":
				aAddedTokens.forEach(function (oToken) {
					aContexts.push({
						key: oToken.getKey(),
						text: oToken.getText()
					});
				});
				break;
				// remove contexts from the data of the model, when tokens are being removed
			case "removed":
				aRemovedTokens.forEach(function (oToken) {
					aContexts = aContexts.filter(function (oContext) {
						return oContext.key !== oToken.getKey();
					});
				});
				break;
			default:
				break;
			}

			oModel.setProperty(oPath, aContexts);
			this.onGlobalBlockChange(oEvent);

		},

		costUpdateEditability: function (isSubitem, showItemLevel, ItemLevel, alwaysInput, sourcetypeKey, appEditable) {

			//sourctypekey not used

			if (appEditable === false)
				return false;
			else if (isSubitem === false && showItemLevel === true && ItemLevel === true)
				return true;
			else if (alwaysInput)
				return true;
			else
				return false;

		},

		costUpdateEditState: function (isSubitem, showItemLevel, ItemLevel, alwaysInput, sourcetypeKey, appEditable) {
			if (this.costUpdateEditability(isSubitem, showItemLevel, ItemLevel, alwaysInput, sourcetypeKey, appEditable))
				return "Information";
			else return "None";
		},

		costUpdateLevelText: function (isSubItem, sourcetypeKey, alwaysInput, showItemLevel, ItemLevel) {

			//sourctypekey not used

			if (isSubItem)
				return "";
			else if (alwaysInput === true)
				return "Item";
			else if (showItemLevel === true) {
				if (ItemLevel) return "Item";
				else return "Vendor";
			} else return "Vendor";
		},

		otherConditionLevelText: function (name, itemrelevant, itemlevel) {
			if (name === "Total")
				return "";
			else if (itemrelevant) {
				if (itemlevel)
					return "Item";
				else return "Vendor";
			} else return "Vendor";

		},
		
		filterVendorStoreBlock: function (oEvent) {
			var sQuery = oEvent.getParameter("query");
			var oTable = this.getView().byId("vendorStoreBlocksTable");
			var oModel = this.getView().getModel("material");
			var oAppModel = this.getView().getModel("appControl");
			var storeBlocks = oModel.getProperty("/purchasing/vendorStoreBlocks");
			for( var i = 0; i < storeBlocks.length ; i++ )
			{
				if(storeBlocks[i].site === sQuery )
				{
					oAppModel.setProperty("/vendorStoreBlockFirstRow", i);
					break;
				}
			}

		},
		
		onAllStateAgeRestrn: function(oEvent)
		{
			var oModel = this.getView().getModel("material");
			var selAge = oEvent.getSource().getSelectedKey();
			if( selAge !== "" && selAge !== undefined )
			{
				var rows = oModel.getProperty("/posStates/rows");
				for( var i = 0; i < rows.length; i++)
				{
					rows[i].ageRestrn = true;
					rows[i].age = selAge;
				}
				
				oModel.setProperty("/posStates/rows", rows);
				this.getView().getModel("appControl").setProperty("/allstateagerestrn", "");
				
			}
			
		},
		onStateAgeRestrn: function(oEvent)
		{
			var state = oEvent.getSource().getState();
			if(state === false)
			{
				var sPath = oEvent.getSource().getParent().getBindingContextPath() + "/age";
				this.getView().getModel("material").setProperty(sPath, "");
			}
		}

	});
});