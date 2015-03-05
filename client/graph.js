
Router.route('/graph', function () {
    //Template.Graph.helpers({
      //accels: function () {
          //return Accels.find();
      //}
    //});


    //var parseDate = d3.time.format("%d-%b-%y").parse;

    //console.log(data);
    //graphData(data);

    this.render('Graph');
//var one = {'x': '582.13', 'y': 5, 'z': '6', createdAt: parseDate('1-May-12')};
//var two = {'x': '585.13', 'y': 10, 'z': '7', createdAt: parseDate('27-Apr-12')};
//console.log(JSON.stringify(two));
});

var doneFirst = false;
Template.Graph.created = function () {
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var line = d3.svg.line()
        .x(function(d) { return x(d.createdAt); })
        .y(function(d) { return y(d.x); });

    if (!doneFirst) {
        doneFirst = true;
        var svg = d3.select("body").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    }


    Tracker.autorun(function () {
        var data = Accels.find();
        //console.log('run this', data.map(function(d) {return d}));
        data = data.map(function(d) {
            var ret = {};
            ret.createdAt = new Date(d.createdAt);
            ret.x = parseFloat(d.x);
            ret.y = parseFloat(d.y);
            ret.z = parseFloat(d.z);
            return ret;
        });
        x.domain(d3.extent(data, function(d) { return d.createdAt; }));
        y.domain(d3.extent(data, function(d) { return d.x; }));

        var svg = d3.select('svg g');
        svg.html('');
        svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

        svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
        .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text("Price ($)");

        svg.append("path")
          .datum(data)
          .attr("class", "line")
          .attr("d", line);
    });
}
