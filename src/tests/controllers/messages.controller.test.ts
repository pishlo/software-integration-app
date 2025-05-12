import messageController from '../../controllers/messages.controller';
import messageModel from '../../models/messageModel';
import { Request, Response } from 'express';

jest.mock('../../models/messageModel');

describe('messageController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getMessages', () => {
    it('should return all messages', async () => {
      (messageModel.find as jest.Mock).mockResolvedValue([{ name: 'test' }]);

      await messageController.getMessages({} as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([{ name: 'test' }]);
    });
  });

  describe('getMessageById', () => {
    it('should return a message by ID', async () => {
      mockReq = { params: { messageId: '123' } };
      (messageModel.findById as jest.Mock).mockResolvedValue({ name: 'found' });

      await messageController.getMessageById(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ name: 'found' });
    });

    it('should handle DB errors', async () => {
      mockReq = { params: { messageId: '123' } };
      (messageModel.findById as jest.Mock).mockRejectedValue(new Error('fail'));

      await messageController.getMessageById(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Error while getting message' });
    });
  });

  describe('addMessage', () => {
    it('should return 400 if message or name is missing', async () => {
      mockReq = { body: {} };

      await messageController.addMessage(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'missing information' });
    });

    it('should return 401 if not authenticated', async () => {
      mockReq = {
        body: { message: { name: 'Hello' } },
        session: {}, // no user
      } as unknown as Request;

      await messageController.addMessage(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'You are not authenticated' });
    });

    it('should save message and return 200', async () => {
      const mockSavedMessage = { name: 'Saved' };

      const mockSave = jest.fn().mockResolvedValue(mockSavedMessage);
      const mockMessageInstance = { ...mockSavedMessage, save: mockSave };

      (messageModel as unknown as jest.Mock).mockImplementation(() => mockMessageInstance);

      mockReq = {
        body: { message: { name: 'Hello' } },
        session: { user: { _id: 'user123' } },
      } as unknown as Request;

      await messageController.addMessage(mockReq as Request, mockRes as Response);

      expect(mockSave).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Saved' }));
    });

    it('should handle DB errors on save', async () => {
      const error = new Error('fail');
      const mockMessageInstance = {
        save: jest.fn().mockRejectedValue(error),
      };

      (messageModel as unknown as jest.Mock).mockImplementation(() => mockMessageInstance);

      mockReq = {
        body: { message: { name: 'fail' } },
        session: { user: { _id: 'user123' } },
      } as unknown as Request;

      await messageController.addMessage(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to add message' });
    });
  });

  describe('editMessage', () => {
    it('should return 400 if name or messageId is missing', async () => {
      mockReq = { body: {}, params: {} };

      await messageController.editMessage(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'missing information' });
    });

    it('should save message and return 200', async () => {
      const mockSave = jest.fn().mockResolvedValue(undefined); // save returns nothing
      const mockMessageInstance = { name: 'Saved', save: mockSave };

      (messageModel as unknown as jest.Mock).mockImplementation(() => mockMessageInstance);

      mockReq = {
        body: { message: { name: 'Hello' } },
        session: { user: { _id: 'user123' } },
      } as unknown as Request;

      await messageController.addMessage(mockReq as Request, mockRes as Response);

      expect(mockSave).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockMessageInstance);
    });

    it('should handle DB error on update', async () => {
      mockReq = { body: { name: 'fail' }, params: { messageId: '123' } };
      (messageModel.findByIdAndUpdate as jest.Mock).mockRejectedValue(new Error('fail'));

      await messageController.editMessage(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to update message' });
    });
  });

  describe('deleteMessage', () => {
    it('should return 400 if messageId is missing', async () => {
      mockReq = { params: {} };

      await messageController.deleteMessage(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'missing information' });
    });

    it('should delete message and return 200', async () => {
      mockReq = { params: { messageId: '123' } };
      (messageModel.findByIdAndDelete as jest.Mock).mockResolvedValue({});

      await messageController.deleteMessage(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Message deleted' });
    });

    it('should handle DB error on delete', async () => {
      mockReq = { params: { messageId: '123' } };
      (messageModel.findByIdAndDelete as jest.Mock).mockRejectedValue(new Error('fail'));

      await messageController.deleteMessage(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to delete message' });
    });
  });
});
