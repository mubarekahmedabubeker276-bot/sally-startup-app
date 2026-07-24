const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// PASTE YOUR MONGODB CONNECTION STRING LINK HERE
const MONGO_URI = "mongodb+srv://YOUR_USER:YOUR_PASS@cluster0.xxxx.mongodb.net/sally_startup?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log("Connected to MongoDB Cloud Database!"))
    .catch(err => console.error("Database connection error:", err));

// Database Schemas for persistent items
const MenuSchema = new mongoose.Schema({ name: String, desc: String, price: String, img: String });
const OrderSchema = new mongoose.Schema({ customer: String, items: String, total: String, timestamp: String });

const MenuItem = mongoose.model('MenuItem', MenuSchema);
const OrderItem = mongoose.model('OrderItem', OrderSchema);

// Setup default screenshot dishes if database is empty
async function initDatabase() {
    const count = await MenuItem.countDocuments();
    if(count === 0) {
        await MenuItem.insertMany([
            { name: "Cheeseburger Deluxe", desc: "Juicy beef patty, melted cheese, fresh lettuce & tomato.", price: "8.99", img: "" },
            { id: 2, name: "Pepperoni Pizza", desc: "Classic pizza with pepperoni, mozzarella, and tangy tomato sauce.", price: "11.99", img: "" },
            { id: 3, name: "Caesar Salad", desc: "Crisp romaine, parmesan, croutons, and creamy Caesar dressing.", price: "7.50", img: "" }
        ]);
    }
}
initDatabase();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/api/menu', async (req, res) => res.json(await MenuItem.find()));
app.get('/api/admin/orders', async (req, res) => res.json(await OrderItem.find()));

app.post('/api/menu/add', upload.single('foodImage'), async (req, res) => {
    const { name, desc, price } = req.body;
    const imgUrl = req.file ? `/uploads/${req.file.filename}` : '';
    const newDish = new MenuItem({ name, desc, price: parseFloat(price).toFixed(2), img: imgUrl });
    await newDish.save();
    res.json({ success: true, message: "New dish added successfully!" });
});

app.post('/api/orders/checkout', async (req, res) => {
    const { customerName, cartItems, totalAmount } = req.body;
    const newOrder = new OrderItem({
        customer: customerName,
        items: cartItems,
        total: totalAmount,
        timestamp: new Date().toLocaleTimeString()
    });
    await newOrder.save();
    res.json({ success: true, message: "Order placed! Preparing your meal." });
});

// NEW FEATURE: DELETE / COMPLETE ORDER ROUTE
app.delete('/api/admin/orders/:id', async (req, res) => {
    await OrderItem.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Order marked as complete and delivered!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("SERVER_IS_RUNNING"));
