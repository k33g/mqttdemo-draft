#!/bin/sh
#/bin/bash
redis-server&
node broker.js&
wait