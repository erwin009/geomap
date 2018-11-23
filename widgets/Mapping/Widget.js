define([
  'dojo/_base/declare', 
  "dojo/_base/lang",   
  "dojo/_base/array",   
  'jimu/BaseWidget', 
  'jimu/MapManager',  
  "jimu/LayerStructure", 
  "dojo/string", 
  'dojo/request',  
  "esri/arcgis/Portal", 
  "esri/toolbars/draw", 
  "esri/toolbars/edit", 
  "esri/dijit/editing/TemplatePicker", 
  "esri/dijit/editing/Editor", 
  "esri/tasks/GeometryService",
  'dijit/_WidgetsInTemplateMixin',  
  "dijit/form/Select", 
  "dijit/form/TextBox", 
  "dijit/form/Button", 
  "dijit/registry",
  "esri/IdentityManager","jimu/FilterManager"],
function(declare,lang,arrayUtils, BaseWidget, MapManager,LayerStructure,  string, request,
             arcgisPortal, Draw, Edit, TemplatePicker, Editor,  GeometryService, 
             _WidgetsInTemplateMixin, Select, TextBox, Button, registry,esriId,FilterManager) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget, _WidgetsInTemplateMixin], {
    // DemoWidget code goes here

    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,

    baseClass: 'jimu-widget-mapping',

    userid: {
      username: 'geoadmin'
    },
    _mapInfoStorage: null,
    _featureLayers: [],
    _layerName: null,
    _username: 'geoadmin',
   
    postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');
    },

    onReceiveData: function(name, widgetId, data, historyData) {

      console.log("获取到的数据：");
      console.log(data);
      this._layerName = data.layerName;
    },

    startup: function() {
      this.inherited(arguments);
      this._mapInfoStorage = {
        resetInfoWindow: null,
        snappingTolerance: null,
        editorATIonLayerSelectionChange: null
      };

      console.log("***********fetch name*****************" + this.fetchDataByName('DeployMap'));

      var mapOjb = this.map;
      this.disableWebMapPopup();
      // this.enableWebMapPopup();
      var thiswidget = this;
      console.log(this.config.portalURL);
      //var portal = new arcgisPortal.Portal(this.config.portalURL);//修改配置的PortalURL
      console.log("********************portal***************")
      //portal.signIn().then(lang.hitch(this, function (loggedInUser) {
        userid = this.userid;        
        console.log(userid);
          var layerStructureInstance = LayerStructure.getInstance();
          var layerObjects = [];
          console.log(layerStructureInstance.getLayerNodes());
          var templateLayers = arrayUtils.map(layerStructureInstance.getLayerNodes(), function (node) {
            node.getLayerObject().then(function (layer) {
              console.log(layer.id);
              
              layerObjects.push(layer);
              
              if (layerObjects.length === (layerStructureInstance.getLayerNodes().length)) {
                var templatePicker = new TemplatePicker({
                  featureLayers: layerObjects,
                  grouping: false,
                  rows: "auto",
                  columns: "auto",
                  style: "height: 400px; overflow: auto;"
                }, "templateGeoDiv");
                templatePicker.startup();

                var layers = arrayUtils.map(layerObjects, function (layer) {
                  esriId.checkSignInStatus(layer.url).then(
                      function (c) { console.log(c); },
                      function (error) { console.log(error); });
                  layer.on("graphic-add", lang.hitch(this,function (e) {
                      e.graphic.attributes.plan = thiswidget._layerName;   // 部署图名称
                      e.graphic.attributes.username = thiswidget._username;
                    }));
                  var fieldInfos;
                  console.log(layer);
                  if(layer.name == "点标注"){
                    fieldInfos = [
                       {'fieldName':'钻孔名称','label':'钻孔名称(*)'},
                       {'fieldName':'内容','label':'内容'},
                       {'fieldName':'所属项目','label':'所属项目'},
                       {'fieldName':'资源类型','label':'资源类型'},
                       {'fieldName':'井型','label':'井型'},
                       {'fieldName':'设计井深','label':'设计井深'},
                       {'fieldName':'目的层位','label':'目的层位'},
                       {'fieldName':'设计开钻时间','label':'设计开钻时间'},
                       {'fieldName':'设计完钻时间','label':'设计完钻时间'},
                       {'fieldName':'符号','label':'符号'}
                    ]
                  }else if(layer.name == "线标注"){
                    fieldInfos = [
                       {'fieldName':'测线编号','label':'测线编号(*)'},
                       {'fieldName':'测线类型','label':'测线类型'},
                       {'fieldName':'测线长度','label':'测线长度'},
                       {'fieldName':'符号','label':'符号'}
                    ]
                  }else {
                    fieldInfos = [
                       {'fieldName':'工区名称','label':'工区名称(*)'},
                       {'fieldName':'所属项目','label':'所属项目'},
                       {'fieldName':'工区面积','label':'工区面积'},
                       {'fieldName':'符号','label':'符号'}
                    ]
                  }
                    return { featureLayer: layer , userId: this.userid.username, fieldInfos: fieldInfos};   
                    thiswidget._featureLayers.push(layer);                             
                });               

                var settings = {
                  map: mapOjb,
                  templatePicker: templatePicker,
                  layerInfos: layers,
                  toolbarVisible: true,
                  createOptions: {
                    polylineDrawTools: [Editor.CREATE_TOOL_FREEHAND_POLYLINE],
                    polygonDrawTools: [Editor.CREATE_TOOL_FREEHAND_POLYGON,
                    Editor.CREATE_TOOL_CIRCLE,
                    Editor.CREATE_TOOL_TRIANGLE,
                    Editor.CREATE_TOOL_RECTANGLE
                    ]
                  },
                  toolbarOptions: {
                    reshapeVisible: true
                  }

                };

                var params = { settings: settings };
                var myEditor = new Editor(params, 'editorGeoDiv');
                myEditor.startup();
              }
            });
          });
      //}));
    },
    
    onActive: function () {
      this.disableWebMapPopup();
    },
    onDeActive: function () {
      this.enableWebMapPopup();
    },
    disableWebMapPopup: function () {
      var mapManager = MapManager.getInstance();
      mapManager.disableWebMapPopup();
      // hide map's infoWindow
      this.map.infoWindow.hide();
      // instead of map's infowindow by editPopup
      //this.map.setInfoWindow(this.editPopup);
      //this._enableMapClickHandler();      
    },

    enableWebMapPopup: function () {
      var mapManager = MapManager.getInstance();
      var mapInfoWindow = mapManager.getMapInfoWindow();
      // revert restInfoWindow when close widget.
      if (this._mapInfoStorage.resetInfoWindow) {
        this.map.setInfoWindow(mapInfoWindow.bigScreen);
        mapManager.isMobileInfoWindow = false;

        mapManager.resetInfoWindow =
          lang.hitch(mapManager, this._mapInfoStorage.resetInfoWindow);
        this._mapInfoStorage.resetInfoWindow = null;
        mapManager.resetInfoWindow();
        this._disableMapClickHandler();
        // hide popup and clear selection
        this.editPopup.hide();
        // don't clear selection if current session is at editing
        if (!this._isEditingSession) {
          this.editor._clearSelection();
        }
        // recall enableWebMap
        mapManager.enableWebMapPopup();
      }
      // revert map snappingTolerance.
      if (this.map.snappingManager && this._mapInfoStorage.snappingTolerance !== null) {
        this.map.snappingManager.tolerance = this._mapInfoStorage.snappingTolerance;
      }
    }

    // onOpen: function(){
    //   console.log('onOpen');
    // },

    // onClose: function(){
    //   console.log('onClose');
    // },

    // onMinimize: function(){
    //   console.log('onMinimize');
    // },

    // onMaximize: function(){
    //   console.log('onMaximize');
    // },

    // onSignIn: function(credential){
    //   /* jshint unused:false*/
    //   console.log('onSignIn');
    // },

    // onSignOut: function(){
    //   console.log('onSignOut');
    // },

    // showVertexCount: function(count){
    //   this.vertexCount.innerHTML = 'The vertex count is: ' + count;
    // }
  });
});