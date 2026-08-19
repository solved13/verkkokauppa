import mongoose from 'mongoose'


const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
})


// (User.find(), User.create() 
export default mongoose.model('User', userSchema)
