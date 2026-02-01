import { OpenAI } from 'openai';
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { englishConversationPrompt, buildConversationPrompt } from '$lib/prompts/englishConversationTutor.js';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

// 대화 히스토리를 메모리에 저장 (프로덕션에서는 DB 사용)
const conversationStore = new Map();

/**
 * POST /api/realtime
 * 
 * Accepts audio, transcribes it, gets AI response, and returns JSON
 * 
 * Request:
 * - Form data with 'audio' field
 * - Optional 'sessionId' to maintain conversation context
 * - Optional 'promptOptions' for customizing the AI behavior
 * 
 * Response:
 * - JSON with transcription, AI response text, and audio URL
 */
export async function POST({ request }) {
  try {
    // 1️⃣ Validate API key
    if (!env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return error(500, 'Server misconfiguration: OPENAI_API_KEY is missing');
    }

    // 2️⃣ Extract audio file and session ID
    const form = await request.formData();
    const audioFile = form.get('audio');
    const sessionId = form.get('sessionId') || `session-${Date.now()}`;
    const sessionTitle = form.get('sessionTitle');
    const duration = Number(form.get('duration') || 0);
    
    // 프롬프트 옵션 추출
    const promptOptionsStr = form.get('promptOptions');
    let promptOptions = null;
    if (promptOptionsStr) {
      try {
        promptOptions = JSON.parse(promptOptionsStr);
      } catch (err) {
        console.warn('Failed to parse promptOptions:', err);
      }
    }

    if (!audioFile || !(audioFile instanceof File)) {
      return error(400, { message: 'No audio file provided' });
    }

    console.log(`[${sessionId}] Received audio: ${audioFile.name}, ${audioFile.size} bytes`);

    // 3️⃣ Transcribe audio using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en'
    });

    const userText = transcription.text;
    console.log(`[${sessionId}] Transcription: "${userText}"`);

    // 4️⃣ Get or create conversation history
    if (!conversationStore.has(sessionId)) {
      // 프롬프트 옵션이 있으면 커스텀 프롬프트 생성, 없으면 기본 프롬프트 사용
      const systemPrompt = promptOptions 
        ? buildConversationPrompt(promptOptions)
        : englishConversationPrompt;
        
      conversationStore.set(sessionId, [
        { role: 'system', content: systemPrompt }
      ]);
    }
    const messages = conversationStore.get(sessionId);
    messages.push({ role: 'user', content: userText });

    // 5️⃣ Get AI response using Chat Completions
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.8,
      max_tokens: 150
    });

    const assistantText = completion.choices[0].message.content;
    messages.push({ role: 'assistant', content: assistantText });

    const promptTokens = Number(completion?.usage?.prompt_tokens || 0);
    const completionTokens = Number(completion?.usage?.completion_tokens || 0);
    const totalTokens = Number(completion?.usage?.total_tokens || 0);

    const transcriptionChars = userText?.length || 0;
    const ttsChars = assistantText?.length || 0;

    // OpenAI 공식 요금 (2024년 기준, 환경변수로 덮어쓰기 가능)
    const whisperUsdPerMin = Number(env.OPENAI_WHISPER_USD_PER_MIN || 0.006); // $0.006/min
    const ttsUsdPer1kChars = Number(env.OPENAI_TTS_USD_PER_1K_CHARS || 0.015); // $0.015/1K chars
    const gptInputUsdPer1k = Number(env.OPENAI_GPT4O_MINI_INPUT_USD_PER_1K || 0.00015); // $0.15/1M tokens
    const gptOutputUsdPer1k = Number(env.OPENAI_GPT4O_MINI_OUTPUT_USD_PER_1K || 0.0006); // $0.60/1M tokens

    const audioInputSeconds = Number.isFinite(duration) ? duration : 0;
    const whisperCost = (audioInputSeconds / 60) * whisperUsdPerMin;
    const gptCost = (promptTokens / 1000) * gptInputUsdPer1k + (completionTokens / 1000) * gptOutputUsdPer1k;
    const ttsCost = (ttsChars / 1000) * ttsUsdPer1kChars;
    const estimatedCostUsd = Number((whisperCost + gptCost + ttsCost).toFixed(6));
    
    // Keep history manageable (last 20 messages)
    if (messages.length > 21) {
      conversationStore.set(sessionId, [
        messages[0], // keep system prompt
        ...messages.slice(-20)
      ]);
    }

    console.log(`[${sessionId}] Assistant: "${assistantText}"`);

    // 6️⃣ Generate speech from response
    const speechResponse = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: assistantText,
      response_format: 'mp3'
    });

    const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
    const audioBase64 = audioBuffer.toString('base64');

    // 7️⃣ Save conversation to DB (if authenticated)
    try {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

      const supabaseUrl = env.SUPABASE_DB_URL || publicEnv.PUBLIC_SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_DB_URL;
      const supabaseKey = env.SUPABASE_DB_PUBLIC_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_DB_PUBLIC_KEY;

      if (token && supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          global: { headers: { Authorization: `Bearer ${token}` } }
        });

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (!userError && userData?.user?.id) {
          // 기본 필드
          const insertPayload = {
            user_id: userData.user.id,
            title: sessionTitle || null,
            user_message: userText,
            assistant_message: assistantText,
            duration: Number.isFinite(duration) ? duration : 0,
            prompt_settings: promptOptions || null
          };

          // 사용량 추적 필드 (새 컬럼이 있을 경우에만 추가)
          try {
            insertPayload.audio_input_seconds = audioInputSeconds;
            insertPayload.audio_output_seconds = 0;
            insertPayload.transcription_chars = transcriptionChars;
            insertPayload.tts_chars = ttsChars;
            insertPayload.prompt_tokens = promptTokens;
            insertPayload.completion_tokens = completionTokens;
            insertPayload.total_tokens = totalTokens;
            insertPayload.estimated_cost_usd = estimatedCostUsd;
          } catch (err) {
            console.warn('[POST /api/realtime] Usage fields not added to payload:', err);
          }

          const { error: insertError } = await supabase
            .from('conversations')
            .insert([insertPayload]);

          if (insertError) {
            console.warn('[POST /api/realtime] Failed to save conversation:', insertError.message);
            // 새 컬럼 오류일 경우 기본 필드만으로 재시도
            if (insertError.message?.includes('column') || insertError.code === '42703') {
              const basicPayload = {
                user_id: userData.user.id,
                title: sessionTitle || null,
                user_message: userText,
                assistant_message: assistantText,
                duration: Number.isFinite(duration) ? duration : 0
              };
              const { error: retryError } = await supabase
                .from('conversations')
                .insert([basicPayload]);
              if (retryError) {
                console.error('[POST /api/realtime] Retry failed:', retryError.message);
              }
            }
          }
        }
      }
    } catch (saveError) {
      console.warn('[POST /api/realtime] Save error:', saveError?.message || saveError);
    }

    // 8️⃣ Return JSON response
    return json({
      sessionId,
      userText,
      assistantText,
      audioData: audioBase64,
      audioFormat: 'mp3'
    });

  } catch (err) {
    console.error('API error:', err);

    const status = err.status || err.statusCode || 500;
    const message = err?.error?.message || err?.message || 'Unknown error';
    
    if (status === 401) {
      return error(401, 'Unauthorized: Check OPENAI_API_KEY');
    }
    if (status === 429) {
      return error(429, 'Rate limit exceeded');
    }
    if (status >= 500) {
      return error(503, `OpenAI error: ${message}`);
    }
    return error(500, `Server error: ${message}`);
  }
}

/**
 * DELETE /api/realtime
 * Clear conversation history for a session
 */
export async function DELETE({ url }) {
  const sessionId = url.searchParams.get('sessionId');
  
  if (!sessionId) {
    return error(400, { message: 'sessionId parameter required' });
  }

  if (conversationStore.has(sessionId)) {
    conversationStore.delete(sessionId);
    console.log(`[${sessionId}] Session cleared`);
  }

  return json({ success: true, message: 'Session cleared' });
}

/**
 * OPTIONS /api/realtime
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
