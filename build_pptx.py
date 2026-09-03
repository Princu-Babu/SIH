"""
Build the SIH 2026 NAWI-ReportPro submission PPT using the exact official template.
Pixel-perfect edition:
- Native bullets completely stripped and replaced with uniform bullet formatting across all slides
- Zero text-image overlapping
- Slide 1: High contrast Navy & Amber text with clear spacing
- Slide 6: Two-column balanced research foundation
- 6 slides total (exact official format)
"""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.oxml import parse_xml
import os

TEMPLATE = r"d:\sih\SIH2026-IDEA-Presentation-Format.pptx"
OUTPUT = r"d:\sih\NAWI-ReportPro-SIH2026-Submission.pptx"
IMAGES_DIR = r"C:\Users\Prash\.gemini\antigravity\brain\64666ea0-b6e9-4784-b965-5a09c45ebe10"

prs = Presentation(TEMPLATE)

# Colors
NAVY = RGBColor(0x1E, 0x3A, 0x5F)
DARK = RGBColor(0x0F, 0x17, 0x2A)
SAFFRON = RGBColor(0xD9, 0x77, 0x06) # Deep amber
TEXT_BODY = RGBColor(0x33, 0x41, 0x55)
GREEN = RGBColor(0x15, 0x80, 0x3D)

def strip_native_bullets(para):
    pPr = para._p.get_or_add_pPr()
    for child in list(pPr):
        if 'bu' in child.tag:
            pPr.remove(child)
    pPr.append(parse_xml('<a:buNone xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"/>'))

def clear_text_frame(tf):
    """Completely empty a text frame, removing ghost paragraphs and native bullets."""
    if len(tf.paragraphs) > 0:
        p0 = tf.paragraphs[0]
        strip_native_bullets(p0)
        for r in p0.runs:
            r.text = ""
    while len(tf.paragraphs) > 1:
        p = tf.paragraphs[1]
        p._element.getparent().remove(p._element)

def add_clean_paragraph(tf):
    p = tf.add_paragraph()
    strip_native_bullets(p)
    return p

def adjust_title(shape, text, font_size=24):
    shape.left = Emu(1650000)
    shape.top = Emu(200000)
    shape.width = Emu(8000000)
    shape.height = Emu(900000)
    if not shape.has_text_frame:
        return
    tf = shape.text_frame
    clear_text_frame(tf)
    p = tf.paragraphs[0]
    r = p.add_run()
    r.text = text
    r.font.size = Pt(font_size)
    r.font.bold = True
    r.font.color.rgb = NAVY

def add_image_to_slide(slide, img_path, left, top, width=None, height=None):
    if os.path.exists(img_path):
        if width and height:
            slide.shapes.add_picture(img_path, left, top, width, height)
        elif width:
            slide.shapes.add_picture(img_path, left, top, width=width)
        else:
            slide.shapes.add_picture(img_path, left, top)
        print(f"  Added image: {os.path.basename(img_path)}")

# ============================================================
# SLIDE 1: TITLE PAGE
# ============================================================
print("Building Slide 1: TITLE PAGE")
slide1 = prs.slides[0]

for shape in slide1.shapes:
    if shape.name == 'Subtitle 3':
        shape.left = Emu(500000)
        shape.top = Emu(1100000)
        shape.width = Emu(6000000)
        shape.height = Emu(800000)
        tf = shape.text_frame
        clear_text_frame(tf)
        p = tf.paragraphs[0]
        r = p.add_run()
        r.text = "NAWI-ReportPro: OIML R-76 Digital Platform"
        r.font.size = Pt(22)
        r.font.bold = True
        r.font.color.rgb = NAVY

    elif shape.name == 'TextBox 9':
        shape.left = Emu(500000)
        shape.top = Emu(2000000)
        shape.width = Emu(5800000)
        shape.height = Emu(4500000)
        
        tf = shape.text_frame
        clear_text_frame(tf)
        
        details = [
            ("Problem Statement ID: ", "26035", True),
            ("Problem Statement Title:\n", "Automated Test Report Generator for Non-Automatic Weighing Instruments (NAWI)", False),
            ("Theme: ", "Smart Automation", False),
            ("PS Category: ", "Software", False),
            ("Team ID: ", "SIH2026-TEAM-NAWI", False),
            ("Team Name: ", "Metrology Innovators", False),
        ]
        
        for idx, (label, val, is_highlight) in enumerate(details):
            p = tf.paragraphs[0] if idx == 0 else add_clean_paragraph(tf)
            r1 = p.add_run()
            r1.text = label
            r1.font.bold = True
            r1.font.size = Pt(16)
            r1.font.color.rgb = NAVY
            
            r2 = p.add_run()
            r2.text = val
            r2.font.bold = is_highlight
            r2.font.size = Pt(16)
            r2.font.color.rgb = SAFFRON if is_highlight else DARK
            p.space_after = Pt(12)

# ============================================================
# SLIDE 2: IDEA TITLE (Proposed Solution)
# ============================================================
print("Building Slide 2: IDEA TITLE")
slide2 = prs.slides[1]

for shape in slide2.shapes:
    if shape.name == 'Title 1':
        adjust_title(shape, "NAWI-ReportPro: Automated Digital Metrology Platform", font_size=24)
    elif shape.name == 'TextBox 8':
        shape.left = Emu(400000)
        shape.top = Emu(1300000)
        shape.width = Emu(5900000)
        shape.height = Emu(4900000)
        
        tf = shape.text_frame
        clear_text_frame(tf)
        
        p0 = tf.paragraphs[0]
        r0 = p0.add_run()
        r0.text = "Proposed Solution & Core Innovations"
        r0.font.size = Pt(18)
        r0.font.bold = True
        r0.font.color.rgb = NAVY
        p0.space_after = Pt(10)
        
        bullets = [
            ("Digital Transformation: ", "Replaces manual paper verification for Non-Automatic Weighing Instruments (scales & truck weighbridges) with an end-to-end digital system."),
            ("Direct Scale Telemetry: ", "Connects directly to weighing indicators via browser Web Serial API (RS-232/USB) — live weight capture with zero manual typing errors."),
            ("OIML R-76 Engine: ", "Automates Maximum Permissible Error (MPE) calculations across all 4 accuracy classes (Class I to IIII) with multi-interval tare compensation."),
            ("Tamper-Proof Certificates: ", "Issues legal verification certificates secured with HMAC-SHA256 digital seals and instant QR code public verification."),
        ]
        
        for bold_title, text in bullets:
            p = add_clean_paragraph(tf)
            r_b = p.add_run()
            r_b.text = "• " + bold_title
            r_b.font.bold = True
            r_b.font.size = Pt(12)
            r_b.font.color.rgb = DARK
            
            r_t = p.add_run()
            r_t.text = text
            r_t.font.bold = False
            r_t.font.size = Pt(11)
            r_t.font.color.rgb = TEXT_BODY
            p.space_after = Pt(8)
            
    elif shape.name == 'Oval 9':
        shape.left = Emu(250000)
        shape.top = Emu(180000)
        shape.width = Emu(1250000)
        shape.height = Emu(800000)
        tf = shape.text_frame
        clear_text_frame(tf)
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        r = p.add_run()
        r.text = "Metrology\nInnovators"
        r.font.size = Pt(10)
        r.font.bold = True
        r.font.color.rgb = NAVY

solution_img = os.path.join(IMAGES_DIR, "solution_overview_1788429555304.jpg")
if os.path.exists(solution_img):
    add_image_to_slide(slide2, solution_img,
                       Emu(6450000), Emu(1350000),
                       Emu(5300000), Emu(4750000))

# ============================================================
# SLIDE 3: TECHNICAL APPROACH
# ============================================================
print("Building Slide 3: TECHNICAL APPROACH")
slide3 = prs.slides[2]

for shape in slide3.shapes:
    if shape.name == 'Title 1':
        adjust_title(shape, "TECHNICAL APPROACH & SYSTEM ARCHITECTURE", font_size=24)
    elif shape.name == 'TextBox 8':
        shape.left = Emu(400000)
        shape.top = Emu(1150000)
        shape.width = Emu(11400000)
        shape.height = Emu(1500000)
        
        tf = shape.text_frame
        clear_text_frame(tf)
        
        bullets = [
            ("Hardware Layer: ", "Browser Web Serial API reads continuous ASCII/HEX telemetry streams from Mettler Toledo (SICS), Avery Weigh-Tronix, and Essae indicators."),
            ("Application Stack: ", "React 18 PWA frontend + Node.js Express REST API + PostgreSQL 14 with Prisma ORM + PDFKit high-resolution certificate engine."),
            ("Metrology & Offline Stack: ", "OIML R-76 MPE computation engine, ISO GUM uncertainty budget (k=2), and IndexedDB queue with idempotent background sync for remote mandis."),
        ]
        
        for idx, (bold_title, text) in enumerate(bullets):
            p = tf.paragraphs[0] if idx == 0 else add_clean_paragraph(tf)
            r_b = p.add_run()
            r_b.text = "• " + bold_title
            r_b.font.bold = True
            r_b.font.size = Pt(11)
            r_b.font.color.rgb = DARK
            
            r_t = p.add_run()
            r_t.text = text
            r_t.font.bold = False
            r_t.font.size = Pt(11)
            r_t.font.color.rgb = TEXT_BODY
            p.space_after = Pt(2)
            
    elif shape.name == 'Oval 10':
        shape.left = Emu(250000)
        shape.top = Emu(180000)
        shape.width = Emu(1250000)
        shape.height = Emu(800000)
        tf = shape.text_frame
        clear_text_frame(tf)
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        r = p.add_run()
        r.text = "Metrology\nInnovators"
        r.font.size = Pt(10)
        r.font.bold = True
        r.font.color.rgb = NAVY

arch_img = os.path.join(IMAGES_DIR, "architecture_diagram_v2_1788429540812.jpg")
if os.path.exists(arch_img):
    add_image_to_slide(slide3, arch_img,
                       Emu(1000000), Emu(2700000),
                       Emu(10200000), Emu(3450000))

# ============================================================
# SLIDE 4: FEASIBILITY AND VIABILITY
# ============================================================
print("Building Slide 4: FEASIBILITY AND VIABILITY")
slide4 = prs.slides[3]

for shape in slide4.shapes:
    if shape.name == 'Title 1':
        adjust_title(shape, "FEASIBILITY, RISK MITIGATION & VIABILITY", font_size=24)
    elif shape.name == 'TextBox 8':
        shape.left = Emu(400000)
        shape.top = Emu(1300000)
        shape.width = Emu(5900000)
        shape.height = Emu(4900000)
        
        tf = shape.text_frame
        clear_text_frame(tf)
        
        p0 = tf.paragraphs[0]
        r0 = p0.add_run()
        r0.text = "Key Feasibility Pillars & Risk Strategies"
        r0.font.size = Pt(18)
        r0.font.bold = True
        r0.font.color.rgb = NAVY
        p0.space_after = Pt(10)
        
        pillars = [
            ("Working Prototype Built: ", "All 15 core metrological features fully implemented and validated with 100% automated test pass rate (129/129 test cases passing)."),
            ("Hardware Agnostic: ", "Protocol-agnostic serial parser interfaces with diverse vendor hardware; virtual simulator enables pre-deployment field training."),
            ("Remote Mandi Resilience: ", "Offline-first PWA with IndexedDB local caching allows full inspections in zero-connectivity rural yards with auto-sync upon reconnection."),
            ("Legal Metrology Compliance: ", "Conforms to OIML R-76 (Edition 2006/E) and the Legal Metrology (General) Rules 2011, including July 2026 amendments for high-capacity scales."),
        ]
        
        for bold_title, text in pillars:
            p = add_clean_paragraph(tf)
            r_b = p.add_run()
            r_b.text = "• " + bold_title
            r_b.font.bold = True
            r_b.font.size = Pt(12)
            r_b.font.color.rgb = DARK
            
            r_t = p.add_run()
            r_t.text = text
            r_t.font.bold = False
            r_t.font.size = Pt(11)
            r_t.font.color.rgb = TEXT_BODY
            p.space_after = Pt(8)
            
    elif shape.name == 'Oval 11':
        shape.left = Emu(250000)
        shape.top = Emu(180000)
        shape.width = Emu(1250000)
        shape.height = Emu(800000)
        tf = shape.text_frame
        clear_text_frame(tf)
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        r = p.add_run()
        r.text = "Metrology\nInnovators"
        r.font.size = Pt(10)
        r.font.bold = True
        r.font.color.rgb = NAVY

feasibility_img = os.path.join(IMAGES_DIR, "feasibility_matrix_1788429979491.jpg")
if os.path.exists(feasibility_img):
    add_image_to_slide(slide4, feasibility_img,
                       Emu(6450000), Emu(1350000),
                       Emu(5300000), Emu(4750000))

# ============================================================
# SLIDE 5: IMPACT AND BENEFITS
# ============================================================
print("Building Slide 5: IMPACT AND BENEFITS")
slide5 = prs.slides[4]

for shape in slide5.shapes:
    if shape.name == 'Title 1':
        adjust_title(shape, "QUANTIFIED IMPACT & NATIONAL BENEFITS", font_size=24)
    elif shape.name == 'TextBox 8':
        shape.left = Emu(400000)
        shape.top = Emu(1150000)
        shape.width = Emu(11400000)
        shape.height = Emu(1500000)
        
        tf = shape.text_frame
        clear_text_frame(tf)
        
        impact_points = [
            ("10x Faster Field Verification: ", "Automated calculations reduce inspection duration from 2 hours to under 15 minutes per instrument, eliminating backlogs."),
            ("Protecting 1.80 Crore Farmers: ", "Guarantees accurate weighing across 1,656 e-NAM agricultural mandis nationwide (DoCA/e-NAM official data, June 2026)."),
            ("100% Tamper-Proof Legal Seals: ", "HMAC-SHA256 digital seals with instant public QR validation completely eliminate forged paper calibration certificates."),
            ("Paperless E-Governance: ", "Replaces multi-page carbon inspection forms with centralized, cryptographically auditable digital records across all State Directorates."),
        ]
        
        for idx, (bold_title, text) in enumerate(impact_points):
            p = tf.paragraphs[0] if idx == 0 else add_clean_paragraph(tf)
            r_b = p.add_run()
            r_b.text = "• " + bold_title
            r_b.font.bold = True
            r_b.font.size = Pt(11)
            r_b.font.color.rgb = DARK
            
            r_t = p.add_run()
            r_t.text = text
            r_t.font.bold = False
            r_t.font.size = Pt(11)
            r_t.font.color.rgb = TEXT_BODY
            p.space_after = Pt(2)
            
    elif shape.name == 'Oval 11':
        shape.left = Emu(250000)
        shape.top = Emu(180000)
        shape.width = Emu(1250000)
        shape.height = Emu(800000)
        tf = shape.text_frame
        clear_text_frame(tf)
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        r = p.add_run()
        r.text = "Metrology\nInnovators"
        r.font.size = Pt(10)
        r.font.bold = True
        r.font.color.rgb = NAVY

impact_img = os.path.join(IMAGES_DIR, "impact_v2_1788429990425.jpg")
if os.path.exists(impact_img):
    add_image_to_slide(slide5, impact_img,
                       Emu(1000000), Emu(2750000),
                       Emu(10200000), Emu(3400000))

# ============================================================
# SLIDE 6: RESEARCH AND REFERENCES (Two-Column Layout)
# ============================================================
print("Building Slide 6: RESEARCH AND REFERENCES")
slide6 = prs.slides[5]

for shape in slide6.shapes:
    if shape.name == 'Title 1':
        adjust_title(shape, "RESEARCH FOUNDATION & REGULATORY REFERENCES", font_size=24)
    elif shape.name == 'TextBox 8':
        shape.left = Emu(400000)
        shape.top = Emu(1300000)
        shape.width = Emu(5500000)
        shape.height = Emu(4900000)
        
        tf = shape.text_frame
        clear_text_frame(tf)
        
        p0 = tf.paragraphs[0]
        r0 = p0.add_run()
        r0.text = "1. International Metrology Standards"
        r0.font.size = Pt(16)
        r0.font.bold = True
        r0.font.color.rgb = NAVY
        p0.space_after = Pt(8)
        
        intl = [
            ("OIML R 76-1:2006: ", "Non-automatic weighing instruments — Metrological & technical requirements; Table 3 MPE tolerance limits, Section 3.5."),
            ("OIML R 76-2:2007: ", "Non-automatic weighing instruments — Standardized test report format and repeatable testing procedures."),
            ("ISO/IEC Guide 98-3:2008 (GUM): ", "Guide to the Expression of Uncertainty in Measurement — Expanded uncertainty budget calculation (k=2)."),
            ("EURAMET cg-18 v4.0 (2015): ", "Guidelines on Calibration of NAWI — Repeatability, eccentricity & temperature formulas."),
        ]
        for b, t in intl:
            p = add_clean_paragraph(tf)
            r_b = p.add_run()
            r_b.text = "• " + b
            r_b.font.bold = True
            r_b.font.size = Pt(11)
            r_b.font.color.rgb = DARK
            r_t = p.add_run()
            r_t.text = t
            r_t.font.bold = False
            r_t.font.size = Pt(10)
            r_t.font.color.rgb = TEXT_BODY
            p.space_after = Pt(6)
            
    elif shape.name == 'Oval 8':
        shape.left = Emu(250000)
        shape.top = Emu(180000)
        shape.width = Emu(1250000)
        shape.height = Emu(800000)
        tf = shape.text_frame
        clear_text_frame(tf)
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        r = p.add_run()
        r.text = "Metrology\nInnovators"
        r.font.size = Pt(10)
        r.font.bold = True
        r.font.color.rgb = NAVY

# Add Column 2 text box for Indian Legal Framework on Slide 6
col2_box = slide6.shapes.add_textbox(Emu(6100000), Emu(1300000), Emu(5600000), Emu(4900000))
tf2 = col2_box.text_frame
tf2.word_wrap = True
clear_text_frame(tf2)

p2_0 = tf2.paragraphs[0]
r2_0 = p2_0.add_run()
r2_0.text = "2. Indian Legal Framework & Government Portals"
r2_0.font.size = Pt(16)
r2_0.font.bold = True
r2_0.font.color.rgb = NAVY
p2_0.space_after = Pt(8)

india = [
    ("Legal Metrology Act, 2009 (Act 1 of 2010): ", "Statutory mandates for verification & calibration of commercial weighing instruments."),
    ("Legal Metrology (General) Rules, 2011: ", "Seventh Schedule standards, including July 2026 amendments rationalizing verification norms for high-capacity scales (>=1 tonne)."),
    ("BIS IS 9281 (Parts 1-4): ", "Bureau of Indian Standards specifications for electronic weighing systems and load cells."),
    ("DoCA eMaap Portal (emaap.gov.in): ", "Department of Consumer Affairs online enforcement and inspection tracking system."),
    ("e-NAM Platform (enam.gov.in): ", "National Agriculture Market official data: 1,656 mandis, 1.80 Cr farmers (June 2026)."),
    ("SIH Winner Benchmark: ", "https://github.com/Aadiii00/SIH-Winners-PPt-and-Sources."),
]
for b, t in india:
    p = add_clean_paragraph(tf2)
    r_b = p.add_run()
    r_b.text = "• " + b
    r_b.font.bold = True
    r_b.font.size = Pt(10.5)
    r_b.font.color.rgb = DARK
    r_t = p.add_run()
    r_t.text = t
    r_t.font.bold = False
    r_t.font.size = Pt(9.5)
    r_t.font.color.rgb = TEXT_BODY
    p.space_after = Pt(4)

# ============================================================
# REMOVE SLIDE 7 (Instructions slide)
# ============================================================
print("Removing Slide 7 (Instructions)")
from lxml import etree
prs_elem = prs.part._element
nsmap = {'p': 'http://schemas.openxmlformats.org/presentationml/2006/main'}
sldIdLst = prs_elem.find('.//p:sldIdLst', nsmap)
if sldIdLst is not None:
    slide_ids = list(sldIdLst)
    if len(slide_ids) > 6:
        sldId_to_remove = slide_ids[6]
        sldIdLst.remove(sldId_to_remove)
        print("  Removed slide 7 from presentation")

prs.save(OUTPUT)
print("")
print("PPT successfully saved to: " + OUTPUT)
print("Final slide count: 6")
