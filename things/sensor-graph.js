/**
 * sensor-graph is available under the terms of the MIT-License.
 * Copyright 2015-2016, Philippe Charrière & Laurent Huet
 */
var Cylon = require('cylon');

var mqttServer = 'mqtt://85.171.70.209:1883'
  , mqttClientId = 'the-sensor-graph'
  , topicForPublication = "hello-graph";

Cylon.robot({

  connections: {
    server: { adaptor: 'mqtt', host: mqttServer }
  },

  work: function(my) {
    // set id of client
    my.server.additionalOpts.clientId = mqttClientId;

    my.server.publish('informations', JSON.stringify({
      kind:"graph", remark:"data each 2 seconds", unit: "db",
      publishOn: topicForPublication
    }));

    my.server.on('message', function (topic, data) {

    });

    every((2).seconds(), function() {
      var message = {
        time: Date.now(),
        y: Math.floor(Math.random()*3000)
      }
      my.server.publish(topicForPublication, JSON.stringify(message));
    });

  }

}).start();
