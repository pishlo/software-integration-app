import { Schema, model, Document, Types } from 'mongoose';

// Define the TypeScript interface for a Message document
export interface MessageDocument extends Document {
  name?: string;
  user: Types.ObjectId;
  created_at?: Date;
  updated_at?: Date;
}

const messageSchema = new Schema<MessageDocument>(
  {
    name: {
      type: String,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

const Message = model<MessageDocument>('Message', messageSchema);

export default Message;