# 그땐 그랬지,, (dear-2004)

2000년대 초반 미니홈피 감성의 이미지·카드를 만드는 웹앱입니다.
로그인 없이 사진과 문구로 카드를 꾸미고 PNG 또는 JPEG로 저장할 수 있습니다.

## 주요 기능

- PNG·JPEG 사진 업로드 (형식·용량·해상도 검증, 큰 사진은 자동으로 축소)
- 사진 위치·확대·회전 조절, 사진 효과(원본·뽀샤시·빛바램·흑백), 필름카메라 날짜 스탬프
- 카드 틀 4종(감성 사진·미니홈피·사진첩·다이어리)과 배경 스킨 5종(단색 포함)
- 화면비 1:1, 4:5, 9:16
- 도트 스티커 붙이기와 끌어서 옮기기
- 템플릿 저장·불러오기·수정·삭제, JSON 백업과 복원
- PNG·JPEG 다운로드 (미리보기와 같은 렌더러를 사용하므로 결과가 동일합니다)

## 데이터 저장

사진과 문구는 서버로 전송되지 않습니다. 카드 렌더링과 템플릿 저장은 모두 브라우저 안에서 이루어지며, 템플릿은 브라우저의 IndexedDB에 저장됩니다.
템플릿에는 사진도 함께 저장되므로, 여러 사람이 쓰는 컴퓨터에서는 사용 후 템플릿을 삭제하는 것이 좋습니다.

## 기술 스택

- React 19, TypeScript, Vite
- Canvas 2D 렌더링
- Vitest (단위 테스트), Playwright (브라우저 E2E), oxlint

## 실행

Node.js 20 이상이 필요합니다.

```bash
npm install
npm run dev        # 개발 서버 (http://localhost:5173)
```

배포용 빌드는 다음과 같이 확인합니다.

```bash
npm run build
npm run preview    # http://localhost:4173
```

## 테스트

```bash
npm test           # 단위 테스트
npm run lint       # 정적 검사
npm run test:e2e   # 빌드 후 실제 브라우저로 주요 흐름 확인
```

`npm run test:e2e`는 업로드, 편집, 다운로드, 템플릿, JSON, 모바일 레이아웃 등을 실제 브라우저에서 확인하고 결과를 요약합니다.
처음 실행할 때 테스트용 브라우저가 없다면 한 번 설치합니다.

```bash
npx playwright-core install chromium-headless-shell
```

테스트 중 생성된 스크린샷과 다운로드 파일은 `e2e/.output/`에 저장되며 git에는 포함되지 않습니다.

## 폴더 구성

| 폴더 | 내용 |
|---|---|
| `src/editor/` | 편집 상태(EditorState), 입력값 검증, 상태 변경 로직 |
| `src/render/` | 카드 렌더러 (미리보기와 다운로드에서 공통으로 사용) |
| `src/upload/` | 업로드 파일 검증과 축소 |
| `src/export/` | PNG·JPEG 저장, JSON 백업 |
| `src/templates/` | 템플릿 저장소 (IndexedDB) |
| `src/components/` | UI 컴포넌트 |
| `e2e/` | 브라우저 E2E 테스트 |
| `scripts/` | 폰트·스티커 에셋 생성 도구 |
| `docs/` | 요구사항, 테스트 항목, 진행 상황 |

## 폰트와 에셋

- 글꼴: [Galmuri](https://github.com/quiple/galmuri) (SIL Open Font License 1.1, 전문은 `public/fonts/Galmuri-OFL.md`)
  로딩 속도를 위해 필요한 글자만 남기고 자주 쓰는 한글과 나머지로 나누어 두었습니다. 원본은 `fonts-src/`에 있으며 `npm run fonts:subset`으로 다시 생성할 수 있습니다.
- 도트 스티커: 이 프로젝트를 위해 AI로 제작한 이미지입니다.

## 문서

- 요구사항: `docs/REQUIREMENTS.md`
- 테스트 항목: `docs/TEST_CASES.md`
- 진행 상황: `docs/PROGRESS.md`
