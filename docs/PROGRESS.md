# dear-2004 Progress

이 파일은 세션 간 작업 상태를 전달하기 위한 문서다.

Claude Code는 새 세션 시작 시 이 파일을 읽고
완료된 기능을 다시 구현하지 않는다.


## Current Phase

Core editor 구현 (EditorState 완료 → 이미지 업로드부터)


## Completed

- [x] 프로젝트 컨셉 결정
- [x] 프로젝트명 결정: 그땐 그랬지...
- [x] Repository 이름 결정: dear-2004
- [x] 핵심 요구사항 정리
- [x] 세션 지속을 위한 문서 구조 정의
- [x] 프로젝트 초기화 (Vite + React + TypeScript, Vitest, oxlint)
- [x] 기본 페이지 레이아웃 뼈대 (header / 편집 도구 / 미리보기, 좁은 화면 세로 배치)
- [x] EditorState 타입·기본값·상수 정의 (`src/editor/`)
- [x] EditorState 검증 (`validateEditorState`, `parseEditorStateJson`) — JSON import / 템플릿 로드에서 재사용
- [x] `editorReducer` — 모든 상태 변경 경로, clamp 로직 공유
- [x] EditorState 확장: 사진 효과, 날짜 스탬프, 편집 가능한 댓글, 특수문자 삽입 헬퍼
- [x] 디자인 시안 (Claude Design canvas): (비공개 디자인 캔버스)


## In Progress

- 없음 (다음은 `Next`의 4번부터)


## Next

순서대로 진행한다.

1. ~~프로젝트 초기화~~ (완료)
2. ~~기본 페이지 레이아웃 구성~~ (뼈대 완료, 실제 컨트롤은 기능별로 추가)
3. ~~EditorState 타입 정의~~ (완료, reducer·검증 포함)
4. 이미지 업로드 구현 — `useReducer(editorReducer)`를 App에 연결하면서 시작
5. PNG/JPEG 파일 검증 구현
6. Canvas renderer 구현
7. 1:1 / 4:5 / 9:16 화면비 구현
8. 이미지 위치/크기 조절 구현
9. 텍스트 입력 구현
10. 레트로 미니홈피 테마 구현
11. ~~스티커 구현~~ (보류: 사용자 요청으로 제외)
12. PNG/JPEG 다운로드 구현
13. 사용자 템플릿 CRUD 구현
14. browser persistence 구현
15. JSON export/import 구현
16. TEST_CASES 실행
17. 반응형 및 접근성 정리
18. production build
19. 공개 배포


## Important Technical Decisions

### 1. Preview and Export

Preview와 Export는 동일한 renderer를 사용한다.

별도의 렌더링 구현을 만들지 않는다.


### 2. Editor State

편집 상태는 하나의 명확한 EditorState 모델을 중심으로 관리한다.


### 3. Persistence

초기 버전은 서버 데이터베이스를 사용하지 않는다.

사용자 템플릿은 browser storage에 저장한다.


### 4. Upload

초기 버전 이미지 업로드 형식은 PNG와 JPEG로 제한한다.


### 5. AI

LLM 또는 AI 기능은 핵심 요구사항이 아니다.

기본 기능이 모두 완료되기 전에는 추가하지 않는다.


### 6. Design

실제 싸이월드 UI를 복제하지 않는다.

2000년대 미니홈피 문화의 시각적 특성을
독립적으로 재해석한다.


### 7. Tech Stack

- Vite 8 + React 19 + TypeScript 6
- 테스트: Vitest (`npm test`), lint: oxlint (`npm run lint`)
- 새 dependency는 꼭 필요할 때만 추가한다.


### 8. EditorState 좌표계 (해상도 독립)

`src/editor/types.ts` 참고.

- `photo.transform.scale`: cover 맞춤 대비 배율 (1 = 사진 영역을 꽉 채움), 0.1 ~ 5
- `photo.transform.offsetX/Y`: 사진 영역 크기 대비 이동 비율, -1 ~ 1
- `sticker.x/y`: 카드 크기 대비 중심 좌표 0 ~ 1, `size`: 카드 너비 대비 비율
- Export 해상도: 1:1 = 1080×1080, 4:5 = 1080×1350, 9:16 = 1080×1920 (`CANVAS_SIZES`)
- renderer는 이 값을 캔버스 픽셀로 변환한다. Preview는 같은 캔버스를 축소 표시만 한다.

화면비를 바꿔도 좌표 변환이 필요 없으므로 상태가 깨지지 않는다 (TC-18).


### 9. 사진 저장 방식

업로드 이미지는 `photo.source.dataUrl` (PNG/JPEG data URL)로 EditorState에 포함한다.
템플릿과 JSON이 자기완결적이 된다.
검증은 `data:image/png;base64,` / `data:image/jpeg;base64,` 접두사와 base64 본문만 허용한다 (SVG·원격 URL 거부).


### 10. Import 검증 정책

- 타입 오류, 필드 누락, NaN/Infinity, 알 수 없는 enum, 미지원 schemaVersion → 거부
- 문자열·배열이 상한 초과 → 거부
- 유한 숫자의 범위 초과 → reducer와 같은 clamp 함수로 보정
- 알 수 없는 추가 필드 → 제거


### 11. Design (v2 — 그시절 감성 리디자인)

디자인 시안: (비공개 디자인 캔버스)

v1(파스텔 스크랩북)은 "촌스럽기만 하고 그시절 감성이 없다"는 피드백으로 폐기.
v2는 실제 2000년대 문법을 따른다. 단, 싸이월드 로고·명칭·화면 배치는 복제하지 않는다.

- 폰트: **Galmuri** (픽셀 한글, OFL-1.1, npm `galmuri`) — 굴림 12px 비트맵 느낌.
  Galmuri11은 12px 배수, Galmuri9은 10px 배수에서 선명하다. self-host 가능 → Canvas export에도 사용.
- 편집기 화면 제목 표기: **그땐 그랬지,,** (사용자가 시안에서 직접 수정. 상단 부제 문구는 삭제)
  → 브라우저 탭 제목(`index.html`)과 앱 상단(`App.tsx`)에 반영 완료
- 편집기: **잿빛 하늘색(#c3ced6) 단색 배경** 위의 **바인더 노트** (회색-파랑 도트 테두리, 스프링 고리, 흰 좌/우 페이지),
  오른쪽 **인덱스 탭**(사진 / 문구 / 꾸미기 / 템플릿)으로 왼쪽 페이지 내용 전환, 오른쪽 페이지는 미리보기+저장.
- 옛날 웹 컨트롤: 회색 입체 버튼, 1px 입력칸, 점선 구분선, "■ 제목" 섹션 헤더, 밑줄 텍스트 링크.
- 색: 제목 파랑 #2a6db0, 탭 #2f7fa8, 카운터 주황 #c75000, 하트 핑크 #d43a70, 본문 #4a4a4a, 보조 #767676.
- 카드 틀(FRAME_IDS 매핑):
  - `memo` → **감성 사진**: 뽀샤시 사진 + 흰 여백 + 작은 회색 픽셀 문구 + 디카 날짜 스탬프 (1:1 시안)
  - `minihome` → **미니홈피**: 바인더, 왼쪽 프로필 칸(TODAY is.. 기분·소개글·닉네임), BGM 박스, 인덱스 탭 (4:5 시안)
  - `album` → **사진첩 게시물**: [사진첩] 제목, 날짜·시각, 퍼가기/댓글 줄 (9:16 시안)
  - `diary` → 다이어리 (시안 미작성)
- 스티커: **보류 (2026-09-26, 사용자 요청으로 시안에서 제거)**. v1~v5 시안이 모두 반려됨
  (파스텔 도트 → 키치 블링 → 빛바랜 GIF → 반짝이·꽃·특수문자 픽셀). 다시 요청이 있을 때까지 UI·렌더링을 만들지 않는다.
  EditorState의 `stickers` 필드와 검증·reducer는 그대로 두되 기본값은 빈 배열이다.
- 특수문자 감성: 카드 문구에 `˚ ｡ · * ･ﾟ ｡ﾟ`를 섞는다. Galmuri11 지원 여부를 확인함
  (지원: ˚ ° · * ｡ ･ ﾟ ♡ ♥ ★ ☆ ♬ ♪ … ㆀ ⊙ ▶ 『 』 ─ ※ / 미지원: ✽ ❀ ✿ ∘ ✦ ✧ ⁺ ₊ ⋆).
  미지원 기호는 특수문자 버튼에 넣지 않는다.
- 날짜 스탬프 (시안 `DateStamp.dc.html`, 사용자 참고자료: 필름카메라 날짜 각인):
  - 형식 `YY M DD` (예: 2004.10.27 → `04 10 27`, 2004.7.21 → `04  7 21`), 그룹마다 2칸, 한 자리는 앞 칸 비움
  - 7세그먼트 숫자 직접 그리기: 칸 10×18, 획 두께 2.2, 세그먼트 간격 0.5, 숫자 간격 13, 그룹 간격 +8, skewX(-4°)
  - 색·번짐 3겹: #ff2e00 blur 2.4 (opacity .85) → #ff5a1c blur .8 → #ff8a3d blur .25
  - 위치: 사진 영역 오른쪽 아래. 크기: 숫자 높이 ≈ 사진 영역 긴 변의 약 3% (시안 540px 카드 기준 약 13px, 4:5 미니홈피 틀은 약 9px)
- 문구 예시 톤: "...", "ㄷㅏ" 자모 분리, "^^", "~♡", "★닉네임★"

**확정된 추가 기능 (사용자 승인, 2026-09-26)**
- 사진 효과: 원본 / 뽀샤시 / 빛바램 / 흑백 → `photo.effect` (기본값 `soft`) — 상태·검증 완료, 렌더링 미구현
- 디카 날짜 스탬프 on/off → `photo.showDateStamp` (날짜는 `text.date` 사용) — 상태·검증 완료, 렌더링 미구현
- 특수문자 넣기 버튼 → `SPECIAL_CHARACTERS`, `insertText()` — 헬퍼 완료, UI 미구현
- 댓글 줄: **편집 가능** → `comments[]` (최대 5개, 닉네임 20자, 내용 60자) — 상태·검증 완료, UI·렌더링 미구현


## Known Issues

- 업로드 이미지를 data URL로 저장하므로 localStorage 용량(약 5MB)을 넘을 수 있다.
  업로드 단계에서 최대 변 길이로 축소·재인코딩하고, 템플릿 저장은 IndexedDB 사용을 검토한다.
- Galmuri 웹폰트를 Canvas export에 쓰려면 `document.fonts.load` 완료 후 렌더링해야 한다. 픽셀 폰트는 export 배율(프리뷰 540 → 1080)에서 정수배 크기를 유지해야 선명하다.


## Test Status

```text
build: PASS
automated tests: PASS (55 tests — EditorState 검증 / reducer / text)
manual core flow: NOT RUN (UI 기능 미구현)
edge cases: 모델 단위만 PASS (TC-12, 14~18, 24~27 해당 부분)
```


## Last Session Summary (2026-09-26)

### Completed this session

- 프로젝트 초기화, 앱 레이아웃 뼈대
- EditorState 모델 / 검증 / reducer + 단위 테스트
- 디자인 시안 canvas 작성

### Next action

- App에 `useReducer(editorReducer, createDefaultEditorState())` 연결
- 이미지 업로드 + 파일 검증 (MIME, 크기, decode, 최대 해상도 축소)

### Verification

```text
build: PASS
tests: PASS (55)
manual: 빌드 결과 서빙 확인 (title 렌더)
```


## Session Handoff Template

세션 종료 시 아래 내용을 업데이트한다.

### Completed this session

-


### Current work

-


### Next action

-


### Decisions made

-


### Known issues

-


### Verification

```text
build:
tests:
manual:
```


