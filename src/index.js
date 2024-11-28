const express = require('express')
require('./db/mongoose')
const cors = require('cors');
const userRouter = require('./routers/userRouter');
const bamRequestRouter = require('./routers/bamRequestRouter')
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json())
app.use(cors());

app.use(userRouter)
app.use(bamRequestRouter)


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});