import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Payment from "@/models/Payment";
import Settings from "@/models/Settings";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

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

    const paymentUserId = typeof payment.userId === "object"
      ? (payment.userId as { _id: { toString(): string } })._id.toString()
      : payment.userId.toString();
    if (currentUser.role !== "admin" && currentUser.userId !== paymentUserId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const settings = await Settings.findOne({});
    const foundationName = settings?.foundationName || "Future Planning";
    const memberName = typeof payment.userId === "object" ? (payment.userId as { fullName: string }).fullName : "Unknown";
    const approvedByName = typeof payment.approvedBy === "object" ? (payment.approvedBy as { fullName: string }).fullName : "Unknown";
    const monthName = MONTHS[payment.month - 1];
    const total = payment.amount + payment.penalty;
    const dateStr = new Date(payment.createdAt).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });

    // Load signature image
    const signaturePath = path.join(process.cwd(), "src", "assets", "images", "santu_signature.png");
    const signatureExists = fs.existsSync(signaturePath);

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    const pageWidth = 595.28; // A4 width
    const marginLeft = 50;
    const marginRight = 50;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // ===== HEADER =====
    // Top border line (primary color)
    doc.rect(0, 0, pageWidth, 6).fill("#0a9396");

    // Foundation name
    doc.moveDown(1.5);
    doc.fontSize(24).font("Helvetica-Bold").fillColor("#0a9396")
      .text(foundationName, marginLeft, 40, { align: "center", width: contentWidth });

    // Subtitle
    doc.fontSize(12).font("Helvetica").fillColor("#333333")
      .text("PAYMENT RECEIPT", marginLeft, 72, { align: "center", width: contentWidth });

    // Thin line under header
    const headerLineY = 92;
    doc.moveTo(marginLeft, headerLineY).lineTo(pageWidth - marginRight, headerLineY)
      .lineWidth(1).strokeColor("#0a9396").stroke();

    // ===== RECEIPT INFO BAR =====
    const infoY = 108;
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#555555")
      .text(`Receipt No: ${payment.receiptNo}`, marginLeft, infoY);
    doc.fontSize(9).font("Helvetica").fillColor("#555555")
      .text(`Date: ${dateStr}`, marginLeft, infoY, { align: "right", width: contentWidth });

    // ===== TABLE =====
    const tableTop = 138;
    const labelWidth = 180;
    const valueWidth = contentWidth - labelWidth;
    const rowHeight = 32;
    const labelBgColor = "#f0f9f8";
    const borderColor = "#d0d5dd";
    const textColor = "#1a1a1a";
    const labelColor = "#555555";

    const rows: [string, string][] = [
      ["Member Name", memberName],
      ["Payment Month", `${monthName} ${payment.year}`],
      ["Amount Paid", `BDT ${payment.amount.toLocaleString()}`],
    ];

    if (payment.penalty > 0) {
      rows.push(["Penalty", `BDT ${payment.penalty.toLocaleString()}`]);
      if (payment.penaltyReason) {
        rows.push(["Penalty Reason", payment.penaltyReason]);
      }
    }

    rows.push(
      ["Total Amount", `BDT ${total.toLocaleString()}`],
      ["Status", payment.status === "approved" ? "APPROVED" : payment.status.toUpperCase()],
      ["Approved By", approvedByName],
    );


    // Draw table
    for (let i = 0; i < rows.length; i++) {
      const y = tableTop + i * rowHeight;
      const [label, value] = rows[i];

      // Label cell background
      doc.rect(marginLeft, y, labelWidth, rowHeight).fill(labelBgColor);

      // Value cell background (white)
      doc.rect(marginLeft + labelWidth, y, valueWidth, rowHeight).fill("#ffffff");

      // Cell borders
      doc.rect(marginLeft, y, contentWidth, rowHeight)
        .lineWidth(0.5).strokeColor(borderColor).stroke();

      // Vertical divider
      doc.moveTo(marginLeft + labelWidth, y)
        .lineTo(marginLeft + labelWidth, y + rowHeight)
        .lineWidth(0.5).strokeColor(borderColor).stroke();

      // Label text
      doc.fontSize(9).font("Helvetica-Bold").fillColor(labelColor)
        .text(label, marginLeft + 10, y + 10, { width: labelWidth - 20 });

      // Value text
      const isTotal = label === "Total Amount";
      const isStatus = label === "Status";
      doc.fontSize(isTotal ? 11 : 9)
        .font(isTotal ? "Helvetica-Bold" : "Helvetica")
        .fillColor(isTotal ? "#0a9396" : isStatus ? "#0a9396" : textColor)
        .text(value, marginLeft + labelWidth + 10, y + (isTotal ? 8 : 10), { width: valueWidth - 20 });
    }

    // ===== SIGNATURE SECTION =====
    const signatureY = tableTop + rows.length * rowHeight + 50;

    if (signatureExists) {
      const sigWidth = 120;
      const sigHeight = 47; // proportional to 800x312
      const sigX = pageWidth - marginRight - sigWidth;
      doc.image(signaturePath, sigX, signatureY, { width: sigWidth, height: sigHeight });

      // Line under signature
      doc.moveTo(sigX, signatureY + sigHeight + 5)
        .lineTo(sigX + sigWidth, signatureY + sigHeight + 5)
        .lineWidth(0.5).strokeColor("#999999").stroke();

      // Accounting Manager label
      doc.fontSize(8).font("Helvetica").fillColor("#666666")
        .text("Accounting Manager", sigX, signatureY + sigHeight + 10, { width: sigWidth, align: "center" });
    }

    // ===== FOOTER =====
    const footerY = signatureY + 120;
    doc.moveTo(marginLeft, footerY).lineTo(pageWidth - marginRight, footerY)
      .lineWidth(0.5).strokeColor("#cccccc").stroke();

    doc.fontSize(8).font("Helvetica-Oblique").fillColor("#999999")
      .text("This is a system-generated receipt.", marginLeft, footerY + 10, {
        align: "center", width: contentWidth,
      });

    // Bottom border line
    doc.rect(0, 836, pageWidth, 6).fill("#0a9396");

    doc.end();
    const pdfBuffer = await pdfPromise;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="receipt-${payment.receiptNo}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Receipt generation error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate receipt" }, { status: 500 });
  }
}
