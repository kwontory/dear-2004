/**
 * 도트 스티커 에셋. 사용자가 제공한 참고 시안 이미지에서 잘라낸 원본을 그대로 쓴다.
 * 파일: public/stickers/<id>.png (투명 배경). width/height는 원본 픽셀 크기.
 */
export const STICKER_ASSETS = [
  { id: 'heart-pink', label: '분홍 하트', width: 134, height: 112 },
  { id: 'heart-blue', label: '하늘 하트', width: 120, height: 112 },
  { id: 'heart-silver', label: '은색 하트', width: 118, height: 101 },
  { id: 'heart-outline', label: '테두리 하트', width: 119, height: 113 },
  { id: 'heart-double', label: '쌍하트', width: 132, height: 95 },
  { id: 'heart-planet', label: '행성 하트', width: 143, height: 82 },
  { id: 'heart-lavender', label: '보라 하트', width: 110, height: 128 },
  { id: 'heart-bubble-gray', label: '말풍선 하트', width: 105, height: 97 },
  { id: 'star-pink', label: '분홍 별', width: 110, height: 109 },
  { id: 'star-blue', label: '하늘 별', width: 112, height: 105 },
  { id: 'star-silver', label: '은색 별', width: 112, height: 106 },
  { id: 'sparkle-blue', label: '하늘 반짝이', width: 106, height: 111 },
  { id: 'sparkle-silver', label: '은색 반짝이', width: 115, height: 128 },
  { id: 'shooting-star', label: '별똥별', width: 125, height: 127 },
  { id: 'bow-pink', label: '분홍 리본', width: 147, height: 150 },
  { id: 'bow-pink-wide', label: '큰 분홍 리본', width: 191, height: 149 },
  { id: 'bow-lavender', label: '보라 리본', width: 140, height: 133 },
  { id: 'bow-lavender-wide', label: '큰 보라 리본', width: 181, height: 140 },
  { id: 'bow-blue', label: '하늘 리본', width: 128, height: 150 },
  { id: 'heart-wings', label: '날개 하트', width: 181, height: 117 },
  { id: 'flower-pink', label: '분홍 꽃', width: 124, height: 116 },
  { id: 'flower-blue', label: '하늘 꽃', width: 101, height: 107 },
  { id: 'flower-leaf', label: '잎사귀 꽃', width: 165, height: 109 },
  { id: 'tulip', label: '튤립', width: 118, height: 174 },
  { id: 'heart-bubble-pink', label: '분홍 말풍선', width: 86, height: 89 },
  { id: 'moon', label: '초승달', width: 106, height: 141 },
  { id: 'heart-silver-big', label: '큰 은색 하트', width: 133, height: 118 },
  { id: 'heart-soft', label: '뽀송 하트', width: 109, height: 90 },
  { id: 'cloud-heart', label: '구름 하트', width: 162, height: 117 },
  { id: 'cherry', label: '체리', width: 172, height: 161 },
  { id: 'rose', label: '장미', width: 149, height: 237 },
  { id: 'bow-hearts', label: '하트 리본', width: 143, height: 189 },
] as const

export type StickerAssetId = (typeof STICKER_ASSETS)[number]['id']

export function stickerAssetUrl(id: StickerAssetId): string {
  return `${import.meta.env.BASE_URL}stickers/${id}.png`
}
