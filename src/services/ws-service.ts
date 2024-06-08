import { v4 as uuidv4 } from "uuid";

class WebSocketService {
    sessionId: string;
    ws: WebSocket | null = null;
    eventListeners: { [key: string]: ((data: any) => void)[] } = {};

    constructor() {
        this.sessionId = uuidv4();

        if (document.location.hostname === 'localhost') {
            console.log('Connecting to ws://localhost:3004');
            this.ws = new WebSocket('ws://localhost:3004');
        } else {
            this.ws = new WebSocket('wss://asheramit.com/ws/codoc');
        }

        this.ws.onopen = () => {
            console.log('Connected to WebSocket server');
        };

        this.ws.onmessage = (event: any) => {
            const payload = JSON.parse(event.data);
            const topic = payload.topic;
            const listeners = this.eventListeners[topic];
            if (listeners) {
                listeners.forEach(listener => {
                    listener(payload.data);
                });
            }
        };

        this.ws.onclose = () => {
            console.log('Disconnected from WebSocket server');
        };
    }

    addListener(topic: string, callback: (data: any) => void) {
        if (!this.eventListeners[topic]) {
            this.eventListeners[topic] = [];
        }

        this.eventListeners[topic].push(callback);
    }

    removeListener(topic: string, callback: (data: any) => void) {
        const listeners = this.eventListeners[topic];
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    send(topic: string, data: any) {
        this.ws?.send(JSON.stringify({
            topic,
            sessionId: this.sessionId,
            data
        }));
    }
}

export const webSocketService = new WebSocketService();