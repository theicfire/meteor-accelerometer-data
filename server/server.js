var gcm = Meteor.npmRequire('node-gcm');
var request = Meteor.npmRequire('request');
var PushBullet = Meteor.npmRequire('pushbullet');
var pusher = new PushBullet('oYHlSULc3i998hvbuVtsjlH0ps23l7y2');
var lastCount = -1;





var sendAndroidMessage = function(msg) {
    var regid = Regid.findOne();
    if (!regid) {
        console.error("Nothing registered");
        return;
    }

    var message = new gcm.Message({
        data: {
            method: 'speak',
            text: msg
        }
    });
     
    // Set up the sender with you API key 
    var sender = new gcm.Sender('AIzaSyA7KXZIY6hc39WAxvPO1ednt1HmtSSrWOU');

     
    // Add the registration IDs of the devices you want to send to 
    var registrationIds = [regid.regid];
     
    var retries = 5;
    sender.send(message, registrationIds, 5, function(err, result) {
      if(err) console.error(err);
      else    console.log(result);
    });
}

var setGlobalState = function(name, value) {
    Other.upsert({name:name}, {name:name, value: value});
};

var sendPushbullet = function(title, msg, phone_nickname, cb) {
    pusher.devices(function(err, res) {
        if (err) {
            return;
        }
        var params = {};
        if (phone_nickname && phone_nickname.length > 0) {
            var bikeId;
            for (var i = 0; i < res.devices.length; i++) {
                if (res.devices[i].nickname == phone_nickname) {
                    params = {device_iden: res.devices[i].iden};
                    break;
                }
            }
        }
        pusher.note(params, title, msg, cb);
    });
};

var alertAdmin = function(title, msg, phone_nickname) {
    sendPushbullet(title, msg, phone_nickname);
    setGlobalState('alertAdminNum', getGlobalState('alertAdminNum') + 1);
};

Meteor.methods({
    sendAndroidMessage: sendAndroidMessage,
    setGlobalState: setGlobalState,
    sendPushbullet: sendPushbullet
});

Meteor.onConnection(function (connection) {
    if (connection.httpHeaders['user-agent'] === undefined) {
        setGlobalState('phoneConnected', true);
        connection.onClose(function() {
            setGlobalState('phoneConnected', false);
            console.log('phone closing', connection.clientAddress);
            if (getGlobalState('alarmSet') && getGlobalState('prodOn')) {
                alertAdmin('Phone disconnected', 'At ' + (new Date()).getTime());
            }
        });
    }
});

Meteor.startup(function () {
    Fiber = Npm.require('fibers');
    if (getGlobalState('alertAdminNum') === null) {
        setGlobalState('alertAdminNum', 0);
    }
    if (BatchAccels.find().count() === 0) {
        BatchAccels.insert({accelsJson: "[]"});
    }
    if (Regid.find().count() === 0) {
        Regid.insert({regid: ""});
    }
    setInterval(function() {
        Fiber(function() {
            if (getAccelsCount() > 20000) {
                BatchAccels.remove({});
                Alarms.remove({});
            }
        }).run();
    }, 2000);
});

Router.route('/regid/:regid', {where: 'server'})
    .post(function () {
        Regid.update({}, {'regid': this.params.regid});
        console.log('regid is', this.params.regid);
        this.response.end('done');
    });

Router.route('/tts-received', {where: 'server'})
    .post(function () {
        setGlobalState('TTSReceived', 'received');
        this.response.end('done');
    });

Router.route('/triggerAlarm', {where: 'server'})
    .post(function () {
        console.log('trigger alarm called');
        setGlobalState('alarmSet', false);
        setGlobalState('alertAdminNum', getGlobalState('alertAdminNum') + 1);
        this.response.end('done');
    });

Router.route('/setGlobalState/:key/:value', {where: 'server'})
    .post(function () {
        console.log('setGlobalState', this.params.key, this.params.value);
        setGlobalState(this.params.key, this.params.value === 'true');
        if (this.params.key === 'bluetoothOn' && this.params.value !== 'true') {
            Fiber = Npm.require('fibers');
            setTimeout(function() {
                Fiber(function() {
                    if (!getGlobalState('bluetoothOn') && getGlobalState('alarmSet') && getGlobalState('prodOn')) {
                        alertAdmin('Bluetooth disconnected', 'At ' + (new Date()).getTime());
                    }
                }).run()
            }, 3000);

        }
        this.response.end('done');
    });

Router.route('/pbullet/:nickname?', {where: 'server'})
    .post(function () {
        var that = this;
        sendPushbullet(this.request.body.title, this.request.body.msg, this.params.nickname, function(error, response) {
            if (error) {
                that.response.end('error');
            } else {
                that.response.end(JSON.stringify(response));
            }
        });
    });

Router.route('/phonestart', {where: 'server'})
    .post(function () {
        setGlobalState('alarmSet', false);
        setGlobalState('bluetoothOn', false);
        setGlobalState('lightsOn', false);
        setGlobalState('chainOn', false);
        setGlobalState('prodOn', false);
        setGlobalState('gpsOn', false);
        this.response.end('done');
    });
