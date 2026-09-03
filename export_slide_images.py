import win32com.client
import os

pptx_path = os.path.abspath(r"d:\sih\NAWI-ReportPro-SIH2026-Submission.pptx")
out_dir = os.path.abspath(r"d:\sih\slide_previews")
os.makedirs(out_dir, exist_ok=True)

print("Exporting slides to PNG for visual inspection...")
ppt_app = win32com.client.Dispatch("PowerPoint.Application")
presentation = ppt_app.Presentations.Open(pptx_path, WithWindow=False)

for i, slide in enumerate(presentation.Slides):
    slide_path = os.path.join(out_dir, f"slide_{i+1}.png")
    # Export slide as PNG (1920x1080)
    slide.Export(slide_path, "PNG", 1920, 1080)
    print(f"Exported Slide {i+1} -> {slide_path}")

presentation.Close()
ppt_app.Quit()
print("All slides exported successfully.")
