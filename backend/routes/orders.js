import { Router } from "express";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.post("/", async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Ostoskori on tyhjä" });
  }

  try {
    const products = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res
          .status(400)
          .json({ error: `Tuotetta id=${item.productId} ei löydy` });
      }
      const quantity = item.quantity || 1;
      if (product.stock < quantity) {
        return res.status(400).json({
          error: `Tuotetta "${product.name}" ei ole tarpeeksi varastossa (jäljellä: ${product.stock} kpl)`,
        });
      }
      products.push({ product, quantity });
    }

    let total = 0;
    const orderItems = [];

    for (const { product, quantity } of products) {
      total += product.price * quantity;
      product.stock -= quantity;
      await product.save();

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity,
      });
    }

    const newOrder = await Order.create({
      userId: req.userId,
      items: orderItems,
      total,
      status: "odottaa maksua",
    });

    res.json(newOrder);
  } catch (err) {
    res.status(500).json({ error: "Tilauksen luonti epäonnistui" });
  }
});

router.post("/:id/pay", async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!order) {
      return res.status(404).json({ error: "Tilausta ei löydy" });
    }

    order.status = "maksettu";
    order.paidAt = new Date();
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Maksun käsittely epäonnistui" });
  }
});

router.get("/", async (req, res) => {
  try {
    const myOrders = await Order.find({ userId: req.userId });
    res.json(myOrders);
  } catch (err) {
    res.status(500).json({ error: "Tilausten haku epäonnistui" });
  }
});

export default router;
