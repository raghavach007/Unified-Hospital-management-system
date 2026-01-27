/* * SOCKET ENGINE
 * Handles real-time bi-directional communication with Spring Boot
 */

const WS_ENDPOINT = 'http://localhost:8080/ws';
const TOPIC_ALERTS = '/topic/alerts';

export const liveNet = {
    client: null,
    listeners: [],

    // Initialize Connection
    connect: () => {
        // Safety check for dependencies
        if (typeof SockJS === 'undefined' || typeof Stomp === 'undefined') {
            console.warn("⚠️ Live Stream Disabled: SockJS/Stomp libraries missing in HTML.");
            return;
        }

        const socket = new SockJS(WS_ENDPOINT);
        const stompClient = Stomp.over(socket);
        
        // Disable debug logs for a cleaner console
        stompClient.debug = null; 

        stompClient.connect({}, (frame) => {
            console.log('%c ● LIVE NETWORK CONNECTED ', 'background: #10b981; color: white; border-radius: 3px;');
            
            // Subscribe to the global alert channel
            stompClient.subscribe(TOPIC_ALERTS, (message) => {
                // The backend sends a raw string: "Patient 123 risk: HIGH -> [SpO2 low]"
                // We pass this directly to any listeners (Doctor/Nurse dashboards)
                const payload = message.body;
                liveNet.notifyListeners(payload);
            });

        }, (error) => {
            console.warn('⚠ Network Pulse Lost. Attempting Reconnection...', error);
            setTimeout(liveNet.connect, 5000);
        });

        liveNet.client = stompClient;
    },

    // Allow dashboards to register a callback function to receive alerts
    onAlert: (callback) => {
        liveNet.listeners.push(callback);
    },

    // Internal dispatcher
    notifyListeners: (data) => {
        liveNet.listeners.forEach(callback => callback(data));
    }
};

// Auto-connect when imported
liveNet.connect();