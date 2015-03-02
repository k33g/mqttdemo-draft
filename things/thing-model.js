// Model of Thing

/**
 * thing-model
 * broker is available under the terms of the MIT-License.
 * Copyright 2015-2016, Philippe Charrière & Laurent Huet
 */


var Cylon = require('cylon');

var mqttServer = 'mqtt://85.171.70.209:1883'
  , mqttClientId = 'the-thing'
  , topicForPublication = "hello-all";

Cylon.robot({
  connections: {
    server: { adaptor: 'mqtt', host: mqttServer }
  },

  work: function(my) {
    // set id of client
    my.server.additionalOpts.clientId = mqttClientId;

    // explain woh am I
    /*
      kind: kind of component to display
      publishOn: topic for publication
     */
    my.server.publish('informations', JSON.stringify({
      kind:"text",
      remark:"This is a thing",
      unit: "pony",
      publishOn: topicForPublication
    }));

    my.server.subscribe('yo'); // listen to yo topic

    setTimeout(function(){
      my.server.subscribe('hi'); // listen to hi topic
    }, 1000);

    my.server.on('message', function (topic, data) {

    });

    every((1).seconds(), function() {
      var message = {
        time: Date.now(),
        value: ["Yo!", "Hi!", "Hello!"][Math.floor(Math.random()*3)]
      }
      my.server.publish(topicForPublication, JSON.stringify(message));
    });

  }

}).start();
