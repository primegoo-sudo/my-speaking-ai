<!-- src/lib/components/MicIcon.svelte -->
<script>
	let { isRecording = false } = $props();
</script>

<div class="flex justify-center mb-6">
	<div class="w-32 h-32 rounded-full border-4 border-gray-800 flex items-center justify-center bg-white {isRecording ? 'border-red-600 animate-pulse' : ''}">
		<div class="text-center">
			<svg class="w-16 h-16 mx-auto text-gray-800 {isRecording ? 'text-red-600' : ''}" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd" />
			</svg>
		</div>
	</div>
</div>
<div class="text-center mb-6">
	<span class="text-lg font-bold text-gray-800">MIC</span>
</div>
