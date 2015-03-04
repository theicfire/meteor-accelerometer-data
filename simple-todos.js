Tasks = new Mongo.Collection("tasks");
var Circles = new Meteor.Collection('circles');

if (Meteor.isServer) {
  Meteor.startup(function () {
    if (Circles.find().count() === 0) {
      Circles.insert({data: [5, 8, 11, 14, 17, 20]});
    }
  });

  Meteor.setInterval(function () {
    var newData = _.shuffle(Circles.findOne().data);
    Circles.update({}, {data: newData});
  }, 2000);
}

if (Meteor.isClient) {
    // This code only runs on the client
    Template.TodoList.helpers({
      tasks: function () {
        if (Session.get("hideCompleted")) {
          // If hide completed is checked, filter tasks
          return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
        } else {
          // Otherwise, return all of the tasks
          return Tasks.find({}, {sort: {createdAt: -1}});
        }
      },
      hideCompleted: function () {
        return Session.get("hideCompleted");
      },
      incompleteCount: function () {
          return Tasks.find({checked: {$ne: true}}).count();
      }
    });

    Template.TodoList.events({
      "submit .new-task": function (event) {
        // This function is called when the new task form is submitted

        var text = event.target.text.value;

        Tasks.insert({
          text: text,
          createdAt: new Date() // current time
        });

        // Clear form
        event.target.text.value = "";

        // Prevent default form submit
        return false;
      },
      "change .hide-completed input": function (event) {
          Session.set("hideCompleted", event.target.checked);
      }
    });
    Template.task.events({
      "click .toggle-checked": function () {
        // Set the checked property to the opposite of its current value
        Tasks.update(this._id, {$set: {checked: !this.checked}});
      },
      "click .delete": function () {
        Tasks.remove(this._id);
      }
    });

    Template.Vis.rendered = function () {
        var svg, width = 500, height = 75, x;

        svg = d3.select('#circles').append('svg')
          .attr('width', width)
          .attr('height', height);

        var drawCircles = function (update) {
          var data = Circles.findOne().data;
          var circles = svg.selectAll('circle').data(data);
          if (!update) {
            circles = circles.enter().append('circle')
              .attr('cx', function (d, i) { return x(i); })
              .attr('cy', height / 2);
          } else {
            circles = circles.transition().duration(1000);
          }
          circles.attr('r', function (d) { return d; });
        };

        Circles.find().observe({
          added: function () {
            x = d3.scale.ordinal()
              .domain(d3.range(Circles.findOne().data.length))
              .rangePoints([0, width], 1);
            drawCircles(false);
          },
          changed: _.partial(drawCircles, true)
        });
      };
}

Router.route('/task/:task', {where: 'server'})
  .post(function () {
        Tasks.insert({
          text: this.params.task,
          createdAt: new Date() // current time
        });
    this.response.end('post request ' + this.params.task + '\n');
  });

Router.route('/', function () {
  // render the Home template with a custom data context
  this.render('Vis', {data: {title: 'My Title'}});
});

Router.route('/todos', function () {
  // render the Home template with a custom data context
  this.render('TodoList');
});
