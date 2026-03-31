import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const formatMonth = (month: number, year: number) => `${MONTHS[month - 1]} ${year}`;

interface Payment {
  _id: string;
  userId: { _id: string; fullName: string };
  month: number;
  year: number;
  amount: number;
  createdAt: string;
}

interface RecentPaymentsProps {
  payments: Payment[];
}

export function RecentPayments({ payments }: RecentPaymentsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Payments</CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments yet</p>
        ) : (
          <div className="space-y-3">
            {payments.slice(0, 5).map((payment) => (
              <div key={payment._id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{payment.userId.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatMonth(payment.month, payment.year)}
                  </p>
                </div>
                <span className="font-semibold">৳{payment.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link
          href="/admin/accounting"
          className="text-sm text-primary hover:underline"
        >
          View All
        </Link>
      </CardFooter>
    </Card>
  );
}
