#MQTT Demo

by @lhuet35 and @k33g_org for DevoxxFR 2015


#TODO

- api to search a thing + search ux


##Components

- Mosca: [https://github.com/mcollina/mosca](https://github.com/mcollina/mosca)
- MQTT.js: [https://github.com/mqttjs/MQTT.js](https://github.com/mqttjs/MQTT.js)
- Cylon: [http://cylonjs.com/](http://cylonjs.com/)
- Express: [http://expressjs.com/](http://expressjs.com/)
- SocketIO: [https://github.com/automattic/socket.io](https://github.com/automattic/socket.io)
- SocketIO client: [https://github.com/automattic/socket.io-client](https://github.com/automattic/socket.io-client)
- MongoDB: optional
- Redis
- Riot (web components): [https://github.com/muut/riotjs](https://github.com/muut/riotjs)
- Polymer (web components): [https://www.polymer-project.org/](https://www.polymer-project.org/) (instead of riot)
- Epoch (real-time charting): [http://fastly.github.io/epoch/](http://fastly.github.io/epoch/)

##Install

Clone the project and type `npm install` + `bower install`

##Run

    ./broker.sh # launch redis too

Then:

    ./things.sh
    ./hubs.sh

##Resources


##TODO

- Sphero mqtt client (Done, to be integrated)
- Sphero web component for dashboard
- an other mqtt client to drive the Sphero
- persist messages (with Mongo or in memory?)
- rest api to read messages, send messages to mqtt client, ...
- composant pour la leap

