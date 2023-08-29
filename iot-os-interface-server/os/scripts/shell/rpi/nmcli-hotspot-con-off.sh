#!/bin/bash

con_name="$1"

response="$(sudo nmcli con down ${con_name})"

value="\"${response}\""
echo '{"done":true,"value":'"${value}"'}'