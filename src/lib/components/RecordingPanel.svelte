<!-- src/lib/components/RecordingPanel.svelte -->
<script>
	export let isRecording = false;
	export let isProcessing = false;
	export let recordingTime = 0;
	export let formatTime = (time) => `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`;
	export let isError = false;
	export let error = null;
	
	export let onStart = () => {};
	export let onStop = () => {};
	export let onReset = () => {};
</script>

<div class="bg-white rounded-lg shadow-lg p-6 mb-6">
	<!-- Recording Status Display -->
	<div class="flex items-center justify-between mb-4">
		<div class="text-center flex-1">
			{#if isRecording}
				<p class="text-3xl font-bold text-red-600">{formatTime(recordingTime)}</p>
				<p class="text-sm text-red-500 animate-pulse">AI 대화 시작...</p>
			{:else if isProcessing}
				<p class="text-lg text-blue-600 animate-pulse">처리 중...</p>
			{:else}
				<p class="text-sm text-gray-500">연습 준비 완료</p>
			{/if}
		</div>
	</div>

	<!-- Control Buttons -->
	<div class="flex gap-4 justify-center">
		<button
			on:click={onStart}
			disabled={isRecording || isProcessing}
			class={`px-6 py-3 rounded-lg font-semibold transition ${
				isRecording || isProcessing
					? 'bg-gray-300 text-gray-600 cursor-not-allowed'
					: 'bg-blue-500 hover:bg-blue-600 text-white'
			}`}
		>
			🎙️ AI와 대화 시작
		</button>

		<button
			on:click={onStop}
			disabled={!isRecording || isProcessing}
			class={`px-6 py-3 rounded-lg font-semibold transition ${
				!isRecording || isProcessing
					? 'bg-gray-300 text-gray-600 cursor-not-allowed'
					: 'bg-blue-500 hover:bg-blue-600 text-white'
			}`}
		>
			⏹️ 대화 전송 및 중지
		</button>

		<button
			on:click={onReset}
			class="px-6 py-3 rounded-lg font-semibold bg-gray-500 hover:bg-gray-600 text-white transition"
		>
			🔄 초기화
		</button>
	</div>

	<!-- Status Message -->
	<div class="mt-4 text-center text-sm">
		{#if isProcessing}
			<p class="text-blue-600 font-semibold">🔄 메시지 처리 중...</p>
		{:else if isError && error}
			<p class="text-red-600 font-semibold">❌ {error}</p>
		{:else}
			<p class="text-gray-500">준비 완료</p>
		{/if}
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>
