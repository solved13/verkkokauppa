import mongoose from 'mongoose'


const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  total: { type: Number, required: true },
  status: { type: String, default: 'odottaa maksua' },
  createdAt: { type: Date, default: Date.now },
  paidAt: { type: Date },
})

export default mongoose.model('Order', orderSchema)
