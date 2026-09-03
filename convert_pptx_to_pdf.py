import win32com.client
import os
import sys

pptx_path = os.path.abspath(r"d:\sih\NAWI-ReportPro-SIH2026-Submission.pptx")
pdf_path = os.path.abspath(r"d:\sih\NAWI-ReportPro-SIH2026-Submission.pdf")

print(f"Converting PPTX to PDF...")
print(f"Source: {pptx_path}")
print(f"Target: {pdf_path}")

try:
    ppt_app = win32com.client.Dispatch("PowerPoint.Application")
    # Open presentation in read-only mode, without window if possible
    presentation = ppt_app.Presentations.Open(pptx_path, WithWindow=False)
    
    # 32 is the constant for ppSaveAsPDF
    presentation.SaveAs(pdf_path, 32)
    presentation.Close()
    ppt_app.Quit()
    
    if os.path.exists(pdf_path):
        size = os.path.getsize(pdf_path)
        print(f"\nPDF successfully generated: {pdf_path}")
        print(f"Size: {size:,} bytes")
    else:
        print("Error: PDF file was not created.")
        sys.exit(1)
except Exception as e:
    print(f"Error converting to PDF: {e}")
    sys.exit(1)
