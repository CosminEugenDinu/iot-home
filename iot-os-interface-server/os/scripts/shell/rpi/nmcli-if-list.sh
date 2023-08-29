#!/bin/bash

# list network interfaces

# [-t] format output for use in scripts
# output like: (DEVICE, TYPE, STATE, CONNECTION)
# wlan0:wifi:connected:netplan-wlan0-AndroidAP
# eth0:ethernet:unmanaged:
# lo:loopback:unmanaged:

iflist="$(nmcli -t device status)"

echo "${iflist}"
