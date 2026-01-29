<script>
	import { onMount } from 'svelte';
	import { useRecording } from '$lib/composables/useRecording.js';
	import { useRealtimeAgent } from '$lib/composables/useRealtimeAgent.js';
	import DebugConsole from '$lib/components/DebugConsole.svelte';
	import ConversationPanel from '$lib/components/ConversationPanel.svelte';
	import RecordingPanel from '$lib/components/RecordingPanel.svelte';
	import ApiStatusPanel from '$lib/components/ApiStatusPanel.svelte';
	import TipsPanel from '$lib/components/TipsPanel.svelte';

	// ====== State ======
	let recordingTime = 0;
	let isRecording = false;
	let conversationHistory = [];
	let assistantMessage = '';
	let isProcessing = false;
	let showDebug = true;
	let apiActivityStatus = {
		hasActiveRequest: false,
		isAudioPlaying: false,
		isAnyActivityRunning: false,
		lastActivityTime: null
	};

	const { startRecording, stopRecording, formatTime, cleanup, requestMicAccess } = useRecording();
	const realtime = useRealtimeAgent({
		onTextChunk: handleTextChunk,
		onStateChange: handleStateChange
	});

	// ====== Event Handlers ======
	function handleStateChange(state) {
		isProcessing = state.isLoading;
		apiActivityStatus = realtime.getActivityStatus();
		
		if (state.error) {
			conversationHistory = [...conversationHistory, {
				role: 'system',
				content: `⚠️ Error: ${state.error}`,
				timestamp: new Date().toLocaleTimeString()
			}];
		}
	}

	function handleTextChunk(text) {
		assistantMessage = text;
	}

	async function handleStart() {
		isRecording = true;
		assistantMessage = '';

		try {
			await requestMicAccess();
		} catch (err) {
			conversationHistory = [...conversationHistory, {
				role: 'system',
				content: `⚠️ 마이크 오류: ${err.message}. 브라우저 설정에서 마이크 접근을 허용해 주세요.`,
				timestamp: new Date().toLocaleTimeString()
			}];
			isRecording = false;
			return;
		}

		startRecording((state) => {
			if (state.recordingTime !== undefined) recordingTime = state.recordingTime;
			isRecording = state.isRecording;
			if (state.error) {
				conversationHistory = [...conversationHistory, {
					role: 'system',
					content: `⚠️ ${state.error}`,
					timestamp: new Date().toLocaleTimeString()
				}];
			}
		});
	}

	async function handleStop() {
		isRecording = false;
		const audioBlob = await stopRecording();
		
		if (!audioBlob || audioBlob.size === 0) {
			conversationHistory = [...conversationHistory, {
				role: 'system',
				content: '⚠️ 녹음된 오디오가 없습니다. 다시 시도해 주세요.',
				timestamp: new Date().toLocaleTimeString()
			}];
			return;
		}

		const timestamp = new Date().toLocaleTimeString();
		conversationHistory = [...conversationHistory, {
			role: 'user',
			content: '[말하는 중...]',
			timestamp
		}];

		assistantMessage = '';
		const response = await realtime.startSession(audioBlob);

		if (response && response.userText) {
			conversationHistory = conversationHistory.map((msg, idx) => 
				idx === conversationHistory.length - 1 ? { ...msg, content: response.userText } : msg
			);
		}

		if (response && response.assistantText) {
			conversationHistory = [...conversationHistory, {
				role: 'assistant',
				content: response.assistantText,
				timestamp: new Date().toLocaleTimeString()
			}];
			assistantMessage = '';
		}
	}

	async function handleReset() {
		await realtime.reset();
		conversationHistory = [];
		assistantMessage = '';
		recordingTime = 0;
		isProcessing = false;
		isRecording = false;
		apiActivityStatus = realtime.getActivityStatus();
		
		conversationHistory = [{
			role: 'system',
			content: `✅ 초기화 완료 - API 연결 종료 확인됨 (${new Date().toLocaleTimeString()})`,
			timestamp: new Date().toLocaleTimeString()
		}];
	}

	// ====== Lifecycle ======
	let statusUpdateInterval;
	
	onMount(() => {
		statusUpdateInterval = setInterval(() => {
			apiActivityStatus = realtime.getActivityStatus();
		}, 1000);
		
		return () => {
			clearInterval(statusUpdateInterval);
			cleanup();
			realtime.stopSession();
		};
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
	<div class="max-w-2xl mx-auto">
		<!-- Header -->
		<div class="text-center mb-8">
			<h1 class="text-4xl font-bold text-gray-800 mb-2">🎤 AI 대화 연습</h1>
			<p class="text-gray-600">한글/영어 자유롭게 대화하세요 - OpenAI 음성 AI</p>
		</div>

		<!-- Conversation Panel -->
		<ConversationPanel 
			{conversationHistory}
			{isProcessing}
			{assistantMessage}
		/>

		<!-- Recording Panel -->
		<RecordingPanel
			{isRecording}
			{isProcessing}
			{recordingTime}
			{formatTime}
			isError={!!realtime.error}
			error={realtime.error}
			onStart={handleStart}
			onStop={handleStop}
			onReset={handleReset}
		/>

		<!-- API Status Panel -->
		<div class="bg-white rounded-lg shadow-lg p-6 mb-6">
			<ApiStatusPanel {apiActivityStatus} />
		</div>

		<!-- Tips Panel -->
		<TipsPanel />
	</div>
</div>

<!-- Debug Console -->
<DebugConsole bind:open={showDebug} height={260} />

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>
