const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://yaelkol:yaelkol24@bam.yvw03.mongodb.net/?retryWrites=true&w=majority&appName=Bam', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Connected to MongoDB Atlas");
}).catch((error) => {
    console.error("Error connecting to MongoDB Atlas:", error);
});

module.exports = mongoose;