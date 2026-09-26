import { UPLOAD_LIMITS } from './constants'
import type { UploadError } from './checkUploadFile'

const MAX_MB = UPLOAD_LIMITS.maxFileBytes / (1024 * 1024)
const MAX_DIM = UPLOAD_LIMITS.maxDimension

/** 사용자에게 보여줄 업로드 에러 문구. 파일 이름 등 사용자 입력은 포함하지 않는다. */
export function uploadErrorMessage(error: UploadError): string {
  switch (error.code) {
    case 'unsupported-type':
      return `${error.formatLabel ?? '이'} 파일은 올릴 수 없어요 ㅠ_ㅠ PNG나 JPEG로 올려 주세요~`
    case 'empty-file':
      return '빈 파일이에요. 다른 사진을 골라 주세요.'
    case 'file-too-large':
      return `사진 용량이 너무 커요. ${MAX_MB}MB까지 올릴 수 있어요.`
    case 'not-an-image':
      return '사진 파일이 아닌 것 같아요. 확장자만 바꾼 파일은 올릴 수 없어요.'
    case 'unreadable-header':
    case 'decode-failed':
      return '사진을 읽을 수 없어요. 파일이 깨졌을 수 있어요 ㅠ_ㅠ'
    case 'dimensions-too-large':
      return `사진 해상도가 너무 커요. 가로·세로 ${MAX_DIM}px까지 올릴 수 있어요.`
    case 'output-too-large':
      return '사진을 저장용으로 줄이지 못했어요. 더 작은 사진을 올려 주세요.'
    case 'read-failed':
      return '파일을 읽는 중에 문제가 생겼어요. 다시 시도해 주세요.'
  }
}
