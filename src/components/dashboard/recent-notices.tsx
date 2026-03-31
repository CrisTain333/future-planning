import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RecentNotices() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Notices</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">No notices yet</p>
      </CardContent>
    </Card>
  );
}
