/**
 * Created by k33g_org on 01/03/15.
 * License
 * broker is available under the terms of the MIT-License.
 * Copyright 2015-2016, Philippe Charrière & Laurent Huet
 */

var mqtt = require('mqtt')
  , util = require('util');


var config = require('./brokerConfig.js')
  , express = require('express')
  , http = require('http')
  , bodyParser = require('body-parser')
  , socketIo = require('socket.io')
  , app = express()
  , httpPort = config.httpPort
  , socketPort = config.socketPort
  , mqttSettings = {port: config.mqttPort}
  , io  = socketIo.listen(socketPort)
  , redis = require("redis")
  , redisClient = redis.createClient();

/*=== Redis ===*/

redisClient.del("things");

redisClient.on("error", function (err) {
  console.log("Redis Error: " + err);
});


/*=== Express ===*/
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());


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


/*=== SocketIO ===*/
io.sockets.on('connection', function (socket) {
  //console.log("socket", socket)
});



new mqtt.Server(function(client) {
  var self = this;

  if (!self.clients) self.clients = {};

  client.on('connect', function(packet) {
    client.connack({returnCode: 0});
    client.id = packet.clientId;
    console.log("CONNECT(%s): %j", client.id, packet);
    self.clients[client.id] = client;

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

  client.on('publish', function(packet) {
    console.log("PUBLISH(%s): %j", client.id, packet);
    for (var k in self.clients) {
      self.clients[k].publish({topic: packet.topic, payload: packet.payload});
    }

    //console.log("### CMD: ", packet.cmd)

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

  client.on('subscribe', function(packet) {
    console.log("SUBSCRIBE(%s): %j", client.id, packet);
    var granted = [];
    for (var i = 0; i < packet.subscriptions.length; i++) {
      granted.push(packet.subscriptions[i].qos);
    }

    redisClient.hget("things", client.id, function(err, reply) {

      var data = JSON.parse(reply);

      data.subscriptions.push(packet.topic);

      redisClient.hset("things", client.id, JSON.stringify(data));

    });


    io.sockets.emit("subscribed", {
      client: client.id,
      topic: packet.topic

    });

    client.suback({granted: granted, messageId: packet.messageId});
  });

  client.on('pingreq', function(packet) {
    console.log('PINGREQ(%s)', client.id);
    client.pingresp();
  });

  client.on('disconnect', function(packet) {

    client.stream.end();

  });

  client.on('close', function(err) {

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

    delete self.clients[client.id];
  });

  client.on('error', function(err) {
    console.log('error!', err);

    if (!self.clients[client.id]) return;

    client.stream.end();
    console.dir(err);
  });
}).listen(process.argv[2] || mqttSettings.port);

app.listen(httpPort);

console.log("------------------ MQTT Demo ------------------")
console.log(" by @lhuet35 and @k33g_org for DevoxxFR 2015")
console.log("-----------------------------------------------")
console.log(' - MqttBroker listening on ' + mqttSettings.port)
console.log(" - Express listening on " + httpPort);
console.log(" - Socket.io listening on " + socketPort);
console.log("-----------------------------------------------")