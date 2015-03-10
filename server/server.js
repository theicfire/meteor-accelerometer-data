var gcm = Npm.require('node-gcm');

var sendSomeMessage = function() {
    var regid = Regid.findOne();
    if (!regid) {
        Regid.insert({'regid': 'APA91bFoHl8IksJdGaJzl9k01BzvqqaoBu_SR6BXNAPGfnut_rGlE1jYFx64c3mosVHYm8t7lyfvcF1LN2O8wb6E1HhaYyxFoPP56okn7dXHR9PSh4t8pxu6LEYY5DMBH8noQ-hq75H4cdSH8snqQcOYr1S0o9RxJXWQQR-ze2Zctrkj8Xke3Pimz5z59wGdkTeDy0lmx-Rq'});
        regid = Regid.findOne();
    }

    var message = new gcm.Message({
        //collapseKey: 'demo',
        //delayWhileIdle: true,
        //timeToLive: 3,
        data: {
            method: 'speak',
            text: 'this is the best'
        }
    });
     
    // Set up the sender with you API key 
    var sender = new gcm.Sender('AIzaSyB7HbfqjrISHU3MDBr_7DQM-4BmdaLUoTw');
     
    // Add the registration IDs of the devices you want to send to 
    var registrationIds = [];
    registrationIds.push(regid.regid);
     
    // Send the message 
    // ... trying only once 
    console.log('now SENDING');
    sender.sendNoRetry(message, registrationIds, function(err, result) {
      if(err) console.error(err);
      else    console.log(result);
    });
}

Meteor.methods({
    setClearFlag: function() {
        sendSomeMessage();
        BatchAccels.remove({}); // Clear everything :p
        console.log('removing everything');
    }
});

Meteor.startup(function () {
  if (BatchAccels.find().count() === 0) {
      BatchAccels.insert({accelsJson: "[]"});
  }
});

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

Router.route('/regid/:regid', {where: 'server'})
    .post(function () {
            // TODO mongo back this up
            Regid.update({}, {'regid': this.params.regid});
            console.log('regid is', this.params.regid);
          this.response.end('done');
        });

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
