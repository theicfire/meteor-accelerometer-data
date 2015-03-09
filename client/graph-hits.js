Template.Hitter.helpers({
  count: function () {
      return Hitters.find().count();
  }
});

Router.route('/hitter', function () {
    //var parseDate = d3.time.format("%d-%b-%y").parse;

    this.render('Hitter');
});

Router.route('/hithitter', function () {
    //var parseDate = d3.time.format("%d-%b-%y").parse;

    this.render('HitHitter');
    setInterval(function() {
          Hitters.insert({androidTime: (new Date()).getTime(), createdAt: new Date()});

      }, 200);
});

var doneFirst = false;
Template.Hitter.created = function () {
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

    var lineHits = d3.svg.line()
        .x(function(d) { return x(d.androidTime); })
        .y(function (d, i) { return y(i)});

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
        var rows = Hitters.find();
        var data = rows.map(function(d) {
                return {androidTime: parseInt(d.androidTime)};
            });
        console.log(data);

        var maxY = data.length;
        var minY = 0;

        var extent = d3.extent(data, function(d) { return d.androidTime; });
        console.log('extent', extent);
        x.domain(extent);
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
          .attr("d", lineHits);
    });
}

