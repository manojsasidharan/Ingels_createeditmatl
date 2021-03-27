sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/json/JSONModel",
	"sap/ui/comp/valuehelpdialog/ValueHelpDialog",
	"sap/ui/comp/filterbar/FilterBar",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/Input",
	"sap/m/SearchField"
], function (Object, JSONModel, ValueHelpDialog, FilterBar, Filter, FilterOperator, Input, SearchField) {
	"use strict";

	return Object.extend("Ingles.AddOn.CreateEditMaterial.controller.ValueHelper", {
		srchHelpName: "",
		srchHelpDialog: null,
		srchHelpDialogName: "",
		oController: null,
		config: [],
		// cols: [],
		// oColModel: new sap.ui.model.json.JSONModel(),
		// model: null,

		constructor: function (oController, srchHelpName) {
			this.srchHelpName = srchHelpName;
			this.oController = oController;
			switch (srchHelpName) {
			case "VENDOR":
				this.config = {
					cols: [{
						label: "Vendor ID",
						template: "vendor"
					}, {
						label: "Vendor Name",
						template: "vendorName"
					}, {
						label: "Sales Person",
						template: "salesPerson"
					}, {
						label: "Telephone",
						template: "telephone"
					}],
					modelName: "MasterDataModel",
					modelPath: "/vendors",
					title: "Vendor",
					multiSelectControls: [],
					key: "vendor",
					descriptionKey: "vendorName",
					addnlExportDetails: [{
						inputControlName: "purchasingVendor",
						exportDetails: [{
							template: "salesPerson",
							model: "material",
							property: "/purchasing/genData/salesPerson"
						}, {
							template: "telephone",
							model: "material",
							property: "/purchasing/genData/telephone"
						}]
					}]
				};
				break;
			case "SITE":
				this.config = {
					cols: [{
						label: "Site",
						template: "site"
					}, {
						label: "Site Name",
						template: "name"
					}, {
						label: "Zone",
						template: "zone"
					}, {
						label: "State",
						template: "state"
					}],
					modelName: "MasterDataModel",
					modelPath: "/siteList",
					title: "Site",
					multiSelectControls: [{
						name: "globalSiteBlock",
						controlId : "globalSiteBlock",
						model : "material",
						path : "/posGlobal/blockData/blockedSites"
					}, {
						name: "globalSiteBlockException",
						controlId : "globalSiteBlockException",
						model : "material",
						path : "/posGlobal/blockData/blockedSitesExceptions"
					}],

					key: "site",
					descriptionKey: "name",
					addnlExportDetails: []
				};
				break;

			}

		},

		openValueHelp: function (oEvent) {
			var oControl = oEvent.getSource();
			var filterBarName = "";
			var filterItems = [];
			var basicSearchField = null;

			if (this.srchHelpDialog) {
				this.srchHelpDialog.destroy();
			}

			for (var i = 0; i < this.config.cols.length; i++) {
				filterItems.push(new sap.ui.comp.filterbar.FilterGroupItem({
					groupTitle: "Group",
					groupName: "gn1",
					name: this.config.cols[i].template,
					label: this.config.cols[i].label,
					control: new Input(this.config.cols[i].template)
				}));
			}

			switch (this.srchHelpName) {
			case "VENDOR":
				this.oController._oVendorValueHelp = null;
				this.srchHelpDialog = this.oController._oVendorValueHelp;
				this.srchHelpDialogName = "VendorSearchHelp";
				this.oController._oBasicVendorSearchField = new SearchField({
					showSearchButton: false
				});
				basicSearchField = this.oController._oBasicVendorSearchField;
				filterBarName = "VendorFilterBar";
				break;
			case "SITE":
				this.oController._oSiteValueHelp = null;
				this.srchHelpDialog = this.oController._oSiteValueHelp;
				this.srchHelpDialogName = "SiteSearchHelp";
				this.oController._oBasicSiteSearchField = new SearchField({
					showSearchButton: false
				});
				basicSearchField = this.oController._oBasicSiteSearchField;
				filterBarName = "SiteFilterBar";
				break;
			}

			var oFilterBar = new FilterBar(filterBarName, {
				advancedMode: true,
				filterGroupItems: filterItems,
				basicSearch: basicSearchField,
				showClearOnFB: true
			});

			oFilterBar.attachSearch(function (searchEvent) {
				var aSearchQuery = basicSearchField.getValue();
				var aSelectionSet = searchEvent.getParameter("selectionSet");
				var oCols = this.config.cols;
				var aFilters = aSelectionSet.reduce(function (aResult, ofilterControl) {
					if (ofilterControl.getValue()) {
						aResult.push(new Filter({
							path: ofilterControl.getId(),
							operator: FilterOperator.Contains,
							value1: ofilterControl.getValue()
						}));
					}

					return aResult;
				}, []);
				var bFilters = [];
				if (aSearchQuery !== "" && aSearchQuery !== undefined) {
					for (i = 0; i < oCols.length; i++) {
						bFilters.push(new Filter({
							path: oCols[i].template,
							operator: FilterOperator.Contains,
							value1: aSearchQuery
						}));
					}
					aFilters.push(new Filter({
						filters: bFilters,
						and: false
					}));
				}
				var finalFilter = new Filter({
					filters: aFilters,
					and: true
				});
				this.srchHelpDialog.getTable().bindRows({
					path: this.config.modelPath,
					filters: finalFilter
				});
				this.srchHelpDialog.update();

			}.bind(this));

			oFilterBar.attachClear(function (oFBEvent) {
				var aSelSet = oEvent.getParameter("selectionSet");
				for (i = 0; i < aSelSet.length; i++) {
					aSelSet[i].setValue();
				}
				basicSearchField.setValue("");
				oEvent.getSource().search();
			}.bind(this));

			var isMultiSelect = false;
			var multiSelectInputControl = this.config.multiSelectControls.filter(function (obj) {	return obj.name === oControl.getName();	});
			if (multiSelectInputControl.length > 0 ) isMultiSelect = true;
			
			this.srchHelpDialog = new ValueHelpDialog(this.srchHelpDialogName, {
				title: this.config.title,
				supportMultiselect: isMultiSelect,
				key: this.config.key,
				descriptionKey: this.config.descriptionKey,
				ok: function (okEvent) {

					if (!isMultiSelect) {  //SINGLE SELECT
						var seln = okEvent.getParameters("tokens").tokens[0].getCustomData()[0].getValue();
						oControl.setValue(seln[this.config.key]);
						oControl.setDescription(seln[this.config.descriptionKey]);
						this.config.addnlExportDetails.forEach(function (obj) {
							if (obj.inputControlName === oControl.getName()) {
								for (i = 0; i < obj.exportDetails.length; i++) {
									this.oController.getView().getModel(obj.exportDetails[i].model).setProperty(obj.exportDetails[i].property, seln[obj.exportDetails[
										i].template]);
								}
							}
						}.bind(this));

					} else { //MULTI SELECT
						oControl.setTokens(okEvent.getParameter("tokens"));
						var aContexts = [];
						okEvent.getParameter("tokens").forEach(function (oToken) {
							aContexts.push({
								key: oToken.getKey(),
								text: oToken.getText()
							});
						});
						if (multiSelectInputControl[0].path !== "") {
							var model = multiSelectInputControl[0].model;
							var path = multiSelectInputControl[0].path;
							var controlId = multiSelectInputControl[0].controlId;
							this.oController.getView().getModel(model).setProperty(path, aContexts);
							this.oController.getView().byId(controlId).fireSubmit();
						}
					}

					this.srchHelpDialog.close();
				}.bind(this),
				cancel: function (closeEvent) {
					this.srchHelpDialog.close();
				}.bind(this)
			});

			if (isMultiSelect) {
				this.srchHelpDialog.setTokens(oControl.getTokens());
			}

			this.srchHelpDialog.setFilterBar(oFilterBar);
			this.oController.getView().addDependent(this.srchHelpDialog);

			var oColModel = new JSONModel();
			oColModel.setData({
				cols: this.config.cols
			});
			var oTable = this.srchHelpDialog.getTable();
			oTable.setModel(oColModel, "columns");
			oTable.setModel(this.oController.getView().getModel(this.config.modelName));
			oTable.bindRows(this.config.modelPath);

			this.srchHelpDialog.open();

		}

	});
});