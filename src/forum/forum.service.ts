import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ForumPost, ForumPostDocument } from './schemas/forum-post.schema';
import {
  ForumComment,
  ForumCommentDocument,
} from './schemas/forum-comment.schema';
import { Reaction } from './schemas/reaction.schema';

/** Public author fields surfaced to the client (matches FE ForumUser). */
const AUTHOR_FIELDS =
  'username avatarUrl role fieldFocus selfAssessedLevel gamification createdAt';

interface ShapeablePost {
  _id: Types.ObjectId | string;
  channelId: string;
  authorId: unknown;
  body: string;
  createdAt?: Date;
  reactions?: Reaction[];
  replyCount?: number;
}

interface ShapeableComment {
  _id: Types.ObjectId | string;
  postId: Types.ObjectId | string;
  authorId: unknown;
  body: string;
  createdAt?: Date;
  reactions?: Reaction[];
}

@Injectable()
export class ForumService {
  constructor(
    @InjectModel(ForumPost.name)
    private readonly postModel: Model<ForumPostDocument>,
    @InjectModel(ForumComment.name)
    private readonly commentModel: Model<ForumCommentDocument>,
  ) {}

  /** Map stored reactions ({emoji, users[]}) into the FE shape ({emoji,count,users}). */
  private shapeReactions(reactions: Reaction[] = []) {
    return reactions.map((r) => ({
      emoji: r.emoji,
      count: r.users?.length ?? 0,
      users: (r.users ?? []).map((u) => String(u)),
    }));
  }

  private shapePost(doc: ShapeablePost) {
    return {
      _id: String(doc._id),
      channelId: doc.channelId,
      author: doc.authorId,
      body: doc.body,
      createdAt: doc.createdAt,
      reactions: this.shapeReactions(doc.reactions ?? []),
      replyCount: doc.replyCount ?? 0,
    };
  }

  private shapeComment(doc: ShapeableComment) {
    return {
      _id: String(doc._id),
      postId: String(doc.postId),
      author: doc.authorId,
      body: doc.body,
      createdAt: doc.createdAt,
      reactions: this.shapeReactions(doc.reactions ?? []),
    };
  }

  async getPosts(channelId: string) {
    const filter = channelId ? { channelId } : {};
    const posts = await this.postModel
      .find(filter)
      .sort({ createdAt: -1 })
      .populate('authorId', AUTHOR_FIELDS)
      .lean();
    return posts.map((p) => this.shapePost(p as unknown as ShapeablePost));
  }

  async createPost(userId: Types.ObjectId, channelId: string, body: string) {
    const created = await this.postModel.create({
      channelId,
      authorId: userId,
      body,
    });
    const populated = await created.populate('authorId', AUTHOR_FIELDS);
    return this.shapePost(populated.toObject());
  }

  async getComments(postId: string) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new NotFoundException('Post not found');
    }
    const comments = await this.commentModel
      .find({ postId: new Types.ObjectId(postId) })
      .sort({ createdAt: 1 })
      .populate('authorId', AUTHOR_FIELDS)
      .lean();
    return comments.map((c) =>
      this.shapeComment(c as unknown as ShapeableComment),
    );
  }

  async createComment(userId: Types.ObjectId, postId: string, body: string) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new NotFoundException('Post not found');
    }
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const created = await this.commentModel.create({
      postId: post._id,
      authorId: userId,
      body,
    });
    await this.postModel.updateOne(
      { _id: post._id },
      { $inc: { replyCount: 1 } },
    );

    const populated = await created.populate('authorId', AUTHOR_FIELDS);
    return this.shapeComment(populated.toObject());
  }

  async reactToPost(userId: Types.ObjectId, postId: string, emoji: string) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new NotFoundException('Post not found');
    }
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    this.toggleReaction(post.reactions, userId, emoji);
    await post.save();

    const populated = await post.populate('authorId', AUTHOR_FIELDS);
    return this.shapePost(populated.toObject());
  }

  async reactToComment(
    userId: Types.ObjectId,
    commentId: string,
    emoji: string,
  ) {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new NotFoundException('Comment not found');
    }
    const comment = await this.commentModel.findById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');

    this.toggleReaction(comment.reactions, userId, emoji);
    await comment.save();

    const populated = await comment.populate('authorId', AUTHOR_FIELDS);
    return this.shapeComment(populated.toObject());
  }

  /** Add the user to the emoji reaction, or remove them if already reacted. */
  private toggleReaction(
    reactions: Reaction[],
    userId: Types.ObjectId,
    emoji: string,
  ) {
    let reaction = reactions.find((r) => r.emoji === emoji);
    if (!reaction) {
      reaction = { emoji, users: [] };
      reactions.push(reaction);
    }
    const idx = reaction.users.findIndex((u) => String(u) === String(userId));
    if (idx >= 0) {
      reaction.users.splice(idx, 1);
      if (reaction.users.length === 0) {
        const ri = reactions.findIndex((r) => r.emoji === emoji);
        if (ri >= 0) reactions.splice(ri, 1);
      }
    } else {
      reaction.users.push(userId);
    }
  }
}
