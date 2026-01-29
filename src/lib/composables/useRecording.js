/**
 * 녹음 기능을 관리하는 composable 함수
 * 
 * OpenAI Realtime API 호환성:
 * - WAV 포맷 (audio/wav)
 * - 16kHz 샘플 레이트
 * - 16-bit PCM
 */
import { logDebug } from '$lib/stores/debug.js';

export function useRecording() {
	let mediaRecorder = null;
	let audioChunks = [];
	let timerInterval = null;
	let audioContext = null;
	let mediaStream = null;
	let isRecordingActive = false;
	let pendingStopResolve = null;

	async function requestMicAccess() {
		if (!navigator?.mediaDevices?.getUserMedia) {
			throw new Error('This browser does not support audio recording');
		}
		try {
			// Try Permissions API (not available in all browsers)
			if (navigator.permissions && navigator.permissions.query) {
				const status = await navigator.permissions.query({ name: 'microphone' });
				if (status.state === 'denied') {
					throw new Error('Microphone permission denied. Please enable it in browser settings.');
				}
			}
			// Request a stream only if we don't already have one
			if (!mediaStream || !mediaStream.active) {
				mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
			}
			return true;
		} catch (err) {
			throw err;
		}
	}

	async function startRecording(onStateUpdate) {
		try {
			// Ensure mic access only once (prevents repeated prompts)
			await requestMicAccess();
			logDebug('recording', 'Mic access granted', {
				tracks: mediaStream?.getAudioTracks()?.length || 0
			});

			if (isRecordingActive) {
				return; // already recording
			}

			// Choose a supported mime type for MediaRecorder
			let mimeType = '';
			if (typeof MediaRecorder !== 'undefined') {
				if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
					mimeType = 'audio/webm;codecs=opus';
				} else if (MediaRecorder.isTypeSupported('audio/webm')) {
					mimeType = 'audio/webm';
				}
			}

			mediaRecorder = mimeType
				? new MediaRecorder(mediaStream, { mimeType })
				: new MediaRecorder(mediaStream);

			audioChunks = [];
			logDebug('recording', 'MediaRecorder created', { mimeType: mimeType || 'default' });

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunks.push(event.data);
					logDebug('recording', 'dataavailable', { size: event.data.size });
				}
			};

			mediaRecorder.onstop = () => {
				const blobType = mimeType || mediaRecorder.mimeType || 'audio/webm';
				const audioBlob = new Blob(audioChunks, { type: blobType });
				const recordedAudio = URL.createObjectURL(audioBlob);
				isRecordingActive = false;
				logDebug('recording', 'stopped', { blobType, bytes: audioBlob.size });
				
				// 모든 트랙 정지
				if (mediaStream) {
					mediaStream.getTracks().forEach(track => track.stop());
					mediaStream = null;
				}
				
				if (onStateUpdate) {
					onStateUpdate({
						recordedAudio,
						audioBlob, // Realtime API로 전송할 Blob 제공
						isRecording: false,
						stream: null
					});
				}

				// Resolve any pending stop promise
				if (typeof pendingStopResolve === 'function') {
					pendingStopResolve(audioBlob);
					pendingStopResolve = null;
				}
			};

			mediaRecorder.start();
			isRecordingActive = true;
			logDebug('recording', 'started');
			
			let recordingTime = 0;
			timerInterval = setInterval(() => {
				recordingTime++;
				if (onStateUpdate) {
					onStateUpdate({
						isRecording: true,
						recordingTime,
						stream: mediaStream
					});
				}
			}, 1000);

			if (onStateUpdate) {
					onStateUpdate({
						isRecording: true,
						recordingTime: 0,
						stream: mediaStream
					});
			}
		} catch (error) {
			console.error('녹음 권한 또는 장치 오류:', error);
			logDebug('recording', 'error', { message: error?.message, name: error?.name });
			if (onStateUpdate) {
				onStateUpdate({
					isRecording: false,
					error: error?.message || 'Microphone access error'
				});
			}
		}
	}

	function stopRecording(onStateUpdate) {
		if (!mediaRecorder || mediaRecorder.state === 'inactive') {
			return Promise.resolve(new Blob(audioChunks, { type: mediaRecorder?.mimeType || 'audio/webm' }));
		}

		// Ensure we flush any buffered data before stopping
		try {
			if (typeof mediaRecorder.requestData === 'function') {
				mediaRecorder.requestData();
			}
		} catch {}

		const stopPromise = new Promise((resolve) => {
			pendingStopResolve = resolve;
		});

		mediaRecorder.stop();
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
		if (onStateUpdate) {
			onStateUpdate({
				isRecording: false
			});
		}
		return stopPromise;
	}

	function deleteRecording(onStateUpdate) {
		if (onStateUpdate) {
			onStateUpdate({
				recordedAudio: null,
				recordingTime: 0
			});
		}
	}

	function formatTime(seconds) {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	function cleanup() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
		
		if (mediaStream) {
			mediaStream.getTracks().forEach(track => track.stop());
			mediaStream = null;
		}

		if (audioContext && audioContext.state !== 'closed') {
			audioContext.close();
			audioContext = null;
		}

		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
		}
	}

	/**
	 * 현재 녹음된 오디오를 Blob으로 반환 (onStateUpdate 콜백 없이)
	 * Realtime API 전송용
	 */
	function getAudioBlob() {
		const type = mediaRecorder?.mimeType || 'audio/webm';
		return new Blob(audioChunks, { type });
	}

	return {
		startRecording,
		stopRecording,
		deleteRecording,
		formatTime,
		cleanup,
		requestMicAccess,
		getAudioBlob
	};
}
