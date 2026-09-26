# dear-2004

프로젝트명: **그땐 그랬지...**

2000년대 초반 한국 미니홈피 감성에서 영감을 받은  
레트로 이미지·카드 제작 웹앱.

## Source of Truth

프로젝트 상태는 대화가 아니라 다음을 기준으로 한다.

1. 코드
2. `CLAUDE.md`
3. `docs/REQUIREMENTS.md`
4. `docs/PROGRESS.md`
5. `docs/TEST_CASES.md`
6. Git history

새 세션에서 이전 대화를 알고 있다고 가정하지 않는다.

## Session Start

작업 전 반드시 다음을 확인한다.

1. `CLAUDE.md` 읽기
2. `docs/REQUIREMENTS.md` 읽기
3. `docs/PROGRESS.md` 읽기
4. `git status` 확인
5. 최근 `git log` 확인
6. 현재 작업과 관련된 코드 읽기

`docs/PROGRESS.md`의 `In Progress` 또는 `Next` 항목부터 이어서 작업한다.

이미 완료된 기능을 특별한 이유 없이 다시 구현하지 않는다.

## Session End

의미 있는 작업 단위가 끝나면 다음을 수행한다.

1. 관련 기능 테스트
2. production build 확인
3. `docs/PROGRESS.md` 업데이트
4. `git diff` 확인
5. 의미 있는 단위로 Git commit

작업 중 발견한 미해결 문제는  
`docs/PROGRESS.md`의 `Known Issues`에 기록한다.

## Core Requirements

반드시 지원해야 한다.

- 로그인 없는 공개 편집기
- PNG/JPEG 이미지 업로드
- 잘못된 파일 형식 거부
- 1:1 화면비
- 4:5 화면비
- 9:16 화면비
- 미리보기와 다운로드 결과 일치
- PNG 다운로드
- JPEG 다운로드
- 사용자 템플릿 생성
- 사용자 템플릿 불러오기
- 사용자 템플릿 수정
- 사용자 템플릿 삭제
- 새로고침 후 템플릿 유지
- 편집 상태 JSON export
- JSON import 및 복원
- 잘못된 JSON 안전하게 거부
- 극단 입력 최소 12건 테스트
- 공개 배포 가능한 상태 유지

상세 요구사항은 `docs/REQUIREMENTS.md`를 따른다.

## Architecture Rules

편집 가능한 상태는 하나의 명확한 `EditorState`를  
source of truth로 사용한다.

Preview와 Export는 가능한 한 동일한 rendering pipeline을 사용한다.

```text
EditorState
    ↓
renderCard()
    ↓
Canvas
    ├─ Preview
    └─ Export
```

미리보기용 renderer와 다운로드용 renderer를 별도로 만들지 않는다.

사용자 템플릿은 `EditorState` 전체를 저장한다.

초기 버전은 특별한 이유가 없다면 backend 없이  
browser storage를 사용한다.

## Rendering

미리보기와 다운로드 결과에서 다음 요소가 일치해야 한다.

- 이미지 위치
- 이미지 scale
- 이미지 crop
- 텍스트 내용
- 텍스트 줄바꿈
- 텍스트 위치
- 배경
- 프레임
- 스티커 위치

화면에서는 정상인데 다운로드 결과가 달라지는 구조를 피한다.

## Persistence

사용자 템플릿은 새로고침 후에도 유지되어야 한다.

초기 버전에서는 `localStorage` 또는 `IndexedDB`를 사용할 수 있다.

민감 정보는 저장하지 않는다.

## JSON Import / Export

현재 편집 상태를 JSON으로 export할 수 있어야 한다.

Import 시 단순히 `JSON.parse`만 하지 말고 구조를 검증한다.

최소한 다음을 확인한다.

- 지원하는 schema version인지
- 화면비가 허용된 값인지
- 필드 타입이 올바른지
- 배열 필드가 실제 배열인지
- 숫자 값이 `NaN` 또는 `Infinity`가 아닌지

잘못된 JSON 때문에 앱 전체가 crash해서는 안 된다.

## File Upload Safety

업로드 파일을 신뢰하지 않는다.

최소한 다음을 확인한다.

- MIME type
- 파일 크기
- 실제 image decode 성공 여부

초기 버전 허용 형식:

- `image/png`
- `image/jpeg`

초기 버전에서 거부:

- SVG
- GIF
- PDF
- HTML
- executable
- 기타 비이미지 파일

파일 이름이나 사용자 텍스트를 HTML로 직접 삽입하지 않는다.

## Text Safety

사용자 입력은 일반 텍스트로 취급한다.

- `dangerouslySetInnerHTML` 사용을 피한다.
- 사용자 입력으로 script 또는 HTML이 실행되어서는 안 된다.
- 예상 가능한 잘못된 입력 때문에 앱이 crash해서는 안 된다.

## Development Rules

- 전체 프로젝트를 이유 없이 다시 작성하지 않는다.
- 작은 기능 단위로 작업한다.
- 기존 working code를 이유 없이 교체하지 않는다.
- 불필요한 dependency를 추가하지 않는다.
- 같은 계산 로직을 중복 구현하지 않는다.
- magic number를 최소화한다.
- 컴포넌트 하나에 너무 많은 역할을 넣지 않는다.
- 변경 범위를 가능한 작게 유지한다.
- 기능 완료 전에 `PROGRESS.md`에서 완료 처리하지 않는다.
- 기존 요구사항을 깨뜨리는 대규모 refactor는 피한다.

새 라이브러리를 추가하기 전에  
기존 코드나 브라우저 API로 해결 가능한지 확인한다.

## Testing

`docs/TEST_CASES.md`를 기준으로 테스트한다.

기능 추가 후 관련 테스트를 수행한다.

항상 다음 상태를 확인한다.

```text
build: PASS / FAIL
tests: PASS / FAIL
manual core flow: PASS / FAIL
```

## Git

의미 있는 작업 단위별로 commit한다.

예시:

```text
feat: add image upload validation
feat: add aspect ratio selector
feat: add canvas renderer
feat: add template persistence
fix: keep export output consistent with preview
test: add edge case coverage
```

서로 관련 없는 변경을 하나의 commit에 섞지 않는다.

## Design Direction

실제 싸이월드 로고, 상표, UI 또는 화면을 그대로 복제하지 않는다.

2000년대 초반 한국 인터넷과 미니홈피 문화의 분위기에서 영감을 받은  
독립적인 디자인을 만든다.

디자인 키워드:

- retro web
- mini homepage
- diary
- scrapbook
- pixel
- sticker
- pastel
- nostalgia
- personal homepage

상세 디자인과 기능 요구사항은 `docs/REQUIREMENTS.md`를 따른다.

## Do Not

다음 행동은 피한다.

- 전체 프로젝트를 이유 없이 다시 생성
- 완료된 기능을 다시 구현
- Preview와 Export를 별도 구현
- 템플릿 저장 시 일부 편집 상태 누락
- JSON import validation 생략
- 업로드 파일을 검증 없이 신뢰
- 사용자 HTML을 그대로 렌더링
- 테스트 없이 완료 처리
- `PROGRESS.md` 갱신 없이 세션 종료
