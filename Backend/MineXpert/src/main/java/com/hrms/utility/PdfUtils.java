package com.hrms.utility;

import java.io.ByteArrayOutputStream;

import com.itextpdf.html2pdf.ConverterProperties;
import com.itextpdf.html2pdf.HtmlConverter;

public class PdfUtils {
    public static byte[] generatePdfFromHtml(String htmlContent) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        ConverterProperties converterProperties = new ConverterProperties();
        HtmlConverter.convertToPdf(htmlContent, outputStream, converterProperties);

        return outputStream.toByteArray();
    }
}
