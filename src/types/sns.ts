// src/types/sns.ts
export interface UserProfile {
  id: number
  userId: string
  bio?: string
  avatarUrl?: string
  website?: string
  location?: string
  birthDate?: Date
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  user?: {
    id: string
    name?: string
    email: string
  }
}

export interface Post {
  id: number
  userId: string
  content: string
  imageUrl?: string
  hashtags?: string[]
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  user?: {
    id: string
    name?: string
    profile?: UserProfile
  }
  _count?: {
    likes: number
    comments: number
  }
  isLiked?: boolean // 現在のユーザーがいいねしているか
}

export interface Comment {
  id: number
  postId: number
  userId: string
  content: string
  createdAt: Date
  updatedAt: Date
  user?: {
    id: string
    name?: string
    profile?: UserProfile
  }
}

export interface Like {
  id: number
  postId: number
  userId: string
  createdAt: Date
  user?: {
    id: string
    name?: string
  }
}

export interface Follow {
  id: number
  followerId: string
  followingId: string
  createdAt: Date
  follower?: {
    id: string
    name?: string
    profile?: UserProfile
  }
  following?: {
    id: string
    name?: string
    profile?: UserProfile
  }
}

export interface Notification {
  id: number
  userId: string
  type: NotificationType
  title: string
  message: string
  relatedId?: number
  isRead: boolean
  createdAt: Date
}

export type NotificationType = 'like' | 'comment' | 'follow' | 'mention'

// API レスポンス型
export interface PostWithStats extends Post {
  likesCount?: number
  commentsCount?: number
  isLiked: boolean
}

export interface CommentWithUser extends Comment {
  user: {
    id: string
    name?: string
    profile?: UserProfile
  }
}

export interface UserWithStats {
  id: string
  name?: string
  email: string
  profile?: UserProfile
  _count?: {
    posts: number
    followers: number
    following: number
  }
  isFollowing?: boolean // 現在のユーザーがフォローしているか
}

// API リクエスト型
export interface CreatePostRequest {
  content: string
  imageUrl?: string
  hashtags?: string[]
  isPublic?: boolean
}

export interface UpdatePostRequest {
  content?: string
  imageUrl?: string
  hashtags?: string[]
  isPublic?: boolean
}

export interface CreateCommentRequest {
  content: string
}

export interface UpdateCommentRequest {
  content: string
}

export interface UpdateProfileRequest {
  bio?: string
  avatarUrl?: string
  website?: string
  location?: string
  birthDate?: Date
  isPublic?: boolean
}

// フィード関連
export interface FeedResponse {
  posts: PostWithStats[]
  hasMore: boolean
  nextCursor?: string
}

export interface CommentsResponse {
  comments: CommentWithUser[]
  hasMore: boolean
  nextCursor?: string
}

// Engagement関連
export interface EngagementStats {
  likesCount: number
  commentsCount: number
  sharesCount?: number
  viewsCount?: number
}

export interface LikeResponse {
  liked: boolean
  likesCount?: number
}

// エラーレスポンス
export interface APIError {
  error: string
  details?: any
}

// 無限スクロール用のhook型
export interface InfiniteScrollHook<T> {
  data: T[]
  isLoading: boolean
  isError: boolean
  hasMore: boolean
  loadMore: () => void
  refresh: () => void
}

// 投稿の状態管理用
export interface PostState {
  posts: PostWithStats[]
  isLoading: boolean
  hasMore: boolean
  cursor?: string
}

// コメントの状態管理用
export interface CommentState {
  comments: CommentWithUser[]
  isLoading: boolean
  hasMore: boolean
  cursor?: string
}
