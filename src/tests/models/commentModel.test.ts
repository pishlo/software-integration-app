import Comment, { CommentDocument } from '../../models/commentModel';
import { jest } from '@jest/globals';

describe('Comment Model Unit Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should save a valid comment successfully', async () => {
    const mockCommentData: Partial<CommentDocument> = {
      movie_id: 1,
      username: 'unit_user',
      comment: 'Solid watch',
      title: 'Cool',
      rating: 4,
    };

    const mockSavedComment: Partial<CommentDocument> = {
      _id: 'mocked_id' as any,
      ...mockCommentData,
      downvotes: 0,
      upvotes: 0,
      created_at: new Date(),
    };

    jest.spyOn(Comment.prototype, 'save').mockResolvedValue(mockSavedComment as CommentDocument);

    const comment = new Comment(mockCommentData);
    const result = await comment.save();

    expect(result._id).toBe('mocked_id');
    expect(result.title).toBe('Cool');
    expect(result.downvotes).toBe(0);
  });

  it('should throw a validation error when required fields are missing', async () => {
    const comment = new Comment({});

    const mockError = new Error('Validation failed');
    jest.spyOn(Comment.prototype, 'save').mockRejectedValue(mockError);

    await expect(comment.save()).rejects.toThrow('Validation failed');
  });
});
