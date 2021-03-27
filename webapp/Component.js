sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"Ingles/AddOn/CreateEditMaterial/model/models",
	"sap/ui/model/json/JSONModel",
	"sap/f/library",
	"sap/f/FlexibleColumnLayoutSemanticHelper"
], function (UIComponent, Device, models, JSONModel, library, FlexibleColumnLayoutSemanticHelper) {
	"use strict";

	var LayoutType = library.LayoutType;

	return UIComponent.extend("Ingles.AddOn.CreateEditMaterial.Component", {

		modes: {
			create: "CREATE",
			edit: "EDIT",
			display: "DISPLAY"
		},

		metadata: {
			manifest: "json"
		},

		mode: "",
		launchFromFLP: "false",

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();

			//Set unnamed model
			var oModel = new JSONModel();
			this.setModel(oModel);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			var sValue = "";
			var editable = false;
			var paramName = "mode";
			var i18TitleText = "";
			var oComponentData = this.getComponentData();
			if (oComponentData === undefined) //Standalone start
			{
				sValue = jQuery.sap.getUriParameters().get(paramName).toUpperCase();
			} else { //FIORI start
				this.launchedFromFLP = true;
				sValue = oComponentData.startupParameters[paramName][0];
				if (sValue !== null && sValue !== undefined) {
					sValue = sValue.toUpperCase();
				}
			}

			this.mode = sValue;

			switch (this.mode) {
			case "CREATE":
				i18TitleText = "CREATE_TITLE";
				editable = true;
				break;
			case "EDIT":
				i18TitleText = "EDIT_TITLE";
				editable = true;
				break;
			case "DISPLAY":
				i18TitleText = "DISPLAY_TITLE";
				editable = false;
				break;
			default:
				i18TitleText = "DISPLAY_TITLE";
				editable = false;
			}

			var appControl = {
				mode: this.mode,
				editable: editable,
				sourcingTypeKey: 0,
				sourcingType: "",
				refMaterial: "",
				materialType: "",
				materialGroup: ""
			};
			this.setModel(new JSONModel(appControl), "appControl");			

			if (this.launchedFromFLP) {
				var appTitle = this.getModel("i18n").getResourceBundle().getText(i18TitleText);
				this.getService("ShellUIService").then(
					function (oService) {
						oService.setTitle(appTitle);
					},
					function (oError) {
						jQuery.sap.log.error("Unable to set title dynamically");
					}
				);
			}

		},

		/**
		 * Returns an instance of the semantic helper
		 * @returns {sap.f.FlexibleColumnLayoutSemanticHelper} An instance of the semantic helper
		 */
		getHelper: function () {
			var oFCL = this.getRootControl().byId("fcl"),
				oParams = jQuery.sap.getUriParameters(), //UriParameters.fromQuery(location.search),
				oSettings = {
					defaultTwoColumnLayoutType: LayoutType.TwoColumnsMidExpanded,
					defaultThreeColumnLayoutType: LayoutType.ThreeColumnsMidExpanded,
					mode: oParams.get("mode"),
					maxColumnsCount: oParams.get("max")
				};

			return FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, oSettings);
		},

		getToday: function () {
			var d = new Date(),
				month = "" + (d.getMonth() + 1),
				day = "" + d.getDate(),
				year = d.getFullYear();

			if (month.length < 2) {
				month = "0" + month;
			}
			if (day.length < 2) {
				day = "0" + day;
			}

			return [year, month, day].join("-");
		},
		getFortnightAgo: function () {
			var d = new Date(Date.now() - 12096e5),
				month = "" + (d.getMonth() + 1),
				day = "" + d.getDate(),
				year = d.getFullYear();

			if (month.length < 2) {
				month = "0" + month;
			}
			if (day.length < 2) {
				day = "0" + day;
			}

			return [year, month, day].join("-");
		},

		destroy: function () {

			sap.ui.core.UIComponent.prototype.destroy.apply(this, arguments);

		}
		
	});
});