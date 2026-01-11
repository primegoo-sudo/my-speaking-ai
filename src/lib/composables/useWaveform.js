/**
 * 웨이브폼 시각화를 관리하는 composable 함수
 */
export function useWaveform() {
	let audioContext = null;
	let analyser = null;
	let dataArray = null;
	let canvasContext = null;
	let animationFrame = null;

	function initializeWaveform(canvas, stream, getIsRecording) {
		if (!canvas || !stream) return;

		// 기존 리소스 정리
		cleanup();

		try {
			audioContext = new (window.AudioContext || window.webkitAudioContext)();
			const source = audioContext.createMediaStreamSource(stream);
			analyser = audioContext.createAnalyser();
			analyser.fftSize = 256;
			source.connect(analyser);
			dataArray = new Uint8Array(analyser.frequencyBinCount);
			
			if (!canvasContext) {
				canvasContext = canvas.getContext('2d');
			}
			
			startWaveform(canvas, getIsRecording);
		} catch (error) {
			console.error('웨이브폼 시작 실패:', error);
		}
	}

	function startWaveform(canvas, getIsRecording) {
		if (!canvas || !analyser || !canvasContext) return;

		function draw() {
			const currentlyRecording = typeof getIsRecording === 'function' ? getIsRecording() : getIsRecording;
			
			if (!currentlyRecording || !analyser || !canvasContext) {
				if (animationFrame) {
					cancelAnimationFrame(animationFrame);
					animationFrame = null;
				}
				// 녹음 중지 시 캔버스 초기화
				if (canvasContext && canvas) {
					canvasContext.fillStyle = '#ffffff';
					canvasContext.fillRect(0, 0, canvas.width, canvas.height);
				}
				return;
			}

			animationFrame = requestAnimationFrame(draw);
			analyser.getByteFrequencyData(dataArray);

			canvasContext.fillStyle = '#ffffff';
			canvasContext.fillRect(0, 0, canvas.width, canvas.height);

			const barWidth = (canvas.width / dataArray.length) * 2.5;
			let x = 0;

			canvasContext.fillStyle = '#000000';
			for (let i = 0; i < dataArray.length; i++) {
				const barHeight = (dataArray[i] / 255) * canvas.height;
				canvasContext.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
				x += barWidth + 1;
			}
		}

		draw();
	}

	function resizeCanvas(canvas) {
		if (!canvas) return;
		const container = canvas.parentElement;
		if (container) {
			const rect = container.getBoundingClientRect();
			canvas.width = Math.max(600, rect.width - 32);
			canvas.height = 150;
			if (canvasContext) {
				canvasContext.fillStyle = '#ffffff';
				canvasContext.fillRect(0, 0, canvas.width, canvas.height);
			}
		}
	}

	function cleanup() {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
			animationFrame = null;
		}
		if (audioContext) {
			audioContext.close();
			audioContext = null;
		}
		canvasContext = null;
		analyser = null;
		dataArray = null;
	}

	return {
		initializeWaveform,
		startWaveform,
		resizeCanvas,
		cleanup
	};
}
