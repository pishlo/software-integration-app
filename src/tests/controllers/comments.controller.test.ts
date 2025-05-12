import commentsController from '../../controllers/comments.controller';
import commentModel from '../../models/commentModel';
import logger from '../../middleware/winston';
import statusCodes from '../../constants/statusCodes';
import { Request, Response } from 'express';

jest.mock('../../models/commentModel');
jest.mock('../../middleware/winston');

describe('commentsController.addComment', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      params: { movie_id: '1' },
      body: {
        rating: 4,
        username: 'user',
        comment: 'Great movie',
        title: 'Loved it',
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return 400 if parameters are missing or invalid', async () => {
    mockReq.params = {}; // no movie_id
    await commentsController.addComment(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(statusCodes.badRequest);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Missing parameters' });
  });

  it('should save comment and return 200 on success', async () => {
    const mockSave = jest.fn().mockResolvedValue({});

    (commentModel as unknown as jest.Mock).mockImplementation(() => ({
      save: mockSave,
    }));

    await commentsController.addComment(mockReq as Request, mockRes as Response);

    expect(mockSave).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(statusCodes.success);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Comment added' });
  });

  it('should return 503 if save throws', async () => {
    const error = new Error('DB error');
    (commentModel as unknown as jest.Mock).mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(error),
    }));

    await commentsController.addComment(mockReq as Request, mockRes as Response);

    expect(logger.error).toHaveBeenCalledWith(error.stack);
    expect(mockRes.status).toHaveBeenCalledWith(statusCodes.queryError);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Exception occurred while adding comment',
    });
  });
});

describe('commentsController.getCommentsById', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = { params: { movie_id: '1' } };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return 400 if movie_id is missing or invalid', async () => {
    mockReq.params = {}; // missing movie_id

    await commentsController.getCommentsById(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(statusCodes.badRequest);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'movie id missing' });
  });

  it('should return 200 and comments on success', async () => {
    const mockComments = [{ comment: 'Nice!' }];
    (commentModel.find as jest.Mock).mockResolvedValue(mockComments);

    await commentsController.getCommentsById(mockReq as Request, mockRes as Response);

    expect(commentModel.find).toHaveBeenCalledWith({ movie_id: 1 });
    expect(mockRes.status).toHaveBeenCalledWith(statusCodes.success);
    expect(mockRes.json).toHaveBeenCalledWith({ comments: mockComments });
  });

  it('should return 503 if find throws', async () => {
    const error = new Error('DB fail');
    (commentModel.find as jest.Mock).mockRejectedValue(error);

    await commentsController.getCommentsById(mockReq as Request, mockRes as Response);

    expect(logger.error).toHaveBeenCalledWith(error.stack);
    expect(mockRes.status).toHaveBeenCalledWith(statusCodes.queryError);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Exception occured while fetching comments',
    });
  });
});
