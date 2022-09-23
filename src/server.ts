import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const app = express()
app.use(cors())
app.use(express.json())
const port = 5000

const SECRET = "J16"

function getToken(id: number) {
    return jwt.sign({ id: id }, SECRET, {
        expiresIn: '5 minutes'
    })
}

async function getCurrentUser(token: string) {
    // @ts-ignore
    const { id } = jwt.verify(token, SECRET)
    const user = await prisma.user.findUnique({ where: { id }, include: { transactions: true } })
    return user
}

app.get('/validate', async (req, res) => {
    try {
        if (req.headers.authorization) {
            const user = await getCurrentUser(req.headers.authorization)
            // @ts-ignore
            res.send({ user, token: getToken(user.id)})
        }
    }

    catch (error) {
        // @ts-ignore
        res.status(400).send({ error: error.message })

    }
})

app.get('/transactions', async (req, res) => {
    const transactions = await prisma.transaction.findMany({ include: { user: true } })
    res.send(transactions)
})

app.get('/users', async (req, res) => {
    const users = await prisma.user.findMany()
    res.send(users)
})

app.get('/users/:id', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) }, include: { transactions: true } })
        if (user) {
            res.send(user)
        }
        else {
            res.status(404).send({ error: "User not found!" })
        }
    }
    catch (error) {
        // @ts-ignore
        res.status(400).send({ error: error.message })
    }
})

app.post('/sign-up', async (req, res) => {
    try {
        const match = await prisma.user.findUnique({ where: { email: req.body.email } })
        if (match) {
            res.status(400).send({ error: "User already exists!" })
        }
        else {
            const user = await prisma.user.create({
                data: {
                    email: req.body.email,
                    password: bcrypt.hashSync(req.body.password)
                },
                include: {transactions:true}
            }, )
            res.send({ user: user, token: getToken(user.id) })
        }
    }

    catch (error) {
        // @ts-ignore
        res.status(400).send({ error: error.message })
    }


})

app.post('/log-in', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { email: req.body.email }, include: {transactions:true} })

        if (user && bcrypt.compareSync(req.body.password, user.password)) {
            res.send({ user: user, token: getToken(user.id) })
        }
        else {
            res.status(400).send({ error: "User does not exist with these credentials" })
        }
    }

    catch (error) {
        // @ts-ignore
        res.status(400).send({ error: error.message })
    }

})

app.listen(port)
