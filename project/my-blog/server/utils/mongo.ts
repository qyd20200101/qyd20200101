import mongoose from 'mongoose'

const globalForMongoose = globalThis as unknown as {
  mongooseConn?: typeof mongoose
}

export async function connectMongo() {
  const config = useRuntimeConfig()

  if (!config.mongoUri) {
    throw createError({
      statusCode: 500,
      statusMessage: 'MONGODB_URI 未配置'
    })
  }

  if (globalForMongoose.mongooseConn) {
    return globalForMongoose.mongooseConn
  }

  await mongoose.connect(config.mongoUri)
  globalForMongoose.mongooseConn = mongoose

  return mongoose
}
