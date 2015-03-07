/**
 * sensor-gauge is available under the terms of the MIT-License.
 * Copyright 2015-2016, Philippe Charrière & Laurent Huet
 */
var Cylon = require('cylon');

var mqttServer = 'mqtt://85.171.70.209:1883'
  , mqttClientId = 'the-sensor-gauge'
  , topicForPublication = "hello-gauge";

Cylon.robot({

  connections: {
    server: { adaptor: 'mqtt', host: mqttServer }
  },

  work: function(my) {
    // set id of client
    my.server.additionalOpts.clientId = mqttClientId;

    my.server.publish('informations', JSON.stringify({
      kind:"gauge",
      remark:"temperature",
      unit:"°C",
      publishOn: topicForPublication
    }));


    every((2).seconds(), function() {
      var message = {
        time: Date.now(),
        value: Math.random() // between 0 and 1
      }
      my.server.publish(topicForPublication, JSON.stringify(message));
    });

  }

}).start();
