#!/bin/bash

command="$(sudo netplan apply)"
echo '{"done": true}'