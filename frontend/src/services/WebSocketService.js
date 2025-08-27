import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.subscriptions = new Map();
  }

  
  getWebSocketUrl() {
    
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8080/ws';
    }
    
    // AWS 서버의 경우 같은 도메인 사용 (프록시를 통해)
    if (window.location.hostname === 'snippethub.co.kr') {
      return 'https://snippethub.co.kr/ws';
    }
    
    // 기본 설정
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${window.location.host}/ws`;
  }

  connect(userEmail, onNotificationReceived) {
    if (this.connected) {
      console.log('WebSocket already connected');
      return;
    }

    const wsUrl = this.getWebSocketUrl();
    console.log('Attempting to connect to WebSocket at:', wsUrl);
    
    const socket = new SockJS(wsUrl);
    this.stompClient = Stomp.over(socket);
    
    
    this.stompClient.reconnect_delay = 5000;
    

    this.stompClient.connect(
      {},
      (frame) => {
        console.log('WebSocket connected successfully:', frame);
        this.connected = true;

        
        this.stompClient.subscribe(`/user/${userEmail}/queue/notifications`, (message) => {
          try {
            const notification = JSON.parse(message.body);
            console.log('Received notification:', notification);
            onNotificationReceived(notification);
          } catch (error) {
            console.error('Error parsing notification:', error);
          }
        });

        
        this.stompClient.subscribe('/topic/notifications', (message) => {
          try {
            const notification = JSON.parse(message.body);
            console.log('Received broadcast notification:', notification);
            onNotificationReceived(notification);
          } catch (error) {
            console.error('Error parsing broadcast notification:', error);
          }
        });
      },
      (error) => {
        console.error('WebSocket connection failed:', error);
        this.connected = false;
        
        setTimeout(() => {
          console.log('Retrying WebSocket connection...');
          this.connect(userEmail, onNotificationReceived);
        }, 5000);
      }
    );
  }

  disconnect() {
    if (this.stompClient && this.connected) {
      this.stompClient.disconnect();
      this.connected = false;
      console.log('WebSocket disconnected');
    }
  }

  isConnected() {
    return this.connected;
  }

  
  sendMessage(destination, message) {
    if (this.stompClient && this.connected) {
      this.stompClient.send(destination, {}, JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
    }
  }
}


const webSocketService = new WebSocketService();
export default webSocketService;