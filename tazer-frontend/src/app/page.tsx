"use client"

import { useState, useEffect, useCallback } from "react"
import RobotVisualization from "@/components/robot-visualization"
import ControllerStatus from "@/components/controller-status"
import WebSocketStatus from "@/components/websocket-status"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Image from "next/image"

export default function Home() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [controller, setController] = useState<Gamepad | null>(null)
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null)
  const [controllerStatus, setControllerStatus] = useState<"waiting" | "connected" | "disconnected">("disconnected")
  const [wsStatus, setWsStatus] = useState("Not connected")
  const [motorValues, setMotorValues] = useState({ left: 0, right: 0 })
  const [tazerActive, setTazerActive] = useState(false)
  const [keyboardActive, setKeyboardActive] = useState(false)
  const [reconnectAttempt, setReconnectAttempt] = useState(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = 2000 // 2 seconds

  const attemptReconnect = useCallback(() => {
    if (reconnectAttempt < maxReconnectAttempts) {
      setTimeout(() => {
        setReconnectAttempt(prev => prev + 1)
        connectWebSocket()
        toast.info(`Attempting to reconnect (${reconnectAttempt + 1}/${maxReconnectAttempts})...`)
      }, reconnectDelay)
    } else {
      toast.error("Maximum reconnection attempts reached. Please try connecting manually.")
      setReconnectAttempt(0)
    }
  }, [reconnectAttempt])

  const connectController = () => {
    const gamepads = navigator.getGamepads()
    const existingGamepad = gamepads[0]
    
    if (existingGamepad) {
      setController(existingGamepad)
      setControllerStatus("connected")
      toast.success(`Connected to ${existingGamepad.id}`)
      requestAnimationFrame(updateGamepadState)
    } else {
      setControllerStatus("waiting")
      toast.info("Press any button on your controller to connect")
    }

    window.addEventListener("gamepadconnected", handleGamepadConnected)
    window.addEventListener("gamepaddisconnected", handleGamepadDisconnected)
  }

  const handleGamepadDisconnected = (e: GamepadEvent) => {
    console.log("Gamepad disconnected:", e.gamepad)
    setController(null)
    setControllerStatus("disconnected")
    toast.error("Controller disconnected")
  }

  const handleGamepadConnected = (e: GamepadEvent) => {
    console.log("Gamepad connected:", e.gamepad)
    setController(e.gamepad)
    setControllerStatus("connected")
    toast.success(`Connected to ${e.gamepad.id}`)
    requestAnimationFrame(updateGamepadState)
  }

  const updateGamepadState = useCallback(() => {
    const gamepads = navigator.getGamepads()
    if (gamepads && gamepads[0]) {
      const gamepad = gamepads[0]
      
      const throttle = -gamepad.axes[1]
      const steering = gamepad.axes[0]

      const deadzone = 0.15
      const processedThrottle = Math.abs(throttle) < deadzone ? 0 : throttle
      const processedSteering = Math.abs(steering) < deadzone ? 0 : steering

      let leftMotor = 0
      let rightMotor = 0

      leftMotor = Math.round((processedThrottle + processedSteering) * 255)
      rightMotor = Math.round((processedThrottle - processedSteering) * 255)

      leftMotor = Math.max(-255, Math.min(255, leftMotor))
      rightMotor = Math.max(-255, Math.min(255, rightMotor))

      const tazerValue = gamepad.buttons[7].value
      const newTazerActive = tazerValue > 0.5

      setTazerActive(newTazerActive)

      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.send(
          JSON.stringify({
            command: "relay",
            data: { state: newTazerActive },
          }),
        )
      }

      setMotorValues({ left: leftMotor, right: rightMotor })

      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.send(
          JSON.stringify({
            command: "motor",
            data: { left: leftMotor, right: rightMotor },
          }),
        )
      }
    }
    
    requestAnimationFrame(updateGamepadState)
  }, [wsConnection])

  useEffect(() => {
    if (controllerStatus === "connected") {
      const animationFrameId = requestAnimationFrame(updateGamepadState)
      
      return () => {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [controllerStatus, updateGamepadState])

  const handleKeyboardControls = useCallback(
    (event: KeyboardEvent) => {
      if (!keyboardActive) return

      const { key, type } = event
      const isKeyDown = type === "keydown"

      if (key === " " && isKeyDown) {
        const newTazerActive = !tazerActive
        setTazerActive(newTazerActive)

        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
          wsConnection.send(
            JSON.stringify({
              command: "relay",
              data: { state: newTazerActive },
            }),
          )
        }
        return
      }

      let newMotorValues = { ...motorValues }

      switch (key.toLowerCase()) {
        case "w":
          newMotorValues = isKeyDown ? { left: 255, right: 255 } : { left: 0, right: 0 }
          break
        case "a":
          newMotorValues = isKeyDown ? { left: -255, right: 255 } : { left: 0, right: 0 }
          break
        case "s":
          newMotorValues = isKeyDown ? { left: -255, right: -255 } : { left: 0, right: 0 }
          break
        case "d":
          newMotorValues = isKeyDown ? { left: 255, right: -255 } : { left: 0, right: 0 }
          break
        default:
          return
      }

      setMotorValues(newMotorValues)

      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.send(
          JSON.stringify({
            command: "motor",
            data: newMotorValues,
          }),
        )
      }
    },
    [motorValues, wsConnection, keyboardActive, tazerActive],
  )

  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket("ws://tazer.local:8765/")
      
      let pingInterval: NodeJS.Timeout
      setWsStatus("Connecting")

      ws.onopen = () => {
        setWsConnection(ws)
        setWsStatus("Connected")
        setReconnectAttempt(0)
        toast.success("Connected to motor control server")

        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ command: "ping" }))
          }
        }, 30000)
      }

      ws.onclose = (event) => {
        console.log("WebSocket closed:", event)
        setWsConnection(null)
        setWsStatus("Disconnected")
        
        if (pingInterval) {
          clearInterval(pingInterval)
        }

        if (!event.wasClean) {
          attemptReconnect()
        }
        
        toast.error("Connection to motor control server closed")
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        setWsStatus("Error")
        toast.error("Error communicating with motor control server")
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.command === "pong") {
            console.debug("Received pong from server")
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e)
        }
      }

      return () => {
        if (pingInterval) {
          clearInterval(pingInterval)
        }
        if (ws.readyState === WebSocket.OPEN) {
          ws.close()
        }
      }
    } catch (error: unknown) {
      console.error("Error connecting to WebSocket:", error)
      setWsStatus(`Connection failed: ${error instanceof Error ? error.message : String(error)}`)
      toast.error(`WebSocket connection failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [attemptReconnect])
  
  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardControls)
    window.addEventListener("keyup", handleKeyboardControls)

    return () => {
      // Clean up event listeners
      window.removeEventListener("keydown", handleKeyboardControls)
      window.removeEventListener("keyup", handleKeyboardControls)
      window.removeEventListener("gamepadconnected", handleGamepadConnected)
      window.removeEventListener("gamepaddisconnected", handleGamepadDisconnected)
    }
  }, [handleKeyboardControls])

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <Image src="/scrapyard.png" alt="Scrapyard Logo" width={200} height={95} className="place-self-center" />
        <h1 className="text-3xl font-bold mb-8 text-center">Tazers lol</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="flex flex-col gap-4">
            <ControllerStatus status={controllerStatus} />
            <Button onClick={connectController} loading={controllerStatus === "waiting"} disabled={controllerStatus === "connected"} className="w-full">
              Connect Controller
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            <WebSocketStatus status={wsStatus} />
            <Button onClick={connectWebSocket} loading={wsStatus === "Connecting"} disabled={wsStatus === "Connected"} className="w-full">
              Connect to Robot
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <Button
            onClick={() => setKeyboardActive(!keyboardActive)}
            variant={keyboardActive ? "default" : "outline"}
            className="w-full"
          >
            {keyboardActive ? "Keyboard Controls: Active" : "Keyboard Controls: Inactive"}
          </Button>
          {keyboardActive && (
            <div className="mt-2 text-center text-sm text-muted-foreground">
              Use W (forward), A (left), S (backward), D (right) to control the robot
              <br />
              Press SPACEBAR to toggle the tazer
            </div>
          )}
        </div>

        <div className="bg-black/5 dark:bg-white/5 p-4 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Motor Values</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Left Motor</p>
              <p className="text-2xl">{motorValues.left}</p>
            </div>
            <div>
              <p className="font-medium">Right Motor</p>
              <p className="text-2xl">{motorValues.right}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="font-medium">Tazer Status</p>
            <p className={`text-2xl ${tazerActive ? "text-red-500" : ""}`}>{tazerActive ? "ACTIVE" : "Inactive"}</p>
          </div>
        </div>

        <div className="h-[400px] w-full bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden">
          <RobotVisualization motorValues={motorValues} tazerActive={tazerActive} />
        </div>
      </div>
    </main>
  )
}

