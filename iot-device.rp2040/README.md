# Device server - RaspberryPi PICO W

This project is inspired by
[krzmaz/pico-w-webserver-example](https://github.com/krzmaz/pico-w-webserver-example)

## Development machine

- [Windows WSL](https://learn.microsoft.com/en-us/windows/wsl/)

## Windows:setup

- VSCode
- [USB WSL support](https://learn.microsoft.com/en-us/windows/wsl/connect-usb)

- [USBIPD](https://github.com/dorssel/usbipd-win)

```
winget install usbipd
```

- [PICOPROBE prebuilt UF2 firmware](https://github.com/raspberrypi/picoprobe/releases)

## WSL:setup:install - build tools

```bash
#Debian/Ubuntu:
sudo apt update
sudo apt install git

# SDK deps
sudo apt install cmake gcc-arm-none-eabi libnewlib-arm-none-eabi libstdc++-arm-none-eabi-newlib

# OPENOCD deps
sudo apt install pkg-config gdb-multiarch automake autoconf build-essential texinfo libtool gcc texinfo libftdi-dev libusb-1.0-0-dev

# Build deps
sudo apt install perl ninja-build

```

## WSL:setup:install - debug tools

```bash
# Usb monitor
sudo apt install minicom

# VSCode
# sudo apt install code

# VSCode extensions
# C++
code --install-extension ms-vscode.cpptools-extension-pack --force
code --install-extension ms-vscode.cmake-tools --force
code --install-extension ms-vscode.cpptools --force
# Debug
code --install-extension marus25.cortex-debug --force
# serial (usb) monitor helper
code --install-extension ms-vscode.vscode-serial-monitor --force

```

## WSL:setup:usb

- [configure wsl usb support (usbipd)](https://github.com/dorssel/usbipd-win/wiki/WSL-support)

```bash
sudo apt install linux-tools-virtual hwdata

sudo update-alternatives --install /usr/local/bin/usbip usbip `ls /usr/lib/linux-tools/*/usbip | tail -n1` 20
```

## WSL:setup:debug:openOCD raspberrypi picoprobe rp2040

### Build openOCD

```bash
cd openocd.rp2040-src-flat
./bootstrap
./configure --enable-picoprobe --disable-werror
make -j4
sudo make install
```

```bash
# original url for openocd raspberrypi patch
git clone https://github.com/raspberrypi/openocd.git --branch picoprobe --depth=1 --no-single-branch

```

=======================================

## USB attach both RPI PICO with picoprobe firmware and connected RPI PICOW

On the Windows side, share connected picoprobe usb with WSL:

```

# in elevated PowerShell

usbipd wsl list
usbipd wsl attach --busid=<BUSID>

```

### Initial Setup

## Download pico sdk

```bash
# <fill in your credentials>
cp cmake/credentials.cmake.example cmake/credentials.cmake
```

```bash
./setup
```

### Build

```bash
./build.sh
```

### Build:watch - rebuild on save file in `src`

```bash
./watch-build

```

### Attach openocd server

```bash
./attach-picoprobe.openocd
```

### Open serial monitor

```bash
./monitor-pico-serial
```

=======================================

## VSCode:build - cmake commands

- configure
  `Ctrl+P` -> `>CMake: Configure`

- select and build target using CMake VSCode extension
  `Ctrl+P` -> `>Cmake: Set Build Target` -> select build target

- select debug target
  `Ctrl+P` -> `>CMake: Set Debug Target`

- run and debug
  `Ctrl+P` -> `>Run and Debug: Focus on Breakpoints View` -> press start debugging

## Html files

If you want to test this example with your html files, just add/edit them in the `src/fs` directory and rebuild the project!

### Flashing

The built USB Flashing Format file will be located in `build/src/pico_w_webserver.uf2` - just copy it over to the Pico W to flash it!

### References

- https://www.nongnu.org/lwip/2_1_x/group__httpd.html
- https://github.com/lwip-tcpip/lwip/tree/master/contrib/examples/httpd
