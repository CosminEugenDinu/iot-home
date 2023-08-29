#!/bin/bash

wifi_network_interface="$1" # wlan1(infrastructure) or wlan0(ap)
con_name="$2"
con_auto_connect="$3" # yes/no
con_ssid="$4"
con_password="$5"
ip_addr="$6"

sudo nmcli connection delete "${con_name}"

sudo nmcli connection add \
type wifi \
ifname "${wifi_network_interface}" \
mode ap \
con-name "${con_name}" \
ipv4.address "${ip_addr}/24" \
ipv4.method shared \
autoconnect "${con_auto_connect}" \
ssid "${con_ssid}"

sudo nmcli con modify "${con_name}" \
802-11-wireless.mode ap \
802-11-wireless.band bg \
ipv4.method shared

sudo nmcli con modify "${con_name}" \
wifi-sec.key-mgmt wpa-psk

sudo nmcli con modify "${con_name}" \
wifi-sec.psk "${con_password}"

sudo nmcli con up "${con_name}" 

