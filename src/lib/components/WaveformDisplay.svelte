<!-- src/lib/components/WaveformDisplay.svelte -->
<script>
	import { onMount, onDestroy } from 'svelte';
	import { useWaveform } from '$lib/composables/useWaveform.js';

	let { isRecording = false, stream = null } = $props();
	
	let canvas;
	let waveform = useWaveform();

	onMount(() => {
		if (canvas) {
			waveform.resizeCanvas(canvas);
			window.addEventListener('resize', () => waveform.resizeCanvas(canvas));
		}
	});

	onDestroy(() => {
		waveform.cleanup();
		if (canvas) {
			window.removeEventListener('resize', () => waveform.resizeCanvas(canvas));
		}
	});

	$effect(() => {
		if (isRecording && stream && canvas) {
			waveform.initializeWaveform(canvas, stream, () => isRecording);
		} else if (!isRecording) {
			waveform.cleanup();
		}
	});
</script>

<div class="w-full bg-white rounded-lg border-2 border-gray-800 p-4">
	<canvas
		bind:this={canvas}
		class="w-full"
		style="height: 150px;"
	></canvas>
	<div class="text-center mt-2">
		<span class="text-sm font-bold text-gray-800">WAVE FORM</span>
	</div>
</div>
