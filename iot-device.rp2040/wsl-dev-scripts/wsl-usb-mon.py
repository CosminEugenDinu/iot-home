import serial
from time import sleep
# import sys


# COM = '/dev/bus/usb/001/003' # (Linux)
COM = '/dev/ttyACM0' # (Linux)
BAUD = 115200

ser = serial.Serial(COM, BAUD, timeout = .1)

print('Waiting for device');
sleep(3)
print(ser.name)

#check args
# if("-m" in sys.argv or "--monitor" in sys.argv):
# 	monitor = True
# else:
# 	monitor= False
monitor = True

while True:
	val = str(ser.readline().decode().strip('\r\n'))#Capture serial output as a decoded string
	valA = val.split("/")
	#print()
	if(monitor == True):
		print(val, end="\r", flush=True)