// 백엔드 API 상태 확인 유틸리티

export const checkBackendStatus = async () => {
  try {
    console.log('🔍 백엔드 서버 상태 확인 중...');
    console.log('📡 요청 URL: /api/health');
    
    const response = await fetch('/api/health', {
      method: 'GET',
      credentials: 'include'
    });
    
    console.log('📊 응답 상태:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.text();
      console.log('✅ 백엔드 서버 정상 작동');
      console.log('📄 응답 데이터:', data);
      return true;
    } else {
      console.log('⚠️ 백엔드 서버 응답 있지만 상태 코드:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ 백엔드 서버 연결 실패:', error);
    console.error('🔍 에러 상세 정보:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return false;
  }
};

export const checkAIServices = async () => {
  const services = [
    { name: 'AI 문제 생성', url: '/api/ai/problems/generate' },
    { name: 'AI 코드 평가', url: '/api/ai/evaluate-code' }
  ];
  
  console.log('🔍 AI 서비스 상태 확인 중...');
  
  for (const service of services) {
    try {
      const response = await fetch(service.url, {
        method: 'OPTIONS',
        credentials: 'include'
      });
      
      if (response.ok) {
        console.log(`✅ ${service.name} 서비스 사용 가능`);
      } else {
        console.log(`⚠️ ${service.name} 서비스 응답 있지만 상태 코드:`, response.status);
      }
    } catch (error) {
      console.error(`❌ ${service.name} 서비스 연결 실패:`, error);
    }
  }
};

export const logEnvironmentInfo = () => {
  console.log('🌍 환경 정보:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
  console.log('- 현재 시간:', new Date().toISOString());
  console.log('- User Agent:', navigator.userAgent);
}; 