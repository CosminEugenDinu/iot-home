/*
MIT License

Copyright (c) 2022 Krzysztof Mazur

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

#include "cgi.h"

#include "api_handler/ApiHandler.h"
#include "lwip/apps/httpd.h"
#include "lwipopts.h"
#include "pico/cyw43_arch.h"

extern ApiHandler apiH;

static const tCGI cgi_handlers[] = {{/* Html request for "/leds.cgi" will start cgi_handler_basic */
                                     "/leds.cgi", cgi_handler_basic},
                                    {/* Html request for "/leds2.cgi" will start cgi_handler_extended */
                                     "/leds_ext.cgi", cgi_handler_extended},
                                    {"/api", apiH.getCgiHandler()}};

/* cgi-handler triggered by a request for "/leds.cgi" */
const char *cgi_handler_basic(int iIndex, int iNumParams, char *pcParam[], char *pcValue[]) {
  int i = 0;

  /* We use this handler for one page request only: "/leds.cgi"
   * and it is at position 0 in the tCGI array (see above).
   * So iIndex should be 0.
   */
  printf("cgi_handler_basic called with index %d\n", iIndex);

  /* All leds off */
  Led_Off(LED1);
  Led_Off(LED2);
  Led_Off(LED3);
  Led_Off(LED4);

  /* Check the query string.
   * A request to turn LED2 and LED4 on would look like: "/leds.cgi?led=2&led=4"
   */
  for (i = 0; i < iNumParams; i++) {
    /* check if parameter is "led" */
    if (strcmp(pcParam[i], "led") == 0) {
      /* look ar argument to find which led to turn on */
      if (strcmp(pcValue[i], "1") == 0)
        Led_On(LED1);
      else if (strcmp(pcValue[i], "2") == 0)
        Led_On(LED2);
      else if (strcmp(pcValue[i], "3") == 0)
        Led_On(LED3);
      else if (strcmp(pcValue[i], "4") == 0)
        Led_On(LED4);
    }
  }

  /* Our response to the "SUBMIT" is to simply send the same page again*/
  return "/cgi.html";
}

/* cgi-handler triggered by a request for "/leds_ext.cgi".
 *
 * It is almost identical to cgi_handler_basic().
 * Both handlers could be easily implemented in one function -
 * distinguish them by looking at the iIndex parameter.
 * I left it this way to show how to implement two (or more)
 * enirely different handlers.
 */
const char *cgi_handler_extended(int iIndex, int iNumParams, char *pcParam[], char *pcValue[]) {
  int i = 0;

  /* We use this handler for one page request only: "/leds_ext.cgi"
   * and it is at position 1 in the tCGI array (see above).
   * So iIndex should be 1.
   */
  printf("cgi_handler_extended called with index %d\n", iIndex);

  /* All leds off */
  Led_Off(LED1);
  Led_Off(LED2);
  Led_Off(LED3);
  Led_Off(LED4);

  /* Check the query string.
   * A request to turn LED2 and LED4 on would look like: "/leds.cgi?led=2&led=4"
   */
  for (i = 0; i < iNumParams; i++) {
    /* check if parameter is "led" */
    if (strcmp(pcParam[i], "led") == 0) {
      /* look ar argument to find which led to turn on */
      if (strcmp(pcValue[i], "1") == 0)
        Led_On(LED1);
      else if (strcmp(pcValue[i], "2") == 0)
        Led_On(LED2);
      else if (strcmp(pcValue[i], "3") == 0)
        Led_On(LED3);
      else if (strcmp(pcValue[i], "4") == 0)
        Led_On(LED4);
    }
  }

  /* Our response to the "SUBMIT" is to send "/ssi_cgi.shtml".
   * The extension ".shtml" tells the server to insert some values
   * which show the user what has been done in response.
   */
  return "/ssi_cgi.shtml";
}

/* initialize the CGI handler */
void cgi_init() {
  http_set_cgi_handlers(cgi_handlers, 3);

  for (int i = LED1; i <= LED9; i++) {
    gpio_init(i);
    gpio_set_dir(i, GPIO_OUT);
    gpio_put(i, 0);
  }
}

/* led control and debugging info */
void Led_On(int led) {
  printf("GPIO%d on\n", led);
  gpio_put(led, 1);
}

void Led_Off(int led) {
  printf("GPIO%d off\n", led);
  gpio_put(led, 0);
}
