<!-- src/lib/components/PromptSettings.svelte -->
<script>
	import { promptPresets } from '$lib/prompts/englishConversationTutor.js';
	import { supabaseClient } from '$lib/supabaseClient.js';
	
	export let settings = {
		role: "친절하고 도움이 되는 다국어 대화 도우미",
		personality: "따뜻하고, 격려하며, 친근함",
		responseLength: "2-3 문장",
		topics: "일상 대화, 취미, 여행, 직장, 음식, 건강, 목표",
		correctionStyle: "대화 중 자연스럽게 부드럽게 교정",
		difficulty: "사용자 수준에 맞춰 점진적으로 난이도 조절"
	};
	export let onApply = () => {};
	
	let isExpanded = false;
	let selectedPreset = 'custom';
	let userPresets = [];
	let isLoadingPresets = false;
	let isSavingPreset = false;
	let showSaveDialog = false;
	let newPresetName = '';
	let saveAsDefault = false;
	let saveError = '';
	
	// 사용자 프리셋 로드
	async function loadUserPresets() {
		isLoadingPresets = true;
		try {
			const { data: session } = await supabaseClient.auth.getSession();
			if (!session?.session?.access_token) return;
			
			const response = await fetch('/api/prompt-presets', {
				headers: {
					'Authorization': `Bearer ${session.session.access_token}`
				}
			});
			
			if (response.ok) {
				const result = await response.json();
				userPresets = result.data || [];
				
				// 기본 프리셋이 있으면 자동 적용
				const defaultPreset = userPresets.find(p => p.is_default);
				if (defaultPreset && !isExpanded) {
					settings = { ...defaultPreset.prompt_settings };
					onApply(settings);
				}
			}
		} catch (err) {
			console.error('Failed to load presets:', err);
		} finally {
			isLoadingPresets = false;
		}
	}
	
	// 프리셋 저장
	async function savePreset() {
		if (!newPresetName.trim()) {
			saveError = '프리셋 이름을 입력하세요.';
			return;
		}
		
		isSavingPreset = true;
		saveError = '';
		
		try {
			const { data: session } = await supabaseClient.auth.getSession();
			if (!session?.session?.access_token) {
				saveError = '로그인이 필요합니다.';
				return;
			}
			
			const response = await fetch('/api/prompt-presets', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${session.session.access_token}`
				},
				body: JSON.stringify({
					preset_name: newPresetName.trim(),
					prompt_settings: settings,
					is_default: saveAsDefault
				})
			});
			
			if (!response.ok) {
				const errorData = await response.json();
				saveError = errorData.message || '저장에 실패했습니다.';
				return;
			}
			
			// 성공 시 목록 새로고침 및 다이얼로그 닫기
			await loadUserPresets();
			showSaveDialog = false;
			newPresetName = '';
			saveAsDefault = false;
		} catch (err) {
			console.error('Failed to save preset:', err);
			saveError = '저장 중 오류가 발생했습니다.';
		} finally {
			isSavingPreset = false;
		}
	}
	
	// 사용자 프리셋 불러오기
	function loadUserPreset(preset) {
		settings = { ...preset.prompt_settings };
		selectedPreset = 'user-' + preset.id;
	}
	
	// 사용자 프리셋 삭제
	async function deleteUserPreset(presetId) {
		if (!confirm('이 프리셋을 삭제하시겠습니까?')) return;
		
		try {
			const { data: session } = await supabaseClient.auth.getSession();
			if (!session?.session?.access_token) return;
			
			const response = await fetch(`/api/prompt-presets?id=${presetId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${session.session.access_token}`
				}
			});
			
			if (response.ok) {
				await loadUserPresets();
			}
		} catch (err) {
			console.error('Failed to delete preset:', err);
		}
	}
	
	// 프리셋 선택 시
	function applyPreset(presetName) {
		if (presetName === 'custom') {
			selectedPreset = 'custom';
			return;
		}
		
		selectedPreset = presetName;
		settings = { ...promptPresets[presetName] };
	}
	
	// 설정 적용
	function handleApply() {
		onApply(settings);
		isExpanded = false;
	}
	
	// 설정이 변경되면 커스텀으로 전환
	function handleSettingChange() {
		if (!selectedPreset.startsWith('user-')) {
			selectedPreset = 'custom';
		}
	}
	
	// 프리셋 한글 이름
	const presetNames = {
		beginner: '초급 학습자',
		intermediate: '중급 학습자',
		advanced: '고급 학습자',
		business: '비즈니스 영어',
		casual: '일상 대화',
		custom: '커스텀'
	};
	
	// 컴포넌트 마운트 시 프리셋 로드
	import { onMount } from 'svelte';
	onMount(() => {
		loadUserPresets();
	});
</script>

<div class="bg-white rounded-lg shadow-lg p-4 mb-4">
	<!-- Header -->
	<div class="flex items-center justify-between mb-2">
		<h3 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
			⚙️ AI 튜터 설정
		</h3>
		<button
			on:click={() => (isExpanded = !isExpanded)}
			class="text-sm text-blue-600 hover:text-blue-700 font-medium"
		>
			{isExpanded ? '접기 ▲' : '설정 열기 ▼'}
		</button>
	</div>
	
	{#if isExpanded}
		<!-- 저장된 나의 프리셋 -->
		{#if userPresets.length > 0}
			<div class="mb-4 border-t pt-4">
				<label class="block text-sm font-medium text-gray-700 mb-2">
					💾 저장된 나의 프리셋
				</label>
				<div class="space-y-2 max-h-32 overflow-y-auto">
					{#each userPresets as preset}
						<div class="flex items-center gap-2 p-2 rounded-lg border bg-gray-50 hover:bg-gray-100">
							<button
								on:click={() => loadUserPreset(preset)}
								class="flex-1 text-left text-sm"
							>
								<span class="font-medium">{preset.preset_name}</span>
								{#if preset.is_default}
									<span class="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">기본</span>
								{/if}
							</button>
							<button
								on:click={() => deleteUserPreset(preset.id)}
								class="text-red-500 hover:text-red-700 text-xs px-2"
								title="삭제"
							>
								🗑️
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}
		
		<!-- 프리셋 선택 -->
		<div class="mb-4 border-t pt-4">
			<label class="block text-sm font-medium text-gray-700 mb-2">
				📚 기본 프리셋 선택
			</label>
			<div class="grid grid-cols-3 gap-2">
				{#each Object.keys(presetNames) as presetKey}
					<button
						on:click={() => applyPreset(presetKey)}
						class={`px-3 py-2 text-sm rounded-lg border transition-colors ${
							selectedPreset === presetKey
								? 'bg-blue-500 text-white border-blue-600'
								: 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
						}`}
					>
						{presetNames[presetKey]}
					</button>
				{/each}
			</div>
		</div>
		
		<!-- 커스터마이징 옵션 -->
		<div class="space-y-4 border-t pt-4">
			<!-- AI 역할 -->
			<div>
				<label for="role" class="block text-sm font-medium text-gray-700 mb-1">
					🎭 AI 역할
				</label>
				<input
					id="role"
					type="text"
					bind:value={settings.role}
					on:input={handleSettingChange}
					placeholder="예: 친절한 영어 선생님"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>
			
			<!-- 성격/톤 -->
			<div>
				<label for="personality" class="block text-sm font-medium text-gray-700 mb-1">
					😊 성격/톤
				</label>
				<select
					id="personality"
					bind:value={settings.personality}
					on:change={handleSettingChange}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					<option value="에너지 넘치고 과장된 표현으로 재미있게 가르치며, 즉흥적이고 창의적인 유머로 학습 동기를 부여하는 짐캐리 스타일 선생님">짐캐리 유형</option>
					<option value="따뜻하고 격려하며 친근한, 학생의 실수를 인내심 있게 받아들이는 친절한 선생님">친근한 선생님</option>
					<option value="정확성을 중시하고 엄격하며, 명확한 피드백을 주는 엄격한 선생님">엄격한 선생님</option>
					<option value="전문적이고 효율적이며, 실용적이고 목표 지향적인 비즈니스 전문가">비즈니스 전문가</option>
					<option value="편안하고 유머러스하며, 격식 없이 자연스럽게 대화하는 캐주얼한 친구">캐주얼한 친구</option>
				</select>
			</div>
			
			<!-- 응답 길이 -->
			<div>
				<label for="responseLength" class="block text-sm font-medium text-gray-700 mb-1">
					📏 응답 길이
				</label>
				<select
					id="responseLength"
					bind:value={settings.responseLength}
					on:change={handleSettingChange}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					<option value="1-2 짧은 문장">짧게 (1-2 문장)</option>
					<option value="2-3 문장">보통 (2-3 문장)</option>
					<option value="3-4 문장">길게 (3-4 문장)</option>
				</select>
			</div>
			
			<!-- 대화 주제 -->
			<div>
				<label for="topics" class="block text-sm font-medium text-gray-700 mb-1">
					💬 대화 주제
				</label>
				<textarea
					id="topics"
					bind:value={settings.topics}
					on:input={handleSettingChange}
					rows="2"
					placeholder="예: 일상 대화, 취미, 여행"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				></textarea>
			</div>
			
			<!-- 교정 스타일 -->
			<div>
				<label for="correctionStyle" class="block text-sm font-medium text-gray-700 mb-1">
					✏️ 교정 스타일
				</label>
				<select
					id="correctionStyle"
					bind:value={settings.correctionStyle}
					on:change={handleSettingChange}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					<option value="교정 안 함, 격려만">교정 안 함 (격려만)</option>
					<option value="교정은 최소화하고 격려 위주">최소 교정</option>
					<option value="대화 중 자연스럽게 부드럽게 교정">부드러운 교정</option>
					<option value="정확한 교정과 더 세련된 표현 제안">적극적 교정</option>
				</select>
			</div>
			
			<!-- 난이도 -->
			<div>
				<label for="difficulty" class="block text-sm font-medium text-gray-700 mb-1">
					📊 난이도
				</label>
				<input
					id="difficulty"
					type="text"
					bind:value={settings.difficulty}
					on:input={handleSettingChange}
					placeholder="예: 초급 - 간단한 어휘 사용"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>
		</div>
		
		<!-- 적용 및 저장 버튼 -->
		<div class="mt-4 pt-4 border-t flex gap-2">
			<button
				on:click={handleApply}
				class="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
			>
				✅ 설정 적용
			</button>
			<button
				on:click={() => (showSaveDialog = true)}
				class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium"
			>
				💾 저장
			</button>
			<button
				on:click={() => (isExpanded = false)}
				class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
			>
				취소
			</button>
		</div>
	{/if}
</div>

<!-- 프리셋 저장 다이얼로그 -->
{#if showSaveDialog}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" on:click={() => (showSaveDialog = false)}>
		<div class="bg-white rounded-lg p-6 max-w-md w-full mx-4" on:click|stopPropagation>
			<h3 class="text-lg font-semibold text-gray-800 mb-4">💾 프리셋 저장</h3>
			
			<div class="space-y-4">
				<div>
					<label for="preset-name" class="block text-sm font-medium text-gray-700 mb-1">
						프리셋 이름
					</label>
					<input
						id="preset-name"
						type="text"
						bind:value={newPresetName}
						placeholder="예: 나의 초급 설정"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>
				
				<div class="flex items-center gap-2">
					<input
						id="set-default"
						type="checkbox"
						bind:checked={saveAsDefault}
						class="w-4 h-4 text-blue-600 rounded"
					/>
					<label for="set-default" class="text-sm text-gray-700">
						기본 프리셋으로 설정 (대화 시작 시 자동 적용)
					</label>
				</div>
				
				{#if saveError}
					<p class="text-sm text-red-500">{saveError}</p>
				{/if}
				
				<div class="flex gap-2">
					<button
						on:click={savePreset}
						disabled={isSavingPreset}
						class={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
							isSavingPreset
								? 'bg-gray-300 text-gray-500 cursor-not-allowed'
								: 'bg-blue-500 text-white hover:bg-blue-600'
						}`}
					>
						{isSavingPreset ? '저장 중...' : '저장'}
					</button>
					<button
						on:click={() => { showSaveDialog = false; saveError = ''; newPresetName = ''; saveAsDefault = false; }}
						class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
					>
						취소
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* 커스텀 스타일이 필요한 경우 여기에 추가 */
</style>
