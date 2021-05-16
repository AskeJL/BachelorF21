const path = require('path')
const express = require('express')

const app = express()
const publicDirPath = path.join(__dirname, './public')

app.use(express.static(publicDirPath, {extensions: ['html']}))

app.get('/', (req, res) => {
    res.sendFile('./public/index.html', { root: __dirname });
    res.sendFile('./public/janus.js', { root: __dirname });
    res.sendFile('./public/videoroomtest.js', { root: __dirname });
});

app.listen(80, () => {
    console.log('Server is up and running on PORT 80.')
})