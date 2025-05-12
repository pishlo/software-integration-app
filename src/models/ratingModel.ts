import { Schema, model, Document } from 'mongoose';

// Define the interface for a Rating document
export interface RatingDocument extends Document {
  movie_id: number;
  email: string;
  rating: number;
  created_at?: Date;
}

const ratingSchema = new Schema<RatingDocument>(
  {
    movie_id: {
      type: Number,
      required: [true, 'movie is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      required: [true, 'rating is required'],
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: false, // Not used in the original schema
    },
  }
);

const Rating = model<RatingDocument>('Rating', ratingSchema);

export default Rating;
