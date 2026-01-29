<script>
	export let conversationHistory = [];
	export let isProcessing = false;
	export let assistantMessage = '';
</script>

<div class="bg-white rounded-lg shadow-lg p-6 mb-6 h-96 overflow-y-auto">
	{#if conversationHistory.length === 0}
		<div class="flex items-center justify-center h-full text-gray-400">
			<p>아래 녹음 버튼을 눌러 대화를 시작하세요</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each conversationHistory as msg, i (i)}
				<div class={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
					<div
						class={`max-w-xs px-4 py-3 rounded-lg ${
							msg.role === 'user'
								? 'bg-blue-500 text-white rounded-br-none'
								: msg.role === 'system'
								  ? 'bg-red-100 text-red-800'
								  : 'bg-gray-200 text-gray-800 rounded-bl-none'
						}`}
					>
						<p class="text-sm whitespace-pre-wrap">{msg.content}</p>
						<p class="text-xs opacity-70 mt-1">{msg.timestamp}</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Live Processing Indicator -->
	{#if isProcessing && assistantMessage}
		<div class="flex justify-start mt-4">
			<div class="max-w-xs px-4 py-3 rounded-lg bg-green-100 text-green-800 rounded-bl-none">
				<p class="text-sm whitespace-pre-wrap">{assistantMessage}</p>
				<p class="text-xs opacity-70 mt-1">답변 중...</p>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>
