Session.set('graphOn', false);
var alarmTriggered = true;

Template.Graph.helpers({
        count: function () {
            return getAccelsCount();
        },
        ttsWaiting: function () {
            return getGlobalState('TTSReceived') === 'waiting';
        },
        ttsButtons: function () {
            return ['gps-off', 'gps-on', 'prod', 'debug', 'alarm-reset'].map(function (x) {return {val: x}});
        },
        ttsPretextButtons: function () {
            return ['Subject is walking', 'Subject is running', 'Hi, would you mind putting this bike upright?', 'Bike is being tampered with at the California Avenue cal train station. Authorities notified.'].map(function (x) {return {val: x}});
        },
        alarmSet: function() {
            return getGlobalState('alarmSet');
        },
        graphOn: function() {
            return Session.get('graphOn');
        },
        // TODO making this "alarmTriggered" piece of data... need to keep track of it and have
        // android change this mongo row.. reflect it here
        // The one problem is the "initialization". We want to watch for changes on "alarmSet" and see
        // when it turns off, in which case we play the alarm song. But at the _start_, alarmSet
        // is false but we don't want to play the song.
        phoneConnected: function() {
            return getGlobalState('phoneConnected');
        },
        graphDisplay: function() {
            if (Session.get('graphOn')) {
                return '';
            }
            return 'display:none';
        }
    });

Template.Graph.events({
        "click .setClearFlag": function (event) {
            Meteor.call('setClearFlag');
        },
        "submit .ttsForm": function (event) {
            event.preventDefault();
            console.log('change to', event.target.children[0].value);
            Meteor.call('setGlobalState', 'TTSReceived', 'waiting', function() {
                console.log('is it waiting?', getGlobalState('TTSReceived') === 'waiting');
            });
            Meteor.call('sendMsg', event.target.children[0].value);

            return false;
        },
        "click .ttsButton": function (event) {
            Meteor.call('sendMsg', event.target.innerHTML);
            Meteor.call('setGlobalState', 'TTSReceived', 'waiting');
            if (event.target.innerHTML === 'alarm-reset') {
                document.getElementById('alertAudio').pause();
                document.getElementById('alertAudio').currentTime = 0;
                Meteor.call('setGlobalState', 'alarmSet', true);
            }
        },
        "click .ttsPretextButton": function (event) {
            Meteor.call('sendMsg', event.target.innerHTML);
            Meteor.call('setGlobalState', 'TTSReceived', 'waiting');
        },
        "change #graphOn": function (event) {
            Session.set('graphOn', event.target.checked);
        }
    });

Router.route('/graph', function () {
        //var parseDate = d3.time.format("%d-%b-%y").parse;

        this.render('Graph');
    });

var doneFirst = false;
var margin = {top: 20, right: 20, bottom: 30, left: 50},
width = 1500 - margin.left - margin.right,
height = 800 - margin.top - margin.bottom;
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

Template.Graph.rendered = function () {
    if (!doneFirst) {
        doneFirst = true;
        console.log('adding svg stuff');
        var svg = d3.select("#graph")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    }
};

Template.Graph.created = function () {
    Tracker.autorun(function () {
            if (Session.get('graphOn')) {
                //var data = Accels.find({createdAt: {$gt: new Date(new Date().getTime() - 1000 * 120)}});
                var batchAccelsRaw = BatchAccels.find().map(function(x) {
                        return JSON.parse(x.accelsJson);
                    });
                var batchAccels = [];
                console.log('raw', batchAccelsRaw);
                var curTime = new Date();
                for (var i = 0; i < batchAccelsRaw.length; i++) {
                    //console.log('length', batchAccelsRaw[i].length);
                    for (var j = 0; j < batchAccelsRaw[i].length; j++) {
                        if (curTime - new Date(batchAccelsRaw[i][j][3]) < 20000) {
                            batchAccels.push({x: batchAccelsRaw[i][j][0],
                                    y: batchAccelsRaw[i][j][1],
                                    z: batchAccelsRaw[i][j][2],
                                    createdAt: new Date(batchAccelsRaw[i][j][3])});
                        }
                    }
                }
                var data = batchAccels;
                console.log('now have', batchAccels);
                //var row = AllAccels.findOne();
                //if (!row) {
                //return;
                //}
                //var data = [];
                //// Important I look at the "times" length and not xs or something, because that's the last
                //// array that is updated in mongo
                //var curTime = new Date();
                //for (var i = 0; i < row.times.length; i++) {
                ////if (curTime - new Date(row.times[i]) < 120000) {
                //data.push({x: parseFloat(row.xs[i]), y: parseFloat(row.ys[i]), z: parseFloat(row.zs[i]), createdAt: new Date(row.times[i])});
                ////}
                //}
                //console.log('vs data', data);

                var maxY = 40;// d3.max(data, function (d) {return Math.max(d.x, d.y, d.z)});
                var minY = -40; //d3.min(data, function (d) {return Math.min(d.x, d.y, d.z)});

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
            }
        });

    Tracker.autorun(function() {
            if (getGlobalState('alarmSet') && getGlobalState('phoneConnected')) {
                alarmTriggered = false;
            } else if (!alarmTriggered) {
                document.getElementById('alertAudio').play();
                alarmTriggered = true;
            }
        });
}
