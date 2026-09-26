# dear-2004 Requirements

## 1. Product Overview

프로젝트명:

그땐 그랬지...

Repository:

dear-2004

목적:

사용자가 이미지와 문구를 조합해
2000년대 초반 미니홈피 감성의 이미지를 제작하고
PNG 또는 JPEG 파일로 다운로드할 수 있도록 한다.


## 2. Target Experience

사용자는 별도의 로그인이나 회원가입 없이
웹사이트를 열자마자 편집을 시작할 수 있어야 한다.

기본 사용 흐름:

1. 이미지 업로드
2. 화면비 선택
3. 이미지 조절
4. 문구 작성
5. 꾸미기
6. 결과 미리보기
7. 이미지 다운로드


## 3. Supported Aspect Ratios

### Square

1:1

SNS 일반 카드 등에 사용한다.


### Portrait

4:5

SNS 피드용 세로 이미지에 사용한다.


### Story

9:16

스토리 또는 모바일 공유 이미지에 사용한다.


## 4. Image Upload

지원:

- PNG
- JPEG
- JPG

업로드 성공 시:

- 이미지를 decode한다.
- EditorState에 반영한다.
- 현재 화면비에 맞게 초기 배치한다.

잘못된 파일은 명확하게 거부한다.

최소 검증:

- MIME type
- 파일 크기
- 이미지 decode


## 5. Image Editing

사용자는 최소 다음을 조절할 수 있어야 한다.

- 위치 X
- 위치 Y
- 확대 / 축소

가능하면 추가:

- 회전
- crop 위치 조절
- 초기화


## 6. Text Editing

최소 입력 필드:

- 제목
- 상태 메시지
- 본문

선택 입력:

- BGM 표시 문구
- 날짜
- TODAY / TOTAL 숫자
- 짧은 서명

줄바꿈을 지원한다.

긴 텍스트 때문에 전체 레이아웃이 깨지지 않아야 한다.


## 7. Decoration

최소 하나 이상의 배경/프레임 스타일을 지원한다.

권장:

### Background

- 하늘색 도트
- 핑크 체크
- 크림색 다이어리
- 파스텔 그라데이션

### Frame

- 기본 미니홈피풍
- 다이어리
- 사진첩
- 메모장

### Stickers

- 별
- 하트
- 구름
- 반짝이
- 리본
- 스마일

스티커는 가능하면 위치를 조절할 수 있도록 한다.


## 8. Preview

편집 중 결과가 즉시 보인다.

Preview는 다운로드 결과와 동일한 rendering logic을 사용한다.

다음 요소가 다운로드 결과와 일치해야 한다.

- 이미지 crop
- 이미지 위치
- 이미지 scale
- 텍스트 내용
- 텍스트 줄바꿈
- 텍스트 위치
- 스티커 위치
- 배경
- 프레임


## 9. Export

최소:

- PNG
- JPEG

다운로드 파일의 aspect ratio는 현재 선택된 화면비와 동일해야 한다.

JPEG의 경우 흰색 또는 현재 배경색 등
명확한 배경 위에 렌더링해야 한다.


## 10. User Templates

사용자는 현재 디자인을 템플릿으로 저장할 수 있다.

필수 기능:

Create
Read
Update
Delete

새로고침 후에도 유지되어야 한다.

템플릿 이름을 사용자가 지정할 수 있어야 한다.


## 11. JSON

현재 편집 상태를 JSON으로 export할 수 있다.

저장된 JSON을 다시 import하면
가능한 한 동일한 편집 상태를 복원해야 한다.

잘못된 JSON은 거부한다.

지원하지 않는 schema version도 거부하거나 안전하게 처리한다.


## 12. Persistence

로그인 없는 공개 편집기이므로
기본 버전에서는 browser storage 사용을 허용한다.

후보:

- localStorage
- IndexedDB

민감 정보는 저장하지 않는다.


## 13. Safety

사용자가 업로드한 파일을 실행하지 않는다.

사용자 입력을 HTML로 해석하지 않는다.

SVG 등 script를 포함할 가능성이 있는 입력은
초기 버전 업로드 대상에서 제외한다.

앱에 secret API key를 포함하지 않는다.


## 14. Accessibility

가능한 범위에서 다음을 지킨다.

- 버튼에 의미 있는 텍스트
- 이미지 업로드 input label
- keyboard 접근
- 충분한 클릭 영역
- 에러 메시지를 색상만으로 전달하지 않기


## 15. Responsive Layout

Desktop에서 편집이 편해야 한다.

Mobile에서도 다음 기능은 사용할 수 있어야 한다.

- 이미지 업로드
- 텍스트 수정
- 화면비 선택
- 미리보기
- 다운로드

화면 폭이 좁을 경우
editor controls와 preview를 세로로 배치할 수 있다.


## 16. Out of Scope

초기 버전에 반드시 필요하지 않다.

- 로그인
- 서버 DB
- 소셜 네트워크
- 실제 음악 재생
- 결제
- 댓글
- 사용자 계정
- 실시간 공동 편집
- AI/LLM 문구 생성

이 기능들은 핵심 제출 요건이 완성된 뒤에만 고려한다.


## 17. Definition of Done

프로젝트가 완료되었다고 판단하려면 다음을 만족해야 한다.

- 공개 URL 접속 가능
- 로그인 불필요
- PNG/JPEG 업로드 가능
- 잘못된 파일 거부
- 3개 화면비 작동
- 미리보기와 다운로드 결과 일치
- PNG 다운로드 성공
- JPEG 다운로드 성공
- 템플릿 CRUD 작동
- 새로고침 이후 템플릿 유지
- JSON export/import 성공
- 잘못된 JSON 안전하게 거부
- TEST_CASES의 핵심 테스트 통과
- production build 성공
