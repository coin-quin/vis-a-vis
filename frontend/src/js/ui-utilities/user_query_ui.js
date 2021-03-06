/*
* Copyright (c) TUT Tampere University of Technology 2014-2015.
* All rights reserved.
* This software has been developed in Tekes-TIVIT project Need-for-Speed.
* All rule set in consortium agreement of Need-for-Speed project apply.
*
* Main authors: Antti Luoto, Anna-Liisa Mattila, Henri Terho
*/

var USER_QUERY_UI = function(callback){
   
    var parseTextValue = function(val){
        val = val.replace(/\s/g,'');
        if(val.length === 0){
            return false;
        }
        return val;
    };
    
    var onClick = function(){
        
        var filters = {};
        
        var startDate = parseTextValue(document.getElementById("startDate").value);
        var startTime = parseTextValue(document.getElementById("startTime").value);
        if(startDate !== false && startTime !== false){
            filters.startTime = new Date(startDate+"T"+startTime);
        }
        else{
            filters.startTime = startDate;
        }
        
        var endDate = parseTextValue(document.getElementById("endDate").value);
        var endTime = parseTextValue(document.getElementById("endTime").value);
        if(endDate !== false && endTime !== false){
            filters.endTime = new Date(endDate+"T"+endTime);
        }
        else{
            filters.endTime = endDate;
        }
        
        filters.context = false; 
        filters.source = parseTextValue(document.getElementById("source").value);
        
        var constructFilters = {};
        
        constructFilters.name = parseTextValue(document.getElementById("constructName").value);
        constructFilters.type = ["user", "document", "page", "session"]; 
        constructFilters.description = false; 
        
        filters.constructs = constructFilters;

        var mapping = {};
        
        mapping.rowId = "source_id"; 
        mapping.rowIdIsFromOrigin = true; 
        mapping.states = {resolution : ["(session)closed", "(doc)closed", "(page)closed"]};
        
        document.getElementById("queryui").style.display = "none";
        var loading = document.createTextNode("LOADING");
        document.getElementById("loader").appendChild(loading);
        callback({filters:filters, mapping:mapping});
    };
    
    var _button = document.createElement("button");
    var _text = document.createTextNode("visualize");
    _button.appendChild(_text);
    
    _button.addEventListener("click", onClick);
    document.getElementById("queryui").appendChild(_button);
};