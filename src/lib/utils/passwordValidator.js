/**
 * 비밀번호 강도 검증 유틸리티
 */

export function validatePasswordStrength(password) {
  if (!password) {
    return { isValid: false, errors: ['비밀번호를 입력하세요.'] };
  }

  const errors = [];

  // 최소 길이 6자
  if (password.length < 6) {
    errors.push('최소 6자 이상이어야 합니다.');
  }

  // 영문자 대문자 포함
  if (!/[A-Z]/.test(password)) {
    errors.push('영문 대문자(A-Z)를 포함해야 합니다.');
  }

  // 영문자 소문자 포함
  if (!/[a-z]/.test(password)) {
    errors.push('영문 소문자(a-z)를 포함해야 합니다.');
  }

  // 특수문자 포함
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('특수문자(!@#$%^&* 등)를 포함해야 합니다.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 비밀번호 강도 검증 상태 확인
 */
export function getPasswordStrengthStatus(password) {
  if (!password) return { status: 'none', percentage: 0 };

  const checks = {
    length: password.length >= 6,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const percentage = (passedChecks / 4) * 100;

  let status = 'weak';
  if (percentage >= 75) status = 'strong';
  else if (percentage >= 50) status = 'medium';

  return { status, percentage, checks };
}
