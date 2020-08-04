/*
The middleware returns the function that is used by socket.use
This is so as to acces the socket object
*/

module.exports = (socket, authentication_function) => {

  // return the actual middleware
  return (packet, next) => {

    // Parsing packet
    let ws_event = packet[0]
    let ws_payload = packet[1]

    // If client was previosuly authorized
    if(socket.authenticated) {

      // Unless the client is logging out, allow him to continue
      if(ws_event === 'logout') {
        socket.authenticated = false
        socket.leave('authenticated')
        socket.emit('unauthorized','logged out')
      }
      else {
        next()
      }

    }
    else {
      // If The user is trying to do something else than authenticating
      if(ws_event !== 'authentication') {
        return socket.emit('unauthorized','Authentication required')
      }

      // If The user is trying to authenticate, forward credentials to authentication callback
      // IDEA: Could pass the socket here
      authentication_function(ws_payload, (error, response) => {
        if(err) return socket.emit('unauthorized', error)
          // The user authenticated properly

        // For future connections, no need to check anymore
        socket.authenticated = true

        // Joining room of authenticated users
        socket.join('authenticated')

        // Emit confirmation message
        socket.emit('authenticated', response)

      })

    }
  }

}
