define([
    "dojo/_base/declare",
    "dijit/Tree",    
    "esri/layers/WMTSLayer", 
    "esri/layers/ArcGISTiledMapServiceLayer", 
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/WebTiledLayer",
    "dijit/form/CheckBox",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./templates/TreeNode.html",
    "esri/layers/WMTSLayerInfo",
    "./tdtlib/TDTLayer.js",
    "./tdtlib/TDTAnnoLayer.js",
    "./tdtlib/DZYLayer.js"
], function(declare,Tree,WMTSLayer,ArcGISTiledMapServiceLayer,ArcGISDynamicMapServiceLayer, 
    WebTiledLayer,CheckBox,_WidgetsInTemplateMixin,template,WMTSLayerInfo, TDTLayer, TDTAnnoLayer, DZYLayer){
    
    var CheckboxTreeNode = declare("comm.tree.CheckboxTreeNode", [dijit._TreeNode,_WidgetsInTemplateMixin], {
        templateString: template,
        checked:false,
        layer: null,
        _onCheckBoxClick:function(e){
            if(this.check_input.get("checked")){
                var pb_info = JSON.parse(this.item.node_meta_data)
                console.log(pb_info);
                var url = '';
                if(pb_info.hasOwnProperty('serviceAddress')){
                    url = pb_info.serviceAddress;
                } else if(pb_info.hasOwnProperty('serviceurl')){
                    url = pb_info.serviceurl;
                }
                
                // if(pb_info.serviceConfig !=='undefined' & pb_info.serviceConfig.map_type  !=='undefined' & pb_info.serviceConfig.map_type.map_service_name  !=='undefined'){
                //     servcice_name  = pb_info.serviceConfig.map_type.map_service_name;
                // }
                if(url.indexOf('WMTSServer') > 0){
                    url = url.substr(0, url.indexOf('WMTSServer') + 10);
                    var serviceName = serviceName  = pb_info.serviceConfig.map_type.map_service_name;
                    console.log(serviceName);
                    // this.addWMTSLayer(url,serviceName);
                    this.addDzyLayer(url);
                } else if(url.indexOf('MapServer') > 0){
                    url = url.substr(0, url.indexOf('MapServer') + 9);
                    this.addMapLayer(url);
                } else if(url.indexOf('tianditu') > 0){
                    this.addWebTiledLayer(url);
                }
                //url = 'http://www.mg.cgs.gov.cn:6080/arcgis/rest/services/Huanghe_Delta_Comprehensive_land_use/MapServer';
                //this.addMapLayer(url);
                console.log(url);
            } else{
                this.removeLayer();
            }
            
        },
        removeLayer: function(){
            this.tree._map.removeLayer(this.layer);
        },
        addWMTSLayer: function(url,service_name){          
            // var wmtsLayer = new WMTSLayer("https://gibs.earthdata.nasa.gov/wmts/epsg4326/best", options);
            var wmtsLayer = new WMTSLayer(url);
            var layerInfo = new WMTSLayerInfo({identifier: service_name});
            wmtsLayer.setActiveLayer(layerInfo);
            this.tree._map.addLayer(wmtsLayer);
            this.layer = wmtsLayer;

        },
        addDzyLayer: function(url) {
            var dzyLayer = new DZYLayer();
            this.tree._map.addLayer(dzyLayer);
            this.layer = dzyLayer;
        },
        addMapLayer: function(url){
            var mapLayer = new ArcGISDynamicMapServiceLayer(url);
            this.tree._map.addLayer(mapLayer);
            this.layer = mapLayer;
        },
        addWebTiledLayer: function(url){
            // var tileLayer = new WebTiledLayer(url, {
            //     "subDomains": ["0"]
            // });
            // this.tree._map.addLayer(tileLayer);
            // this.layer = tileLayer;
            var basemap = new TDTLayer();
            this.tree._map.addLayer(basemap);
            var annolayer = new TDTAnnoLayer();
            this.tree._map.addLayer(annolayer);
            this.layer = basemap;
        },        
        /* constructor : function(_arg){    
            dojo.mixin(this,_arg);
            
            this.checked = this.tree.model.store.getValue(this.item, "checked");
            this.inherited("constructor", arguments);
        
        },  */
          // return the dijit.Checkbox inside the tree node
        getNodeCheckbox: function(){
            return this.check_input;
        },
        setNodeCheckboxValue: function(value){
            this.check_input.set("checked",value);
        },
        getCheckedNodesList: function(nodeArray){
            if (this.getNodeCheckbox().isChecked()){
                nodeArray.push(this.item.label);
            }
            this.getChildren().forEach(getCheckedNodesList(nodeArray), this);
        },
      
        postCreate: function(){
            // preload
            // get value from the store (JSON) of the property "checked" and set the checkbox
            this.checked = this.tree.model.getChecked(this.item);
            this.check_input.set("checked",this.checked);
            var disabled = this.item.is_expand == 1 ? true : false;
            this.check_input.set("disabled", disabled);
            this.inherited(arguments);
        }
    });
    
    
    declare("comm.tree.CheckboxTree", [Tree], {
       
        _map: null,
        
        setMap: function(map){
            this._map = map;
            console.log("good, iam  here")
            console.log(map)
        },

        //修改数据发生变化时的处理事件。
        _onItemChange: function(/*Item*/item){
        
            //summary: set data event on an item in the store
            var identity = this.model.getIdentity(item);
            var newValue = this.model.store.getValue(item, "checked");
            nodes = this._itemNodesMap[identity];
            if(nodes){
                var self = this;
                dojo.forEach(nodes,function(node){
                    node.set({
                        label: self.getLabel(item),
                        tooltip: self.getTooltip(item)
                    });
                    node.setNodeCheckboxValue(newValue);
                    node._updateItemClasses(item);
                });
            }      
        },
        _createTreeNode: function(/*Object*/ args){
            // summary:
            //        creates a TreeNode
            // description:
            //        Developers can override this method to define their own TreeNode class;
            //        However it will probably be removed in a future release in favor of a way
            //        of just specifying a widget for the label, rather than one that contains
            //        the children too.
            return new CheckboxTreeNode(args);
        }
    });
})