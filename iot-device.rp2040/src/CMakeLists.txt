set(PROGRAM_NAME pico_w_webserver)

set(MAKE_FS_DATA_SCRIPT ${CMAKE_CURRENT_LIST_DIR}/scripts/makefsdata)

message("Running makefsdata script")
execute_process(COMMAND
        perl ${MAKE_FS_DATA_SCRIPT}
        WORKING_DIRECTORY ${CMAKE_CURRENT_LIST_DIR}
        ECHO_OUTPUT_VARIABLE
        ECHO_ERROR_VARIABLE
        )
file(RENAME fsdata.c my_fsdata.c)

add_executable(${PROGRAM_NAME}
        main.cpp
        ssi.cpp
        cgi.cpp
        http_client/lwip_http_client.c
        http_client/http_client_request.cpp
        api_handler/ApiHandler.cpp
        )
target_compile_definitions(${PROGRAM_NAME} PRIVATE
        WIFI_SSID=\"${WIFI_SSID}\"
        WIFI_PASSWORD=\"${WIFI_PASSWORD}\"
        )
target_include_directories(${PROGRAM_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}
        ${CMAKE_CURRENT_LIST_DIR}/.. # for our common lwip
        ${CMAKE_CURRENT_LIST_DIR}/network_manager
        )
target_link_libraries(${PROGRAM_NAME}
        cyw43_driver_base
        pico_cyw43_arch_lwip_threadsafe_background
        pico_stdlib
        hardware_adc
        pico_lwip_http
        )

pico_enable_stdio_usb(${PROGRAM_NAME} TRUE)
pico_enable_stdio_uart(${PROGRAM_NAME} TRUE)
suppress_tinyusb_warnings()

pico_add_extra_outputs(${PROGRAM_NAME})
