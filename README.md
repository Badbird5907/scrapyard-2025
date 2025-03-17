# Scrapyard Toronto 2025

This is my team's sumbission for scrapyard 2025 (Twitch Chat's tazer). [2nd place!]
This repository contains 4 modules:

- [`ioserver`](https://github.com/Badbird5907/scrapyard-2025/tree/master/ioserver): A systemctl daemon that runs on the raspberry pi. This module opens a websocket at `0.0.0.0:8765` and listens for motor/relay commands.
- [`tazer-frontend`](https://github.com/Badbird5907/scrapyard-2025/tree/master/tazer-frontend): This is a Next.JS/React app that connects to a xbox controller. It acts as a client to `ioserver`.
- [`twitch-bot`](https://github.com/Badbird5907/scrapyard-2025/tree/master/twitch-bot): This is another ioserver client that acts as a twitch bot, listening for twitch chat commands and forwarding them to `ioserver`.

## Required Parts
- Raspberry Pi 4b
- Variable voltage regulator
- Relay
- USB-C PD trigger board
- Powerbank (with 12v PD)
- Tazer module off aliexpress
- 9v battery
- Wires
- Xbox Controller
- L298N Driver
- Hobby motors
- Party food stuff

## Hardware
Using paper plates forks and spoons, make a disk with 2 cutouts for wheels
Use forks to renenforce
attach motors and wheels to plates
motor driver and vrm are put on the plate
cover the plate with another plate
the rest of the electronics goes on top
