# IOServer
*basically "we have WPIlib at home"*
To set up IOserver, run the following commands:

```bash
# Clone the repo
git clone https://github.com/Badbird5907/scrapyard-2025 scrapyard

# Cd into ioserver
cd scrapyard/ioserver

# Create a python venv
python -m venv .

# Install deps
./bin/pip install -r requirements.txt

# Install systemd service
sudo ln -s /etc/systemd/system/ioserver.service /home/pi/scrapyard/ioserver/ioserver.service

# Enable systemd service
sudo systemctl daemon-reload
sudo systemctl enable --now ioserver.service
```

This should bind the websocket server to `0.0.0.0:8765`
