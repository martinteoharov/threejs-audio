require('dotenv').config()
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static('static'));
app.use('/three', express.static('node_modules/three'));

app.listen(PORT, () => {
    console.log(`INFO: Server listening on port: ${ PORT }`)
});