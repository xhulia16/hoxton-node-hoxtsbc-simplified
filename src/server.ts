import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const app = express()
app.use(cors())
app.use(express.json())
const port = 5000

app.get('/users', async (req, res) => {
const users= await prisma.user.findMany()
res.send(users)
})

app.post('/sign-up', async (req, res) => {
    const user = await prisma.user.create({
        data: {
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password)
        }
    })
    res.send(user)
})

app.post('/log-in', async (req, res) => {
    req.body.password

    const user = await prisma.user.findUnique({ where: { email: req.body.email } })

    if (user && bcrypt.compareSync(req.body.password, user.password)){
        res.send(user)
    }
    else {
        res.status(400).send({ message: "User does not exist with these credentials" })
    }
})

app.listen(port)
