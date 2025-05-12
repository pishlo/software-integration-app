import User from '../../models/userModel';
import { jest } from '@jest/globals';
import { Types } from 'mongoose';

describe('User Model Unit Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should save a valid user successfully', async () => {
    const mockUserData = {
      username: 'mockuser',
      email: 'mockuser@example.com',
      password: 'securePassword123',
      messages: [new Types.ObjectId()],
    };

    const mockSavedUser = {
      _id: 'mocked_id' as any,
      ...mockUserData,
      created_at: new Date(),
      updated_at: new Date(),
    };

    jest.spyOn(User.prototype, 'save').mockResolvedValue(mockSavedUser as any);

    const user = new User(mockUserData);
    const savedUser = await user.save();

    expect(savedUser._id).toBe('mocked_id');
    expect(savedUser.email).toBe('mockuser@example.com');
    expect(savedUser.username).toBe('mockuser');
    expect(savedUser.messages.length).toBe(1);
  });

  it('should throw a validation error if required fields are missing', async () => {
    const user = new User({});

    const mockError = new Error('Validation failed');
    jest.spyOn(User.prototype, 'save').mockRejectedValue(mockError);

    await expect(user.save()).rejects.toThrow('Validation failed');
  });

  it('should throw a validation error if email is not unique', async () => {
    const duplicateUser = new User({
      email: 'duplicate@example.com',
      password: 'somePassword123',
    });

    const mockError = new Error('E11000 duplicate key error');
    jest.spyOn(User.prototype, 'save').mockRejectedValue(mockError);

    await expect(duplicateUser.save()).rejects.toThrow('E11000 duplicate key error');
  });
});
