// src/lib/utils/image-upload.ts

/**
 * 画像ファイルのバリデーション
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // ファイルサイズチェック (5MB制限)
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB
  if (file.size > MAX_SIZE) {
    return { isValid: false, error: 'ファイルサイズは5MB以下にしてください' }
  }

  // ファイル形式チェック
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'JPG、PNG、WebP、GIF形式のファイルのみ対応しています' }
  }

  return { isValid: true }
}

/**
 * 画像ファイルをBase64に変換
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert file to base64'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 画像をリサイズ（Canvas使用）
 */
export function resizeImage(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 600,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      // アスペクト比を保持してリサイズ
      let { width, height } = img
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      // 画像を描画
      ctx.drawImage(img, 0, 0, width, height)

      // Blobとして出力
      canvas.toBlob(resolve, file.type, quality)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 一意なファイル名を生成
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const extension = originalName.split('.').pop() || 'jpg'
  return `${timestamp}_${random}.${extension}`
}

/**
 * 画像URLの形式チェック
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname.toLowerCase()
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(pathname)
  } catch {
    return false
  }
}
