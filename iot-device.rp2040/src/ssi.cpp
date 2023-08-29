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

#include "api_handler/ApiHandler.h"
#include "cgi.h"
#include "hardware/adc.h"
#include "lwip/apps/httpd.h"
#include "lwipopts.h"
#include "pico/cyw43_arch.h"
extern ApiHandler apiH;

#define HTTPD_ADDITIONAL_CONTENT_TYPES \
  {"json", HTTP_CONTENT_TYPE("application/json")}, { "exe", HTTP_CONTENT_TYPE("application/exe") }

// max length of the tags defaults to be 8 chars
// LWIP_HTTPD_MAX_TAG_NAME_LEN
const char *__not_in_flash("httpd") ssi_example_tags[] = {
    "Hello",    // 0
    "counter",  // 1
    "GPIO",     // 2
    "state1",   // 3
    "state2",   // 4
    "state3",   // 5
    "state4",   // 6
    "bg1",      // 7
    "bg2",      // 8
    "bg3",      // 9
    "bg4",      // 10
    "json"      // 11
};

u16_t __time_critical_func(ssi_handler)(int iIndex, char *pcInsert, int iInsertLen) {
  size_t printed;
  switch (iIndex) {
    case 0: /* "Hello" */
      printed = snprintf(pcInsert, iInsertLen, "Hello user number %d!", rand());
      break;
    case 1: /* "counter" */
    {
      static int counter;
      counter++;
      printed = snprintf(pcInsert, iInsertLen, "%d", counter);
    } break;
    case 2: /* "GPIO" */
    {
      const float voltage = adc_read() * 3.3f / (1 << 12);
      printed = snprintf(pcInsert, iInsertLen, "%f", voltage);
    } break;
    case 3: /* "state1" */
    case 4: /* "state2" */
    case 5: /* "state3" */
    case 6: /* "state4" */
    {
      bool state = 0;
      if (iIndex == 3)
        state = gpio_get(LED1);
      else if (iIndex == 4)
        state = gpio_get(LED2);
      else if (iIndex == 5)
        state = gpio_get(LED3);
      else if (iIndex == 6)
        state = gpio_get(LED4);

      if (state)
        printed = snprintf(pcInsert, iInsertLen, "checked");
      else
        printed = snprintf(pcInsert, iInsertLen, " ");
    } break;

    case 7:  /* "bg1" */
    case 8:  /* "bg2" */
    case 9:  /* "bg3" */
    case 10: /* "bg4" */
    {
      bool state = 0;
      if (iIndex == 7)
        state = gpio_get(LED1);
      else if (iIndex == 8)
        state = gpio_get(LED2);
      else if (iIndex == 9)
        state = gpio_get(LED3);
      else if (iIndex == 10)
        state = gpio_get(LED4);

      if (state)
        printed = snprintf(pcInsert, iInsertLen, "\"background-color:green;\"");
      else
        printed = snprintf(pcInsert, iInsertLen, "\"background-color:red;\"");
    } break;
    // send json response data
    case 11: {
      printed = snprintf(pcInsert, iInsertLen, apiH.getResponse().c_str());
    } break;
    default: /* unknown tag */
      printed = 0;
      break;
  }
  LWIP_ASSERT("sane length", printed <= 0xFFFF);
  return (u16_t)printed;
}

void ssi_init() {
  adc_init();
  adc_gpio_init(26);
  adc_select_input(0);
  size_t i;
  for (i = 0; i < LWIP_ARRAYSIZE(ssi_example_tags); i++) {
    LWIP_ASSERT("tag too long for LWIP_HTTPD_MAX_TAG_NAME_LEN",
                strlen(ssi_example_tags[i]) <= LWIP_HTTPD_MAX_TAG_NAME_LEN);
  }

  http_set_ssi_handler(ssi_handler, ssi_example_tags, LWIP_ARRAYSIZE(ssi_example_tags));
}
