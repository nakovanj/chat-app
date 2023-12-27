const socket = io()

// socket.on('countUpdated', (data) => {
//     console.log('The count has been updated: ', data)
// })

// document.querySelector('#incrementId')
//         .addEventListener('click', () => {
//             console.log('Clicked')
//             socket.emit('increment')
//         })

// Elements
const $messageForm = document.querySelector('#msgFormId')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationId = document.querySelector('#locationId')
const $divMessages = document.querySelector('#messages')

// Templates 
const messageTemplate =
    document.querySelector('#message-template').innerHTML
const locationTemplate =
    document.querySelector('#location-template').innerHTML
const sidebarTemplate =
    document.querySelector('#sidebar-template').innerHTML

// Options
// Qr script
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
    // New message element
    const $newMessage = $divMessages.lastElementChild

    // Height of the new message
    const newMsgStyles = getComputedStyle($newMessage) //browsers function
    const newMsgMargin = parseInt(newMsgStyles.marginBottom)
    const newMsgHeight = $newMessage.offsetHeight + newMsgMargin

    // Visible margin
    const visibleHeight = $divMessages.offsetHeight

    // height of div msg container
    const containerHeight = $divMessages.scrollHeight

    // how far we scrolled
    const scrollOffset = $divMessages.scrollTop + visibleHeight

    if (containerHeight - newMsgHeight <= scrollOffset) {
        $divMessages.scrollTop = $divMessages.scrollHeight
    }

}
socket.on('message', (data) => {
    // console.log(data)
    const html = Mustache.render(messageTemplate, {
        username: data.username,
        messageData: data.text,
        //moment is js lib loaded in index.html
        createdAt: moment(data.createdAt).format('HH:mm:ss')
    })
    $divMessages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage', (data) => {
   // console.log(data)
    const html = Mustache.render(locationTemplate, {
        username: data.username,
        locationUrl: data.url,
        createdAt: moment(data.createdAt).format('HH:mm:ss')
    })
    $divMessages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    //disable form
    $messageFormButton.setAttribute('disabled', 'disabled')
    const msgInput = e.target.elements.messageInput
    const message = msgInput.value
    socket.emit('sendMessage', message, (error) => {

        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        //the last argument is function run
        // when event is acknowledged
        if (error) {
            return console.log(error)
        }
        //console.log('The message was delivered')
    })
})



$locationId.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by browser!')
    }

    $locationId.setAttribute('disabled', 'disabled')

    //does not support promisses
    navigator.geolocation.getCurrentPosition((position) => {
        //  console.log('##Pos: ', position)
        const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }
        socket.emit('sendLocation', loc, () => {
           // console.log('Location shared!')
            $locationId.removeAttribute('disabled')

        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }

})

