Meteor.startup(function () {
  if (Circles.find().count() === 0) {
    Circles.insert({data: [5, 8, 11, 14, 17, 20]});
  }
});

Meteor.setInterval(function () {
  var newData = _.shuffle(Circles.findOne().data);
  Circles.update({}, {data: newData});
}, 2000);

Router.route('/task/:task', {where: 'server'})
  .post(function () {
        Tasks.insert({
          text: this.params.task,
          createdAt: new Date() // current time
        });
    this.response.end('post request ' + this.params.task + '\n');
  });

Router.route('/accels/:x/:y/:z', {where: 'server'})
  .post(function () {
      var accel = {
          x: this.params.x,
          y: this.params.y,
          z: this.params.z,
          createdAt: new Date() // current time
      };
      Accels.insert(accel);
      this.response.end('Received x of ' + JSON.stringify(accel) + '\n');
  });
