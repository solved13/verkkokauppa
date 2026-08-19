import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true, enum: ['old', 'new'] }, 
  image: { type: String, default: '' },
  stock: { type: Number, default: 0 },
  description: { type: String, default: '' },
 
  colors: [
    {
      name: { type: String, default: '' },
      image: { type: String, default: '' },
    },
  ],
})

export default mongoose.model('Product', productSchema)
