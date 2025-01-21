import { api } from "@/services/api"
import { io, Socket } from "socket.io-client"

export interface SocketInterface {
  socket: Socket
}

class SocketConnection implements SocketInterface {
  public socket: Socket
  public socketEndpoint = api.config.socketUrl

  // The constructor will initialize the Socket Connection
  constructor(authenticationToken: string) {
    this.socket = io(this.socketEndpoint, {
      secure: true,
      auth: {
        token: `Bearer ${authenticationToken}`,
      },
    })
  }

  // Disconnect the socket
  public disconnect() {
    if (this.socket) {
      this.socket.disconnect()
    }
  }
}

let socketConnection: SocketConnection | undefined

// The SocketFactory is responsible for creating and returning a single instance of the SocketConnection class
// Implementing the singleton pattern
class SocketFactory {
  public static create(authenticationToken: string): SocketConnection {
    if (!socketConnection) {
      // Create a new connection if one doesn't exist
      socketConnection = new SocketConnection(authenticationToken)
    } else if (socketConnection.socket.disconnected) {
      // Reconnect if the socket is disconnected
      socketConnection = new SocketConnection(authenticationToken)
    } else {
      // If the token has changed, disconnect the existing connection and create a new one
      const currentToken: string | undefined = (socketConnection.socket.auth as { token?: string })
        .token
      if (currentToken !== `Bearer ${authenticationToken}`) {
        socketConnection.disconnect()
        socketConnection = new SocketConnection(authenticationToken)
      }
    }
    return socketConnection
  }

  // Disconnect the existing connection
  public static disconnect() {
    if (socketConnection) {
      socketConnection.disconnect()
      socketConnection = undefined // Clear the singleton instance
    }
  }
}

export default SocketFactory
