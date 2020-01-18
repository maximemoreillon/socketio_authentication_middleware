/*
The middleware returns the function that is used by socket.use
This is so as to acces the socket object
*/

module.exports = function (socket, authentication_function){

  // return the actual middleware
  return function(packet, next){

    // Parsing packet
    var ws_event = packet[0];
    var ws_payload = packet[1];

    // If client was previosuly authorized
    if(socket.authenticated) {

      // Unless the client is logging out, allow him to continue
      if(ws_event === 'logout') {
        socket.authenticated = false;
        socket.leave('authenticated');
        socket.emit('unauthorized','logged out');
      }
      else {
        next();
      }
    }
    else {
      // If the client is not authenticated, only allow him to login
      if(ws_event === 'authentication'){
        // The user is trying to authenticate

        authentication_function(ws_payload, (err, res) => {
          if(res){
            // The token is valid

            // For future connections, no need to check anymore
            socket.authenticated = true;

            // Joining room
            socket.join('authenticated');

            // Emit confirmation message
            socket.emit('authenticated',res);
          }
          else {
            // JWT is invalid
            socket.emit('unauthorized','Invalid JWT');
          }
        })

      }
      else {
        // The user is trying to do something else than authenticating
        socket.emit('unauthorized','Authentication required');
      }
    }
  }

}
