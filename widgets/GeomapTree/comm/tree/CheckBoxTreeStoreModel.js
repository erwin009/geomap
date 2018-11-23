define([
    "dojo/_base/declare",
    "dijit/tree/TreeStoreModel"
], function(declare,TreeStoreModel){
    
    return declare("comm.tree.CheckboxTreeStoreModel", [TreeStoreModel], {
        /*constructor: function(params){
            // summary:
            //        Sets up variables, etc.
            // tags:
            //        private
        
            // Make dummy root item
            this.root = {
                store: this,
                root: true,
                id: params.rootId,
                label: params.rootLabel,
                children: params.rootChildren    // optional param
            };
        },*/
        getChecked:function(/*dojo.data.Item*/item){
            return this.store.getValue(item,"checked");
        },
        setChecked:function(/*dojo.data.Item*/item,/*boolean*/checked){
            this.store.setValue(item,"checked",checked);
        },
        onChange: function(/*dojo.data.Item*/item){
            var currStore = this.store;
            var newValue = currStore.getValue(item, "checked");
            
            // if a node gets checked we propagate the "event" down to the children
            // erase this if you don't need to propagate the event (simple check)
            this.getChildren(item, function(children){
                dojo.forEach(children, function(child){
                    currStore.setValue(child, "checked", newValue);
                });
            });
        },
        _onItemChildrenChange: function(/*dojo.data.Item*/ parent, /*dojo.data.Item[]*/ newChildrenList){
            console.info(arguments);
            // summary:
            //        Callback to do notifications about new, updated, or deleted items.
            // tags:
            //        callback
        },
        mayHaveChildren: function(/*dojo.data.Item*/ item){
            // summary:
            //        Tells if an item has or may have children.  Implementing logic here
            //        avoids showing +/- expando icon for nodes that we know don't have children.
            //        (For efficiency reasons we may not want to check if an element actually
            //        has children until user clicks the expando node)
            return dojo.some(this.childrenAttrs, function(attr){
                return this.store.hasAttribute(item, attr) && this.store.getValue(item,attr);
            }, this);
        }
    });
})