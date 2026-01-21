import { NextRequest, NextResponse } from 'next/server';
import { Receipt, Organization } from '@/lib/models';
import connectDB from '@/lib/mongodb';
import fs from 'fs';  // Add this for reading the font file
import path from 'path';  // Add this for path resolution

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = req.headers.get('X-User-UID');
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const receipt = await Receipt.findOne({
      _id: params.id,
      organizationId: organizationId,
    }).lean();

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    const organization = await Organization.findById(organizationId).lean();
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Dynamically import PDFKit (only on server)
    const PDFDocument = (await import('pdfkit')).default;
    const { Readable } = await import('stream');

    // Load custom font (adjust path if needed)
    const fontPath = path.join(process.cwd(), 'public/OpenSans-Regular.ttf');
    const fontBuffer = fs.readFileSync(fontPath);

    // Create PDF with custom font as default (optional: { font: 'CustomHelvetica' } in constructor)
    const doc = new PDFDocument({ 
      margin: 50,
      bufferPages: true 
    });

    // Register the custom font
    doc.registerFont('CustomHelvetica', fontBuffer);

    // Set as default font
    doc.font('CustomHelvetica');

    // Collect chunks
    const chunks: Uint8Array[] = [];
    
    // Create a readable stream from the PDF
    const stream = new Readable({
      read() {}
    });

    doc.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
      stream.push(chunk);
    });

    doc.on('end', () => {
      stream.push(null);
    });

    // Generate PDF content
    // Header
    doc
      .fontSize(24)
      .fillColor('#2962FF')
      .text(organization.companyName || 'SENDORA', { align: 'left' });

    doc
      .fontSize(10)
      .fillColor('#666666')
      .text(`Receipt #${receipt.receiptNumber}`, { align: 'left' });

    doc.moveDown(0.5);

    // Organization Details
    if (organization.address) {
      doc.fontSize(9).fillColor('#666666').text(organization.address);
    }
    if (organization.phoneNumber) {
      doc.text(organization.phoneNumber);
    }
    if (organization.email) {
      doc.text(organization.email);
    }

    doc.moveDown(2);

    // Customer Information
    doc.fontSize(12).fillColor('#000000').text('Bill To:', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#666666').text(receipt.customerName);
    doc.text(receipt.customerEmail);
    if (receipt.customerPhoneNumber) {
      doc.text(receipt.customerPhoneNumber);
    }

    doc.moveDown(1);

    // Date
    doc
      .fontSize(10)
      .fillColor('#666666')
      .text(`Date: ${new Date(receipt.createdAt).toLocaleDateString()}`, {
        align: 'right',
      });

    doc.moveDown(2);

    // Items Table Header
    const tableTop = doc.y;
    const itemX = 50;
    const qtyX = 300;
    const priceX = 370;
    const totalX = 470;

    doc
      .fontSize(10)
      .fillColor('#000000')
      .text('Item / Service', itemX, tableTop, { width: 240 })
      .text('Qty', qtyX, tableTop, { width: 50, align: 'center' })
      .text('Price', priceX, tableTop, { width: 80, align: 'right' })
      .text('Total', totalX, tableTop, { width: 80, align: 'right' });

    doc
      .strokeColor('#e0e0e0')
      .lineWidth(1)
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    // Items
    let currentY = tableTop + 25;
    receipt.items.forEach((item: any) => {
      const itemTotal = item.quantity * item.price;

      doc
        .fontSize(9)
        .fillColor('#666666')
        .text(item.name, itemX, currentY, { width: 240 })
        .text(item.quantity.toString(), qtyX, currentY, {
          width: 50,
          align: 'center',
        })
        .text(`$${item.price.toFixed(2)}`, priceX, currentY, {
          width: 80,
          align: 'right',
        })
        .text(`$${itemTotal.toFixed(2)}`, totalX, currentY, {
          width: 80,
          align: 'right',
        });

      currentY += 20;
    });

    // Calculate totals
    const subtotal = receipt.items.reduce(
      (acc: number, item: any) => acc + item.quantity * item.price,
      0
    );
    const discountAmount = (subtotal * (receipt.discount || 0)) / 100;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = (subtotalAfterDiscount * (receipt.tax || 0)) / 100;

    currentY += 10;

    // Totals section
    doc
      .strokeColor('#e0e0e0')
      .lineWidth(1)
      .moveTo(50, currentY)
      .lineTo(550, currentY)
      .stroke();

    currentY += 15;

    // Subtotal
    doc
      .fontSize(10)
      .fillColor('#666666')
      .text('Subtotal:', 370, currentY, { width: 80, align: 'right' })
      .text(`$${subtotal.toFixed(2)}`, 470, currentY, {
        width: 80,
        align: 'right',
      });

    currentY += 20;

    // Discount
    if (receipt.discount && receipt.discount > 0) {
      doc
        .text(`Discount (${receipt.discount}%):`, 370, currentY, {
          width: 80,
          align: 'right',
        })
        .text(`-$${discountAmount.toFixed(2)}`, 470, currentY, {
          width: 80,
          align: 'right',
        });
      currentY += 20;
    }

    // Tax
    if (receipt.tax && receipt.tax > 0) {
      doc
        .text(`Tax (${receipt.tax}%):`, 370, currentY, {
          width: 80,
          align: 'right',
        })
        .text(`$${taxAmount.toFixed(2)}`, 470, currentY, {
          width: 80,
          align: 'right',
        });
      currentY += 20;
    }

    // Total
    doc
      .fontSize(12)
      .fillColor('#000000')
      .text('Total:', 370, currentY, { width: 80, align: 'right' })
      .text(`$${receipt.totalAmount.toFixed(2)}`, 470, currentY, {
        width: 80,
        align: 'right',
      });

    currentY += 40;

    // Footer
    doc
      .fontSize(9)
      .fillColor('#999999')
      .text('Thank you for your business!', 50, currentY, {
        align: 'center',
        width: 500,
      });

    // Finalize PDF
    doc.end();

    // Wait for PDF to finish
    await new Promise<void>((resolve) => {
      doc.on('end', () => resolve());
    });

    // Combine all chunks into a single buffer
    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${receipt.receiptNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('❌ PDF generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
