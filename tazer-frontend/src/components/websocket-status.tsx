import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Radio } from "lucide-react"

export default function WebSocketStatus({ status }: { status: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Robot Connection</CardTitle>
        <Radio className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {status === "Connected" ? (
            <span className="text-green-500">Connected</span>
          ) : status === "Connecting" ? (
            <span className="text-yellow-500">Connecting...</span>
          ) : status === "Disconnected" ? (
            <span className="text-gray-500">Disconnected</span>
          ) : (
            <span className="text-red-500">{status}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

