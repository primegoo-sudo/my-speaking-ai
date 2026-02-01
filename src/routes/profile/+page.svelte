<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authReady, isAuthenticated } from '$lib/stores/auth.js';
	import { supabaseClient } from '$lib/supabaseClient.js';

	let loading = true;
	let error = '';
	let userInfo = null;
	let editName = '';
	let editPhone = '';
	let isEditing = false;
	let isSaving = false;
	let usage = null;
	let consent = null;
	let recentConversations = [];
	let policyDetailType = null;
	let privacyPolicyContent = '';
	let termsOfServiceContent = '';

	const formatDateTime = (value) => {
		if (!value) return '-';
		const date = new Date(value);
		return date.toLocaleString('ko-KR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const truncate = (text, max = 80) => {
		if (!text) return '-';
		return text.length > max ? `${text.slice(0, max)}…` : text;
	};

	const formatSeconds = (seconds) => {
		const total = Number(seconds || 0);
		const mins = Math.floor(total / 60);
		const secs = total % 60;
		return `${mins}분 ${secs}초`;
	};

	const formatUsd = (value) => {
		const num = Number(value || 0);
		return `$${num.toFixed(4)}`;
	};

	const formatPhone = (value) => {
		const numbers = (value || '').replace(/[^\d]/g, '');
		if (numbers.length <= 3) return numbers;
		if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
		return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
	};

	const startEdit = () => {
		editName = userInfo?.name || '';
		editPhone = userInfo?.phone || '';
		isEditing = true;
	};

	const cancelEdit = () => {
		isEditing = false;
		error = '';
	};

	const saveProfile = async () => {
		if (!editName.trim() || !editPhone.trim()) {
			error = '이름과 전화번호를 입력해주세요.';
			return;
		}

		isSaving = true;
		error = '';
		try {
			const { data } = await supabaseClient.auth.getSession();
			const token = data?.session?.access_token;
			if (!token) {
				goto('/login', { replaceState: true });
				return;
			}

			const response = await fetch('/api/user-profile', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					name: editName.trim(),
					phone: editPhone.trim()
				})
			});

			const result = await response.json();
			if (!response.ok) {
				throw new Error(result?.error || '프로필 저장에 실패했습니다.');
			}

			userInfo = { ...userInfo, name: result.data?.name || editName.trim(), phone: result.data?.phone || editPhone.trim() };
			isEditing = false;
		} catch (err) {
			error = err?.message || '오류가 발생했습니다.';
		} finally {
			isSaving = false;
		}
	};

	const fallbackPrivacyPolicy =
		'수집하는 개인정보 항목\n- 필수: 이메일, 이름, 전화번호\n- 자동 수집: 서비스 이용 기록, 접속 로그\n\n개인정보의 수집 및 이용 목적\n- 서비스 제공 및 계약 이행\n- 회원 관리 및 본인 확인\n- 서비스 개선 및 맞춤형 서비스 제공\n\n보유 및 이용 기간\n- 회원 탈퇴 시까지 (단, 관계 법령에 따라 일정 기간 보관)';

	const fallbackTermsOfService =
		'서비스 이용 규칙\n- 본 서비스는 AI 영어 회화 학습을 위한 플랫폼입니다\n- 회원은 관계 법령 및 이 약관을 준수해야 합니다\n- 타인의 정보 도용 및 부정 사용을 금지합니다\n\n서비스 제공\n- AI 음성 대화 기능 제공\n- 대화 기록 저장 및 관리\n- 개인 맞춤형 학습 설정\n\n회원의 의무\n- 정확한 정보 제공\n- 계정 정보 보안 유지\n- 서비스의 부적절한 사용 금지';

	onMount(async () => {
		// authReady를 기다림
		if (!$authReady) {
			const unsubscribe = authReady.subscribe((ready) => {
				if (ready && !$isAuthenticated) {
					goto('/login', { replaceState: true });
				}
			});
			setTimeout(() => unsubscribe(), 3000);
		} else if (!$isAuthenticated) {
			goto('/login', { replaceState: true });
			return;
		}

		try {
			const { data, error: sessionError } = await supabaseClient.auth.getSession();
			if (sessionError) {
				console.error('Session error:', sessionError);
				throw new Error('세션을 확인할 수 없습니다.');
			}

			const token = data?.session?.access_token;
			if (!token) {
				console.warn('No access token found');
				goto('/login', { replaceState: true });
				return;
			}

			console.log('Fetching user summary...');
			const response = await fetch('/api/user-summary', {
				headers: { Authorization: `Bearer ${token}` }
			});

			console.log('User summary response status:', response.status);

			if (response.status === 401) {
				console.warn('Unauthorized access to user summary');
				goto('/login', { replaceState: true });
				return;
			}

			const result = await response.json();
			console.log('User summary result:', result);

			if (!response.ok) {
				console.error('User summary error:', result);
				throw new Error(result?.error || '사용자 정보를 불러오지 못했습니다.');
			}

			userInfo = result.data?.user || null;
			editName = userInfo?.name || '';
			editPhone = userInfo?.phone || '';
			usage = result.data?.usage || null;
			consent = result.data?.consent || null;
			recentConversations = result.data?.recent_conversations || [];

			console.log('User info loaded:', { userInfo, usage, consent });

			try {
				const policiesResponse = await fetch('/api/policies');
				if (policiesResponse.ok) {
					const policiesResult = await policiesResponse.json();
					privacyPolicyContent =
						policiesResult?.data?.privacy_policy?.content || fallbackPrivacyPolicy;
					termsOfServiceContent =
						policiesResult?.data?.terms_of_service?.content || fallbackTermsOfService;
				} else {
					privacyPolicyContent = fallbackPrivacyPolicy;
					termsOfServiceContent = fallbackTermsOfService;
				}
			} catch (policyErr) {
				console.error('Policies load error:', policyErr);
				privacyPolicyContent = fallbackPrivacyPolicy;
				termsOfServiceContent = fallbackTermsOfService;
			}
		} catch (err) {
			console.error('Profile page error:', err);
			error = err?.message || '오류가 발생했습니다.';
		} finally {
			loading = false;
		}
	});
</script>

<div class="min-h-screen bg-gray-50 p-6">
	<div class="max-w-5xl mx-auto space-y-6">
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold text-gray-800">사용자 정보 & 사용내역</h1>
			<button
				class="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
				on:click={() => goto('/practice')}
			>
				대화로 돌아가기
			</button>
		</div>

		{#if loading}
			<div class="bg-white rounded-lg shadow p-6 text-gray-600">불러오는 중...</div>
		{:else if error}
			<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
		{:else}
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div class="lg:col-span-2 space-y-6">
					<div class="bg-white rounded-lg shadow p-6">
						<h2 class="text-lg font-semibold text-gray-800 mb-4">기본 정보</h2>
						<div class="flex items-center justify-between mb-4">
							<p class="text-sm text-gray-500">프로필 정보를 확인하고 수정할 수 있습니다.</p>
							{#if !isEditing}
								<button
									class="text-sm text-blue-600 hover:underline"
									on:click={startEdit}
								>
									수정하기
								</button>
							{/if}
						</div>

						{#if isEditing}
							<div class="space-y-4 text-sm">
								<div>
									<p class="text-gray-500">이메일</p>
									<p class="font-medium text-gray-800">{userInfo?.email || '-'}</p>
								</div>
								<div>
									<label class="block text-gray-500 mb-1" for="profile-name">이름</label>
									<input
										id="profile-name"
										class="w-full px-3 py-2 border border-gray-300 rounded-md"
										type="text"
										bind:value={editName}
									/>
								</div>
								<div>
									<label class="block text-gray-500 mb-1" for="profile-phone">전화번호</label>
									<input
										id="profile-phone"
										class="w-full px-3 py-2 border border-gray-300 rounded-md"
										type="tel"
										value={editPhone}
										on:input={(e) => (editPhone = formatPhone(e.target.value))}
										maxlength="13"
									/>
								</div>
								<div class="flex items-center gap-3">
									<button
										class="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
										on:click={saveProfile}
										disabled={isSaving}
									>
										{isSaving ? '저장 중...' : '저장'}
									</button>
									<button
										class="px-4 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
										on:click={cancelEdit}
									>
										취소
									</button>
								</div>
							</div>
						{:else}
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
								<div>
									<p class="text-gray-500">이메일</p>
									<p class="font-medium text-gray-800">{userInfo?.email || '-'}</p>
								</div>
								<div>
									<p class="text-gray-500">이름</p>
									<p class="font-medium text-gray-800">{userInfo?.name || '-'}</p>
								</div>
								<div>
									<p class="text-gray-500">전화번호</p>
									<p class="font-medium text-gray-800">{userInfo?.phone || '-'}</p>
								</div>
								<div>
									<p class="text-gray-500">프로필 완료</p>
									<p class="font-medium text-gray-800">{userInfo?.profile_completed ? '완료' : '미완료'}</p>
								</div>
							</div>
						{/if}
					</div>

					<div class="bg-white rounded-lg shadow p-6">
						<h2 class="text-lg font-semibold text-gray-800 mb-4">최근 사용내역</h2>
						{#if recentConversations.length === 0}
							<p class="text-sm text-gray-500">아직 저장된 대화가 없습니다.</p>
						{:else}
							<div class="overflow-x-auto">
								<table class="min-w-full text-sm">
									<thead class="text-left text-gray-500 border-b">
										<tr>
											<th class="py-2 pr-3">시간</th>
											<th class="py-2 pr-3">제목</th>
											<th class="py-2 pr-3">사용시간</th>
											<th class="py-2 pr-3">토큰</th>
											<th class="py-2 pr-3">예상비용</th>
											<th class="py-2 pr-3">요약</th>
										</tr>
									</thead>
									<tbody>
										{#each recentConversations as row}
											<tr class="border-b last:border-b-0">
												<td class="py-2 pr-3 text-gray-500">{formatDateTime(row.created_at)}</td>
												<td class="py-2 pr-3 font-medium text-gray-800">{row.title || '대화 기록'}</td>
												<td class="py-2 pr-3">{formatSeconds(row.duration || row.audio_input_seconds)}</td>
												<td class="py-2 pr-3">{row.total_tokens ?? 0}</td>
												<td class="py-2 pr-3">{formatUsd(row.estimated_cost_usd)}</td>
												<td class="py-2 pr-3 text-gray-600">
													<div>나: {truncate(row.user_message)}</div>
													<div>AI: {truncate(row.assistant_message)}</div>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}
					</div>
				</div>

				<div class="space-y-6">
					<div class="bg-white rounded-lg shadow p-6">
						<h2 class="text-lg font-semibold text-gray-800 mb-4">사용 통계</h2>
						<div class="space-y-3 text-sm">
							<div class="flex items-center justify-between">
								<span class="text-gray-500">총 대화 수</span>
								<span class="font-semibold text-gray-800">{usage?.total_conversations ?? 0}회</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-gray-500">최근 대화</span>
								<span class="font-semibold text-gray-800">{formatDateTime(usage?.last_conversation_at)}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-gray-500">총 녹음 시간</span>
								<span class="font-semibold text-gray-800">{formatSeconds(usage?.total_audio_input_seconds)}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-gray-500">총 토큰</span>
								<span class="font-semibold text-gray-800">{usage?.total_tokens ?? 0} 토큰</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-gray-500">예상 비용 합계</span>
								<span class="font-semibold text-gray-800">{formatUsd(usage?.total_cost_usd)}</span>
							</div>
							<p class="text-xs text-gray-400">* 비용은 서버 환경변수 기준으로 계산된 예상값입니다.</p>
						</div>
					</div>

					<div class="bg-white rounded-lg shadow p-6">
						<h2 class="text-lg font-semibold text-gray-800 mb-4">약관 동의 내역</h2>
						<div class="space-y-3 text-sm">
							<div class="flex items-center justify-between">
								<span class="text-gray-500">개인정보 처리방침</span>
								<div class="flex items-center gap-2">
									<span class="font-semibold text-gray-800">{consent?.privacy_policy_version || '-'}</span>
									<button
										class="text-xs text-blue-600 hover:underline"
										on:click={() => (policyDetailType = 'privacy')}
									>
										보기
									</button>
								</div>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-gray-500">서비스 이용약관</span>
								<div class="flex items-center gap-2">
									<span class="font-semibold text-gray-800">{consent?.terms_of_service_version || '-'}</span>
									<button
										class="text-xs text-blue-600 hover:underline"
										on:click={() => (policyDetailType = 'terms')}
									>
										보기
									</button>
								</div>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-gray-500">동의 일시</span>
								<span class="font-semibold text-gray-800">{formatDateTime(consent?.consented_at)}</span>
							</div>
						</div>

						{#if policyDetailType}
							<div class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-line">
								<div class="flex items-center justify-between mb-2">
									<span class="font-semibold text-gray-800">
										{policyDetailType === 'privacy' ? '개인정보 처리방침' : '서비스 이용약관'}
									</span>
									<button
										class="text-xs text-gray-500 hover:text-gray-700"
										on:click={() => (policyDetailType = null)}
									>
										닫기
									</button>
								</div>
								{#if policyDetailType === 'privacy'}
									{privacyPolicyContent}
								{:else}
									{termsOfServiceContent}
								{/if}
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
