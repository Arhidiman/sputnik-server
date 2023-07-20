
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


app.use(cors({
    origin: originCors,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
}))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/reg',async (req, res)=>{
    const newUser = req.body 
    const usersData = fs.readFileSync('usersData.json')
    const parsedUsers = JSON.parse(usersData)
    const existedUser = parsedUsers.find((user)=>user.name === newUser.name)
    console.log(existedUser)
    if(!existedUser) {
        parsedUsers.push(newUser) 
        const newData = JSON.stringify(parsedUsers)
        console.log('Регистрация нового пользователя')
        fs.writeFileSync('usersData.json', newData)
        res.status = 200
        res.send({
            name: newUser.name,
            password: newUser.password,
            message: 'Новый пользователь зарегистрирован'
        })
    } else {
        console.log('Имя занято')
        res.status = 200
        res.send({
            message: 'Пользователь с таким именем уже существует'
        })
    }
})

app.post('/auth', async (req, res)=>{
    const authUser = req.body
    const usersData = fs.readFileSync('usersData.json')
    const parsedUsers = JSON.parse(usersData)
    const existedUser = parsedUsers.find((user)=>
        user.name === authUser.name
    )
    if(existedUser) {
        console.log(existedUser, authUser, 'пользователь существует')
        if (existedUser.password !== authUser.password) {
            res.status = 200
            res.send({
                message: 'Ошибка - неверный пароль'
            })
            console.log('Неверный пароль')
        } 
        if (existedUser.password === authUser.password) {
            const { accessToken, refreshToken } = generateTokenPair({name: existedUser.name})
            res.status = 200
            res.send({
                message: "Успешно",
                accessToken,
                refreshToken
            })
        }
    } else {
        console.log('Ошибка - пользователя с таким именем не существует')
        res.send({
            message: 'Ошибка - пользователя с таким именем не существует'
        })
    }
})

app.post('/check',async (req, res)=>{
    const checkedUser = req.body 
    const usersData = fs.readFileSync('usersData.json')
    const parsedUsers = JSON.parse(usersData)
    const existedUser = parsedUsers.find((user)=>user.name === checkedUser.name)
    console.log(checkedUser, existedUser)
    if (existedUser) {
        console.log('user exists')
        if(existedUser.password === checkedUser.password) {
            res.status = 200
            res.send(existedUser)
        } else {
            console.log('atata')
            res.status = 200
            res.send({
                name: existedUser.name,
                password: null
            })
        }
    } else {
        res.status = 200
        res.send({
            name: null,
            password: null
        })
    }
})

app.listen('3011', ()=>{
    console.log('server is listening on port 3011')
});



