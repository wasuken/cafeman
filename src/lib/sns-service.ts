'use strict'

import { prisma } from './prisma'
import type {
  Post,
  UserProfile,
  CreatePostRequest,
  UpdatePostRequest,
  UpdateProfileRequest,
  NotificationType,
} from '@/types/sns'

export class SNSService {
  /**
   * ユーザープロフィールを取得
   */
  static async getUserProfile(userId: string) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
    })

    return profile
  }

  /**
   * ユーザープロフィールを作成/更新
   */
  static async upsertUserProfile(userId: string, data: UpdateProfileRequest) {
    return await prisma.userProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  /**
   * 投稿を作成
   */
  static async createPost(userId: string, data: CreatePostRequest) {
    return await prisma.post.create({
      data: {
        userId,
        content: data.content,
        imageUrl: data.imageUrl,
        hashtags: data.hashtags || [],
        isPublic: data.isPublic ?? true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profile: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    })
  }

  /**
   * フィード用の投稿一覧を取得
   */
  static async getFeedPosts(userId: string, limit: number = 20, cursor?: string) {
    const posts = await prisma.post.findMany({
      where: {
        isPublic: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profile: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        likes: {
          where: { userId },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: parseInt(cursor) },
        skip: 1,
      }),
    })

    const hasMore = posts.length > limit
    if (hasMore) posts.pop()

    return {
      posts: posts.map(post => ({
        ...post,
        isLiked: post.likes.length > 0,
        likes: undefined, // クライアントには送信しない
      })),
      hasMore,
      nextCursor: hasMore ? posts[posts.length - 1]?.id.toString() : undefined,
    }
  }

  /**
   * 投稿にいいねを追加/削除
   */
  static async toggleLike(postId: number, userId: string) {
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    })

    if (existingLike) {
      // いいねを削除
      await prisma.like.delete({
        where: { id: existingLike.id },
      })
      return { liked: false }
    } else {
      // いいねを追加
      await prisma.like.create({
        data: { postId, userId },
      })

      // 投稿者に通知を送信（自分の投稿でない場合）
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { userId: true },
      })

      if (post && post.userId !== userId) {
        await this.createNotification(
          post.userId,
          'like',
          'いいね',
          `あなたの投稿にいいねがつきました`,
          postId
        )
      }

      return { liked: true }
    }
  }

  /**
   * フォロー/アンフォロー
   */
  static async toggleFollow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new Error('自分自身をフォローすることはできません')
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    })

    if (existingFollow) {
      // フォローを解除
      await prisma.follow.delete({
        where: { id: existingFollow.id },
      })
      return { following: false }
    } else {
      // フォローを追加
      await prisma.follow.create({
        data: { followerId, followingId },
      })

      // フォローされた人に通知
      await this.createNotification(
        followingId,
        'follow',
        '新しいフォロワー',
        `あなたをフォローしました`,
        null
      )

      return { following: true }
    }
  }

  /**
   * 通知を作成
   */
  static async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    relatedId?: number | null
  ) {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        relatedId,
      },
    })
  }

  /**
   * ユーザーの統計情報を取得
   */
  static async getUserStats(userId: string) {
    const [postsCount, followersCount, followingCount] = await Promise.all([
      prisma.post.count({ where: { userId } }),
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
    ])

    return {
      postsCount,
      followersCount,
      followingCount,
    }
  }

  /**
   * フォロー状態をチェック
   */
  static async isFollowing(followerId: string, followingId: string) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    })

    return !!follow
  }
  static async getUserPosts(targetUserId: string, limit: number = 20, cursor?: string) {
    const posts = await prisma.post.findMany({
      where: { userId: targetUserId, isPublic: true },
      include: {
        user: { select: { id: true, name: true, profile: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: parseInt(cursor) }, skip: 1 }),
    })

    const hasMore = posts.length > limit
    if (hasMore) posts.pop()

    return {
      posts,
      hasMore,
      nextCursor: hasMore ? posts[posts.length - 1]?.id.toString() : undefined,
    }
  }

  static async getPost(postId: number, userId: string) {
    return await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: { select: { id: true, name: true, profile: true } },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId }, select: { id: true } },
      },
    })
  }

  static async updatePost(postId: number, userId: string, data: Partial<CreatePostRequest>) {
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } })
    if (!post || post.userId !== userId)
      throw new Error('投稿が見つからないか、編集権限がありません')

    return await prisma.post.update({
      where: { id: postId },
      data,
      include: {
        user: { select: { id: true, name: true, profile: true } },
        _count: { select: { likes: true, comments: true } },
      },
    })
  }

  static async deletePost(postId: number, userId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } })
    if (!post || post.userId !== userId)
      throw new Error('投稿が見つからないか、削除権限がありません')

    return await prisma.post.delete({ where: { id: postId } })
  }
}
