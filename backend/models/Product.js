import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true, enum: ['old', 'new'] }, // тільки ці два значення
  image: { type: String, default: '' },
  stock: { type: Number, default: 0 },
})

export default mongoose.model('Product', productSchema)
