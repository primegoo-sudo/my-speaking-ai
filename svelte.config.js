import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		// 환경 변수 설정 (server-only)
		env: {
			privatePrefix: 'OPENAI_',
			publicPrefix: 'PUBLIC_'
		}
	}
};

export default config;
