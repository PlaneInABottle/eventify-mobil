import { api } from "@/services/api"
import { io, Socket } from "socket.io-client"
import { handleError } from "./errorHandler"

export interface SocketInterface {
  socket: Socket
}

class SocketConnection implements SocketInterface {
  public socket: Socket
  public socketEndpoint = api.config.socketUrl
  private eventListeners: Map<string, EventListener[]> = new Map() // Store event listeners

  // The constructor will initialize the Socket Connection
  constructor(authenticationToken: string) {
    this.socket = io(this.socketEndpoint, {
      secure: true,
      auth: {
        token: `Bearer ${authenticationToken}`,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    // Reattach event listeners on reconnect
    this.socket.on("connect", () => {
      this.reattachEventListeners()
    })
  }

  // Emit an event to the server
  public emit(event: string, data: any): void {
    if (this.socket.connected) {
      this.socket.emit(event, data)
    } else {
      handleError("errors:socketNotConnected")
    }
  }

  // Listen to an event from the server
  public on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
    this.socket.on(event, callback)
  }

  // Remove an event listener
  public off(event: string, callback?: (data: any) => void): void {
    if (callback) {
      this.socket.off(event, callback)
      const listeners = this.eventListeners.get(event)
      if (listeners) {
        this.eventListeners.set(
          event,
          listeners.filter((listener) => listener !== callback),
        )
      }
    } else {
      this.socket.off(event)
      this.eventListeners.delete(event)
    }
  }

  // Reattach all stored event listeners
  private reattachEventListeners(): void {
    this.eventListeners.forEach((listeners, event) => {
      listeners.forEach((callback) => {
        this.socket.on(event, callback)
      })
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
