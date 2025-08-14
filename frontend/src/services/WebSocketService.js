import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.subscriptions = new Map();
  }

  // WebSocket URL을 환경에 맞게 동적으로 생성
  getWebSocketUrl() {
    // 개발 환경 체크
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8080/ws';
    }
    
    // 프로덕션 환경에서는 현재 도메인과 프로토콜 사용
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
