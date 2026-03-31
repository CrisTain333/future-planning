import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Payment from "@/models/Payment";
import Settings from "@/models/Settings";
import PDFDocument from "pdfkit";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const payment = await Payment.findById(id)
      .populate("userId", "fullName")
      .populate("approvedBy", "fullName");

    if (!payment || payment.isDeleted) {
      return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 });
    }

    // Access control: members can only download their own
    const paymentUserId = typeof payment.userId === "object" ? (payment.userId as { _id: { toString(): string } })._id.toString() : payment.userId.toString();
    if (currentUser.role !== "admin" && currentUser.userId !== paymentUserId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const settings = await Settings.findOne({});
    const foundationName = settings?.foundationName || "Future Planning";

    const memberName = typeof payment.userId === "object" ? (payment.userId as { fullName: string }).fullName : "Unknown";
    const approvedByName = typeof payment.approvedBy === "object" ? (payment.approvedBy as { fullName: string }).fullName : "Unknown";
    const monthName = MONTHS[payment.month - 1];
    const total = payment.amount + payment.penalty;

    // Generate PDF
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    // Header
    doc.fontSize(20).font("Helvetica-Bold").text(foundationName, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(14).font("Helvetica").text("Payment Receipt", { align: "center" });
    doc.moveDown(1);

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // Receipt details
    const labelX = 50;
    const valueX = 200;
    const lineHeight = 25;

    const addRow = (label: string, value: string) => {
      doc.fontSize(11).font("Helvetica-Bold").text(label, labelX, doc.y, { continued: false });
      doc.fontSize(11).font("Helvetica").text(value, valueX, doc.y - lineHeight + 3);
      doc.moveDown(0.3);
    };

    addRow("Receipt No:", payment.receiptNo);
    addRow("Member Name:", memberName);
    addRow("Month:", `${monthName} ${payment.year}`);
    addRow("Amount Paid:", `BDT ${payment.amount.toLocaleString()}`);

    if (payment.penalty > 0) {
      addRow("Penalty:", `BDT ${payment.penalty.toLocaleString()}`);
      if (payment.penaltyReason) {
        addRow("Penalty Reason:", payment.penaltyReason);
      }
    }

    addRow("Total:", `BDT ${total.toLocaleString()}`);
    addRow("Approved By:", approvedByName);
    addRow("Date:", new Date(payment.createdAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }));

    // Divider
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // Footer
    doc.fontSize(9).font("Helvetica-Oblique").text("This is a system-generated receipt.", { align: "center" });

    doc.end();

    const pdfBuffer = await pdfPromise;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="receipt-${payment.receiptNo}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to generate receipt" }, { status: 500 });
  }
}
