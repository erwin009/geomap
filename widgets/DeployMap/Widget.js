define(['dojo/_base/declare', 
        'dojo/_base/array',
        'jimu/BaseWidget',
        'dojo/dom',
        'dojo/on',
        'dojo/query',
        'dojo/dom-construct',
        "dijit/form/DropDownButton", 
        "dijit/TooltipDialog", 
        "dijit/form/TextBox",
        'dijit/form/Button',
        'dijit/form/RadioButton',
        'dijit/_WidgetsInTemplateMixin',
        'dijit/popup',
        'dojo/_base/lang',
        "esri/layers/FeatureLayer",
        "esri/tasks/FeatureSet",
        'dojo/request',
        "jimu/LayerStructure",
        "jimu/FilterManager",
        "esri/arcgis/Portal"],
function(declare, array, BaseWidget, dom, on, Query, domConstruct, DropDownButton, TooltipDialog,
         TextBox, Button, RadioButton, _WidgetsInTemplateMixin, popup, lang, FeatureLayer, FeatureSet,request,
         LayerStructure, FilterManager,arcgisPortal) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget,  _WidgetsInTemplateMixin], {
    // DemoWidget code goes here

    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,

    baseClass: 'jimu-widget-deploymap',

    mapLayers: [],
    count: 0,
    layerRadios: [],
    _hostUrl: 'http://10.90.128.167:3000/',
    // _userid: null,
    _userid: {
      username: "geoadmin"
    },
    postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');

      // 加载图层
      
      // 读取后台获取部署图列表
      // this.own(on(this.addButton, "click", lang.hitch(this, function(){
      //   alert('o');
      // })));
      // this.addButton.on('click', lang.hitch(this, this.addDeployMap));
    },

    _onBtnAddDeployMap: function() {
      // 获取部署图名称
      var layerName = dom.byId('layerName');
      // 检查是否有重名的部署图
      if(this.checkDeployMapDuplicateName(layerName.value)) {
        alert("已有名称为：" + layerName.value + "的部署图，请重新命名！");        
      } else {
        //创建一个对象，并保存到全局数组中      
        var obj = {
            id: 'rb' + this.count,
            checked: true,
            name: 'layerItem',
            value: 'layerRadio',
            type: 'radio',
            title: layerName.value,
            cid: 'p' + this.count
        };
        this.mapLayers.push(obj);                    
                  
        // 创建容器
        domConstruct.create('p', {
            id: obj.cid,
        }, 'list', 'first');
        this.disableOtherMapLayers();
        // 创建radiobutton
        var rb = new RadioButton({
            id: obj.id,
            checked: obj.checked,
            name: obj.name,
            value: obj.value,
            type: obj.type
        });  
        var that = this;
        on(rb, 'click', function(){
          if(this.checked){
            var layerName = that.getSelectedLayerName();
            // 设置并过滤
            that.filterByPlan(layerName);            
          }
        });
        this.layerRadios.push(rb),
        rb.placeAt(obj.cid, 'first');
        domConstruct.create('label', {
            innerHTML: layerName.value,
            for: obj.id
        }, obj.cid);

        // 将数据保存到后台
        var requestOptions = {
          query: "username=" + this._userid.username + "&planname=" + layerName.value,
          method: 'get',
          handleAs: 'json'
        };
        request(this._hostUrl + 'deployMap/saveDeployMap', requestOptions).then(lang.hitch(this, function (data) {
          //后台添加新方案
          console.log(data);
        })); 
        console.log('layer name is :' + layerName.value);
        this.filterByPlan(layerName.value);
        this.count += 1;
        layerName.value = '';
        popup.close(this.ttDialog);         
      }  
    },

    _onBtnDeleteDeployMap: function() {
      for(var i = 0; i < this.mapLayers.length; i++){
        if(this.layerRadios[i].checked){
          domConstruct.destroy(this.mapLayers[i].cid);
          // 删除后台存储的数据
          var requestOptions = {
            query: "username=" + this._userid.username + "&planname=" + this.mapLayers[i].title,
            method: 'get',
            handleAs: 'json'
          };
          var that = this;
          request(this._hostUrl + 'deployMap/deleteDeployMap', requestOptions).then(lang.hitch(this, function (data) {
            //后台删除方案
            console.log(data);
            // 删除要素
            console.log(that.mapLayers);
            that.deleteFeaturesByPlan(that.mapLayers[i].title);
            that.mapLayers.splice(i,1);
            that.layerRadios.splice(i,1); 
            this.enableFirstRadioButton(); 
          }));
                 
          break;
        }
      }  
         
    },

    deleteFeaturesByPlan: function(planname){
      var that = this;
      var layerStructureInstance = LayerStructure.getInstance();
      console.log(layerStructureInstance.getLayerNodes());
      layerStructureInstance.traversal(lang.hitch(this,function (layerNode) {        
        if (layerNode.title === "点标注" || layerNode.title === "线标注" || layerNode.title === "面标注") { //1===1去掉
            
            var txt = "plan = '" + planname + "'";
            var url = layerNode.getUrl();
            var featureLayer = new FeatureLayer(url,{mode: FeatureLayer.MODE_SNAPSHOT,outFields: ["*"]});
            var query = new Query();            
            query.where = txt;
            // Query for the features with the given object ID
            featureLayer.queryFeatures(query, function(featureSet) {
              featureLayer.applyEdits(null,null,featureSet.features,
                function(result){
                  console.log("good");
                  console.log(result);
                },
                function(err){
                  console.log(err);
                });
            });
        }
      }));  
    },

    checkDeployMapDuplicateName: function(name) {
      console.log(this.mapLayers);
      for(var i = 0; i < this.mapLayers.length; i++) {
        if(this.mapLayers[i].title === name) {
          return true;
        }
      }
      return false;
    },

    enableFirstRadioButton: function() {
      if(this.layerRadios.length > 0){
        this.layerRadios[this.layerRadios.length-1].set('checked', true);
        this.filterByPlan(this.mapLayers[this.mapLayers.length-1].title);
      } else{
        this.filterByPlan('none');
      } 
    },

    disableOtherMapLayers: function() {      
      for(var i = 0; i < this.layerRadios.length; i++) {
        this.layerRadios[i].set('checked', false);
      }      
    },

    getSelectedLayerName: function() {
      for(var i = 0; i < this.mapLayers.length; i++){
        if(this.layerRadios[i].checked){
          return this.mapLayers[i].title;
        }
      }  
      return null;
    },

    startup: function() {
      this.inherited(arguments);
      console.log('startup');
      var that = this;
      var portal = new arcgisPortal.Portal(this.config.portalURL);//修改配置的PortalURL
      console.log("********************portal***************")
      // portal.signIn().then(lang.hitch(this, function (loggedInUser) {
          userid = this._userid;
          that._userid = userid;
          var requestOptions = {
              query: "username=" + userid.username,
              method:'get',
              handleAs: 'json'
          };

          request(this._hostUrl + 'deployMap/getDeployMap', requestOptions).then(lang.hitch(this,function (data) {//修改请求的后台查询URL
              console.log(data.plans);
              // 初始化部署图列表
              that.initializeLayerList(data.plans);

              // 设置第一个图层可见
              that.enableFirstRadioButton();

              // 过滤部署图方案
              //that.filterByPlan(that.mapLayers[that.mapLayers.length-1].title);
          }));
      // })); 
    },

    filterByPlan: function (planname) {
      var that = this;
      var layerStructureInstance = LayerStructure.getInstance();
      console.log(layerStructureInstance.getLayerNodes());
      layerStructureInstance.traversal(lang.hitch(this,function (layerNode) {        
        if (layerNode.title === "点标注" || layerNode.title === "线标注" || layerNode.title === "面标注") { //1===1去掉
           
            var txt = "plan = '" + planname + "'";
            console.log(txt);
            console.log(layerNode);
            // layer.setDefinitionExpression(string.substitute("plan = '${plan}'", { plan: planname }));//修改为 planname
            var filterManager = FilterManager.getInstance();
            filterManager.applyWidgetFilter (layerNode.id, this.id, txt);
            //layerNode.setFilter(txt);
            //layerNode.getLayerObject().then(function (layer) {
                //layer.setDefinitionExpression(txt);//修改为 planname
              //});
            that.publishData({layerName: planname});
        }
      }));     
    },

    initializeLayerList: function(layerList) {        
        for(var i = 0; i < layerList.length; i++){
          //创建一个对象，并保存到全局数组中      
          var obj = {
              id: 'rb' + this.count,
              checked: false,
              name: 'layerItem',
              value: 'layerRadio',
              type: 'radio',
              title: layerList[i],
              cid: 'p' + this.count
          };
          this.mapLayers.push(obj);                    
                    
          // 创建容器
          domConstruct.create('p', {
              id: obj.cid,
          }, 'list', 'first');
          
          // 创建radiobutton
          var rb = new RadioButton({
              id: obj.id,
              checked: obj.checked,
              name: obj.name,
              value: obj.value,
              type: obj.type
          });  
          var that = this;
          on(rb, 'click', function(){
            if(this.checked){
              var layerName = that.getSelectedLayerName();
              that.filterByPlan(layerName);
            }
          });
          this.layerRadios.push(rb),
          rb.placeAt(obj.cid, 'first');
          domConstruct.create('label', {
              innerHTML: obj.title,
              for: obj.id
          }, obj.cid);
          this.count += 1;            
        }                
    },

    onOpen: function(){
      console.log('onOpen');
    },

    onClose: function(){
      console.log('onClose');
    },

    onMinimize: function(){
      console.log('onMinimize');
    },

    onMaximize: function(){
      console.log('onMaximize');
    },

    onSignIn: function(credential){
      /* jshint unused:false*/
      console.log('onSignIn');
    },

    onSignOut: function(){
      console.log('onSignOut');
    },

    showVertexCount: function(count){
      this.vertexCount.innerHTML = 'The vertex count is: ' + count;
    }
  });
});