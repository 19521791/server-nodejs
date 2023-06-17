const app = require("./app");
const connectDB = require("./config/db.config");

const { PORT } = process.env;

// connectDB();
app.listen(PORT, () => console.log(`App are listening at ${PORT}`));
