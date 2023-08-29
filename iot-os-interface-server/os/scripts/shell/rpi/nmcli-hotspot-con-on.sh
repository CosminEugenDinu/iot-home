#!/bin/bash

con_name="$1"

UUID="$(sudo grep uuid /etc/NetworkManager/system-connections/${con_name}.nmconnection | cut -d= -f2)"

response="$(sudo nmcli con up uuid $UUID)"

value="\"${response}\""
echo '{"done":true,"value":'"${value}"'}'
