import mongoose from 'mongoose'

// Схема користувача — визначає, які поля зберігаються в MongoDB
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // unique — не можна два однакових email
  passwordHash: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
})

// mongoose.model перетворює схему на модель, з якою можна працювати
// (User.find(), User.create() тощо)
export default mongoose.model('User', userSchema)
