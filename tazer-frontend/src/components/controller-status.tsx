import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Gamepad2 } from "lucide-react"

export default function ControllerStatus({ status }: { status: "waiting" | "connected" | "disconnected" }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Controller Status</CardTitle>
        <Gamepad2 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {status === "connected" ? (
            <span className="text-green-500">Connected</span>
          ) : status === "disconnected" ? (
            <span className="text-gray-500">Not Connected</span>
          ) : status === "waiting" ? (
            <span className="text-yellow-500">Waiting for gamepad...</span>
          ) : (
            <span className="text-red-500">{status}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

