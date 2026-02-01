<!-- src/lib/components/ConversationPanel.svelte -->
<script>
	export let conversationHistory = [];
	export let isProcessing = false;
	export let assistantMessage = '';

	let chatContainer;
	let activeTab = 'all'; // 'all', 'user', 'assistant', 'system'

	// 활성 탭에 따라 메시지 필터링
	$: filteredMessages = conversationHistory.filter(msg => {
		if (activeTab === 'all') return true;
		return msg.role === activeTab;
	});

	// 각 타입별 메시지 개수
	$: userCount = conversationHistory.filter(m => m.role === 'user').length;
	$: assistantCount = conversationHistory.filter(m => m.role === 'assistant').length;
	$: systemCount = conversationHistory.filter(m => m.role === 'system').length;

	// 자동 스크롤 (새 메시지가 추가될 때)
	$: if (chatContainer) {
		setTimeout(() => {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}, 0);
	}
</script>

<div class="bg-white rounded-lg shadow-lg p-6 mb-6 flex flex-col h-96">
	<!-- Header -->
	<div class="pb-3 mb-4">
		<h2 class="text-lg font-semibold text-gray-800">💬 대화 기록</h2>
	</div>

	<!-- Tab Navigation -->
	<div class="flex gap-2 mb-4 border-b">
		<button
			on:click={() => (activeTab = 'all')}
			class={`px-4 py-2 text-sm font-medium transition-colors ${
				activeTab === 'all'
					? 'text-blue-600 border-b-2 border-blue-600'
					: 'text-gray-600 hover:text-gray-800'
			}`}
		>
			전체 ({conversationHistory.length})
		</button>
		<button
			on:click={() => (activeTab = 'user')}
			class={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
				activeTab === 'user'
					? 'text-blue-600 border-b-2 border-blue-600'
					: 'text-gray-600 hover:text-gray-800'
			}`}
		>
			<span>🎤 내 음성</span>
			<span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{userCount}</span>
		</button>
		<button
			on:click={() => (activeTab = 'assistant')}
			class={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
				activeTab === 'assistant'
					? 'text-blue-600 border-b-2 border-blue-600'
					: 'text-gray-600 hover:text-gray-800'
			}`}
		>
			<span>👨‍🏫 AI 선생님</span>
			<span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{assistantCount}</span>
		</button>
		<button
			on:click={() => (activeTab = 'system')}
			class={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
				activeTab === 'system'
					? 'text-blue-600 border-b-2 border-blue-600'
					: 'text-gray-600 hover:text-gray-800'
			}`}
		>
			<span>📋 시스템</span>
			<span class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{systemCount}</span>
		</button>
	</div>

	<!-- Chat Area -->
	<div bind:this={chatContainer} class="flex-1 overflow-y-auto space-y-3 pr-2">
		{#if filteredMessages.length === 0}
			<div class="flex items-center justify-center h-full text-gray-400">
				<p class="text-center">
					{#if activeTab === 'all'}
						<span class="block text-sm">아래 "AI와 대화 시작" 버튼을 눌러</span>
						<span class="block text-sm">대화를 시작하세요</span>
					{:else if activeTab === 'user'}
						<span class="block text-sm">아직 음성 메시지가 없습니다</span>
					{:else if activeTab === 'assistant'}
						<span class="block text-sm">아직 AI 선생님 응답이 없습니다</span>
					{:else}
						<span class="block text-sm">시스템 메시지가 없습니다</span>
					{/if}
				</p>
			</div>
		{:else}
			{#each filteredMessages as msg, i (i)}
				{#if msg.role === 'system'}
					<!-- System Message -->
					<div class="flex justify-center">
						<div class="max-w-sm px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
							<p class="text-xs font-medium">📋 시스템</p>
							<p class="text-sm whitespace-pre-wrap mt-1">{msg.content}</p>
							<p class="text-xs opacity-60 mt-1 text-right">{msg.timestamp}</p>
						</div>
					</div>
				{:else if msg.role === 'user'}
					<!-- User Voice Message -->
					<div class="flex items-start gap-3">
						<div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
							<span class="text-white text-xs font-bold">나</span>
						</div>
						<div class="flex-1 px-4 py-3 rounded-lg bg-gray-50 border border-gray-200">
							<div class="flex items-center justify-between mb-2">
								<p class="text-xs font-medium text-gray-700">나</p>
								<p class="text-xs text-gray-600 font-bold">{msg.timestamp}</p>
							</div>
							<p class="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>
						</div>
					</div>
				{:else if msg.role === 'assistant'}
					<!-- Assistant Message -->
					<div class="flex items-start gap-3">
						<div class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-1">
							<span class="text-white text-xs font-bold">AI</span>
						</div>
						<div class="flex-1 px-4 py-3 rounded-lg bg-green-50 border border-green-200">
							<div class="flex items-center justify-between mb-2">
								<p class="text-xs font-medium text-green-700">AI 선생님</p>
								<p class="text-xs text-gray-600 font-bold">{msg.timestamp}</p>
							</div>
							<p class="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>
						</div>
					</div>
				{/if}
			{/each}
		{/if}

		<!-- Live Processing Indicator -->
		{#if isProcessing && assistantMessage && (activeTab === 'all' || activeTab === 'assistant')}
			<div class="flex items-start gap-3 animate-pulse">
				<div class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-1">
					<span class="text-white text-xs font-bold">AI</span>
				</div>
				<div class="flex-1 px-4 py-3 rounded-lg bg-green-50 border border-green-300">
					<p class="text-xs font-medium text-green-700 mb-2">AI 선생님 (응답 중...)</p>
					<p class="text-sm text-gray-800 whitespace-pre-wrap">{assistantMessage}</p>
				</div>
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
