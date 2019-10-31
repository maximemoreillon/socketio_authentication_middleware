/*
The middleware returns the function that is used by socket.use
This is so as to acces the socket object
*/

exports.authentication_middleware = function (socket, token_verification, credentials_verification){

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
      if(ws_event === 'token_authentication'){
        // The user is trying to authenticate using a JWT

        // TODO: VERIFY TOKEN PROPERLY
        token_verification(ws_payload.jwt, function(err, res){
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

      else if(ws_event === 'credentials_authentication'){
        // The client is trying to login with a username/password combo

        credentials_verification(ws_payload.credentials, function(err,res){
          if(res){
            // The credentials are correct

            // Allow access for future packets
            socket.authenticated = true;

            // joining room
            socket.join('authenticated');

            // Emit a token so the user does not need to login for next connections
            socket.emit('authenticated', res);
          }
          else {
            // Login Credentials are wrong
            socket.emit('unauthorized','Invalid credentials');
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
