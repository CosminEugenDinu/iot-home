## WSL ip

```bash
cat /etc/resolv.conf
```

## Windows allow port

===========================

```
netsh interface portproxy add v4tov4 listenport=3335 listenaddress=0.0.0.0 connectport=3335 connectaddress=<wsl ip addr>
```

```
New-NetFirewallRule -DisplayName "WSL2 Port Bridge" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 80,3335
```

===========================

```
netsh interface portproxy add v4tov4 listenport=3335 listenaddress=0.0.0.0 connectport=3335 connectaddress=<wsl ip addr>

New-NetFirewallRule -DisplayName "Allow Inbound Port 3335" -Direction Inbound -LocalPort 3335 -Protocol TCP -Action Allow
```

===========================

```ps
netsh interface portproxy add v4tov4 listenport=3335 listenaddress=0.0.0.0 connectport=3335

netsh advfirewall firewall add rule name="TCP Port 3335" dir=in action=allow protocol=TCP localport=3334

New-NetFirewallRule -DisplayName "Allow Inbound Port 3335" -Direction Inbound -LocalPort 3335 -Protocol TCP -Action Allow

netsh interface portproxy set v4tov4 listenport=3335 listenaddress=0.0.0.0 connectport=3335 connectaddress=$(wsl hostname -I)
```
