import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Settings() {
  const [attendanceThreshold, setAttendanceThreshold] = useState("75");
  const [gpaThreshold, setGpaThreshold] = useState("6.0");
  const [feeDelayDays, setFeeDelayDays] = useState("30");
  const [instantAlerts, setInstantAlerts] = useState(true);
  const [notificationFrequency, setNotificationFrequency] = useState("instant");

  const handleSave = () => {
    toast.success("Settings saved successfully!");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure risk thresholds and notification preferences
          </p>
        </div>

        {/* Risk Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment Thresholds</CardTitle>
            <CardDescription>
              Configure the thresholds for identifying at-risk students
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="attendance">
                Minimum Attendance Percentage
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  id="attendance"
                  type="number"
                  min="0"
                  max="100"
                  value={attendanceThreshold}
                  onChange={(e) => setAttendanceThreshold(e.target.value)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">
                  Students below this will be flagged
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gpa">Minimum GPA Threshold</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="gpa"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={gpaThreshold}
                  onChange={(e) => setGpaThreshold(e.target.value)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">
                  GPA below this indicates academic risk
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee-delay">Fee Payment Delay (Days)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="fee-delay"
                  type="number"
                  min="0"
                  value={feeDelayDays}
                  onChange={(e) => setFeeDelayDays(e.target.value)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">
                  Alert when fees are pending beyond this period
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Manage how and when you receive alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="instant-alerts">Instant Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications immediately when a student is flagged
                </p>
              </div>
              <Switch
                id="instant-alerts"
                checked={instantAlerts}
                onCheckedChange={setInstantAlerts}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Notification Frequency</Label>
              <Select
                value={notificationFrequency}
                onValueChange={setNotificationFrequency}
              >
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">Instant</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                  <SelectItem value="weekly">Weekly Summary</SelectItem>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send alerts via email
                </p>
              </div>
              <Switch id="email-notifications" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms-notifications">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send critical alerts via SMS
                </p>
              </div>
              <Switch id="sms-notifications" />
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>General application preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="academic-year">Academic Year</Label>
              <Select defaultValue="2024-2025">
                <SelectTrigger id="academic-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023-2024">2023-2024</SelectItem>
                  <SelectItem value="2024-2025">2024-2025</SelectItem>
                  <SelectItem value="2025-2026">2025-2026</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select defaultValue="ist">
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ist">IST (India)</SelectItem>
                  <SelectItem value="est">EST (US East)</SelectItem>
                  <SelectItem value="pst">PST (US West)</SelectItem>
                  <SelectItem value="gmt">GMT (UK)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg">
            Save Changes
          </Button>
        </div>
      </div>
    </Layout>
  );
}
