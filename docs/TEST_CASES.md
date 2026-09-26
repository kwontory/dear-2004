# dear-2004 Test Cases

## Goal

극단적인 입력에서도 애플리케이션이 crash하지 않고
Preview와 Export가 안정적으로 동작하는지 확인한다.


# Core Flow

## TC-01 Normal PNG

Input:

일반적인 PNG 사진

Expected:

- 업로드 성공
- Preview 정상
- PNG export 성공
- JPEG export 성공


## TC-02 Normal JPEG

Input:

일반적인 JPEG 사진

Expected:

- 업로드 성공
- Preview 정상
- 다운로드 정상


# Required Edge Cases

## TC-03 Unsupported PDF

Input:

PDF 파일

Expected:

- 업로드 거부
- 사용자에게 파일 형식 오류 표시
- 기존 편집 상태 유지
- 앱 crash 없음


## TC-04 Unsupported GIF

Input:

GIF 파일

Expected:

- 업로드 거부
- 명확한 에러 표시


## TC-05 Fake Image Extension

Input:

실제로는 이미지가 아닌 파일을 .jpg 등으로 변경

Expected:

- decode 실패 감지
- 업로드 거부
- 앱 crash 없음


## TC-06 Very Large Image

Input:

매우 큰 해상도의 이미지

Expected:

- 브라우저가 freeze하지 않도록 처리
- 정책상 크기 제한을 넘으면 안전하게 거부
- 에러 메시지 표시


## TC-07 Very Small Image

Input:

예: 1x1 또는 매우 작은 이미지

Expected:

- crash 없음
- Preview 가능 또는 명확한 제한 안내


## TC-08 Extremely Wide Image

Input:

매우 가로로 긴 이미지

Expected:

- crop/contain 정책에 따라 정상 렌더
- Canvas 바깥으로 깨지지 않음


## TC-09 Extremely Tall Image

Input:

매우 세로로 긴 이미지

Expected:

- crop/contain 정상
- Export와 Preview 일치


## TC-10 Transparent PNG

Input:

투명 영역이 많은 PNG

Expected:

- Preview 정상
- PNG의 투명 영역 정책이 일관됨
- JPEG export 시 배경 처리 정상


## TC-11 Empty Text

Input:

모든 텍스트 필드 비움

Expected:

- crash 없음
- 이미지 또는 빈 카드 정상 렌더


## TC-12 Very Long Text

Input:

본문에 500자 이상의 텍스트

Expected:

- 앱 crash 없음
- 정해진 overflow 정책 적용
- 다른 UI가 무너지지 않음


## TC-13 Many Line Breaks

Input:

줄바꿈이 매우 많은 텍스트

Expected:

- crash 없음
- overflow 정책 적용


## TC-14 Emoji Input

Input:

이모지 다량 입력

예:

😀😭⭐️💖✨🎵

Expected:

- 앱 crash 없음
- 지원 가능한 범위에서 표시
- Preview/Export 최대한 일치


## TC-15 Special Characters

Input:

```text
< > & " ' / \ { } [ ] <script>
```

Expected:

- 코드 실행 없음
- 일반 텍스트로 처리
- XSS 없음


## TC-16 Mixed Korean English

Input:

한글, 영어, 숫자, 이모지가 섞인 텍스트

Expected:

- 줄바꿈 정상
- 렌더링 정상


## TC-17 Extreme Scale

Input:

이미지를 최소 또는 최대 scale까지 변경

Expected:

- Infinity/NaN 상태 발생하지 않음
- renderer crash 없음


## TC-18 Repeated Aspect Ratio Change

Steps:

1:1 → 4:5 → 9:16 → 1:1을 여러 번 반복

Expected:

- 상태가 깨지지 않음
- Preview 정상
- Export 정상


# Template Tests

## TC-19 Create Template

Expected:

현재 EditorState 저장 성공


## TC-20 Reload Template

Steps:

1. 템플릿 저장
2. 페이지 새로고침
3. 템플릿 불러오기

Expected:

저장된 템플릿 유지


## TC-21 Update Template

Expected:

기존 템플릿 변경 내용 저장


## TC-22 Delete Template

Expected:

삭제 후 목록에서 제거

새로고침 후에도 다시 나타나지 않음


# JSON Tests

## TC-23 JSON Export

Expected:

현재 편집 상태 JSON 생성 가능


## TC-24 JSON Round Trip

Steps:

1. 디자인 제작
2. JSON export
3. 편집 상태 초기화
4. JSON import

Expected:

원본과 동일하거나 허용 오차 내에서 동일한 상태 복원


## TC-25 Invalid JSON

Input:

문법적으로 잘못된 JSON

Expected:

- import 거부
- 에러 메시지
- 기존 상태 유지


## TC-26 Wrong Schema

Input:

정상 JSON이지만 dear-2004 schema가 아님

Expected:

- 안전하게 거부
- crash 없음


## TC-27 Unsupported Version

Input:

지원하지 않는 version

Expected:

- 명확하게 거부하거나 migration 정책 적용
- crash 없음


# Export Consistency

아래 테스트는 세 화면비 모두 수행한다.


## TC-28 1:1 Preview vs Export

Expected:

Preview와 export 이미지의

- 이미지 위치
- scale
- crop
- text
- sticker
- frame

이 동일하다.


## TC-29 4:5 Preview vs Export

Expected:

Preview와 export 동일


## TC-30 9:16 Preview vs Export

Expected:

Preview와 export 동일


# Production Checklist

배포 전 확인:

- [ ] npm run build 성공
- [ ] 콘솔에 치명적 오류 없음
- [ ] 1:1 export 확인
- [ ] 4:5 export 확인
- [ ] 9:16 export 확인
- [ ] PNG 확인
- [ ] JPEG 확인
- [ ] template CRUD 확인
- [ ] 새로고침 persistence 확인
- [ ] JSON round trip 확인
- [ ] invalid file 확인
- [ ] invalid JSON 확인
- [ ] 모바일 viewport 확인
- [ ] 공개 URL 확인
