import win32com.client
import os

pptx_path = os.path.abspath(r"d:\smart\SIH\NAWI-ReportPro-SIH2026-Submission.pptx")
pdf_path = os.path.abspath(r"d:\smart\SIH\NAWI-ReportPro-SIH2026-Submission.pdf")
out_dir = os.path.abspath(r"d:\smart\SIH\slide_previews")
os.makedirs(out_dir, exist_ok=True)

print("Opening PowerPoint application...")
ppt_app = win32com.client.Dispatch("PowerPoint.Application")
presentation = ppt_app.Presentations.Open(pptx_path, WithWindow=False)

print("Exporting slides to PNG (1920x1080)...")
for i, slide in enumerate(presentation.Slides):
    slide_path = os.path.join(out_dir, f"slide_{i+1}.png")
    slide.Export(slide_path, "PNG", 1920, 1080)
    print(f"Exported Slide {i+1} -> {slide_path}")

print("Exporting presentation to PDF...")
# 32 is ppSaveAsPDF
presentation.SaveAs(pdf_path, 32)
print(f"Exported PDF -> {pdf_path}")

presentation.Close()
ppt_app.Quit()
print("All exports completed successfully.")
