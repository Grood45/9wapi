import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates a professional PDF Integration Guide for the API Gateway.
 * @param {Object} selectedData - Object with provider names as keys and arrays of endpoint objects as values.
 */
export const generateIntegrationPdf = (selectedData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const serverUrl = window.location.origin;

    // --- Header / Title Section ---
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('API INTEGRATION GUIDE', 15, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 30);
    doc.text(`Gateway Host: ${serverUrl}`, pageWidth - 15, 30, { align: 'right' });

    let currentY = 50;

    // --- Introduction ---
    doc.setTextColor(51, 65, 85); // slate-700
    doc.setFontSize(14);
    doc.text('Integration Overview', 15, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    const introText = "This document provides the necessary endpoint details for integrating with the 9W GateKeeper API Gateway. " +
        "Authentication is strictly enforced via IP Whitelisting. Ensure your server's public IP is registered in the Admin Panel.";
    doc.text(doc.splitTextToSize(introText, pageWidth - 30), 15, currentY);
    currentY += 20;

    // --- Iterate through selected Providers and Endpoints ---
    Object.keys(selectedData).forEach((provider) => {
        const endpoints = selectedData[provider];
        if (endpoints.length === 0) return;

        // Check for page overflow
        if (currentY > 240) {
            doc.addPage();
            currentY = 20;
        }

        doc.setTextColor(0, 123, 255); // brand-accent
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(provider.toUpperCase(), 15, currentY);
        currentY += 5;

        const tableRows = endpoints.map(ep => [
            ep.label,
            `${serverUrl}${ep.pathTemplate}`,
            ep.description || 'No description provided.'
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Endpoint Service', 'Integration URL', 'Description']],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
            styles: { fontSize: 8, cellPadding: 4 },
            columnStyles: {
                0: { cellWidth: 40, fontStyle: 'bold' },
                1: { cellWidth: 70, textColor: [0, 123, 255] },
                2: { cellWidth: 'auto' }
            },
            margin: { left: 15, right: 15 }
        });

        currentY = doc.lastAutoTable.finalY + 15;
    });

    // --- Footer Footer ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`9W GateKeeper - Confidential Documentation - Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`9W_GateKeeper_Integration_Guide_${new Date().getTime()}.pdf`);
};
