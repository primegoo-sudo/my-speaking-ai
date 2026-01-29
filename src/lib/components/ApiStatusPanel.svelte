<!-- src/lib/components/ApiStatusPanel.svelte -->
<script>
	export let apiActivityStatus = {
		hasActiveRequest: false,
		isAudioPlaying: false,
		isAnyActivityRunning: false,
		lastActivityTime: null
	};
</script>

<div class="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
	<div class="text-xs font-semibold text-gray-600 mb-2">📡 API 연결 상태</div>
	
	<!-- Status Indicators -->
	<div class="grid grid-cols-2 gap-2 text-xs">
		<div class="flex items-center gap-2">
			<span class={`w-2 h-2 rounded-full ${
				apiActivityStatus.hasActiveRequest ? 'bg-yellow-500 animate-pulse' : 'bg-gray-300'
			}`}></span>
			<span class="text-gray-700">
				API 요청: {apiActivityStatus.hasActiveRequest ? '진행중' : '없음'}
			</span>
		</div>
		<div class="flex items-center gap-2">
			<span class={`w-2 h-2 rounded-full ${
				apiActivityStatus.isAudioPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
			}`}></span>
			<span class="text-gray-700">
				오디오: {apiActivityStatus.isAudioPlaying ? '재생중' : '정지'}
			</span>
		</div>
	</div>

	<!-- Billing Status -->
	<div class="mt-2 pt-2 border-t border-gray-200">
		{#if apiActivityStatus.isAnyActivityRunning}
			<div class="flex items-center gap-2 text-orange-600">
				<span class="text-base">⚠️</span>
				<span class="font-semibold">API 활동 중 - 과금 발생 가능</span>
			</div>
		{:else}
			<div class="flex items-center gap-2 text-green-600">
				<span class="text-base">✅</span>
				<span class="font-semibold">API 비활성 - 과금 없음</span>
			</div>
		{/if}
		{#if apiActivityStatus.lastActivityTime}
			<div class="text-gray-500 mt-1">
				마지막 활동: {Math.floor((Date.now() - apiActivityStatus.lastActivityTime) / 1000)}초 전
			</div>
		{/if}
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>
