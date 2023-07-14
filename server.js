
const fs = require('fs')
const express = require('express')
const cors = require("cors")
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const config = require('./config')
const bodyParser = require("body-parser");
const app = express()
const originCors = [
    "http://localhost:3000"
];
const hash = (s) => {
    return crypto.createHash('sha256').update(s).digest('hex')
}

const generateTokenPair = (data) => {
    const accessToken = jwt.sign(
        data,
        config.atSecret,
        { expiresIn: config.atLife }
    )
    const refreshToken = jwt.sign(
        { atTokenHash: hash(accessToken) },
        config.rtSecret,
        { expiresIn: config.rtLife }
    )
    const tokensData = JSON.parse(fs.readFileSync('tokensData.json'))
    tokensData[refreshToken] = {
        accessToken,
        data
    }
    fs.writeFileSync('tokensData.json', JSON.stringify(tokensData))
    return {
        accessToken,
        refreshToken
    }
}

const getTokenData = (token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, config.atSecret, (err, decoded) => {
            if (err) {
                reject(err)
            } else {
                resolve(decoded)
            }
        })
    })
}

app.use(cors({
    origin: originCors,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
}))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/reg',async (req, res)=>{
    const newUser = req.body 
    console.log(newUser)
    const usersData = fs.readFileSync('usersData.json')
    const parsedUsers = JSON.parse(usersData)
    parsedUsers.push(newUser) 
    const newData = JSON.stringify(parsedUsers)
    fs.writeFileSync('usersData.json', newData)
    res.status = 200
    res.send({
        message: 'Новый пользователь зарегистрирован'
    })
})

app.post('/auth', async (req, res)=>{
    const authUser = req.body
    const usersData = fs.readFileSync('usersData.json')
    const parsedUsers = JSON.parse(usersData)
    const existedUser = parsedUsers.find((user)=>
        user.name === authUser.name
    )
    if(existedUser) {
        if (existedUser.password !== authUser.password) {
            res.send({
                isUserLoggedIn: false,
                message: 'Ошибка - неверный пароль'
            })
        }
        const { accessToken, refreshToken } = generateTokenPair({
            name: existedUser.name
        })

        res.status = 200
        res.send({
            message: "Успешно",
            accessToken,
            refreshToken
        })
    } else {
        console.log('Попытка авторизации несуществующего пользователя')
        res.send({
            message: 'Ошибка - пользователя с таким именем не существует'
        })
    }
})


app.listen('3011', ()=>{
    console.log('server is listening on port 3011')
});



