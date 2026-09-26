# dear-2004 Progress

이 파일은 세션 간 작업 상태를 전달하기 위한 문서다.

Claude Code는 새 세션 시작 시 이 파일을 읽고
완료된 기능을 다시 구현하지 않는다.


## Current Phase

Project initialization


## Completed

- [x] 프로젝트 컨셉 결정
- [x] 프로젝트명 결정: 그땐 그랬지...
- [x] Repository 이름 결정: dear-2004
- [x] 핵심 요구사항 정리
- [x] 세션 지속을 위한 문서 구조 정의


## In Progress

- [ ] 프로젝트 기술 스택 및 기본 구조 생성


## Next

순서대로 진행한다.

1. 프로젝트 초기화
2. 기본 페이지 레이아웃 구성
3. EditorState 타입 정의
4. 이미지 업로드 구현
5. PNG/JPEG 파일 검증 구현
6. Canvas renderer 구현
7. 1:1 / 4:5 / 9:16 화면비 구현
8. 이미지 위치/크기 조절 구현
9. 텍스트 입력 구현
10. 레트로 미니홈피 테마 구현
11. 스티커 구현
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


## Known Issues

현재 없음.


## Test Status

```text
build: NOT RUN
automated tests: NOT RUN
manual core flow: NOT RUN
edge cases: NOT RUN
```


## Last Session Summary

프로젝트 개발 전 요구사항과 작업 지속 전략을 정리했다.

다음 세션은 프로젝트 초기화부터 시작한다.


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


