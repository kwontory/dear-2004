# dear-2004 Progress

이 파일은 세션 간 작업 상태를 전달하기 위한 문서다.

Claude Code는 새 세션 시작 시 이 파일을 읽고
완료된 기능을 다시 구현하지 않는다.


## Current Phase

Core editor 구현 (화면비·사진 조절 UI 완료 → 문구 렌더링부터)


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
- [x] 이미지 업로드 + 파일 검증 (`src/upload/`, `src/components/PhotoUpload.tsx`), App에 `useReducer(editorReducer)` 연결
- [x] Canvas renderer 1차 (`src/render/`): 배경, 사진 cover 배치 + offset/scale/rotation, 사진 효과 4종, 날짜 스탬프
- [x] CardPreview: export와 같은 픽셀 크기로 그리고 CSS로만 축소 (preview == export 픽셀 동일 확인)
- [x] 화면비 선택 UI, 사진 조절(확대·좌우·위아래·회전·초기화), 사진 효과 선택, 날짜 스탬프 켜기 + 날짜 입력
- [x] 디자인 시안 (Claude Design canvas): (비공개 디자인 캔버스)


## In Progress

- 없음 (다음은 `Next`의 4번부터)


## Next

순서대로 진행한다.

1. ~~프로젝트 초기화~~ (완료)
2. ~~기본 페이지 레이아웃 구성~~ (뼈대 완료, 실제 컨트롤은 기능별로 추가)
3. ~~EditorState 타입 정의~~ (완료, reducer·검증 포함)
4. ~~이미지 업로드 구현~~ (완료)
5. ~~PNG/JPEG 파일 검증 구현~~ (완료)
6. ~~Canvas renderer 구현~~ (1차 완료: 사진·효과·스탬프. 글자·틀별 레이아웃은 9·10단계에서 추가)
7. ~~1:1 / 4:5 / 9:16 화면비 구현~~ (완료)
8. ~~이미지 위치/크기 조절 구현~~ (완료, 슬라이더. 미리보기 드래그는 미구현)
9. 텍스트 입력 구현
10. 레트로 미니홈피 테마 구현
11. 스티커 구현 — 원본 에셋·렌더러 완료, 추가/선택/드래그 UI 남음
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


### 13. Renderer 구조

```text
EditorState ─ computeLayout(ratio, frame) ─┐
            └ useLoadedPhoto(source) ──────┴→ renderCard(ctx, state, photo) → Canvas
                                                  ├ CardPreview (CSS 축소만)
                                                  └ Export (다음 단계, 같은 함수)
```

- 모든 좌표는 export 픽셀 기준 (1080 × 1080/1350/1920). Preview 캔버스도 같은 크기
- 사진: cover 맞춤 × `transform.scale`, 중심 = 영역 중심 + offset × 영역 절반 (`computePhotoPlacement`)
- 효과: `ctx.filter` 미사용 (Safari 차이). 픽셀 직접 계산 + 1/8 축소-확대로 blur
  - soft: 채도 0.92, ×0.88 +30, 흐린 사본 screen 0.45, 흰 안개 0.06
  - faded: 채도 0.6, R×0.84+38 G×0.8+38 B×0.72+41
  - mono: 회색조 ×0.9 +18
- 날짜 스탬프: `text.date`를 `formatStampText`로 해석 ("2004.10.27", "2004-7-21", "2004년 10월 27일" 등).
  해석 불가면 그리지 않는다. 숫자 높이 = 카드 너비 × 2.4%, 번짐은 shadowBlur 3겹
- 틀별 레이아웃은 아직 없음: 모든 frame이 memo(감성 사진) 배치 — 사진 높이 비율 1:1 0.589 / 4:5 0.62 / 9:16 0.6


### 12. 업로드 정책

`src/upload/` 참고. 순서: 신고된 MIME → 용량 → 매직 바이트 → 헤더 해상도 → 실제 디코드 → 축소·재인코딩.

- 허용: PNG, JPEG만. 신고 MIME이 비어 있으면 매직 바이트로 판단, 신고와 실제가 달라도 실제가 PNG/JPEG면 실제 형식 사용
- 용량 ≤ 10MB, 가로·세로 ≤ 8192px, 픽셀 수 ≤ 40MP — **디코딩 전에 헤더(PNG IHDR / JPEG SOF)에서 확인**해 브라우저 멈춤 방지
- 디코드: `createImageBitmap` 실패 시 거부 (깨진 파일, 헤더만 있는 가짜)
- 저장: 긴 변 2048px로 축소. PNG는 PNG(투명도 유지), JPEG는 JPEG 0.9
- 실패 시 기존 사진·편집 상태 유지, `role="alert"` 문구에 "※ 앗!" 텍스트 포함 (색만으로 전달하지 않음)
- 에러 문구에 파일 이름 등 사용자 입력을 넣지 않는다


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
- 스티커 (v7, 확정): **사용자 "스티커 참고용" 시안 이미지의 원본을 그대로 잘라 쓴다.** 새로 그리지 않는다.
  - 원본 webp(투명 배경)를 알파 기준 연결요소로 분리 → 32종 PNG (`public/stickers/<id>.png`, 약 0.9MB)
  - `src/editor/stickerAssets.ts` = manifest(id, 한글 이름, 원본 크기). `sticker.kind` = 에셋 id. 색(tint) 개념 없음
  - 렌더: 원본 이미지를 `imageSmoothingEnabled=false`로 확대·회전 (도트 유지). `useStickerImages`가 카드에 쓰인 종류만 로드
  - 시안 `Sticker.dc.html`도 같은 PNG를 에셋으로 올려 사용
  - 추가/선택/드래그 UI는 아직 미구현
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

- **스티커 이미지 출처·라이선스 확인 필요**: `public/stickers/`는 사용자가 제공한 참고 이미지에서 잘라낸 것이다.
  공개 배포 전에 원 저작자·이용 조건을 확인해야 한다.
- 업로드 이미지를 data URL로 저장하므로 localStorage 용량(약 5MB)을 넘을 수 있다.
  업로드 단계에서 최대 변 길이로 축소·재인코딩하고, 템플릿 저장은 IndexedDB 사용을 검토한다.
- Galmuri 웹폰트를 Canvas export에 쓰려면 `document.fonts.load` 완료 후 렌더링해야 한다. 픽셀 폰트는 export 배율(프리뷰 540 → 1080)에서 정수배 크기를 유지해야 선명하다.


## Test Status

```text
build: PASS
automated tests: PASS (107 tests — EditorState / reducer / text / upload / render / slider 변환)
browser controls flow: PASS (18 시나리오) — 사진 전 비활성, 화면비 3종 캔버스 크기, TC-18 15회 반복 후 동일,
  키보드 슬라이더, 초기화 복원, 효과 4종 서로 다름, 스탬프 켜기/끄기, 이상한 날짜 안내, 콘솔 에러 없음
browser render check: PASS — preview 캔버스와 별도 export 캔버스 픽셀 diff 0,
  효과 4종 / 스탬프 / 3 화면비 스크린샷 육안 확인, 낮은 화면·모바일에서 미리보기 비율 유지
browser upload flow: PASS (headless Chromium, production build, 13 시나리오)
  TC-01 PNG, TC-02 JPEG(2048 축소), TC-03 PDF(기존 사진 유지), TC-04 GIF, SVG, TC-05 가짜 확장자,
  TC-06 초대형 해상도(디코딩 전 거부), 깨진 PNG, TC-07 1x1, TC-08 초가로형, TC-09 초세로형,
  TC-10 투명 PNG(PNG 유지), 콘솔 에러 없음
manual core flow: 미리보기·다운로드 미구현으로 NOT RUN
```

브라우저 테스트는 저장소 밖 임시 스크립트(playwright-core + 캐시된 chromium-headless-shell)로 실행했다.
dependency를 늘리지 않기 위해 아직 저장소에 넣지 않았다. E2E를 저장소에 둘지는 renderer 이후 결정한다.


## Last Session Summary (2026-09-26)

### Completed this session

- 프로젝트 초기화, 앱 레이아웃 뼈대
- EditorState 모델 / 검증 / reducer + 단위 테스트
- 디자인 시안 canvas 작성

### Next action

- 문구 입력 UI + 렌더링: Galmuri 폰트 self-host(`galmuri` npm, OFL), 줄바꿈·overflow 정책(TC-11~16)
- 그다음: PNG/JPEG 다운로드 (같은 renderCard 사용)

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


