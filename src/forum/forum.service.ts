import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { Comment, CommentDocument } from './schemas/comment.schema';

@Injectable()
export class ForumService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async createPost(authorId: string, channelId: string, body: string) {
    const post = new this.postModel({ author: authorId, channelId, body });
    await post.save();
    return this.postModel.findById(post._id).populate('author', 'username avatarUrl role fieldFocus gamification');
  }

  async getPosts(channelId: string) {
    return this.postModel.find({ channelId })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatarUrl role fieldFocus gamification');
  }

  async reactToPost(postId: string, userId: string, emoji: string) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const reactionIndex = post.reactions.findIndex(r => r.emoji === emoji);
    const userIdObj = new Types.ObjectId(userId);

    if (reactionIndex > -1) {
      const userIndex = post.reactions[reactionIndex].users.findIndex(u => u.equals(userIdObj));
      if (userIndex > -1) {
        // User already reacted, remove reaction
        post.reactions[reactionIndex].users.splice(userIndex, 1);
        post.reactions[reactionIndex].count -= 1;
        if (post.reactions[reactionIndex].count === 0) {
          post.reactions.splice(reactionIndex, 1);
        }
      } else {
        post.reactions[reactionIndex].users.push(userIdObj);
        post.reactions[reactionIndex].count += 1;
      }
    } else {
      post.reactions.push({ emoji, count: 1, users: [userIdObj] });
    }

    await post.save();
    return post;
  }

  async createComment(postId: string, authorId: string, body: string) {
    const comment = new this.commentModel({ postId, author: authorId, body });
    await comment.save();

    await this.postModel.findByIdAndUpdate(postId, { $inc: { replyCount: 1 } });
    
    return this.commentModel.findById(comment._id).populate('author', 'username avatarUrl role fieldFocus gamification');
  }

  async getComments(postId: string) {
    return this.commentModel.find({ postId })
      .sort({ createdAt: 1 })
      .populate('author', 'username avatarUrl role fieldFocus gamification');
  }

  async reactToComment(commentId: string, userId: string, emoji: string) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');

    const reactionIndex = comment.reactions.findIndex(r => r.emoji === emoji);
    const userIdObj = new Types.ObjectId(userId);

    if (reactionIndex > -1) {
      const userIndex = comment.reactions[reactionIndex].users.findIndex(u => u.equals(userIdObj));
      if (userIndex > -1) {
        comment.reactions[reactionIndex].users.splice(userIndex, 1);
        comment.reactions[reactionIndex].count -= 1;
        if (comment.reactions[reactionIndex].count === 0) {
          comment.reactions.splice(reactionIndex, 1);
        }
      } else {
        comment.reactions[reactionIndex].users.push(userIdObj);
        comment.reactions[reactionIndex].count += 1;
      }
    } else {
      comment.reactions.push({ emoji, count: 1, users: [userIdObj] });
    }

    await comment.save();
    return comment;
  }
}
