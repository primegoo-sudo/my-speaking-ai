/**
 * 파일 검증 유틸리티
 * 사용자가 업로드한 파일의 안전성을 검증합니다.
 */

// 설정
export const FILE_VALIDATION_CONFIG = {
  MAX_AUDIO_FILE_SIZE: 25 * 1024 * 1024, // 25MB
  MAX_IMAGE_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_AUDIO_TYPES: [
    'audio/wav',
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
    'audio/ogg',
    'audio/aac'
  ],
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
};

/**
 * 오디오 파일 검증
 * @param {File} file - 검증할 파일
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateAudioFile(file) {
  if (!file || !(file instanceof File)) {
    return { valid: false, error: 'File object is required' };
  }

  // 파일 크기 검증
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  if (file.size > FILE_VALIDATION_CONFIG.MAX_AUDIO_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds limit (max: ${FILE_VALIDATION_CONFIG.MAX_AUDIO_FILE_SIZE / 1024 / 1024}MB)`
    };
  }

  // MIME 타입 검증
  if (!FILE_VALIDATION_CONFIG.ALLOWED_AUDIO_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Allowed types: ${FILE_VALIDATION_CONFIG.ALLOWED_AUDIO_TYPES.join(', ')}`
    };
  }

  // 파일 이름 검증 (경로 traversal 방지)
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return { valid: false, error: 'Invalid file name' };
  }

  return { valid: true, error: null };
}

/**
 * 이미지 파일 검증
 * @param {File} file - 검증할 파일
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateImageFile(file) {
  if (!file || !(file instanceof File)) {
    return { valid: false, error: 'File object is required' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  if (file.size > FILE_VALIDATION_CONFIG.MAX_IMAGE_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds limit (max: ${FILE_VALIDATION_CONFIG.MAX_IMAGE_FILE_SIZE / 1024 / 1024}MB)`
    };
  }

  if (!FILE_VALIDATION_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}`
    };
  }

  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return { valid: false, error: 'Invalid file name' };
  }

  return { valid: true, error: null };
}

/**
 * 파일 이름 sanitize
 * @param {string} filename - 원본 파일 이름
 * @returns {string} Sanitize된 파일 이름
 */
export function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // 안전하지 않은 문자 제거
    .replace(/_{2,}/g, '_') // 중복된 언더스코어 제거
    .slice(0, 255); // 파일 이름 길이 제한
}

/**
 * 파일 시그니처 검증 (매직 넘버 기반)
 * @param {File} file - 검증할 파일
 * @returns {Promise<Object>} { valid: boolean, error: string|null }
 */
export async function validateFileSignature(file) {
  try {
    const buffer = await file.slice(0, 12).arrayBuffer();
    const view = new Uint8Array(buffer);

    // 오디오 파일 시그니처
    const signatures = {
      // WAV: RIFF....WAVE
      wav: [0x52, 0x49, 0x46, 0x46], // "RIFF"
      // MP3: ID3 or 0xFF 0xFB
      mp3: [0xff, 0xfb],
      // MPEG-4: ftypisom 또는 ftypM4A
      mp4: [0x66, 0x74, 0x79, 0x70], // "ftyp"
      // OGG: OggS
      ogg: [0x4f, 0x67, 0x67, 0x53], // "OggS"
      // WebM: 1A 45 DF A3
      webm: [0x1a, 0x45, 0xdf, 0xa3]
    };

    for (const [type, sig] of Object.entries(signatures)) {
      if (sig.every((byte, idx) => view[idx] === byte)) {
        return { valid: true, error: null, detectedType: type };
      }
    }

    return { valid: false, error: 'File signature does not match declared type' };
  } catch (err) {
    return { valid: false, error: `Signature validation failed: ${err.message}` };
  }
}

/**
 * 종합 파일 검증
 * @param {File} file - 검증할 파일
 * @param {string} fileType - 파일 유형 ('audio' | 'image')
 * @param {boolean} validateSignature - 시그니처 검증 여부
 * @returns {Promise<Object>} { valid: boolean, errors: Array }
 */
export async function validateFile(file, fileType = 'audio', validateSignature = true) {
  const errors = [];

  // 기본 검증
  const basicValidation = fileType === 'audio' 
    ? validateAudioFile(file)
    : validateImageFile(file);

  if (!basicValidation.valid) {
    errors.push(basicValidation.error);
  }

  // 시그니처 검증 (선택)
  if (validateSignature && basicValidation.valid) {
    const signatureValidation = await validateFileSignature(file);
    if (!signatureValidation.valid) {
      errors.push(signatureValidation.error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    file: basicValidation.valid ? file : null
  };
}
