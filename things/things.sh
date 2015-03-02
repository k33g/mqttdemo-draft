#!/bin/sh
#/bin/bash
node sensor-graph.js&
node thing-model.js&
node sensor-gauge.js&
node 06-Gauge.js&
wait