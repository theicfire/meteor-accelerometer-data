var gcm = Meteor.npmRequire('node-gcm');
var request = Meteor.npmRequire('request');
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
    var sender = new gcm.Sender('AIzaSyB7HbfqjrISHU3MDBr_7DQM-4BmdaLUoTw');
     
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

var sendPushbullet = function(title, msg, phone_nickname) {
    console.log('sending pushbullet');
    var headers = {
        'User-Agent':       'Super Agent/0.0.1',
        'Content-Type':     'application/x-www-form-urlencoded'
    }

    // Configure the request
    var form_items = {title:title, message: msg};
    if (phone_nickname !== undefined) {
        form_items['phone_nickname'] = phone_nickname
    }
    var options = {
        url: 'http://pbullet.chaselambda.com/send',
        method: 'POST',
        headers: headers,
        form: form_items
    }

    // Start the request
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log('Pbullet done!', body);
        }
    })
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
            if (getGlobalState('alarmSet')) {
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
        this.response.end('done');
    });

Router.route('/bluetooth/:state', {where: 'server'})
    .post(function () {
        console.log('bluetooth request of ', this.params.state);
        setGlobalState('bluetoothOn', this.params.state === 'on');
        if (this.params.state !== 'on') {
            Fiber = Npm.require('fibers');
            setTimeout(function() {
                Fiber(function() {
                    if (!getGlobalState('bluetoothOn')) {
                        alertAdmin('Bluetooth disconnected', 'At ' + (new Date()).getTime());
                    }
                }).run()
            }, 3000);
        }
        this.response.end('done');
    });
