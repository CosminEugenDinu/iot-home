#include <sstream>
#include <string>

#include "pico/cyw43_arch.h"
#include "pico/stdlib.h"

using namespace std;

#if CYW43_ARCH_DEBUG_ENABLED
#define CYW43_ARCH_DEBUG(...) printf(__VA_ARGS__)
#else
#define CYW43_ARCH_DEBUG(...) ((void)0)
#endif

class NMError : public exception {
  string _msg;

 public:
  NMError(const char* message) : _msg(message) {}
  NMError(const string& message) : _msg(message) {}

  const char* what() const noexcept { return this->_msg.c_str(); }
};

class WifiManager {
  u32_t _ip = 0;
  string _wifi_ssid, _wifi_pass;

 public:
  WifiManager(string wifi_ssid, string wifi_pass) : _wifi_ssid(wifi_ssid), _wifi_pass(wifi_pass) {}
  void wifiInit();
  void wifiInfiniteTryConnect();

  // u32_t getIpAddr();
  // u32_t getIpAddr_int(cyw43_t* self, int itf);
  string getLocalServerIpAddrStr(u32_t ip_addr);
  u8_t* getIpAddrBytes(u32_t ip_addr);
  string getIpAddrStr(u8_t*);

  string getMacAddrStr();
};

void WifiManager::wifiInit() {
  if (cyw43_arch_init()) {
    throw NMError("failed to initialize wifi");
  }
  cyw43_arch_enable_sta_mode();

  cyw43_wifi_pm(&cyw43_state, CYW43_PERFORMANCE_PM);
}

void WifiManager::wifiInfiniteTryConnect() {
  cyw43_arch_poll();
  int status = cyw43_tcpip_link_status(&cyw43_state, CYW43_ITF_STA);
  if (status == CYW43_LINK_UP) return;

  const char* wifi_ssid = (this->_wifi_ssid).c_str();
  const char* wifi_pass = (this->_wifi_pass).c_str();
  while (cyw43_arch_wifi_connect_timeout_ms(wifi_ssid, wifi_pass, CYW43_AUTH_WPA2_AES_PSK, 1000 * 60)) {
    printf("Wifi - connecting to ssid %s...\n", wifi_ssid);
    CYW43_ARCH_DEBUG("failed to connect, wifi_ssid: %s, wifi_password: %s \n", wifi_ssid, wifi_pass);
    sleep_ms(1000);
  }
  printf("Wifi connected to ssid: %s.\n", wifi_ssid);
  // turn on LED to signal connected
  cyw43_arch_gpio_put(CYW43_WL_GPIO_LED_PIN, 1);
}

// u32_t WifiManager::getIpAddr_int(cyw43_t* self, int itf) {
//   struct netif* netif = &self->netif[itf];
//   u32_t ip = netif->ip_addr.addr;
//   return ip;
// }

// u32_t WifiManager::getIpAddr() { return this->_ip; }

u8_t* WifiManager::getIpAddrBytes(u32_t ip_addr) {
  static u8_t ip_bytes[4] = {static_cast<u8_t>(ip_addr & 0xFF), static_cast<u8_t>((ip_addr >> 8) & 0xFF),
                             static_cast<u8_t>((ip_addr >> 16) & 0xFF), static_cast<u8_t>(ip_addr >> 24)};
  return ip_bytes;
}

string WifiManager::getLocalServerIpAddrStr(u32_t ip_addr) {
  u8_t* ip_bytes = this->getIpAddrBytes(ip_addr);
  u8_t local_server_ip_bytes[4] = {ip_bytes[0], ip_bytes[1], ip_bytes[2], 1};
  string local_server_ip_str = this->getIpAddrStr(local_server_ip_bytes);
  return local_server_ip_str;
}

string WifiManager::getIpAddrStr(u8_t* ip_bytes) {
  stringstream ipSS;
  for (int i = 0; i < 4; i++) {
    string sep = (i < 3) ? "." : "";
    ipSS << to_string(ip_bytes[i]) << sep;
  }
  return ipSS.str();
}

string WifiManager::getMacAddrStr() {
  extern cyw43_t cyw43_state;
  stringstream macSS;
  for (int i = 0; i < 6; i++) {
    string sep = (i < 5) ? ":" : "";
    char hex_str[3];
    sprintf(hex_str, "%02x", cyw43_state.mac[i]);
    macSS << hex_str << sep;
  }
  return macSS.str();
}