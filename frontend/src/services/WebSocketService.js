import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.subscriptions = new Map();
  }

  connect(userEmail, onNotificationReceived) {
    if (this.connected) {
      console.log('WebSocket already connected');
      return;
    }

    console.log('Attempting to connect to WebSocket...');
    const socket = new SockJS('http://localhost:8080/ws');
    this.stompClient = Stomp.over(socket);
    
    // STOMP 설정 개선
    this.stompClient.reconnect_delay = 5000;
    // debug 설정 제거 (오류 원인)

    this.stompClient.connect(
      {},
      (frame) => {
        console.log('WebSocket connected successfully:', frame);
        this.connected = true;

        // 사용자별 알림 구독
        this.stompClient.subscribe(`/user/${userEmail}/queue/notifications`, (message) => {
          try {
            const notification = JSON.parse(message.body);
            console.log('Received notification:', notification);
            onNotificationReceived(notification);
          } catch (error) {
            console.error('Error parsing notification:', error);
          }
        });

        // 전체 알림 구독 (선택사항)
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
        // 재연결 시도
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

  // 메시지 전송 (필요시)
  sendMessage(destination, message) {
    if (this.stompClient && this.connected) {
      this.stompClient.send(destination, {}, JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
    }
  }
}

// 싱글톤 인스턴스
const webSocketService = new WebSocketService();
export default webSocketService;
