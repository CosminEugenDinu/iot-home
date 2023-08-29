#include "lwip_http_client.h"

char resBuff[1000];

static bool running = false;

static void result_fn(void *arg, httpc_result_t httpc_result, u32_t rx_content_len, u32_t srv_res,
                      err_t err) {
  printf("statusCode: %lu \n", srv_res);
  running = false;
}

static err_t headers_fn(httpc_state_t *connection, void *arg, struct pbuf *hdr, u16_t hdr_len,
                        u32_t content_len) {
  pbuf_copy_partial(hdr, resBuff, hdr->tot_len, 0);
  printf("Headers: %s", resBuff);
  pbuf_free(hdr);
  return ERR_OK;
}

static err_t body_fn(void *arg, struct altcp_pcb *conn, struct pbuf *p, err_t err) {
  pbuf_copy_partial(p, resBuff, p->tot_len, 0);
  printf("Body: %s", resBuff);
  pbuf_free(p);
  return ERR_OK;
}

static httpc_connection_t settings;

int request(char const *method, char const *url, u16_t port, char const *path, char *body) {
  if (running) return 0;
  settings.result_fn = result_fn;
  settings.headers_done_fn = headers_fn;
  settings.method = (char *)method;
  settings.body = body;
  err_t err = _httpc_get_file_dns(url, port, path, &settings, body_fn, NULL, NULL);
  if (err) return err;
  return ERR_OK;
}
