#ifndef __API_H
#define __API_H

#include <string>
using namespace std;
typedef const char *(*tCGIHandler)(int iIndex, int iNumParams, char *pcParam[], char *pcValue[]);

class ApiHandler {
 public:
  tCGIHandler getCgiHandler();
  string getResponse();
};

#endif