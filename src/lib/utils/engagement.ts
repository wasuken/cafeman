// src/lib/utils/engagement.ts

/**
 * いいね数をフォーマット
 */
export function formatLikesCount(count: number): string {
  if (count < 1000) return count.toString()
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`
  if (count < 1000000) return `${Math.floor(count / 1000)}k`
  return `${(count / 1000000).toFixed(1)}M`
}

/**
 * コメント数をフォーマット
 */
export function formatCommentsCount(count: number): string {
  return formatLikesCount(count)
}

/**
 * エンゲージメント率を計算
 */
export function calculateEngagementRate(likes: number, comments: number, views?: number): number {
  if (!views || views === 0) return 0
  return ((likes + comments) / views) * 100
}

/**
 * 投稿の人気度スコアを計算
 */
export function calculatePopularityScore(
  likes: number,
  comments: number,
  createdAt: Date,
  shares?: number
): number {
  const now = new Date()
  const hoursSincePost = (now.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60)

  // 時間による減衰を考慮
  const timeDecay = Math.max(0.1, 1 / (1 + hoursSincePost / 24))

  // エンゲージメントスコア（コメントを重く評価）
  const engagementScore = likes + comments * 3 + (shares || 0) * 2

  return engagementScore * timeDecay
}

/**
 * ハッシュタグを抽出
 */
export function extractHashtags(content: string): string[] {
  const hashtags = content.match(/#[^\s#]+/g) || []
  return hashtags.map(tag => tag.slice(1)).filter(tag => tag.length > 0)
}

/**
 * メンションを抽出
 */
export function extractMentions(content: string): string[] {
  const mentions = content.match(/@[^\s@]+/g) || []
  return mentions.map(mention => mention.slice(1)).filter(mention => mention.length > 0)
}

/**
 * 投稿内容にリンクが含まれているかチェック
 */
export function hasLinks(content: string): boolean {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return urlRegex.test(content)
}

/**
 * 投稿内容からプレビューテキストを生成
 */
export function generatePreviewText(content: string, maxLength: number = 100): string {
  const cleanContent = content
    .replace(/#[^\s#]+/g, '')
    .replace(/@[^\s@]+/g, '')
    .trim()

  if (cleanContent.length <= maxLength) return cleanContent

  const truncated = cleanContent.substring(0, maxLength)
  const lastSpaceIndex = truncated.lastIndexOf(' ')

  if (lastSpaceIndex > maxLength * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + '...'
  }

  return truncated + '...'
}

/**
 * エンゲージメント統計の初期値
 */
export const INITIAL_ENGAGEMENT_STATS = {
  likesCount: 0,
  commentsCount: 0,
  sharesCount: 0,
  viewsCount: 0,
} as const

/**
 * 投稿のバリデーション
 */
export function validatePostContent(content: string): { isValid: boolean; error?: string } {
  if (!content.trim()) {
    return { isValid: false, error: '投稿内容を入力してください' }
  }

  if (content.length > 280) {
    return { isValid: false, error: '280文字以内で入力してください' }
  }

  return { isValid: true }
}

/**
 * コメントのバリデーション
 */
export function validateCommentContent(content: string): { isValid: boolean; error?: string } {
  if (!content.trim()) {
    return { isValid: false, error: 'コメント内容を入力してください' }
  }

  if (content.length > 500) {
    return { isValid: false, error: '500文字以内で入力してください' }
  }

  return { isValid: true }
}
