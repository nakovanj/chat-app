const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage,
    generateLocationMessage } = require('./utils/messages')
const
    {
        addUser,
        removeUser,
        getUser,
        getUsersInRoom
    } = require('./utils/user')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
   // console.log('Someone connected')
    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username: username, room: room })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)
        // io.to().emit - room
        // socket.broadcast.to().emit

        socket.emit('message', generateMessage('chatBot', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message',
            generateMessage('chatBot', `${user.username} has joined`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()

    })

    socket.on('sendMessage', (data, callbackAck) => {
        user = getUser(socket.id)
        if (!user) {
            callbackAck()
        }

        const filter = new Filter()
        if (filter.isProfane(data)) {
            return callbackAck('Profanity is not allowed')
        }

        io.to(user.room).emit('message', generateMessage(user.username, data))
        callbackAck()
    })
    socket.on('sendLocation', (data, ack) => {
        const url = 'https://google.com/maps?q=' + data.latitude + ','
            + data.longitude
        user = getUser(socket.id)
        if (!user) {
            ack()
        }

        io.to(user.room).emit('locationMessage',
            generateLocationMessage(user.username, url))
        ack()
    })

    socket.on('disconnect', () => {
        const remUser = removeUser(socket.id)
        if (remUser) {
            io.to(remUser.room).emit('message',
                generateMessage('chatBot', `${remUser.username} has left!`))
            io.to(remUser.room).emit('roomData', {
                room: remUser.room,
                users: getUsersInRoom(remUser.room)
            })
        }
    })

})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})  