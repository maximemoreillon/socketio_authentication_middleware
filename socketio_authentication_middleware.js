/*
The middleware returns the function that is used by socket.use
This is so as to acces the socket object
*/

exports.authentication_middleware = function (socket, token_verification, credentials_verification){

  // return the actual middleware
  return function(packet, next){

    // If client previosuly authorized or posesses a valid JWT
    if(socket.authenticated) {
      next();
    }
    else {
      // If the client is not authenticated, only allow him to login

      // Parsing packet
      var ws_event = packet[0];
      var ws_payload = packet[1];

      if(ws_event === 'authenticate'){
        // The user is trying to authenticate using a JWT

        // TODO: VERIFY TOKEN PROPERLY
        if(token_verification(ws_payload.token)){
          // The token is valid

          // For future connections, no need to check anymore
          socket.authenticated = true;

          // NOT SURE ABOUT THIS
          socket.emit('authenticated',{});
        }
        else {
          // JWT is invalid
          socket.emit('unauthorized','Invalid JWT');
        }
      }

      else if(ws_event === 'login'){
        // The client is trying to login with a username/password combo

        // TODO: externalize this function
        if(credentials_verification(ws_payload.credentials)){
          // The credentials are correct

          // Emit a token so the user does not need to login for next connections
          // TODO: GENERATE PROPER TOKEN
          socket.emit('token','theToken');

          // NOT SURE ABOUT THIS
          socket.emit('authenticated', {});

          // Allow access for future packets
          socket.authenticated = true;
        }
        else {
          // Login Credentials are wrong
          socket.emit('unauthorized','Invalid credentials');
        }
      }
      else {
        // The user is trying to do something else than authenticating
        socket.emit('unauthorized','Authentication required');
      }
    }
  }

}
