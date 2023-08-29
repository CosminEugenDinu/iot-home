#!/bin/bash

source .env

export PICO_SDK_PATH="$(pwd)/pico-sdk-flat"

export PICO_WIFI_SSID="${PICO_WIFI_SSID}"
export PICO_WIFI_PASS="${PICO_WIFI_PASS}"

if which ninja >/dev/null; then
    cmake -B build -G Ninja $1 && \
    ninja -C build $1
else
    cmake -B build $1 && \
    make -j $(getconf _NPROCESSORS_ONLN) -C build $1 && \
    echo "done. P.S.: Consider installing ninja - it's faster"
fi
exit $?
