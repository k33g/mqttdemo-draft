/**
 * Created by k33g_org on 22/02/15.
 * License
 * broker is available under the terms of the MIT-License.
 * Copyright 2015-2016, Philippe Charrière & Laurent Huet
 */

var config = require('./brokerConfig.js')
  , mosca = require('mosca')
  , express = require('express')
  , http = require('http')
  , bodyParser = require('body-parser')
  , socketIo = require('socket.io')
  , app = express()
  , httpPort = config.httpPort
  , socketPort = config.socketPort
  , mqttSettings = {port: config.mqttPort}
  , io  = socketIo.listen(socketPort)
  , mqttBroker = new mosca.Server(mqttSettings)
  , redis = require("redis")
  , redisClient = redis.createClient();

/*=== Redis ===*/
redisClient.on("error", function (err) {
  console.log("Redis Error: " + err);
});


/*=== Express ===*/
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());


/*=== SocketIO ===*/
io.sockets.on('connection', function (socket) {
  //console.log("socket", socket)
});


/*=== Mosca ===*/
mqttBroker.on('clientConnected', function(client) {
  console.log('client connected', client.id);

  io.sockets.emit("clientConnected", {
    client: client.id
  });

  redisClient.hset("things", client.id, JSON.stringify({
    id: client.id,
    status: "connected",
    informations:null,
    subscriptions:[],
    lastMqttMessage:null
  }));

});

// When a message is received
mqttBroker.on('published', function(packet, client) {

  if(packet.cmd=="publish") {
    //console.log(client.id, packet.topic, packet.payload.toString())

    io.sockets.emit("mqtt", { // socket topic ?
      client: client.id,
      topic: packet.topic,
      message: packet.payload.toString()
    });

    /* I'm a thing, once connected I publish who I'm if I'm "polite" */
    if(packet.topic == "informations") {
      redisClient.hset("things", client.id, JSON.stringify({
        id: client.id,
        status: "connected",
        informations: JSON.parse(packet.payload.toString()),
        subscriptions:[],
        lastMqttMessage:null
      }));
    } else {

      redisClient.hget("things", client.id, function(err, reply) {
        var thing = JSON.parse(reply);
        thing.lastMqttMessage = JSON.parse(packet.payload.toString());
        //console.log("-->", thing)

        redisClient.hset("things", client.id, JSON.stringify(thing));

      });


    }
  }
});

// When a client subscribes to a topic
mqttBroker.on('subscribed', function(topic, client) {
  console.log('subscribed : ', topic);

  redisClient.hget("things", client.id, function(err, reply) {

    var data = JSON.parse(reply);

    data.subscriptions.push(topic);

    redisClient.hset("things", client.id, JSON.stringify(data));

  });


  io.sockets.emit("subscribed", {
    client: client.id,
    topic: topic

  });




});

mqttBroker.on('unsubscribed', function(topic, client) {
  console.log('unsubscribed : ', topic);

  io.sockets.emit("unsubscribed", {
    client: client.id,
    topic: topic
  });

  redisClient.hget("things", client.id, function(err, reply) {
    var data = JSON.parse(reply);
    var index = data.subscriptions.indexOf(topic)
    if (index > -1) {
      data.subscriptions.splice(index, 1);
    }
    redisClient.hset("things", client.id, JSON.stringify(data));
  });

});

mqttBroker.on('clientDisconnecting', function(client) {
  console.log('clientDisconnecting : ', client.id);
});

mqttBroker.on('clientDisconnected', function(client) {
  console.log('clientDisconnected : ', client.id);

  io.sockets.emit("clientDisconnected", {
    client: client.id
  });

  //redisClient.hdel("things", client.id);
  redisClient.hget("things", client.id, function(err, reply) {
    var data = JSON.parse(reply);
    data.status = "disconnected";
    data.subscriptions = [];
    redisClient.hset("things", client.id, JSON.stringify(data));
  });

});


app.get("/things", function(req, res) {
  var things = [];
  redisClient.hgetall("things", function (err, redisThings) {

    if(err) { console.log(err) }

    for(var thingKey in redisThings) {
      things.push(JSON.parse(redisThings[thingKey]));
    }
    res.send(things);
    //redisClient.quit();
  });

});

app.get("/things/:id", function (req, res) {
  redisClient.hget("things", req.params["id"], function(err, reply) {
    var thing = JSON.parse(reply);
    res.send(thing);

  });
});


mqttBroker.on('ready', setup);

// When the mqtt broker is ready
function setup() {

  //redisClient.del("things");

  console.log("------------------ MQTT Demo ------------------")
  console.log(" by @lhuet35 and @k33g_org for DevoxxFR 2015")
  console.log("-----------------------------------------------")
  console.log(' - Mosca mqttBroker listening on ' + mqttSettings.port)
  app.listen(httpPort);
  console.log(" - Express listening on " + httpPort);
  console.log(" - Socket.io listening on " + socketPort);
  console.log("-----------------------------------------------")
}

