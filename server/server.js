Meteor.methods({
    setClearFlag: function() {
        BatchAccels.remove({}); // Clear everything :p
        console.log('removing everything');
    }
});

Meteor.startup(function () {
  if (Circles.find().count() === 0) {
    Circles.insert({data: [5, 8, 11, 14, 17, 20]});
  }
  if (BatchAccels.find().count() === 0) {
      BatchAccels.insert({accelsJson: "[]"});
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

//Router.route('/accels/:x/:y/:z', {where: 'server'})
  //.post(function () {
      //var accel = {
          //x: this.params.x,
          //y: this.params.y,
          //z: this.params.z,
          //createdAt: new Date() // current time
      //};
      //Accels.insert(accel);
      //this.response.end('Received x of ' + JSON.stringify(accel) + '\n');
  //});

//var clearOldAccels = function() {
    //var accels = AllAccels.findOne();
    //if (!accels) {
        //return;
    //}
    //var xs = [];
    //var ys = [];
    //var zs = [];
    //var times = [];
    //var curTime = new Date();
    //for (var i = 0; i < accels.times.length; i++) {
        //if (curTime - new Date(accels.times[i]) < 120000) { // TODO hardcoded.. 2 seconds.. fix here and in graph.js
          //xs.push(accels.xs[i]);
          //ys.push(accels.ys[i]);
          //zs.push(accels.zs[i]);
          //times.push(accels.times[i]);
      //}
  //}
  //AllAccels.update({}, {$set: {times: times}}); // Times has to go first, because we're watching the length of this.. TODO be more explicit about this in code?
  //AllAccels.update({}, {$set: {xs: xs}});
  //AllAccels.update({}, {$set: {ys: ys}});
  //AllAccels.update({}, {$set: {zs: zs}});
//};

Router.route('/hitter/:time', {where: 'server'})
  .post(function () {
          Hitters.insert({androidTime: this.params.time, createdAt: new Date()});
          this.response.end('done');
    });

Router.route('/multi_accels', {where: 'server'})
  .post(function () {
      if (AllAccels.find().count() === 0) {
          AllAccels.insert({xs: [], ys: [], zs: [], times: []});
      }
      //if (clearFlag) {
          //clearOldAccels();
          //clearFlag = false;
      //}
      console.log('request', this.request.body);
      var xs = [];
      var ys = [];
      var zs = [];
      var times = [];
      var points = this.request.body;
      for (var i = 0; i < points.length; i++) {
          xs.push(points[i][0]);
          ys.push(points[i][1]);
          zs.push(points[i][2]);
          times.push(new Date(points[i][3]));
      }
      AllAccels.update({}, {$pushAll: {xs: xs}});
      AllAccels.update({}, {$pushAll: {ys: ys}});
      AllAccels.update({}, {$pushAll: {zs: zs}});
      AllAccels.update({}, {$pushAll: {times: times}});
      this.response.end('got some request');
  });
