import Rating, { RatingDocument } from '../../models/ratingModel';
import { jest } from '@jest/globals';

describe('Rating Model Unit Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should save a valid rating successfully', async () => {
    const mockRatingData: Partial<RatingDocument> = {
      movie_id: 101,
      email: 'test@example.com',
      rating: 5,
    };

    const mockSavedRating: Partial<RatingDocument> = {
      _id: 'mocked_id' as any,
      ...mockRatingData,
      created_at: new Date(),
    };

    jest.spyOn(Rating.prototype, 'save').mockResolvedValue(mockSavedRating as RatingDocument);

    const rating = new Rating(mockRatingData);
    const savedRating = await rating.save();

    expect(savedRating._id).toBe('mocked_id');
    expect(savedRating.rating).toBe(5);
    expect(savedRating.email).toBe('test@example.com');
    expect(savedRating.created_at).toBeInstanceOf(Date);
  });

  it('should throw a validation error when required fields are missing', async () => {
    const rating = new Rating({});

    const mockError = new Error('Validation failed');
    jest.spyOn(Rating.prototype, 'save').mockRejectedValue(mockError);

    await expect(rating.save()).rejects.toThrow('Validation failed');
  });

  it('should throw a validation error if rating is out of range', async () => {
    const invalidRating = new Rating({
      movie_id: 42,
      email: 'fail@example.com',
      rating: 10, // invalid
    });

    const mockError = new Error('Validation failed: rating must be between 0 and 5');
    jest.spyOn(Rating.prototype, 'save').mockRejectedValue(mockError);

    await expect(invalidRating.save()).rejects.toThrow('Validation failed');
  });
});
