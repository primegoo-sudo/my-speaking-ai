<!-- src/lib/components/AudioPlayer.svelte -->
<script>
	let { recordedAudio = null, onDelete = () => {} } = $props();
</script>

{#if recordedAudio}
	<div class="border-t pt-8">
		<h2 class="text-xl font-semibold text-gray-800 mb-4">녹음된 음성</h2>
		<div class="bg-gray-50 rounded-lg p-6">
			<audio
				src={recordedAudio}
				controls
				class="w-full mb-4"
			></audio>
			<div class="flex justify-end">
				<button
					onclick={onDelete}
					class="text-red-600 hover:text-red-700 font-medium flex items-center gap-2 transition-colors"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
					</svg>
					삭제
				</button>
			</div>
		</div>
	</div>
{/if}
