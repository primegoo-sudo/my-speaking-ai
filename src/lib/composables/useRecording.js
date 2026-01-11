/**
 * 녹음 기능을 관리하는 composable 함수
 */
export function useRecording() {
	let mediaRecorder = null;
	let audioChunks = [];
	let timerInterval = null;

	async function startRecording(onStateUpdate) {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaRecorder = new MediaRecorder(stream);
			audioChunks = [];

			mediaRecorder.ondataavailable = (event) => {
				audioChunks.push(event.data);
			};

			mediaRecorder.onstop = () => {
				const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
				const recordedAudio = URL.createObjectURL(audioBlob);
				stream.getTracks().forEach(track => track.stop());
				
				if (onStateUpdate) {
					onStateUpdate({
						recordedAudio,
						isRecording: false,
						stream: null
					});
				}
			};

			mediaRecorder.start();
			
			let recordingTime = 0;
			timerInterval = setInterval(() => {
				recordingTime++;
				if (onStateUpdate) {
					onStateUpdate({
						isRecording: true,
						recordingTime,
						stream
					});
				}
			}, 1000);

			if (onStateUpdate) {
				onStateUpdate({
					isRecording: true,
					recordingTime: 0,
					stream
				});
			}
		} catch (error) {
			console.error('녹음 권한이 필요합니다:', error);
			alert('마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
		}
	}

	function stopRecording(onStateUpdate) {
		if (mediaRecorder) {
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
		}
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
	}

	return {
		startRecording,
		stopRecording,
		deleteRecording,
		formatTime,
		cleanup
	};
}
