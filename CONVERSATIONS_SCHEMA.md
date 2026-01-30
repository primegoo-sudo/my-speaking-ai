# 회화 기록 데이터베이스 구조

## 🏗️ 전체 구조

```
┌─────────────────────────┐
│    auth.users (Auth)    │
│  (Supabase 관리)         │
├─────────────────────────┤
│ id (UUID)               │
│ email                   │
│ password (암호화)        │
└────────────┬────────────┘
             │
             │ (참조)
             ▼
┌─────────────────────────┐
│   public.users (프로필)  │
├─────────────────────────┤
│ id (UUID) ◄─── 외래키   │
│ email                   │
│ name                    │
│ created_at              │
│ updated_at              │
│ metadata                │
└────────────┬────────────┘
             │
             │ (1:N 관계)
             ▼
┌─────────────────────────┐
│ public.conversations    │
│  (회화 기록) NEW!        │
├─────────────────────────┤
│ id (UUID)               │
│ user_id (UUID) ◄─ 외래키│
│ user_message (text)     │
│ assistant_message (text)│
│ created_at              │
└─────────────────────────┘
```

## 📊 데이터 흐름

```
1. 사용자 로그인
   └─► auth.uid() = 사용자 ID

2. AI와 대화
   └─► user_message + assistant_message 기록
       + title (대화 제목) 설정
       + duration (대화 시간) 기록

3. 기록 저장
   ┌────────────────────────────────┐
   │ INSERT INTO conversations      │
   │ (user_id, title, user_message, │
   │  assistant_message, duration,  │
   │  created_at)                   │
   └────────────────────────────────┘
         │
         ▼
   ┌─────────────────────────┐
   │  conversations 테이블에   │
   │  새로운 행 추가         │
   └─────────────────────────┘

4. 기록 조회 (RLS 정책 적용)
   ┌────────────────────────────────┐
   │ SELECT * FROM conversations    │
   │ WHERE user_id = auth.uid()     │
   │ ORDER BY created_at DESC       │
   └────────────────────────────────┘
         │
         ▼
   ┌─────────────────────────┐
   │  자신의 기록만 표시     │
   │  (다른 사용자 데이터    │
   │   는 안 보임)           │
   └─────────────────────────┘
```

## 🔐 Row Level Security (RLS)

### 정책 1: SELECT (조회)
```sql
WHERE auth.uid() = user_id
→ 자신의 기록만 볼 수 있음
```

### 정책 2: INSERT (생성)
```sql
WITH CHECK (auth.uid() = user_id)
→ 자신의 기록만 만들 수 있음
```

### 정책 3: DELETE (삭제)
```sql
WHERE auth.uid() = user_id
→ 자신의 기록만 삭제 가능
```

## 📈 쿼리 예시

### 자신의 최근 대화 10개 조회
```sql
SELECT * FROM public.conversations
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;
```

### 새 대화 저장 (모든 정보 포함)
```sql
INSERT INTO public.conversations 
(user_id, title, user_message, assistant_message, duration)
VALUES (auth.uid(), '아침 인사', '안녕하세요?', 'Hello! How are you?', 35);
```

### 새 대화 저장 (제목 없이)
```sql
INSERT INTO public.conversations 
(user_id, user_message, assistant_message, duration)
VALUES (auth.uid(), '안녕하세요?', 'Hello! How are you?', 35);
```

### 특정 기간의 대화 조회
```sql
SELECT * FROM public.conversations
WHERE user_id = auth.uid() 
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### 5분 이상의 긴 대화만 조회
```sql
SELECT * FROM public.conversations
WHERE user_id = auth.uid() 
  AND duration >= 300  -- 300초 = 5분
ORDER BY created_at DESC;
```

### 특정 기록 삭제
```sql
DELETE FROM public.conversations
WHERE id = 'record-id' AND user_id = auth.uid();
```

## 📋 칼럼 상세

### id (UUID)
- **타입**: UUID (128-bit)
- **생성**: 자동 생성 (gen_random_uuid())
- **용도**: 각 기록의 고유 식별자

### user_id (UUID)
- **타입**: UUID
- **참조**: auth.users(id)
- **제약**: NOT NULL, 외래키
- **삭제**: CASCADE (사용자 삭제 시 기록도 삭제)

### title (TEXT)
- **타입**: TEXT (무제한 길이)
- **요구사항**: 선택사항 (NULL 가능)
- **내용**: 대화의 제목
- **예시**: "Morning greeting", "How to order coffee"

### user_message (TEXT)
- **타입**: TEXT (무제한 길이)
- **내용**: 사용자가 말한 음성을 텍스트로 변환한 내용
- **예시**: "Hello, how are you?"

### assistant_message (TEXT)
- **타입**: TEXT
- **내용**: AI가 응답한 메시지
- **예시**: "I'm doing well, thank you for asking!"

### duration (INTEGER)
- **타입**: INTEGER (정수)
- **기본값**: 0 (초 단위)
- **내용**: 대화가 진행된 시간
- **예시**: 45 (45초)

### created_at (TIMESTAMPTZ)
- **타입**: TIMESTAMPTZ (타임존 포함 타임스탐프)
- **기본값**: now() (생성 시간 자동 기록)
- **용도**: 기록의 시간순 정렬

## 🎯 간단한 구현

### 최소 필요 정보
- ✅ user_id: 누가 말했는지
- ✅ user_message: 뭐라고 말했는지
- ✅ assistant_message: AI가 뭐라고 응답했는지
- ✅ created_at: 언제 말했는지

### 확장 가능성
나중에 필요하면 추가할 수 있는 칼럼:
- language (언어: "en", "ko")
- rating (사용자 만족도: 1-5)
- tags (태그: ["greeting", "question"])
- duration (회화 길이: 초 단위)

현재는 **간단한 구현**만 하고, 필요에 따라 확장하세요!
