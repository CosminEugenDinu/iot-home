## Allow wsl app port on Windows

```PowerShell

# Windows - allow tcp port
netsh advfirewall firewall add rule name="Allowing LAN connections" dir=in action=allow protocol=TCP localport=3335

# connectaddress - public wsl ip
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=3335 connectaddress=172.24.202.25 connectport=3335
```
