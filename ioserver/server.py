#!/usr/bin/env python

import asyncio
from websockets.asyncio.server import serve
import json
import RPi.GPIO as GPIO
import serial
# Left motor
ENA = 18 # PWM (physical pin 12)
IN1 = 23 # Direction
IN2 = 24 # Direction

# Right motor
ENB = 19 # PWM (physical pin 35)
IN3 = 27 # Direction
IN4 = 22 # Direction

RELAY = 25 # tazer!!

GPIO.setmode(GPIO.BCM)
for pin in [ENA, ENB, IN1, IN2, IN3, IN4, RELAY]:
    GPIO.setup(pin, GPIO.OUT)

# pwm setup
pwm_left = GPIO.PWM(ENA, 1000)
pwm_right = GPIO.PWM(ENB, 1000)
pwm_left.start(0)
pwm_right.start(0)

def set_motor(left, right): # -255 to 255
    # left
    if left >= 0:
        GPIO.output(IN1, GPIO.HIGH)
        GPIO.output(IN2, GPIO.LOW)
    else:
        GPIO.output(IN1, GPIO.LOW)
        GPIO.output(IN2, GPIO.HIGH)

    # right
    if right >= 0:
        GPIO.output(IN3, GPIO.HIGH)

        GPIO.output(IN4, GPIO.LOW)
    else:
        GPIO.output(IN3, GPIO.LOW)
        GPIO.output(IN4, GPIO.HIGH)

    # scale speed to a 0-100 duty cycle
    duty_left = min(abs(left) / 255 * 100, 100)
    duty_right = min(abs(right) / 255 * 100, 100)
    pwm_left.ChangeDutyCycle(duty_left)

    pwm_right.ChangeDutyCycle(duty_right)

def set_relay(state):
    GPIO.output(RELAY, state)

def toggle_relay():
    set_relay(not GPIO.input(RELAY))

async def echo(websocket):
    async for message in websocket:
        data = json.loads(message)
        print("Received:", data)
        if data.get("command") == "motor":
            motor_data = data.get("data", {})
            left = motor_data.get("left", 0)
            right = motor_data.get("right", 0)
            print("Motor command:", left, right)
            set_motor(right, left) # { "command": "motor", "data": { "left": 100, "right": 100 } }
            await websocket.send(json.dumps({"left": left, "right": right}))
        if data.get("command") == "relay": # { "command": "relay", "data": { "state": True } }
            set_relay(data.get("data", {}).get("state", False))
            await websocket.send(json.dumps({"relay": data.get("data", {}).get("state", False)}))
        if data.get("command") == "serial":
            serial_data = data.get("data", {})
            print("Serial command:", serial_data)
            dev = "/dev/ttyUSB0"
            baud = 9600
            ser = serial.Serial(dev, baud)
            ser.write(serial_data.encode())
            ser.close()
            await websocket.send(json.dumps({"serial": serial_data}))



async def main():
    async with serve(echo, "0.0.0.0", 8765):
        print("Server started on port 8765")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
    finally:
        pwm_left.stop()
        pwm_right.stop()
        GPIO.cleanup()