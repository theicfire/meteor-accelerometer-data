Template.Graph.helpers({
  count: function () {
      if (AllAccels.findOne()) {
          return AllAccels.findOne().times.length;
      }
      return 0;
  }
});

Template.Graph.events({
  "click .setClearFlag": function (event) {
      Meteor.call('setClearFlag');
  }
});

Router.route('/graph', function () {
    //var parseDate = d3.time.format("%d-%b-%y").parse;

    this.render('Graph');
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

    var lineX = d3.svg.line()
        .x(function(d) { return x(d.createdAt); })
        .y(function(d) { return y(d.x); });
    var lineY = d3.svg.line()
        .x(function(d) { return x(d.createdAt); })
        .y(function(d) { return y(d.y); });
    var lineZ = d3.svg.line()
        .x(function(d) { return x(d.createdAt); })
        .y(function(d) { return y(d.z); });

    if (!doneFirst) {
        doneFirst = true;
        var svg = d3.select("body").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    }

    Tracker.autorun(function () {
        //var data = Accels.find({createdAt: {$gt: new Date(new Date().getTime() - 1000 * 120)}});
        var row = AllAccels.findOne();
        if (!row) {
            return;
        }
        var data = [];
        // Important I look at the "times" length and not xs or something, because that's the last
        // array that is updated in mongo
        var curTime = new Date();
        for (var i = 0; i < row.times.length; i++) {
            if (curTime - new Date(row.times[i]) < 120000) {
                data.push({x: parseFloat(row.xs[i]), y: parseFloat(row.ys[i]), z: parseFloat(row.zs[i]), createdAt: new Date(row.times[i])});
            }
        }

        var maxY = d3.max(data, function (d) {return Math.max(d.x, d.y, d.z)});
        var minY = d3.min(data, function (d) {return Math.min(d.x, d.y, d.z)});

        x.domain(d3.extent(data, function(d) { return d.createdAt; }));
        y.domain([minY, maxY]);

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
          .attr("class", "lineX")
          .attr("d", lineX);
        svg.append("path")
          .datum(data)
          .attr("class", "lineY")
          .attr("d", lineY);
        svg.append("path")
          .datum(data)
          .attr("class", "lineZ")
          .attr("d", lineZ);
    });
}
