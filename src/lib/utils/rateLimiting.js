/**
 * Rate Limiting 유틸리티
 * API 호출 제한을 구현합니다.
 */

/**
 * 인메모리 기반 Rate Limiter
 * 주의: 프로덕션에서 다중 인스턴스 사용 시 Redis 권장
 */
class RateLimiter {
  constructor() {
    this.store = new Map();
    // 주기적으로 오래된 데이터 정리 (1시간마다)
    setInterval(() => this.cleanup(), 3600000);
  }

  /**
   * Rate limit 체크
   * @param {string} key - 식별 키 (사용자ID, IP 등)
   * @param {number} maxRequests - 허용된 요청 수
   * @param {number} windowMs - 시간 윈도우 (밀리초)
   * @returns {Object} { allowed: boolean, remaining: number, resetTime: Date }
   */
  check(key, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    
    if (!this.store.has(key)) {
      this.store.set(key, []);
    }

    const requests = this.store.get(key);
    
    // 시간 윈도우 밖의 요청 제거
    const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);
    
    const allowed = recentRequests.length < maxRequests;
    
    if (allowed) {
      recentRequests.push(now);
      this.store.set(key, recentRequests);
    }

    const resetTime = new Date(
      recentRequests.length > 0
        ? recentRequests[0] + windowMs
        : now + windowMs
    );

    return {
      allowed,
      remaining: Math.max(0, maxRequests - recentRequests.length),
      retryAfter: allowed ? null : resetTime,
      resetTime
    };
  }

  /**
   * 오래된 데이터 정리
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 3600 * 1000; // 24시간

    for (const [key, requests] of this.store.entries()) {
      const recentRequests = requests.filter(t => now - t < maxAge);
      
      if (recentRequests.length === 0) {
        this.store.delete(key);
      } else {
        this.store.set(key, recentRequests);
      }
    }
  }

  /**
   * 특정 키 초기화
   * @param {string} key - 초기화할 키
   */
  reset(key) {
    this.store.delete(key);
  }

  /**
   * 모든 데이터 초기화
   */
  resetAll() {
    this.store.clear();
  }

  /**
   * 통계 정보
   */
  getStats() {
    return {
      activeKeys: this.store.size,
      totalRequests: Array.from(this.store.values()).reduce((sum, arr) => sum + arr.length, 0)
    };
  }
}

// 글로벌 Rate Limiter 인스턴스
export const globalRateLimiter = new RateLimiter();

/**
 * 사용자별 API 호출 Rate Limiting
 * @param {string} userId - 사용자 ID
 * @param {number} maxRequests - 분당 최대 요청 수 (기본값: 10)
 * @returns {Object} Rate limit 결과
 */
export function checkUserRateLimit(userId, maxRequests = 10) {
  return globalRateLimiter.check(userId, maxRequests, 60000); // 1분
}

/**
 * IP 기반 Rate Limiting
 * @param {string} ipAddress - IP 주소
 * @param {number} maxRequests - 분당 최대 요청 수 (기본값: 20)
 * @returns {Object} Rate limit 결과
 */
export function checkIpRateLimit(ipAddress, maxRequests = 20) {
  return globalRateLimiter.check(ipAddress, maxRequests, 60000); // 1분
}

/**
 * 시간당 API 비용 기반 Rate Limiting
 * @param {string} userId - 사용자 ID
 * @param {number} estimatedCost - 이번 요청의 예상 비용 (USD)
 * @param {number} hourlyBudget - 시간당 예산 (USD)
 * @returns {Object} { allowed: boolean, remaining: number }
 */
export function checkCostRateLimit(userId, estimatedCost, hourlyBudget = 10) {
  const costKey = `cost_${userId}`;
  const now = Date.now();
  const hourMs = 3600000;

  if (!globalRateLimiter.store.has(costKey)) {
    globalRateLimiter.store.set(costKey, { total: 0, resetTime: now + hourMs });
  }

  const costData = globalRateLimiter.store.get(costKey);
  
  // 시간 초과 시 초기화
  if (now > costData.resetTime) {
    costData.total = 0;
    costData.resetTime = now + hourMs;
  }

  const newTotal = costData.total + estimatedCost;
  const allowed = newTotal <= hourlyBudget;

  if (allowed) {
    costData.total = newTotal;
    globalRateLimiter.store.set(costKey, costData);
  }

  return {
    allowed,
    spent: costData.total,
    remaining: Math.max(0, hourlyBudget - costData.total),
    resetTime: new Date(costData.resetTime)
  };
}

/**
 * SvelteKit 미들웨어용 Rate Limit 체크 함수
 * @param {Request} request - HTTP 요청
 * @param {number} maxRequests - 최대 요청 수
 * @param {boolean} useIp - IP 기반 제한 사용 여부
 * @returns {Object} { allowed: boolean, retryAfter: Date|null }
 */
export function getRateLimitFromRequest(request, maxRequests = 10, useIp = false) {
  let key;

  if (useIp) {
    // IP 주소 추출
    key = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || request.headers.get('client-ip')
      || 'unknown';
  } else {
    // 사용자 ID는 별도로 추출 필요
    key = request.headers.get('authorization')?.split(' ')[1] || 'anonymous';
  }

  return checkUserRateLimit(key, maxRequests);
}

/**
 * Rate Limit 헤더 생성
 * @param {Object} rateLimitResult - checkUserRateLimit의 결과
 * @returns {Object} HTTP 헤더 객체
 */
export function createRateLimitHeaders(rateLimitResult) {
  return {
    'X-RateLimit-Limit': '10',
    'X-RateLimit-Remaining': String(rateLimitResult.remaining),
    'X-RateLimit-Reset': rateLimitResult.resetTime.toISOString(),
    ...(rateLimitResult.retryAfter && {
      'Retry-After': Math.ceil((rateLimitResult.retryAfter - new Date()) / 1000)
    })
  };
}

/**
 * Rate Limit 에러 응답
 * @param {Object} rateLimitResult - checkUserRateLimit의 결과
 * @returns {Object} { status: 429, headers: Object, body: Object }
 */
export function createRateLimitErrorResponse(rateLimitResult) {
  return {
    status: 429,
    headers: createRateLimitHeaders(rateLimitResult),
    body: {
      error: 'Too many requests',
      message: `Rate limit exceeded. Retry after ${rateLimitResult.resetTime.toISOString()}`,
      retryAfter: Math.ceil((rateLimitResult.retryAfter - new Date()) / 1000)
    }
  };
}
