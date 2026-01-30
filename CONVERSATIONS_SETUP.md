# 회화 기록 저장 설정 가이드

## 📋 테이블 구조

### `conversations` 테이블
사용자별 영어 회화 기록을 저장하는 테이블입니다.

| 칼럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid | 기록의 고유 ID (자동 생성) |
| `user_id` | uuid | 사용자 ID (auth.users와 연동) |
| `title` | text | 대화 제목 (선택사항) |
| `user_message` | text | 사용자가 말한 음성 텍스트 |
| `assistant_message` | text | AI가 응답한 메시지 |
| `duration` | integer | 대화 시간 (초 단위, 기본값: 0) |
| `created_at` | timestamptz | 기록 생성 시간 |

## 🚀 설정 방법

### 1단계: SQL 실행

1. **Supabase 대시보드 접속**
   - https://app.supabase.com

2. **SQL Editor 열기**
   - SQL Editor 메뉴 클릭

3. **쿼리 실행**
   - `sql/create_conversations_table.sql` 파일 내용 복사
   - SQL Editor에 붙여넣기
   - **Run** 클릭

### 예상 결과

```
CREATE TABLE
CREATE INDEX (2개)
ALTER TABLE
CREATE POLICY (3개)
GRANT
```

위와 같이 모두 성공 메시지가 나와야 합니다.

## 💡 테이블 특징

### 보안 (RLS - Row Level Security)
- ✅ 사용자는 **자신의 기록만** 조회 가능
- ✅ 사용자는 **자신의 기록만** 생성 가능
- ✅ 사용자는 **자신의 기록만** 삭제 가능

### 성능
- ✅ `user_id` 인덱스: 사용자별 조회 빠르게
- ✅ `created_at` 인덱스: 시간순 정렬 빠르게

### 관계
- ✅ `user_id` → `auth.users(id)` 외래키 연동
- ✅ 사용자 삭제 시 자동으로 관련 기록도 삭제

## 🔍 테스트 (선택사항)

SQL Editor에서 테스트 쿼리 실행:

```sql
-- 테이블 확인
SELECT * FROM public.conversations LIMIT 10;

-- 사용자별 기록 개수 확인
SELECT user_id, COUNT(*) as record_count 
FROM public.conversations 
GROUP BY user_id;
```

## 📝 다음 단계

테이블이 생성되면, 다음 작업이 필요합니다:

1. **Frontend**: 회화 저장 API 엔드포인트 구현
2. **Frontend**: 회화 조회 API 엔드포인트 구현
3. **Components**: 저장된 대화 목록 표시 페이지 추가

**별도 요청이 있을 때 구현하겠습니다.**

## ✅ 완료 확인

테이블이 정상 생성되었으면:

```sql
-- Supabase > Table Editor에서 "conversations" 테이블이 보입니다
-- Supabase > Authentication > Policies에서 3개의 RLS 정책이 보입니다
```
