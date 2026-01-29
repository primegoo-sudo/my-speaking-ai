<!-- src/lib/components/RecordingControls.svelte -->
<script>
	let { 
		isRecording = false, 
		recordingTime = 0, 
		recordedAudio = null,
		formatTime = (s) => s,
		onStart = () => {},
		onStop = () => {}
	} = $props();
</script>

<div class="flex flex-col items-center mb-8">
	<div class="mb-6">
		{#if isRecording}
			<div class="flex items-center gap-3">
				<div class="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
				<span class="text-xl font-mono text-gray-700">{formatTime(recordingTime)}</span>
			</div>
		{:else}
			<div class="text-gray-500 text-sm">
				{recordedAudio ? '녹음 완료' : '녹음 대기'}
			</div>
		{/if}
	</div>

	<div class="flex gap-4">
		{#if !isRecording}
			<button
				onclick={onStart}
				class="bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-8 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2 min-w-[160px] justify-center"
			>
				<div class="w-4 h-4 bg-white rounded-full"></div>
				<span>녹음 시작</span>
			</button>
		{:else}
			<button
				onclick={onStop}
				class="bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2 min-w-[160px] justify-center"
			>
				<div class="w-4 h-4 bg-white"></div>
				<span>녹음 중지</span>
			</button>
		{/if}
	</div>
</div>
