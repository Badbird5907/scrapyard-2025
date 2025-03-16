import { RefreshingAuthProvider } from '@twurple/auth';
import { ChatClient, ChatMessage } from '@twurple/chat';
import WebSocket from 'ws';

const clientId = '5l7rq1z2e0oe394nzodt9cbwhbl4fr';
const clientSecret = 'yrwlwo0axvudmbs8ujq8cd3xzlolsh';
const accessToken ='u0ytaiv4ijjqvovy6upmr0alcj4k9v';
const refreshToken = 'asbccuga6hoo6vocr4abi5don06p21bsangq5k4ewycgtzf4ir';

const speed = 100;

async function main() {
    const authProvider = new RefreshingAuthProvider({
        clientId,
        clientSecret
    });

    await authProvider.addUserForToken({
        accessToken,
        refreshToken,
        expiresIn: null,
        obtainmentTimestamp: Date.now()
    }, ['chat']);

    const chatClient = new ChatClient({ authProvider, channels: ['runthebot'] });

    const ws = new WebSocket('ws://tazer.local:8765');

    ws.on('open', () => {
        console.log('Connected to WebSocket server');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    function sendMotorCommand(left: number, right: number) {
        const command = {
            command: "motor",
            data: { left, right }
        };
        ws.send(JSON.stringify(command));
    }

    function sendRelayCommand(state: boolean) {
        const command = {
            command: "relay",
            data: { state }
        };
        ws.send(JSON.stringify(command));
    }

    chatClient.onMessage(async (channel: string, user: string, text: string, msg: ChatMessage) => {
        const command = text.toLowerCase();
        
        switch(command) {
            case 'w':
            case 'forward':
                sendMotorCommand(speed, speed);
                setTimeout(() => sendMotorCommand(0, 0), 250);
                break;
                
            case 's':
            case 'backward':
                sendMotorCommand(-speed, -speed);
                setTimeout(() => sendMotorCommand(0, 0), 250);
                break;
                
            case 'a':
            case 'left':
                sendMotorCommand(-speed, speed);
                setTimeout(() => sendMotorCommand(0, 0), 250);
                break;
                
            case 'd':
            case 'right':
                sendMotorCommand(speed, -speed);
                setTimeout(() => sendMotorCommand(0, 0), 250);
                break;
                
            case 'zap':
                sendRelayCommand(true);
                setTimeout(() => sendRelayCommand(false), 500);
                break;
        }
    });

    chatClient.connect();
}

main().catch(console.error);


