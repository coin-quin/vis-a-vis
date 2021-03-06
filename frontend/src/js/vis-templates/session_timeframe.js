/*
* Copyright (c) TUT Tampere University of Technology 2014-2015.
* All rights reserved.
* This software has been developed in Tekes-TIVIT project Need-for-Speed.
* All rule set in consortium agreement of Need-for-Speed project apply.
*
* Main authors: Antti Luoto, Anna-Liisa Mattila, Henri Terho
*/

//Timeline visualization component for visualizing events and states of artifacts
/*PARAMETERS:
    svg         : svg element where the visualization is rendered wrapped with d3
    width       : the width of the svg
    height      : the height of the svg
    margins     : how much space should be leaved for drawing labels and stuff (left, right),
                    how much room we leave for scale (top) and how much whitespace we leave at the bottom.
    timeframe   : value range of x-domain == array containing start time and end time of the range.
    labelColors : array that contains all label values that are mapped to colors
    stateColors : array that contains all state values that are mapped to colors
    ids         : id data used in y-axis, an array that defines the value range of y-axis. should contain each value of y-axis no more than once.
                    This is formed by the data processor.
    events      : event data formed by the data processor.
    lifespans   : lifespan data formed by the data processor.
    constructs  : construct data formed by the data processor.
    displayTypes: Should we display the types of constructs in right side? (default true)
    colorScale  : d3.js color scale used in showing states, events and labels. if not specified d3.scale.category20 is used.
*/
var SessionTimeframe = function(par){
    console.log("[session_timeframe]Parameters:", par);
   
    var p = par || {};
    
    var _svg  = p.svg !== undefined ? p.svg : false;
    if(!_svg){
        console.log("SVG parameter is mandatory for the timeline!");
        return false;
    }
    
    var _width = p.width !== undefined ? p.width : 256;
    var _height = p.height !== undefined ? p.height : 32;
    var _margins = p.margins !== undefined ? p.margins : {top: 0, bottom : 0, left: 0, right: 0};
    var _xDomain = p.timeframe !== undefined ? p.timeframe : [0, 1000]; //useless because already defined in _main
    var _labelDomain = p.labelColors !== undefined ? p.labelColors : [];
    var _typeDomain = p.stateColors !== undefined ? p.stateColors : [];
    var _yDomain = p.ids !== undefined ? p.ids : [];
    var _eventData = p.events !== undefined ? p.events : [];
    var _lifespanData = p.lifespans !== undefined ? p.lifespans : [];
    var _constructData = p.constructs !== undefined ? p.constructs : false;
    //If we want to display the construct types or not?
    var _displayTypes = p.displayTypes !== undefined ? p.displayTypes : true;
    
    var _colorScale = p.colorScale !== undefined ? p.colorScale : d3.scale.category20();
    var _colorScale2 = d3.scale.category10();
    
   try{
      console.log("[session_timeframe]Modifying timescale...");
      var _range = 0;
      
      console.log("[session_timeframe]Domain:", _xDomain);
      
      var _timeScale = d3.time.scale().domain(_xDomain);
      //var _timeScale = d3.scale.linear();
      
       _timeScale.domain(_xDomain);
      
      //console.log("[custom_timeline.js]Range:", [_margins.left, _width-_margins.right]);
       _timeScale.range([_margins.left, _width-_margins.right]);

       //the tick size is negative because the orient of the axis is top. This reverts the axis...
       var _timeAxis = d3.svg.axis().orient("top").scale(_timeScale).tickSize(-_height+_margins.top+_margins.bottom);
       //_timeAxis.tickFormat(d3.format(",f")); //Number format on graph axis
   }catch(e){
      console.log("[session_timeframe]...fuck", e);
   }
  
    //building ordinal scale for test sets based on the build id
    var _scaleY = d3.scale.ordinal().rangeBands([_margins.top, _height-_margins.bottom]).domain(_yDomain);

    //calculaiting height for one row now that we know how many rows we will have
    var _rowHeight = ((_height-_margins.bottom-_margins.top)/_yDomain.length);
    var _minRowHeight = 30;//12;
    var _maxRowHeight = 40;//16;
    if(_rowHeight < _minRowHeight){
        _rowHeight = _minRowHeight;
    }
    else if(_rowHeight > _maxRowHeight){
        _rowHeight = _maxRowHeight;
    }
    _height = (_rowHeight * _yDomain.length) + _margins.bottom+_margins.top;
    
    _svg.attr("width", _width);
    _svg.attr("height", _height);

    //building color scale
    _colorScale.domain(_labelDomain);
    _colorScale2.domain(["start/end","help","doc","feature"]);
    
    //In SVG the draw order is reverse order of defining the nodes
    
    //Y-axis is constructed from rect and text SVG-elements. d3 axis is not used.
    //the _bgGroup, _bg and _names are the "Y-axis" graphical presentation.
    var _bgGroup = _svg.append("g");
    var _bg = _bgGroup.selectAll("rect").data(_constructData).enter().append("rect");
    var _names = _bgGroup.selectAll("text").data(_yDomain).enter().append("text");
    
    //Status group is related to the "Y-axis". It shows the status of the session
    if(_displayTypes){
        var _stateGroup = _svg.append("g");
        var _states = _stateGroup.selectAll("rect").data(_constructData).enter().append("rect");
        var _labels = _stateGroup.selectAll("text").data(_constructData).enter().append("text");
    }
    
    //Defining the data!
    
    //Lifespan data
    var _lifespanGroup = _svg.append("g");
    var _lifespans = _lifespanGroup.selectAll("line").data(_lifespanData).enter().append("line");
    
    //The event times
    var _eventGroup = _svg.append("g");
    
    var _events = _eventGroup.selectAll("circle").data(_eventData).enter().append("circle");
    
    var _xAxisGraphic = _svg.append("g").attr("class", "x axis");
    
    var _tooltip = d3.select("body").append("div").attr('class', "tooltip");
    
    //Lifespan start (always 0)
    var getLpStart = function(data){
        var domain = _timeScale.domain();

        return _timeScale(domain[0]);
    };
    
    //Lifespan end
    var getLpEnd = function(data){
        var domain = _timeScale.domain();
        
        //if end is false, data endpoint is mapped to the domain end point
        if(!data.end){
            data.end = domain[domain.length-1]; 
        }

        var n_end = new Date(data.end).getTime();
        var n_first = new Date(data.first_time).getTime();
        var y = n_end - n_first;

        if (y >= + domain[domain.length-1]) {
            return _timeScale(domain[domain.length-1]);
        }else if (y <= + domain[0]) {    
            return _timeScale(domain[0]);
        }
            
        return _timeScale(y);
    };
    
    //Gets the timeline bars start point
    //The start point is the x-coordinate of the runtime bar
    var getX = function(data){
        var domain = _timeScale.domain();
        var start = + new Date(data.time);
        var base = + new Date(data.data.first_time);
        
        var circleDiameter = _rowHeight*0.33*2;

        var x = start - base;
        
        //clipping the coordinates to brush selection
        if(x < domain[0] || x > domain[domain.length-1]){
            return -circleDiameter;
        }

        return _timeScale(x);
    };
  
    //Gets the data row based on buildId
    var getY = function(data){
        return _scaleY(data.rowId);
    };
    
    var getLineY = function(data){
        var y = getY(data);
        y += _rowHeight*0.33;
        
        if (data.data && data.data.collide !== 0){
            //console.log("[custom_timeline.js]Data collides:", data.data.collide);
            y += (_rowHeight*0.1) * data.data.collide;
        }
        
        return y;
    };
    
    //WHAT IS DISPLAYED ON MOUSE OVER !!!
    var onMouseOver = function(data){
        var dispstring = "DETAILS:<br>";
       
        try{
        for(var atr in data){
            if(typeof data[atr] !== "undefined" && data.hasOwnProperty(atr)){
                if(!$.isPlainObject(data[atr]) && !$.isArray(data[atr])){
                    dispstring += atr+": "+data[atr].toString()+"</br>";
                   
                }else if ($.isArray(data[atr])) {
                   for(var atr2 in data[atr]){
                       if(!$.isPlainObject(data[atr]) && !$.isArray(data[atr])){
                           if(data[atr].hasOwnProperty(atr2)){
                                dispstring += "tab("+atr2+"): "+data[atr][atr2].toString()+"</br>";
                           }
                       }
                   }
                }else if ($.isPlainObject(data[atr])) {
                   for(var atr2 in data[atr]){
                       if(data[atr].hasOwnProperty(atr2)){
                            dispstring += "object("+atr2+"): "+data[atr][atr2].toString()+"</br>";
                       }
                   }
                }
            }
        }
        }catch(e){
            console.log(data, e);
        }
       
        _tooltip.html(dispstring);
        return _tooltip.style("visibility", "visible");
    };
    
    var onMouseMove = function(data){
        return _tooltip.style("top", (event.pageY-30)+"px").style("left",(event.pageX+15)+"px");
    };
    
    var onMouseOut = function(data){
        return _tooltip.style("visibility", "hidden");
    };

    //public methods
    var pub = {};
    
    pub.clear = function(){
        _svg.selectAll("*").remove();
    };
    
    //Color for lifespans and events
    pub.getColor = function(data){
        return _colorScale2(data.type);
    };
    
    //Color for labels (user name)
    pub.getColor2 = function(data){
        return _colorScale(data.related_constructs[0]);
    };
    
    pub.getStateColor = function(data){
        return "#80c3cc"; //_colorScale(data.state);
    };
    
    //Returns the state text from data
    pub.getLabel = function(data){
        return ".." + data.related_constructs[0].substring(20);
        //return data.type;
    };
    
    pub.draw = function(){
        
        //background and y-axis
        _bg.attr('fill', "#FCFCFC")
            .attr('x', 0)
            .attr('width', _width-_margins.right)
            .attr('y', getY)
            .attr('height', _rowHeight)
            .on("mouseover", onMouseOver)
            //.on("mousemove", onMouseMove)
            .on("mouseout", onMouseOut);

        
        _names.attr('x', 2)
            .attr('y', function(d){return _scaleY(d)+_rowHeight*0.75;})
            .text(function(d){return d.toString();});
        
        _lifespans.attr('x1', getLpStart)
            .attr('x2', getLpEnd)
            .attr('y1', getLineY)
            .attr('y2', getLineY)
            .attr('stroke', pub.getStateColor)
            .on("mouseover", onMouseOver)
            //.on("mousemove", onMouseMove)
            .on("mouseout", onMouseOut);
        
        _events.attr('fill', pub.getColor)
            .attr('cx', getX) //X coordinate
            .attr('cy', getLineY) //Y coordinate
            .attr('r', _rowHeight*0.33*0.5) //Ray of event circle
            .on("mouseover", onMouseOver)
            //.on("mousemove", onMouseMove)
            .on("mouseout", onMouseOut);

        
        //Text and color for labels
        if(_displayTypes){
            _states.attr('fill', pub.getColor2)
                .attr('x', _width-_margins.right)
                .attr('width', _margins.right)
                .attr('y', getY)
                .attr('height', _rowHeight);
            
            _labels.attr('x', _width-_margins.right)
                .attr('y', function(d){return getY(d)+_rowHeight*0.75;})
                .text(pub.getLabel);
        }
        
        
        //x-axis
        _xAxisGraphic.attr("transform", "translate(0,"+(_margins.top)+")")
            .call(_timeAxis)
            .selectAll(".tick text")
            .style("text-anchor", "start");
        
    };
    
    pub.onBrush = function(timeRange){
        _timeScale.domain(timeRange);        
        pub.draw();
    };
    
    pub.onResize = function(width, height, margins){
        _width = width;
        _height = height;
        _margins = margins;
        
        _rowHeight = ((_height-_margins.bottom-_margins.top)/_yDomain.length);
        if(_rowHeight < _minRowHeight){
            _rowHeight = _minRowHeight;
        }
        else if(_rowHeight > _maxRowHeight){
            _rowHeight = _maxRowHeight;
        }
        _height = (_rowHeight * _yDomain.length) + _margins.bottom+_margins.top;
        
        _timeScale.range([_margins.left, _width-_margins.right]);
        _timeAxis.tickSize(-_height+_margins.top+_margins.bottom);
        _scaleY.rangeBands([_margins.top, _height-_margins.bottom]);
        
        _svg.attr("width", _width);
        _svg.attr("height", _height);
        
        pub.draw();
    };
    
    pub.getMinHeight = function(){
       return _rowHeight*_yDomain.length+_margins.top+_margins.bottom;
    };
    
    pub.getColorScale = function(){
        return _colorScale;
    };
    
    pub.getColorScale2 = function(){
        return _colorScale2;
    };
    
    pub.updateData = function(ud){
        //Clear the chart before new bindings
        pub.clear();
        
        var u = ud || {};
        
        _xDomain = u.timeframe !== undefined ? u.timeframe : _xDomain;
        _yDomain = u.ids !== undefined ? u.ids : _yDomain;
        _eventData = u.events !== undefined ? u.events : _eventData;
        _lifespanData = u.lifespans !== undefined ? u.lifespans : _lifespanData;
        _constructData = u.constructs !== undefined ? u.constructs : _constructData;
        //type data can be left out by setting displayTypes parameter to false
        _displayTypes = p.displayTypes !== undefined ? p.displayTypes : _displayTypes;
        
        //reassigning scales
        _timeScale.domain(_xDomain);
        _timeScale.range([_margins.left, _width-_margins.right]);
        //building ordinal scale for test sets based on the build id
        _scaleY.domain(_yDomain);

        //calculaiting height for one row now that we know how many rows we will have
        _rowHeight = ((_height-_margins.bottom-_margins.top)/_yDomain.length);
        if(_rowHeight < _minRowHeight){
            _rowHeight = _minRowHeight;
        }
        else if(_rowHeight > _maxRowHeight){
            _rowHeight = _maxRowHeight;
        }
        _height = (_rowHeight * _yDomain.length) + _margins.bottom+_margins.top;

        //The data update
        
        //Y-axis is constructed from rect and text SVG-elements. d3 axis is not used.
        //the _bgGroup, _bg and _names are the "Y-axis" graphical presentation.
        _bgGroup = _svg.append("g");
        _bg = _bgGroup.selectAll("rect").data(_constructData).enter().append("rect");
        _names = _bgGroup.selectAll("text").data(_yDomain).enter().append("text");
        
        //Status group is related to the "Y-axis". It shows the status of the test if it failed or passed.
        if(_displayTypes){
            _stateGroup = _svg.append("g");
            _states = _stateGroup.selectAll("rect").data(_constructData).enter().append("rect");
            _labels = _stateGroup.selectAll("text").data(_constructData).enter().append("text");
        }
        //Defining the data!
        //Lifespan data
        
        _lifespanGroup = _svg.append("g");
        _lifespans = _lifespanGroup.selectAll("line").data(_lifespanData).enter().append("line");
        
        //The event times
        _eventGroup = _svg.append("g");
        _events = _eventGroup.selectAll("circle").data(_eventData).enter().append("circle");
        
        _xAxisGraphic = _svg.append("g").attr("class", "x axis");
    };
    
    
    return pub;
};