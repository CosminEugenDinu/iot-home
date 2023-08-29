#include <stdio.h>
#include <stdlib.h>

#include <cstdio>
#include <string>

#include "cgi.h"
#include "http_client/http_client_request.h"
#include "http_client/lwip_http_client.h"
#include "lwip/apps/httpd.h"
#include "lwipopts.h"
#include "pico/stdlib.h"
#include "ssi.h"
#include "wifi_manager/WifiManager.cpp"

using namespace std;

void run_server(WifiManager *);

int main() {
  stdio_init_all();

  WifiManager wm(WIFI_SSID, WIFI_PASSWORD);
  wm.wifiInit();
  wm.wifiInfiniteTryConnect();
  string mac = wm.getMacAddrStr();
  printf("Mac is %s\n", mac.c_str());
  printf("Ip address is %s\n", ip4addr_ntoa(&cyw43_state.netif[CYW43_ITF_STA].ip_addr));

  run_server(&wm);
}

void run_server(WifiManager *wm) {
  httpd_init();
  cgi_init();
  ssi_init();
  printf("Http server initialized.\n");

  for (;;) {
    sleep_ms(1000);

    // Retry wifi connection (in case it failed meanwhile)
    wm->wifiInfiniteTryConnect();
    string mac = wm->getMacAddrStr();

    string ip = ip4addr_ntoa(&cyw43_state.netif[CYW43_ITF_STA].ip_addr);
    u32_t ip_addr = cyw43_state.netif[CYW43_ITF_STA].ip_addr.addr;

    string local_server_addr = wm->getLocalServerIpAddrStr(ip_addr);
    // TODO: move port to env
    int local_server_port = 3335;
    // TODO: move path to env
    const char *path = "/device-notifications/set-is-online";

    char body[1000];
    sprintf(body, "{\"mac\":\"%s\",\"ip\":\"%s\"}", mac.c_str(), ip.c_str());

    printf("Trying POST request to %s:%d%s \n.", local_server_addr.c_str(), local_server_port, path);

    request("POST", local_server_addr.c_str(), local_server_port, path, body);
  }
}
