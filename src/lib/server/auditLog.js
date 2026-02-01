/**
 * 감시 로깅 유틸리티
 * 보안 관련 이벤트를 기록합니다.
 */

import { supabaseAdmin } from './supabaseAdmin.js';

/**
 * 감시 로그 이벤트 유형
 */
export const AUDIT_EVENTS = {
  // 인증 관련
  AUTH_LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
  AUTH_LOGIN_FAILED: 'AUTH_LOGIN_FAILED',
  AUTH_LOGOUT: 'AUTH_LOGOUT',
  AUTH_SIGNUP: 'AUTH_SIGNUP',
  AUTH_PASSWORD_RESET: 'AUTH_PASSWORD_RESET',

  // API 접근
  API_CALL_SUCCESS: 'API_CALL_SUCCESS',
  API_CALL_FAILED: 'API_CALL_FAILED',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  API_BUDGET_EXCEEDED: 'API_BUDGET_EXCEEDED',

  // 권한 관련
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',

  // 관리자 작업
  ADMIN_USER_CREATED: 'ADMIN_USER_CREATED',
  ADMIN_USER_UPDATED: 'ADMIN_USER_UPDATED',
  ADMIN_USER_DELETED: 'ADMIN_USER_DELETED',
  ADMIN_ROLE_CHANGED: 'ADMIN_ROLE_CHANGED',

  // 데이터 관련
  DATA_ACCESS: 'DATA_ACCESS',
  DATA_MODIFIED: 'DATA_MODIFIED',
  DATA_DELETED: 'DATA_DELETED',

  // 시스템 이벤트
  SECURITY_ALERT: 'SECURITY_ALERT',
  SYSTEM_ERROR: 'SYSTEM_ERROR'
};

/**
 * 감시 로그 심각도 수준
 */
export const SEVERITY_LEVELS = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

/**
 * 요청에서 클라이언트 정보 추출
 * @param {Request} request - HTTP 요청
 * @returns {Object} { ip, userAgent, userPreferredLanguage }
 */
export function extractClientInfo(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('client-ip')
    || request.headers.get('x-client-ip')
    || 'unknown';

  const userAgent = request.headers.get('user-agent') || 'unknown';
  const userPreferredLanguage = request.headers.get('accept-language') || 'unknown';

  return { ip, userAgent, userPreferredLanguage };
}

/**
 * 감시 이벤트 기록
 * @param {Object} options - 로깅 옵션
 * @param {string} options.event - 이벤트 유형 (AUDIT_EVENTS 중 하나)
 * @param {string} options.severity - 심각도 (SEVERITY_LEVELS 중 하나)
 * @param {string|null} options.userId - 사용자 ID
 * @param {string|null} options.targetUserId - 대상 사용자 ID (관리자 작업)
 * @param {string} options.resource - 리소스 (예: 'audio_processing', 'user_management')
 * @param {Object} options.details - 상세 정보
 * @param {string} options.ip - 클라이언트 IP
 * @param {string} options.userAgent - 사용자 에이전트
 * @returns {Promise<boolean>} 성공 여부
 */
export async function logAuditEvent(options) {
  const {
    event,
    severity = SEVERITY_LEVELS.INFO,
    userId = null,
    targetUserId = null,
    resource,
    details = {},
    ip = 'unknown',
    userAgent = 'unknown'
  } = options;

  try {
    // 먼저 감사 로그 테이블이 존재하는지 확인
    const { error: tableError } = await supabaseAdmin
      .from('audit_logs')
      .select('id')
      .limit(1);

    // 테이블이 없으면 콘솔 로깅만 수행
    if (tableError?.code === 'PGRST116') {
      console.log('[AUDIT LOG]', {
        timestamp: new Date().toISOString(),
        event,
        severity,
        userId,
        resource,
        details
      });
      return false;
    }

    // 감사 로그 저장
    const { error: insertError } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        event,
        severity,
        user_id: userId,
        target_user_id: targetUserId,
        resource,
        details: JSON.stringify(details),
        ip_address: ip,
        user_agent: userAgent,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('[AUDIT LOG ERROR]', insertError);
      // 로깅 실패해도 요청은 계속 진행
      return false;
    }

    return true;
  } catch (err) {
    console.error('[AUDIT LOG EXCEPTION]', err);
    return false;
  }
}

/**
 * 로그인 시도 기록
 * @param {Request} request - HTTP 요청
 * @param {string} email - 이메일
 * @param {boolean} success - 성공 여부
 * @param {string|null} userId - 사용자 ID (성공 시)
 * @param {string|null} failureReason - 실패 이유
 * @returns {Promise<boolean>}
 */
export async function logLoginAttempt(request, email, success, userId = null, failureReason = null) {
  const clientInfo = extractClientInfo(request);

  return logAuditEvent({
    event: success ? AUDIT_EVENTS.AUTH_LOGIN_SUCCESS : AUDIT_EVENTS.AUTH_LOGIN_FAILED,
    severity: success ? SEVERITY_LEVELS.INFO : SEVERITY_LEVELS.WARNING,
    userId,
    resource: 'authentication',
    details: {
      email,
      success,
      ...(failureReason && { failureReason })
    },
    ...clientInfo
  });
}

/**
 * API 호출 기록
 * @param {Request} request - HTTP 요청
 * @param {string} userId - 사용자 ID
 * @param {string} endpoint - API 엔드포인트
 * @param {boolean} success - 성공 여부
 * @param {Object} metadata - 메타데이터 (토큰, 비용 등)
 * @returns {Promise<boolean>}
 */
export async function logApiCall(request, userId, endpoint, success, metadata = {}) {
  const clientInfo = extractClientInfo(request);

  return logAuditEvent({
    event: success ? AUDIT_EVENTS.API_CALL_SUCCESS : AUDIT_EVENTS.API_CALL_FAILED,
    severity: success ? SEVERITY_LEVELS.INFO : SEVERITY_LEVELS.ERROR,
    userId,
    resource: 'api_access',
    details: {
      endpoint,
      ...metadata
    },
    ...clientInfo
  });
}

/**
 * 권한 거부 기록 (의심 활동)
 * @param {Request} request - HTTP 요청
 * @param {string|null} userId - 사용자 ID
 * @param {string} resource - 리소스
 * @param {string} reason - 거부 이유
 * @returns {Promise<boolean>}
 */
export async function logPermissionDenied(request, userId, resource, reason) {
  const clientInfo = extractClientInfo(request);

  return logAuditEvent({
    event: AUDIT_EVENTS.PERMISSION_DENIED,
    severity: SEVERITY_LEVELS.WARNING,
    userId,
    resource,
    details: {
      reason
    },
    ...clientInfo
  });
}

/**
 * 보안 경고 기록
 * @param {Request} request - HTTP 요청
 * @param {string|null} userId - 사용자 ID
 * @param {string} alertType - 경고 유형
 * @param {Object} details - 상세 정보
 * @param {boolean} critical - 중요 여부
 * @returns {Promise<boolean>}
 */
export async function logSecurityAlert(request, userId, alertType, details = {}, critical = false) {
  const clientInfo = extractClientInfo(request);

  return logAuditEvent({
    event: AUDIT_EVENTS.SECURITY_ALERT,
    severity: critical ? SEVERITY_LEVELS.CRITICAL : SEVERITY_LEVELS.WARNING,
    userId,
    resource: 'security',
    details: {
      alertType,
      ...details
    },
    ...clientInfo
  });
}

/**
 * 관리자 작업 기록
 * @param {Request} request - HTTP 요청
 * @param {string} adminUserId - 관리자 사용자 ID
 * @param {string} action - 작업 (USER_CREATED, ROLE_CHANGED 등)
 * @param {string} targetUserId - 대상 사용자 ID
 * @param {Object} changes - 변경 내용
 * @returns {Promise<boolean>}
 */
export async function logAdminAction(request, adminUserId, action, targetUserId, changes = {}) {
  const clientInfo = extractClientInfo(request);
  const eventMap = {
    USER_CREATED: AUDIT_EVENTS.ADMIN_USER_CREATED,
    USER_UPDATED: AUDIT_EVENTS.ADMIN_USER_UPDATED,
    USER_DELETED: AUDIT_EVENTS.ADMIN_USER_DELETED,
    ROLE_CHANGED: AUDIT_EVENTS.ADMIN_ROLE_CHANGED
  };

  return logAuditEvent({
    event: eventMap[action] || AUDIT_EVENTS.DATA_MODIFIED,
    severity: SEVERITY_LEVELS.INFO,
    userId: adminUserId,
    targetUserId,
    resource: 'admin_action',
    details: {
      action,
      ...changes
    },
    ...clientInfo
  });
}

/**
 * 시스템 에러 기록
 * @param {Error} error - 에러 객체
 * @param {string|null} userId - 사용자 ID
 * @param {string} context - 컨텍스트
 * @param {Request|null} request - HTTP 요청 (선택)
 * @returns {Promise<boolean>}
 */
export async function logSystemError(error, userId = null, context = '', request = null) {
  const clientInfo = request ? extractClientInfo(request) : { ip: 'unknown', userAgent: 'unknown' };

  return logAuditEvent({
    event: AUDIT_EVENTS.SYSTEM_ERROR,
    severity: SEVERITY_LEVELS.ERROR,
    userId,
    resource: context,
    details: {
      errorMessage: error.message,
      errorStack: error.stack?.split('\n').slice(0, 3).join('\n') // 처음 3줄만
    },
    ...clientInfo
  });
}

/**
 * Rate Limit 초과 기록
 * @param {Request} request - HTTP 요청
 * @param {string|null} userId - 사용자 ID
 * @param {string} limitType - 제한 유형 ('per_minute', 'daily_budget' 등)
 * @returns {Promise<boolean>}
 */
export async function logRateLimitExceeded(request, userId, limitType) {
  const clientInfo = extractClientInfo(request);

  return logAuditEvent({
    event: AUDIT_EVENTS.API_RATE_LIMIT,
    severity: SEVERITY_LEVELS.WARNING,
    userId,
    resource: 'rate_limiting',
    details: {
      limitType
    },
    ...clientInfo
  });
}
