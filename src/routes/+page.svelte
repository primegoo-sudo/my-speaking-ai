
<script>
	import { onDestroy } from 'svelte';
	import { useRecording } from '$lib/composables/useRecording.js';
	import MicIcon from '$lib/components/MicIcon.svelte';
	import WaveformDisplay from '$lib/components/WaveformDisplay.svelte';
	import RecordingControls from '$lib/components/RecordingControls.svelte';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';

	// 녹음 상태 관리
	let recordedAudio = $state(null);
	let isRecording = $state(false);
	let recordingTime = $state(0);
	let stream = $state(null);

	const recording = useRecording();

	// 상태 업데이트 콜백
	function updateState(newState) {
		if (newState.recordedAudio !== undefined) {
			recordedAudio = newState.recordedAudio;
		}
		if (newState.isRecording !== undefined) {
			isRecording = newState.isRecording;
		}
		if (newState.recordingTime !== undefined) {
			recordingTime = newState.recordingTime;
		}
		if (newState.stream !== undefined) {
			stream = newState.stream;
		}
	}

	// 녹음 시작 핸들러
	async function handleStartRecording() {
		await recording.startRecording(updateState);
	}

	// 녹음 중지 핸들러
	function handleStopRecording() {
		recording.stopRecording(updateState);
	}

	// 녹음 삭제 핸들러
	function handleDeleteRecording() {
		// URL 정리
		if (recordedAudio) {
			URL.revokeObjectURL(recordedAudio);
		}
		recording.deleteRecording(updateState);
	}

	// no test loaders

	onDestroy(() => {
		recording.cleanup();
		if (recordedAudio) {
			URL.revokeObjectURL(recordedAudio);
		}
		if (stream) {
			stream.getTracks().forEach(track => track.stop());
		}
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
	<div class="max-w-2xl mx-auto">
		<div class="bg-white rounded-2xl shadow-xl p-8">
			<h1 class="text-3xl font-bold text-gray-800 mb-2 text-center">음성 녹음</h1>
			<p class="text-gray-600 text-center mb-8">마이크를 사용하여 음성을 녹음하고 확인하세요</p>

			<!-- MIC 아이콘 및 웨이브폼 -->
			<div class="border-2 border-gray-800 rounded-lg p-8 mb-8 bg-white">
				<MicIcon isRecording={isRecording} />
				<WaveformDisplay isRecording={isRecording} stream={stream} />
			</div>

			<!-- 녹음 컨트롤 -->
			<RecordingControls
				isRecording={isRecording}
				recordingTime={recordingTime}
				recordedAudio={recordedAudio}
				formatTime={recording.formatTime}
				onStart={handleStartRecording}
				onStop={handleStopRecording}
			/>

			<!-- 녹음된 오디오 재생 -->
			<AudioPlayer recordedAudio={recordedAudio} onDelete={handleDeleteRecording} />
		</div>
	</div>

    
</div>
