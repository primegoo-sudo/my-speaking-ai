<!-- src/lib/components/PromptSettings.svelte -->
<script>
	import { promptPresets } from '$lib/prompts/englishConversationTutor.js';
	
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
		selectedPreset = 'custom';
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
		<!-- 프리셋 선택 -->
		<div class="mb-4 border-t pt-4">
			<label class="block text-sm font-medium text-gray-700 mb-2">
				📚 프리셋 선택
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
		
		<!-- 적용 버튼 -->
		<div class="mt-4 pt-4 border-t flex gap-2">
			<button
				on:click={handleApply}
				class="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
			>
				✅ 설정 적용
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

<style>
	/* 커스텀 스타일이 필요한 경우 여기에 추가 */
</style>
