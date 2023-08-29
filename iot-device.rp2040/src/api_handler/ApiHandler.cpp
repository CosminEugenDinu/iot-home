#include <string>

#include "pico/cyw43_arch.h"

using namespace std;

typedef const char *(*tCGIHandler)(int iIndex, int iNumParams, char *pcParam[], char *pcValue[]);

static string _response = "[]";
const char *_apiCgiHandler(int iIndex, int iNumParams, char *pcParam[], char *pcValue[]);

class ApiHandler {
 public:
  tCGIHandler getCgiHandler();
  string getResponse();
  void handleRequestParams(int iNumParams, char *pcParam[], char *pcValue[]);

 private:
  bool gpio(int pin, bool direction, int value);
  void setResponse(string response);
};

ApiHandler apiH;

tCGIHandler ApiHandler::getCgiHandler() { return _apiCgiHandler; }
string ApiHandler::getResponse() { return _response; }
void ApiHandler::setResponse(string response) { _response = response; }

void ApiHandler::handleRequestParams(int iNumParams, char *pcParam[], char *pcValue[]) {
  static int pins[10];
  static int vals[10];
  for (int i = 0; i < 10; i++) {
    pins[i] = 0;
    vals[i] = 0;
  }
  for (int i = 0; i < iNumParams; i++) {
    if (i == 10) break;
    // check if parameter is "pin"
    int pin = 0;
    if (strcmp(pcParam[i], "pin") == 0) {
      pin = atoi(pcValue[i]);
      pins[pin] = 1;
      // check if next parameter after "pin" is "val"
      if (i + 1 < 10 && strcmp(pcParam[i + 1], "val") == 0) {
        int val = atoi(pcValue[i + 1]);
        vals[pin] = val;
      } else {
        // invalidating value will only check the state
        vals[pin] = -1;
      }
    }
  }

  string res = "[";
  char obj_i = 0;

  for (int pin = 1; pin < 10; pin++) {
    if (!pins[pin]) continue;
    int val = vals[pin];
    bool dir = GPIO_OUT;
    bool sta = this->gpio(pin, dir, val);

    if (obj_i++) res += ",";
    res += "{";
    res += "\"pin\":" + to_string(pin);
    res += ",\"val\":" + to_string(val);
    res += ",\"dir\":" + to_string(dir);
    res += ",\"sta\":" + to_string(sta);
    res += "}";
  }

  res += "]";

  this->setResponse(res);
}

bool ApiHandler::gpio(int pinNumber, bool direction, int value) {
  if (direction) {
    gpio_set_dir(pinNumber, GPIO_OUT);
  } else {
    gpio_set_dir(pinNumber, GPIO_IN);
  }
  // if value < 0 then only return state
  if (value >= 0) {
    gpio_put(pinNumber, value);
  }
  bool state = gpio_get(pinNumber);
  return state;
}

const char *_apiCgiHandler(int iIndex, int iNumParams, char *pcParam[], char *pcValue[]) {
  apiH.handleRequestParams(iNumParams, pcParam, pcValue);
  return "/response.json";
}
