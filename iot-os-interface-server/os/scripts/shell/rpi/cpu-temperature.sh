#!/bin/bash

# sudo apt install lm-sensors
jsonResponse="$(sensors -j cpu_thermal-*)"

echo '{"done":true,"value":'"${jsonResponse}"'}'