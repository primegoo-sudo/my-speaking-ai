/**
 * useRealtimeAgent.js
 * 
 * Composable for speech-to-speech conversation with OpenAI APIs
 * Uses Whisper (transcription) + GPT (chat) + TTS (speech)
 */

import { logDebug } from '$lib/stores/debug.js';

export function useRealtimeAgent({ onAudioChunk, onTextChunk, onStateChange } = {}) {
  let sessionId = `session-${Date.now()}`;
  let currentAudio = null;
  let activeRequest = null; // 진행 중인 fetch 추적
  let audioStartTime = null; // 오디오 재생 시작 시간
  let lastApiCallTime = null; // 마지막 API 호출 시간

  const state = {
    isLoading: false,
    isConnected: false,
    error: null,
    sessionId: sessionId,
    hasActiveRequest: false, // API 요청 진행 중
    isAudioPlaying: false, // 오디오 재생 중
    lastActivityTime: null // 마지막 활동 시간
  };

  const updateState = (newState) => {
    Object.assign(state, newState);
    onStateChange?.(state);
  };

  /**
   * Start a conversation turn with audio
   * @param {Blob} audioBlob - Audio blob from MediaRecorder
   */
  async function startSession(audioBlob) {
    if (!audioBlob) {
      updateState({ error: 'No audio provided' });
      return null;
    }

    lastApiCallTime = Date.now();
    updateState({ 
      isLoading: true, 
      error: null, 
      hasActiveRequest: true,
      lastActivityTime: lastApiCallTime
    });
    logDebug('realtime', 'startSession', { size: audioBlob.size, type: audioBlob.type, sessionId });

    try {
      // 1️⃣ Send audio to backend
      const formData = new FormData();
      const filename = audioBlob.type?.includes('webm') ? 'recording.webm' : 'recording.wav';
      formData.append('audio', audioBlob, filename);
      formData.append('sessionId', sessionId);

      logDebug('realtime', 'POST /api/realtime');
      
      // AbortController로 요청 추적 및 취소 가능하게 설정
      const controller = new AbortController();
      activeRequest = controller;
      
      const response = await fetch('/api/realtime', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        logDebug('realtime', 'HTTP error', { status: response.status, body: errorText });
        throw new Error(`API error: ${response.status} ${errorText}`);
      }

      // 2️⃣ Parse JSON response
      activeRequest = null; // 요청 완료
      const data = await response.json();
      updateState({ hasActiveRequest: false });
      
      logDebug('realtime', 'response', {
        userText: data.userText,
        assistantText: data.assistantText,
        audioBytes: data.audioData?.length || 0
      });

      // 3️⃣ Notify text chunk
      if (onTextChunk && data.assistantText) {
        onTextChunk(data.assistantText);
      }

      // 4️⃣ Decode and play audio
      if (data.audioData) {
        const audioBytes = Uint8Array.from(atob(data.audioData), c => c.charCodeAt(0));
        const audioBlob = new Blob([audioBytes], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Play audio
        if (currentAudio) {
          currentAudio.pause();
          URL.revokeObjectURL(currentAudio.src);
          currentAudio = null;
        }
        
        currentAudio = new Audio(audioUrl);
        audioStartTime = Date.now();
        updateState({ isAudioPlaying: true });
        
        currentAudio.play().catch(err => {
          logDebug('realtime', 'audio play error', { message: err.message });
          updateState({ isAudioPlaying: false });
        });

        currentAudio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          audioStartTime = null;
          updateState({ 
            isLoading: false, 
            isConnected: false,
            isAudioPlaying: false,
            lastActivityTime: Date.now()
          });
          currentAudio = null;
        };
      } else {
        updateState({ isLoading: false, isConnected: false });
      }

      logDebug('realtime', 'session complete');
      return data;

    } catch (err) {
      activeRequest = null;
      
      // AbortError는 사용자가 의도적으로 취소한 것이므로 에러로 표시하지 않음
      if (err.name === 'AbortError') {
        logDebug('realtime', 'Request aborted by user');
        updateState({
          isLoading: false,
          isConnected: false,
          hasActiveRequest: false,
          isAudioPlaying: false,
          lastActivityTime: Date.now()
        });
        return null;
      }
      
      console.error('Session error:', err);
      logDebug('realtime', 'error', { message: err?.message });
      updateState({
        isLoading: false,
        isConnected: false,
        hasActiveRequest: false,
        isAudioPlaying: false,
        error: err.message || 'Failed to process audio',
        lastActivityTime: Date.now()
      });
      return null;
    }
  }

  /**
   * Stop current audio playback and abort any ongoing API requests
   */
  async function stopSession() {
    logDebug('realtime', 'Stopping session', { 
      hasAudio: !!currentAudio,
      hasActiveRequest: !!activeRequest,
      audioStartTime,
      lastApiCallTime
    });
    
    // 1. 진행 중인 API 요청 취소
    if (activeRequest) {
      try {
        activeRequest.abort();
        logDebug('realtime', 'Active API request aborted');
      } catch (err) {
        console.warn('Failed to abort request:', err);
      }
      activeRequest = null;
    }
    
    // 2. 오디오 재생 중지 및 리소스 해제
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        if (currentAudio.src) {
          URL.revokeObjectURL(currentAudio.src);
        }
        logDebug('realtime', 'Audio stopped and resources cleaned');
      } catch (err) {
        console.warn('Failed to stop audio:', err);
      }
      currentAudio = null;
    }
    
    audioStartTime = null;
    lastApiCallTime = null;
    
    updateState({ 
      isConnected: false, 
      isLoading: false,
      hasActiveRequest: false,
      isAudioPlaying: false,
      lastActivityTime: Date.now()
    });
    
    logDebug('realtime', 'Session stopped - all resources cleaned');
  }

  /**
   * Reset session and clear server-side history
   */
  async function reset() {
    const oldSessionId = sessionId;
    
    // 1. Stop current audio and abort requests
    await stopSession();
    
    // 2. Clear server-side conversation history
    try {
      logDebug('realtime', 'Clearing server session', { sessionId: oldSessionId });
      const deleteResponse = await fetch(`/api/realtime?sessionId=${oldSessionId}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.ok) {
        logDebug('realtime', 'Server session cleared successfully');
      } else {
        console.warn('Server session clear returned non-OK status:', deleteResponse.status);
      }
    } catch (err) {
      console.warn('Failed to clear server session:', err);
    }
    
    // 3. Generate new session ID
    sessionId = `session-${Date.now()}`;
    audioStartTime = null;
    lastApiCallTime = null;
    activeRequest = null;
    currentAudio = null;
    
    updateState({
      isLoading: false,
      isConnected: false,
      hasActiveRequest: false,
      isAudioPlaying: false,
      error: null,
      sessionId: sessionId,
      lastActivityTime: Date.now()
    });
    
    logDebug('realtime', 'Session reset complete', { 
      oldSessionId,
      newSessionId: sessionId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get detailed API activity status for UI display
   */
  function getActivityStatus() {
    const now = Date.now();
    return {
      hasActiveRequest: state.hasActiveRequest,
      isAudioPlaying: state.isAudioPlaying,
      isAnyActivityRunning: state.hasActiveRequest || state.isAudioPlaying,
      lastActivityTime: state.lastActivityTime,
      timeSinceLastActivity: state.lastActivityTime ? now - state.lastActivityTime : null,
      audioPlayDuration: audioStartTime ? now - audioStartTime : null,
      apiRequestDuration: lastApiCallTime && state.hasActiveRequest ? now - lastApiCallTime : null
    };
  }

  return {
    startSession,
    stopSession,
    reset,
    getActivityStatus,
    state,
    get isLoading() {
      return state.isLoading;
    },
    get isConnected() {
      return state.isConnected;
    },
    get error() {
      return state.error;
    },
    get hasActiveRequest() {
      return state.hasActiveRequest;
    },
    get isAudioPlaying() {
      return state.isAudioPlaying;
    }
  };
}

/**
 * Helper: Play PCM audio chunk (deprecated - using MP3 now)
 */
export async function playAudioChunk(pcmData, sampleRate = 16000) {
  // No longer used - kept for compatibility
  console.warn('playAudioChunk deprecated');
}

/**
 * Helper: Convert audio file (e.g., from input or recording) to proper WAV format
 * @param {Blob} blob - Audio blob
 * @returns {Blob} WAV-formatted blob
 */
export async function ensureWavFormat(blob) {
  if (blob.type === 'audio/wav') {
    return blob;
  }

  // Re-encode if needed (simplified)
  const buffer = await blob.arrayBuffer();
  return new Blob([buffer], { type: 'audio/wav' });
}
