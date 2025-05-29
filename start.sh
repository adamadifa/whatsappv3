#!/bin/bash
nohup node app.js > output.log 2>&1 &
echo $! > save_pid.txt
