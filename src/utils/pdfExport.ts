import jsPDF from 'jspdf';
import { toCanvas, toPng } from 'html-to-image';

export interface ExportPdfResult {
  success: boolean;
  savedToDrivePicker: boolean;
  filename: string;
  cancelled?: boolean;
}

export interface ExportPdfOptions {
  elementId?: string;
  element?: HTMLElement | null;
  filename: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'legal' | 'a4';
  onStart?: () => void;
  onSuccess?: (result: ExportPdfResult) => void;
  onError?: (err: Error) => void;
}

/**
 * Capture an element using html-to-image with multi-level resilient fallback
 */
async function captureElementToCanvas(targetElement: HTMLElement): Promise<HTMLCanvasElement> {
  const originalTransform = targetElement.style.transform;
  const originalTransition = targetElement.style.transition;

  try {
    targetElement.style.transform = 'none';
    targetElement.style.transition = 'none';

    // 1st attempt: toCanvas
    try {
      return await toCanvas(targetElement, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: false,
      });
    } catch (err1) {
      console.warn('toCanvas failed, retrying with skipFonts: true...', err1);
      // 2nd attempt: skipFonts
      try {
        return await toCanvas(targetElement, {
          backgroundColor: '#ffffff',
          pixelRatio: 2,
          skipFonts: true,
          cacheBust: false,
        });
      } catch (err2) {
        console.warn('toCanvas with skipFonts failed, falling back to toPng...', err2);
        // 3rd attempt: toPng into Image
        const dataUrl = await toPng(targetElement, {
          backgroundColor: '#ffffff',
          pixelRatio: 2,
          skipFonts: true,
        });

        const img = new Image();
        img.src = dataUrl;
        await new Promise((resolve, reject) => {
          img.onload = () => resolve(null);
          img.onerror = reject;
        });

        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = img.naturalWidth || img.width;
        fallbackCanvas.height = img.naturalHeight || img.height;
        const ctx = fallbackCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
        return fallbackCanvas;
      }
    }
  } finally {
    targetElement.style.transform = originalTransform;
    targetElement.style.transition = originalTransition;
  }
}

/**
 * Capture an HTML element and save it directly to the User's Computer Drive as a PDF document.
 * Uses html-to-image to support all modern CSS and Tailwind colors without parsing crashes,
 * and uses the File System Access API (showSaveFilePicker) when available so the user can choose
 * which drive/folder (e.g. Drive C:, D:, Dokumen) to save into, with an automatic fallback
 * to direct browser download into the computer's Downloads drive.
 */
export async function exportElementToPdf({
  elementId,
  element,
  filename,
  orientation = 'portrait',
  format = 'legal',
  onStart,
  onSuccess,
  onError,
}: ExportPdfOptions): Promise<ExportPdfResult> {
  try {
    if (onStart) onStart();

    const targetElement: HTMLElement | null =
      element || (elementId ? document.getElementById(elementId) : null);

    if (!targetElement) {
      throw new Error(`Elemen tidak ditemukan untuk membuat file PDF.`);
    }

    // Scroll to top to ensure complete render capture
    const originalScrollPos = window.scrollY;
    window.scrollTo(0, 0);

    // Capture using resilient native-rendering html-to-image
    const canvas = await captureElementToCanvas(targetElement);

    window.scrollTo(0, originalScrollPos);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Initialize PDF with Legal paper size (8.5 x 14 in / 215.9 x 355.6 mm) as default
    const isLandscape = orientation === 'landscape';
    const paperFormat = format || 'legal';
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: paperFormat,
      compress: true,
    });

    // Dimensi Kertas Legal Standar: 215.9 mm x 355.6 mm (atau A4: 210 x 297 mm)
    const pageWidth = paperFormat === 'legal'
      ? (isLandscape ? 355.6 : 215.9)
      : (isLandscape ? 297 : 210);
    const pageHeight = paperFormat === 'legal'
      ? (isLandscape ? 215.9 : 355.6)
      : (isLandscape ? 210 : 297);
    const margin = 10; // 10mm margin for Legal paper
    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;

    const imgWidth = usableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    // First page
    pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= usableHeight;

    // Handle multi-page documents
    while (heightLeft > 0) {
      position = position - usableHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= usableHeight;
    }

    // Ensure .pdf extension
    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    const pdfBlob = pdf.output('blob');

    let savedToDrivePicker = false;

    // Try modern File System Access API so user can choose Drive / Folder directly
    if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: cleanFilename,
          types: [
            {
              description: 'Dokumen PDF Resmi BUMDes (*.pdf)',
              accept: { 'application/pdf': ['.pdf'] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(pdfBlob);
        await writable.close();
        savedToDrivePicker = true;
      } catch (pickerErr: any) {
        if (pickerErr?.name === 'AbortError') {
          // User intentionally cancelled the file picker dialog
          const result: ExportPdfResult = {
            success: false,
            savedToDrivePicker: false,
            filename: cleanFilename,
            cancelled: true,
          };
          return result;
        }
        // Fallback to standard download if picker had permission or sandbox restrictions
      }
    }

    // Fallback: direct download link directly into the user's computer drive
    if (!savedToDrivePicker) {
      const blobUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = cleanFilename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      setTimeout(() => {
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(blobUrl);
      }, 500);
    }

    const result: ExportPdfResult = {
      success: true,
      savedToDrivePicker,
      filename: cleanFilename,
    };

    if (onSuccess) onSuccess(result);
    return result;
  } catch (error) {
    console.error('Gagal membuat file PDF:', error);
    if (onError && error instanceof Error) {
      onError(error);
    }
    return {
      success: false,
      savedToDrivePicker: false,
      filename: filename,
    };
  }
}
