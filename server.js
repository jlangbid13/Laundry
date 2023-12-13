require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const argon2 = require('argon2'); // Import argon2
const path = require('path');
const scheduleRoutes = require('./routes/scheduleRoutes');

const app = express();



// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(express.static(path.join(__dirname, "./frontend/build")))

// Schedule routes
app.use('/api/schedule', scheduleRoutes);



  app.use("*", function(req, res) {
    res.sendFile(path.join(__dirname, "./frontend/build/index.html"))
  })



// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to database'))
  .catch((err) => console.log(err));

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});
const User = mongoose.model("User", userSchema);

// Authentication routes
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email }).exec();
        if (user) {
            const passwordMatch = await argon2.verify(user.password, password);
            if (passwordMatch) {
                res.send({ message: "Login Successful", user: user });
            } else {
                res.send({ message: "Password didn't match" });
            }
        } else {
            res.send({ message: "User not registered" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});

app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email: email }).exec();
        if (existingUser) {
            res.send({ message: "User already registered" });
        } else {
            const hashedPassword = await argon2.hash(password); // Hash the password
            const user = new User({
                name,
                email,
                password: hashedPassword,
            });
            await user.save();
            res.send({ message: "Successfully Registered" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});


// Server start
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
