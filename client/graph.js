Session.set('graphOn', false);
Session.set('alertAdminNum', undefined);

Template.Graph.helpers({
        count: function () {
            return getAccelsCount();
        },
        ttsWaiting: function () {
            return getGlobalState('TTSReceived') === 'waiting';
        },
        ttsButtons: function () {
            return [
                'gps-off',
                'gps-on',
                'prod',
                'debug',
                'alarm-reset',
                'bt-on',
                'bt-off',
                'lon',
                'loff',
                'chain-on',
                'siren-short',
                'siren-medium',
                'siren-forever'].map(function (x) {return {val: x}});
        },
        ttsPretextButtons: function () {
            return ['Subject is walking',
                'Subject is running',
                'Hi, would you mind putting this bike upright?',
                'Bike is being tampered with at the Palo Alto cal train station. Authorities notified.'
            ].map(function (x) {return {val: x}});
        },
        alarmSet: function() {
            return getGlobalState('alarmSet');
        },
        graphOn: function() {
            return Session.get('graphOn');
        },
        phoneConnected: function() {
            return getGlobalState('phoneConnected');
        },
        graphDisplay: function() {
            if (Session.get('graphOn')) {
                return '';
            }
            return 'display:none';
        },
        bluetoothOn: function() {
            return getGlobalState('bluetoothOn');
        },
        lightsOn: function() {
            return getGlobalState('lightsOn');
        },
        gpsOn: function() {
            return getGlobalState('gpsOn');
        },
        prodOn: function() {
            return getGlobalState('prodOn');
        },
        chainOn: function() {
            return getGlobalState('chainOn');
        }
    });

Template.Graph.events({
        "submit .ttsForm": function (event) {
            event.preventDefault();
            Meteor.call('setGlobalState', 'TTSReceived', 'waiting');
            Meteor.call('sendAndroidMessage', event.target.children[0].value);
            return false;
        },
        "click .ttsButton": function (event) {
            Meteor.call('setGlobalState', 'TTSReceived', 'waiting');
            Meteor.call('sendAndroidMessage', event.target.innerHTML);
            if (event.target.innerHTML === 'alarm-reset') {
                document.getElementById('alertAudio').pause();
                document.getElementById('alertAudio').currentTime = 0;
                Meteor.call('setGlobalState', 'alarmSet', true);
            }
        },
        "click .ttsPretextButton": function (event) {
            Meteor.call('sendAndroidMessage', event.target.innerHTML);
            Meteor.call('setGlobalState', 'TTSReceived', 'waiting');
        },
        "change #graphOn": function (event) {
            Session.set('graphOn', event.target.checked);
        },
        'click .appStart': function () {
            console.log('appstart called');
            Meteor.call('sendPushbullet', 'appstart', '', 'nexus4bike');
        },
        'click .appStop': function () {
            Meteor.call('sendPushbullet', 'appstop', '', 'nexus4bike');
        }
    });

Router.route('/', function () {
    this.render('Graph');
});

var doneFirst = false;
var margin = {top: 20, right: 20, bottom: 30, left: 50},
width = window.innerWidth - 20 - margin.left - margin.right,
height = window.innerHeight - margin.top - margin.bottom;
var x = d3.time.scale().range([0, width]);

var y = d3.scale.linear().range([height, 0]);

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
            var batchAccelsRaw = BatchAccels.find().map(function(x) {
                return JSON.parse(x.accelsJson);
            });
            var batchAccels = [];
            console.log('raw', batchAccelsRaw);
            var curTime = new Date();
            for (var i = 0; i < batchAccelsRaw.length; i++) {
                for (var j = 0; j < batchAccelsRaw[i].length; j++) {
                    if (curTime - new Date(batchAccelsRaw[i][j][3]) < 20000) {
                        batchAccels.push({x: batchAccelsRaw[i][j][0],
                                y: batchAccelsRaw[i][j][1],
                                z: batchAccelsRaw[i][j][2],
                                createdAt: new Date(batchAccelsRaw[i][j][3])});
                    }
                }
            }
            console.log('now have', batchAccels);

            var maxY = 40;// d3.max(batchAccels, function (d) {return Math.max(d.x, d.y, d.z)});
            var minY = -40; //d3.min(batchAccels, function (d) {return Math.min(d.x, d.y, d.z)});

            x.domain(d3.extent(batchAccels, function(d) { return d.createdAt; }));
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

            svg.append("path")
                .datum(batchAccels)
                .attr("class", "lineX")
                .attr("d", lineX);
            svg.append("path")
                .datum(batchAccels)
                .attr("class", "lineY")
                .attr("d", lineY);
            svg.append("path")
                .datum(batchAccels)
                .attr("class", "lineZ")
                .attr("d", lineZ);
        }
    });

    Tracker.autorun(function() {
            if (typeof(Session.get('alertAdminNum')) === 'number' &&
                    typeof(getGlobalState('alertAdminNum')) === 'number' &&
                    getGlobalState('alertAdminNum') !== Session.get('alertAdminNum')) {
                document.getElementById('alertAudio').play();
            }
            Session.set('alertAdminNum', getGlobalState('alertAdminNum'));
    });
}
