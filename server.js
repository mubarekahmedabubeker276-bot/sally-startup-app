const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configure storage logic for incoming restaurant menu images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

let currentMenu = [
    { id: 1, name: "Cheeseburger Deluxe", desc: "Juicy beef patty, melted cheese, fresh lettuce & tomato.", price: "8.99", img: "" },
    { id: 2, name: "Pepperoni Pizza", desc: "Classic pizza with pepperoni, mozzarella, and tangy tomato sauce.", price: "11.99", img: "" },
    { id: 3, name: "Caesar Salad", desc: "Crisp romaine, parmesan, croutons, and creamy Caesar dressing.", price: "7.50", img: "" }
];
let ordersQueue = [];

app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/api/menu', (req, res) => res.json(currentMenu));
app.get('/api/admin/orders', (req, res) => res.json(ordersQueue));

// Endpoint to handle new product processing
app.post('/api/menu/add', upload.single('foodImage'), (req, res) => {
    const { name, desc, price } = req.body;
    const imgUrl = req.file ? `/uploads/${req.file.filename}` : '';
    
    currentMenu.push({
        id: Date.now(),
        name,
        desc,
        price: parseFloat(price).toFixed(2),
        img: imgUrl
    });
    res.json({ success: true, message: "New dish added successfully!" });
});

// Endpoint to process customer checkout actions
app.post('/api/orders/checkout', (req, res) => {
    const { customerName, cartItems, totalAmount } = req.body;
    ordersQueue.push({
        id: Date.now(),
        customer: customerName,
        items: cartItems,
        total: totalAmount,
        timestamp: new Date().toLocaleTimeString()
    });
    res.json({ success: true, message: "Order placed! Preparing your meal." });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log("SERVER_IS_RUNNING"));
