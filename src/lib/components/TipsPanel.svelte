<script>
	export let tips = [
		'• 한글이나 영어로 자유롭게 말하세요',
		'• AI가 같은 언어로 답변합니다',
		'• 명확하고 자연스럽게 말하세요',
		'• 완벽한 문법보다 소통에 집중하세요'
	];
</script>

<div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
	<h3 class="font-semibold text-yellow-800 mb-2">💡 대화 팁</h3>
	<ul class="text-sm text-yellow-700 space-y-1">
		{#each tips as tip}
			<li>{tip}</li>
		{/each}
	</ul>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>
