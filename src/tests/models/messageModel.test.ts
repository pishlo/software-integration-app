import Message, { MessageDocument } from '../../models/messageModel';
import { Types } from 'mongoose';
import { jest } from '@jest/globals';

describe('Message Model Unit Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should save a valid message successfully', async () => {
    const mockMessageData: Partial<MessageDocument> = {
      name: 'Hello there',
      user: new Types.ObjectId(), // mock user reference
    };

    const mockSavedMessage: Partial<MessageDocument> = {
      _id: 'mocked_id' as any,
      ...mockMessageData,
      created_at: new Date(),
      updated_at: new Date(),
    };

    jest.spyOn(Message.prototype, 'save').mockResolvedValue(mockSavedMessage as MessageDocument);

    const message = new Message(mockMessageData);
    const savedMessage = await message.save();

    expect(savedMessage._id).toBe('mocked_id');
    expect(savedMessage.name).toBe('Hello there');
    expect(savedMessage.user).toBeInstanceOf(Types.ObjectId);
  });

  it('should throw a validation error when user is missing', async () => {
    const message = new Message({ name: 'Test message' });

    const mockError = new Error('Validation failed: user is required');
    jest.spyOn(Message.prototype, 'save').mockRejectedValue(mockError);

    await expect(message.save()).rejects.toThrow('Validation failed');
  });
});
