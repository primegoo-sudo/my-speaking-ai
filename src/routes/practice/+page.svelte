<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authReady, isAuthenticated } from '$lib/stores/auth.js';
	import { useRecording } from '$lib/composables/useRecording.js';
	import { useRealtimeAgent } from '$lib/composables/useRealtimeAgent.js';
	import { supabaseClient } from '$lib/supabaseClient.js';
	//import DebugConsole from '$lib/components/DebugConsole.svelte';
	import ConversationPanel from '$lib/components/ConversationPanel.svelte';
	import RecordingPanel from '$lib/components/RecordingPanel.svelte';
	import ApiStatusPanel from '$lib/components/ApiStatusPanel.svelte';
	import TipsPanel from '$lib/components/TipsPanel.svelte';
	import PromptSettings from '$lib/components/PromptSettings.svelte';

	// ====== State ======
	let recordingTime = 0;
	let isRecording = false;
	let liveConversationHistory = [];
	let conversationSessions = [];
	let selectedSessionKey = 'live';
	let selectedSession = null;
	let isHistoryLoading = false;
	let historyError = '';
	let currentSessionTitle = '';
	let currentSessionStartedAt = null;
	let sessionFilter = '7d';
	let customFrom = '';
	let customTo = '';
	let sessionEditTitle = '';
	let isSessionUpdating = false;
	let assistantMessage = '';
	let isProcessing = false;
	let showDebug = true;
	let apiActivityStatus = {
		hasActiveRequest: false,
		isAudioPlaying: false,
		isAnyActivityRunning: false,
		lastActivityTime: null
	};
	
	// 프롬프트 설정
	let promptSettings = {
		role: "친절하고 도움이 되는 다국어 대화 도우미",
		personality: "따뜻하고, 격려하며, 친근함",
		responseLength: "2-3 문장",
		topics: "일상 대화, 취미, 여행, 직장, 음식, 건강, 목표",
		correctionStyle: "대화 중 자연스럽게 부드럽게 교정",
		difficulty: "사용자 수준에 맞춰 점진적으로 난이도 조절"
	};

	const { startRecording, stopRecording, formatTime, cleanup, requestMicAccess } = useRecording();
	const realtime = useRealtimeAgent({
		onTextChunk: handleTextChunk,
		onStateChange: handleStateChange,
		getPromptOptions: () => promptSettings
	});

	const formatSessionTitle = (date) =>
		date.toLocaleString('ko-KR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});

	const formatSessionLabel = (date) =>
		date.toLocaleString('ko-KR', {
			month: 'short',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});

	const buildSessionKey = (row) => row.title || formatSessionTitle(new Date(row.created_at));

	const toSessionMessages = (session) => {
		if (!session) return [];

		const messages = [
			{
				role: 'system',
				content: `🗂️ 저장된 세션 (${session.title}) · ${session.turns}턴`,
				timestamp: formatSessionLabel(new Date(session.createdAt))
			}
		];

		session.rows.forEach((row) => {
			const timestamp = new Date(row.created_at).toLocaleTimeString();
			messages.push({ role: 'user', content: row.user_message, timestamp });
			messages.push({ role: 'assistant', content: row.assistant_message, timestamp });
		});

		return messages;
	};

	const buildSessions = (rows = []) => {
		const map = new Map();

		rows.forEach((row) => {
			const key = buildSessionKey(row);
			if (!map.has(key)) {
				map.set(key, {
					key,
					title: key,
					createdAt: row.created_at,
					lastAt: row.created_at,
					rows: [],
					promptSettings: row.prompt_settings || null  // 프롬프트 설정 저장
				});
			}
			const session = map.get(key);
			session.rows.push(row);
			if (new Date(row.created_at) < new Date(session.createdAt)) {
				session.createdAt = row.created_at;
			}
			if (new Date(row.created_at) > new Date(session.lastAt)) {
				session.lastAt = row.created_at;
			}
		});

		return Array.from(map.values())
			.map((session) => ({
				...session,
				turns: session.rows.length,
				label: formatSessionLabel(new Date(session.createdAt))
			}))
			.sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
	};

	const ensureSessionTitle = () => {
		if (!currentSessionTitle) {
			const now = new Date();
			currentSessionTitle = formatSessionTitle(now);
			currentSessionStartedAt = now;
		}
		return currentSessionTitle;
	};

	const getAuthToken = async () => {
		const { data } = await supabaseClient.auth.getSession();
		return data?.session?.access_token || null;
	};

	const refreshSessionList = async () => {
		isHistoryLoading = true;
		historyError = '';
		try {
			const authToken = await getAuthToken();
			if (!authToken) {
				conversationSessions = [];
				return;
			}

			const params = new URLSearchParams({ limit: '200' });
			if (sessionFilter === '7d') {
				params.set('from', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
			} else if (sessionFilter === '30d') {
				params.set('from', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
			} else if (sessionFilter === 'custom') {
				if (customFrom) params.set('from', new Date(customFrom).toISOString());
				if (customTo) params.set('to', new Date(customTo).toISOString());
			}

			const response = await fetch(`/api/conversations?${params.toString()}`, {
				headers: { Authorization: `Bearer ${authToken}` }
			});
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(errorText || '대화 기록을 불러오지 못했습니다.');
			}
			const result = await response.json();
			conversationSessions = buildSessions(result.data || []);
			if (selectedSessionKey !== 'live') {
				selectedSession = conversationSessions.find((session) => session.key === selectedSessionKey) || null;
				if (!selectedSession) {
					selectedSessionKey = 'live';
				}
			}
		} catch (err) {
			historyError = err?.message || '대화 기록을 불러오는 중 오류가 발생했습니다.';
		} finally {
			isHistoryLoading = false;
		}
	};

	const selectSession = (sessionKey) => {
		selectedSessionKey = sessionKey;
		if (sessionKey === 'live') {
			selectedSession = null;
			sessionEditTitle = '';
			return;
		}
		selectedSession = conversationSessions.find((session) => session.key === sessionKey) || null;
		sessionEditTitle = selectedSession?.title || '';
	};

	const updateSessionTitle = async () => {
		if (!selectedSession || !sessionEditTitle || sessionEditTitle === selectedSession.title) return;
		isSessionUpdating = true;
		try {
			const authToken = await getAuthToken();
			if (!authToken) throw new Error('로그인이 필요합니다.');

			const response = await fetch('/api/conversations', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${authToken}`
				},
				body: JSON.stringify({ oldTitle: selectedSession.title, newTitle: sessionEditTitle })
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(errorText || '세션 제목 변경에 실패했습니다.');
			}

			await refreshSessionList();
			selectedSessionKey = sessionEditTitle;
			selectedSession = conversationSessions.find((session) => session.key === sessionEditTitle) || null;
		} catch (err) {
			historyError = err?.message || '세션 제목 변경 중 오류가 발생했습니다.';
		} finally {
			isSessionUpdating = false;
		}
	};

	const deleteSession = async () => {
		if (!selectedSession) return;
		if (!confirm(`"${selectedSession.title}" 세션을 삭제할까요?`)) return;
		isSessionUpdating = true;
		try {
			const authToken = await getAuthToken();
			if (!authToken) throw new Error('로그인이 필요합니다.');

			const response = await fetch(`/api/conversations?title=${encodeURIComponent(selectedSession.title)}`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${authToken}` }
			});
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(errorText || '세션 삭제에 실패했습니다.');
			}
			selectedSessionKey = 'live';
			selectedSession = null;
			sessionEditTitle = '';
			await refreshSessionList();
		} catch (err) {
			historyError = err?.message || '세션 삭제 중 오류가 발생했습니다.';
		} finally {
			isSessionUpdating = false;
		}
	};

	let redirected = false;
	$: if (!redirected && $authReady && !$isAuthenticated) {
		redirected = true;
		goto('/login', { replaceState: true });
	}

	// ====== Event Handlers ======
	function handleStateChange(state) {
		isProcessing = state.isLoading;
		apiActivityStatus = realtime.getActivityStatus();
		
		if (state.error) {
			liveConversationHistory = [...liveConversationHistory, {
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
		ensureSessionTitle();

		try {
			await requestMicAccess();
		} catch (err) {
			liveConversationHistory = [...liveConversationHistory, {
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
				liveConversationHistory = [...liveConversationHistory, {
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
			liveConversationHistory = [...liveConversationHistory, {
				role: 'system',
				content: '⚠️ 녹음된 오디오가 없습니다. 다시 시도해 주세요.',
				timestamp: new Date().toLocaleTimeString()
			}];
			return;
		}

		const timestamp = new Date().toLocaleTimeString();
		liveConversationHistory = [...liveConversationHistory, {
			role: 'user',
			content: '[말하는 중...]',
			timestamp
		}];

		assistantMessage = '';
		const authToken = await getAuthToken();
		const response = await realtime.startSession(audioBlob, {
			authToken,
			sessionTitle: ensureSessionTitle(),
			duration: recordingTime,
			clientCreatedAt: new Date().toISOString()
		});

		if (response && response.userText) {
			liveConversationHistory = liveConversationHistory.map((msg, idx) => 
				idx === liveConversationHistory.length - 1 ? { ...msg, content: response.userText } : msg
			);
		}

		if (response && response.assistantText) {
			liveConversationHistory = [...liveConversationHistory, {
				role: 'assistant',
				content: response.assistantText,
				timestamp: new Date().toLocaleTimeString()
			}];
			assistantMessage = '';
		}

		await refreshSessionList();
	}

	async function handleReset() {
		await realtime.reset();
		liveConversationHistory = [];
		assistantMessage = '';
		recordingTime = 0;
		isProcessing = false;
		isRecording = false;
		apiActivityStatus = realtime.getActivityStatus();
		currentSessionTitle = '';
		currentSessionStartedAt = null;
		selectedSessionKey = 'live';
		selectedSession = null;
		
		liveConversationHistory = [{
			role: 'system',
			content: `✅ 초기화 완료 - API 연결 종료 확인됨 (${new Date().toLocaleTimeString()})`,
			timestamp: new Date().toLocaleTimeString()
		}];
		await refreshSessionList();
	}
	
	// 프롬프트 설정 적용 핸들러
	function handlePromptApply(newSettings) {
		promptSettings = { ...newSettings };
		// realtime 에이전트를 새 설정으로 재초기화
		// 다음 세션부터 새 프롬프트가 적용됨
		realtime.reset();
		liveConversationHistory = [
			...liveConversationHistory,
			{
				role: 'system',
				content: `⚙️ AI 튜터 설정이 적용되었습니다. 다음 대화부터 새 설정이 반영됩니다.`,
				timestamp: new Date().toLocaleTimeString()
			}
		];
	}

	// ====== Lifecycle ======
	let statusUpdateInterval;
	
	onMount(() => {
		statusUpdateInterval = setInterval(() => {
			apiActivityStatus = realtime.getActivityStatus();
		}, 1000);

		refreshSessionList();
		
		return () => {
			clearInterval(statusUpdateInterval);
			cleanup();
			realtime.stopSession();
		};
	});

	$: displayConversationHistory = selectedSessionKey === 'live'
		? liveConversationHistory
		: toSessionMessages(selectedSession);

	$: displayProcessing = selectedSessionKey === 'live' ? isProcessing : false;
	$: displayAssistantMessage = selectedSessionKey === 'live' ? assistantMessage : '';
</script>

<div class="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-6">
	<div class="max-w-2xl mx-auto">
		<!-- Header -->
		<div class="text-center mb-8">
			<h1 class="text-4xl font-bold text-gray-800 mb-2">🎤 AI 대화 연습</h1>
			<p class="text-gray-600">한글/영어 자유롭게 대화하세요 - OpenAI 음성 AI</p>
		</div>
		
		<!-- Prompt Settings -->
		<PromptSettings 
			settings={promptSettings}
			onApply={handlePromptApply}
		/>

		<!-- Recording Panel - Control Buttons (먼저 표시) -->
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

		<!-- Conversation Panel - Chat History (아래에 표시) -->
		<div class="bg-white rounded-lg shadow-lg p-6 mb-6">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-lg font-semibold text-gray-800">🗂️ 대화 세션 기록</h2>
				<div class="flex items-center gap-2">
					<select
						bind:value={sessionFilter}
						class="px-2 py-1.5 text-sm rounded-md border border-gray-200 bg-white"
						on:change={refreshSessionList}
					>
						<option value="7d">최근 7일</option>
						<option value="30d">최근 30일</option>
						<option value="all">전체</option>
						<option value="custom">기간 지정</option>
					</select>
					{#if sessionFilter === 'custom'}
						<input
							type="date"
							bind:value={customFrom}
							class="px-2 py-1.5 text-sm rounded-md border border-gray-200"
							on:change={refreshSessionList}
						/>
						<input
							type="date"
							bind:value={customTo}
							class="px-2 py-1.5 text-sm rounded-md border border-gray-200"
							on:change={refreshSessionList}
						/>
					{/if}
					<button
						on:click={refreshSessionList}
						disabled={isHistoryLoading}
						class={`px-3 py-1.5 text-sm rounded-md border transition ${
							isHistoryLoading
								? 'bg-gray-100 text-gray-400 cursor-not-allowed'
								: 'bg-white text-gray-700 hover:bg-gray-50'
						}`}
					>
						새로고침
					</button>
				</div>
			</div>

			{#if historyError}
				<p class="text-sm text-red-500 mb-3">{historyError}</p>
			{/if}

			{#if selectedSession && selectedSessionKey !== 'live'}
				<div class="mb-4 p-3 border rounded-md bg-gray-50">
					<div class="flex flex-col gap-2">
						<label for="session-title-input" class="text-xs text-gray-500">세션 제목 편집</label>
						<div class="flex gap-2 items-center">
							<input
								id="session-title-input"
								class="flex-1 px-3 py-2 text-sm rounded-md border border-gray-200"
								bind:value={sessionEditTitle}
							/>
							<button
								on:click={updateSessionTitle}
								disabled={isSessionUpdating}
								class={`px-3 py-2 text-sm rounded-md border ${
									isSessionUpdating
										? 'bg-gray-200 text-gray-400 cursor-not-allowed'
										: 'bg-white text-gray-700 hover:bg-gray-100'
								}`}
							>
								저장
							</button>
							<button
								on:click={deleteSession}
								disabled={isSessionUpdating}
								class={`px-3 py-2 text-sm rounded-md border ${
									isSessionUpdating
										? 'bg-gray-200 text-gray-400 cursor-not-allowed'
										: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
								}`}
							>
								삭제
							</button>
						</div>
						<p class="text-xs text-gray-400">해당 세션의 모든 대화 기록이 변경/삭제됩니다.</p>
						
						<!-- AI 설정 표시 -->
						{#if selectedSession.promptSettings}
							<div class="mt-3 pt-3 border-t border-gray-200">
								<p class="text-xs font-semibold text-gray-600 mb-2">⚙️ 사용된 AI 설정</p>
								<div class="grid grid-cols-2 gap-2 text-xs">
									<div>
										<span class="text-gray-500">역할:</span>
										<span class="text-gray-700 ml-1">{selectedSession.promptSettings.role || '-'}</span>
									</div>
									<div>
										<span class="text-gray-500">응답길이:</span>
										<span class="text-gray-700 ml-1">{selectedSession.promptSettings.responseLength || '-'}</span>
									</div>
									<div class="col-span-2">
										<span class="text-gray-500">성격/톤:</span>
										<span class="text-gray-700 ml-1">{selectedSession.promptSettings.personality || '-'}</span>
									</div>
									<div class="col-span-2">
										<span class="text-gray-500">교정스타일:</span>
										<span class="text-gray-700 ml-1">{selectedSession.promptSettings.correctionStyle || '-'}</span>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<div class="space-y-2 max-h-56 overflow-y-auto">
				<button
					on:click={() => selectSession('live')}
					class={`w-full text-left px-3 py-2 rounded-md border transition ${
						selectedSessionKey === 'live'
							? 'border-blue-500 bg-blue-50'
							: 'border-gray-200 hover:bg-gray-50'
					}`}
				>
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-semibold text-gray-800">현재 세션</p>
							<p class="text-xs text-gray-500">
								{currentSessionStartedAt ? formatSessionLabel(currentSessionStartedAt) : '진행 전'}
							</p>
						</div>
						<span class="text-xs text-blue-600">LIVE</span>
					</div>
				</button>

				{#if isHistoryLoading}
					<div class="text-sm text-gray-400 px-3 py-2">불러오는 중...</div>
				{:else if conversationSessions.length === 0}
					<div class="text-sm text-gray-400 px-3 py-2">저장된 대화가 없습니다.</div>
				{:else}
					{#each conversationSessions as session}
						<button
							on:click={() => selectSession(session.key)}
							class={`w-full text-left px-3 py-2 rounded-md border transition ${
								selectedSessionKey === session.key
									? 'border-indigo-500 bg-indigo-50'
									: 'border-gray-200 hover:bg-gray-50'
							}`}
						>
							<div class="flex items-center justify-between">
								<div>
									<p class="text-sm font-semibold text-gray-800">{session.title}</p>
									<p class="text-xs text-gray-500">{session.turns}턴 · 마지막 {formatSessionLabel(new Date(session.lastAt))}</p>
								</div>
								<span class="text-xs text-gray-500">{session.label}</span>
							</div>
						</button>
					{/each}
				{/if}
			</div>
		</div>

		<ConversationPanel
			conversationHistory={displayConversationHistory}
			isProcessing={displayProcessing}
			assistantMessage={displayAssistantMessage}
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
<!-- DebugConsole bind:open={showDebug} height={260} / -->

<style>	
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>
