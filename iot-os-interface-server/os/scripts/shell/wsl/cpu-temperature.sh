#!/bin/bash

# curl -L https://bit.ly/glances | /bin/bash

jsonResponse="$(sensors -j cpu_thermal-*)"

echo '{"done":true,"value":'"${jsonResponse}"'}'