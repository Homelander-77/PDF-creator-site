import {
    PDFDocument,
    StandardFonts,
    degrees,
    rgb,
} from 'pdf-lib';

export async function addFreeWatermark(pdf: Buffer): Promise<Buffer> {
    const document = await PDFDocument.load(pdf);
    const font = await document.embedFont(StandardFonts.HelveticaBold);

    for (const page of document.getPages()) {
        const { width, height } = page.getSize();

        const text = 'PDFAPI.RU - FREE';
        const size = 36;
        const textWidth = font.widthOfTextAtSize(text, size);

        page.drawText(text, {
            x: (width - textWidth) / 2,
            y: height / 2,
            size,
            font,
            rotate: degrees(35),
            opacity: 0.18,
            color: rgb(0.2, 0.2, 0.2),
        });
    }

    return Buffer.from(await document.save());
}
