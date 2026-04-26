import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'

const PostSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    type: { type: String, default: '' },
    category: { type: String, default: '' },
    theme: { type: String, default: '' },
    tags: { type: [String], default: [] },
    description: { type: String, default: '' },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft'
    }
  },
  {
    timestamps: true
  }
)

export type PostInput = InferSchemaType<typeof PostSchema>

export default (mongoose.models.Post as Model<PostInput>) ||
  mongoose.model<PostInput>('Post', PostSchema)
