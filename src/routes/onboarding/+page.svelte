<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabaseClient } from '$lib/supabaseClient.js';
	
	let name = '';
	let phone = '';
	let privacyPolicyAgreed = false;
	let termsOfServiceAgreed = false;
	let showPrivacyPolicy = false;
	let showTermsOfService = false;
	let privacyPolicyContent = '';
	let privacyPolicyVersion = '';
	let termsOfServiceContent = '';
	let termsOfServiceVersion = '';
	let isSubmitting = false;
	let error = '';
	
	$: allAgreed = privacyPolicyAgreed && termsOfServiceAgreed;
	$: canSubmit = allAgreed && name.trim() && phone.trim() && !isSubmitting;
	
	// 전화번호 포맷팅
	function formatPhone(value) {
		const numbers = value.replace(/[^\d]/g, '');
		if (numbers.length <= 3) return numbers;
		if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
		return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
	}
	
	function handlePhoneInput(e) {
		phone = formatPhone(e.target.value);
	}

	const fallbackPrivacyPolicy = {
		version: 'v1.0',
		content: `수집하는 개인정보 항목\n- 필수: 이메일, 이름, 전화번호\n- 자동 수집: 서비스 이용 기록, 접속 로그\n\n개인정보의 수집 및 이용 목적\n- 서비스 제공 및 계약 이행\n- 회원 관리 및 본인 확인\n- 서비스 개선 및 맞춤형 서비스 제공\n\n보유 및 이용 기간\n- 회원 탈퇴 시까지 (단, 관계 법령에 따라 일정 기간 보관)`
	};

	const fallbackTermsOfService = {
		version: 'v1.0',
		content: `서비스 이용 규칙\n- 본 서비스는 AI 영어 회화 학습을 위한 플랫폼입니다\n- 회원은 관계 법령 및 이 약관을 준수해야 합니다\n- 타인의 정보 도용 및 부정 사용을 금지합니다\n\n서비스 제공\n- AI 음성 대화 기능 제공\n- 대화 기록 저장 및 관리\n- 개인 맞춤형 학습 설정\n\n회원의 의무\n- 정확한 정보 제공\n- 계정 정보 보안 유지\n- 서비스의 부적절한 사용 금지`
	};
	
	async function handleSubmit() {
		if (!canSubmit) return;
		
		isSubmitting = true;
		error = '';
		
		try {
			const { data: session } = await supabaseClient.auth.getSession();
			if (!session?.session?.access_token) {
				error = '로그인 세션이 만료되었습니다. 다시 로그인해주세요.';
				return;
			}
			
			const response = await fetch('/api/user-consent', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${session.session.access_token}`
				},
				body: JSON.stringify({
					name: name.trim(),
					phone: phone.trim(),
					privacy_policy: privacyPolicyAgreed,
					terms_of_service: termsOfServiceAgreed
				})
			});
			
			const result = await response.json();
			
			if (!response.ok) {
				error = result.message || '저장에 실패했습니다.';
				return;
			}
			
			// 성공 시 메인 페이지로 이동
			goto('/practice');
		} catch (err) {
			console.error('Submit error:', err);
			error = '오류가 발생했습니다. 다시 시도해주세요.';
		} finally {
			isSubmitting = false;
		}
	}
	
	onMount(async () => {
		// 이미 동의 완료된 사용자인지 확인
		const { data: session } = await supabaseClient.auth.getSession();
		if (session?.session?.access_token) {
			try {
				const response = await fetch('/api/user-consent', {
					headers: {
						'Authorization': `Bearer ${session.session.access_token}`
					}
				});
				
				if (response.ok) {
					const result = await response.json();
					if (result.data?.profile_completed) {
						// 이미 완료된 경우 메인으로 리다이렉트
						goto('/practice');
					}
				}
			} catch (err) {
				console.error('Check consent error:', err);
			}
		}

		try {
			const response = await fetch('/api/policies');
			if (response.ok) {
				const result = await response.json();
				const privacy = result?.data?.privacy_policy || fallbackPrivacyPolicy;
				const terms = result?.data?.terms_of_service || fallbackTermsOfService;
				privacyPolicyContent = privacy.content || fallbackPrivacyPolicy.content;
				privacyPolicyVersion = privacy.version || fallbackPrivacyPolicy.version;
				termsOfServiceContent = terms.content || fallbackTermsOfService.content;
				termsOfServiceVersion = terms.version || fallbackTermsOfService.version;
			} else {
				privacyPolicyContent = fallbackPrivacyPolicy.content;
				privacyPolicyVersion = fallbackPrivacyPolicy.version;
				termsOfServiceContent = fallbackTermsOfService.content;
				termsOfServiceVersion = fallbackTermsOfService.version;
			}
		} catch (err) {
			console.error('Policies load error:', err);
			privacyPolicyContent = fallbackPrivacyPolicy.content;
			privacyPolicyVersion = fallbackPrivacyPolicy.version;
			termsOfServiceContent = fallbackTermsOfService.content;
			termsOfServiceVersion = fallbackTermsOfService.version;
		}
	});
</script>

<div class="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
	<div class="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-gray-800 mb-2">🎉 회원가입 완료!</h1>
			<p class="text-gray-600">서비스 이용을 위해 추가 정보를 입력해주세요</p>
		</div>
		
		<form on:submit|preventDefault={handleSubmit} class="space-y-6">
			<!-- 이름 입력 -->
			<div>
				<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
					이름 <span class="text-red-500">*</span>
				</label>
				<input
					id="name"
					type="text"
					bind:value={name}
					placeholder="홍길동"
					required
					class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>
			
			<!-- 전화번호 입력 -->
			<div>
				<label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
					전화번호 <span class="text-red-500">*</span>
				</label>
				<input
					id="phone"
					type="tel"
					value={phone}
					on:input={handlePhoneInput}
					placeholder="010-1234-5678"
					required
					maxlength="13"
					class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>
			
			<!-- 약관 동의 -->
			<div class="space-y-4 border-t pt-6">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">서비스 이용 약관 동의</h3>
				
				<!-- 개인정보 처리방침 -->
				<div class="border border-gray-200 rounded-lg p-4">
					<div class="flex items-start gap-3 mb-3">
						<input
							id="privacy"
							type="checkbox"
							bind:checked={privacyPolicyAgreed}
							class="w-5 h-5 text-blue-600 rounded mt-1"
						/>
						<label for="privacy" class="flex-1">
							<span class="font-medium text-gray-800">개인정보 처리방침 동의 <span class="text-red-500">*</span></span>
							<span class="ml-2 text-xs text-gray-500">({privacyPolicyVersion || 'v1.0'})</span>
						</label>
						<button
							type="button"
							on:click={() => (showPrivacyPolicy = !showPrivacyPolicy)}
							class="text-sm text-blue-600 hover:underline whitespace-nowrap"
						>
							{showPrivacyPolicy ? '닫기' : '보기'}
						</button>
					</div>
					{#if showPrivacyPolicy}
						<div class="ml-8 text-sm text-gray-600 bg-gray-50 p-3 rounded max-h-48 overflow-y-auto whitespace-pre-line">
							{privacyPolicyContent}
						</div>
					{/if}
				</div>
				
				<!-- 서비스 이용약관 -->
				<div class="border border-gray-200 rounded-lg p-4">
					<div class="flex items-start gap-3 mb-3">
						<input
							id="terms"
							type="checkbox"
							bind:checked={termsOfServiceAgreed}
							class="w-5 h-5 text-blue-600 rounded mt-1"
						/>
						<label for="terms" class="flex-1">
							<span class="font-medium text-gray-800">서비스 이용약관 동의 <span class="text-red-500">*</span></span>
							<span class="ml-2 text-xs text-gray-500">({termsOfServiceVersion || 'v1.0'})</span>
						</label>
						<button
							type="button"
							on:click={() => (showTermsOfService = !showTermsOfService)}
							class="text-sm text-blue-600 hover:underline whitespace-nowrap"
						>
							{showTermsOfService ? '닫기' : '보기'}
						</button>
					</div>
					{#if showTermsOfService}
						<div class="ml-8 text-sm text-gray-600 bg-gray-50 p-3 rounded max-h-48 overflow-y-auto whitespace-pre-line">
							{termsOfServiceContent}
						</div>
					{/if}
				</div>
			</div>
			
			{#if error}
				<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
					{error}
				</div>
			{/if}
			
			<!-- 제출 버튼 -->
			<button
				type="submit"
				disabled={!canSubmit}
				class={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
					canSubmit
						? 'bg-blue-500 text-white hover:bg-blue-600'
						: 'bg-gray-300 text-gray-500 cursor-not-allowed'
				}`}
			>
				{isSubmitting ? '처리 중...' : '동의하고 시작하기'}
			</button>
			
			<p class="text-sm text-gray-500 text-center">
				필수 항목에 모두 동의하셔야 서비스를 이용하실 수 있습니다.
			</p>
		</form>
	</div>
</div>
