#!/bin/bash

# [-t] format output for use in scripts
wifilist="$(nmcli -t device wifi list)"
echo "${wifilist}"