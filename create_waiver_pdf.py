#!/usr/bin/env python3
"""Create a fillable PDF waiver for Jet's Ski Rentals."""

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfbase import pdfform

BRAND_DARK = HexColor("#0c4a6e")
BRAND_MED = HexColor("#0369a1")
BRAND_LIGHT = HexColor("#e0f2fe")
BLACK = HexColor("#1a1a1a")
GRAY = HexColor("#555555")
FIELD_BG = HexColor("#f0f9ff")
FIELD_BORDER = HexColor("#7dd3fc")
WHITE = HexColor("#ffffff")

PAGE_W, PAGE_H = letter
MARGIN_L = 0.75 * inch
MARGIN_R = 0.75 * inch
CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R

def new_page(c, y):
    """Start a new page if needed, return new y."""
    if y < 1.0 * inch:
        c.showPage()
        c.setFont("Helvetica", 9)
        return PAGE_H - 0.75 * inch
    return y

def draw_section_title(c, y, number, title):
    y = new_page(c, y)
    y -= 6
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(BRAND_DARK)
    c.drawString(MARGIN_L, y, f"{number}. {title}")
    y -= 3
    c.setStrokeColor(BRAND_MED)
    c.setLineWidth(0.5)
    c.line(MARGIN_L, y, PAGE_W - MARGIN_R, y)
    y -= 12
    c.setFillColor(BLACK)
    c.setFont("Helvetica", 9)
    return y

def draw_paragraph(c, y, text, indent=0):
    """Draw wrapped paragraph text. Returns new y position."""
    from reportlab.lib.utils import simpleSplit
    y = new_page(c, y)
    c.setFont("Helvetica", 9)
    c.setFillColor(GRAY)
    max_w = CONTENT_W - indent
    lines = simpleSplit(text, "Helvetica", 9, max_w)
    for line in lines:
        y = new_page(c, y)
        c.drawString(MARGIN_L + indent, y, line)
        y -= 13
    return y

def draw_bullet(c, y, text, indent=18):
    from reportlab.lib.utils import simpleSplit
    y = new_page(c, y)
    c.setFont("Helvetica", 9)
    c.setFillColor(GRAY)
    c.drawString(MARGIN_L + indent - 8, y + 1, "\u2022")
    max_w = CONTENT_W - indent - 5
    lines = simpleSplit(text, "Helvetica", 9, max_w)
    for i, line in enumerate(lines):
        y = new_page(c, y)
        c.drawString(MARGIN_L + indent, y, line)
        y -= 12
    return y

def draw_text_field(c, y, label, field_name, width=None, height=18):
    y = new_page(c, y)
    if width is None:
        width = CONTENT_W
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(BRAND_MED)
    c.drawString(MARGIN_L, y + 2, label)
    y -= 14
    y = new_page(c, y)
    form = c.acroForm
    form.textfield(
        name=field_name,
        x=MARGIN_L,
        y=y - 4,
        width=width,
        height=height,
        borderColor=FIELD_BORDER,
        fillColor=FIELD_BG,
        textColor=BLACK,
        fontSize=10,
        borderWidth=1,
    )
    y -= (height + 8)
    return y

def draw_checkbox(c, y, label, field_name):
    y = new_page(c, y)
    form = c.acroForm
    form.checkbox(
        name=field_name,
        x=MARGIN_L,
        y=y - 2,
        size=14,
        borderColor=FIELD_BORDER,
        fillColor=FIELD_BG,
        buttonStyle='check',
        borderWidth=1,
    )
    c.setFont("Helvetica", 9)
    c.setFillColor(BLACK)
    c.drawString(MARGIN_L + 20, y, label)
    y -= 20
    return y

def draw_signature_field(c, y, label, field_name):
    y = new_page(c, y)
    y -= 4
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(BRAND_MED)
    c.drawString(MARGIN_L, y + 2, label)
    y -= 16
    y = new_page(c, y)
    # Draw signature box
    c.setStrokeColor(FIELD_BORDER)
    c.setFillColor(FIELD_BG)
    c.setLineWidth(1)
    sig_h = 40
    c.rect(MARGIN_L, y - sig_h + 14, CONTENT_W, sig_h, fill=1, stroke=1)
    # Add text field overlay for typing
    form = c.acroForm
    form.textfield(
        name=field_name,
        x=MARGIN_L,
        y=y - sig_h + 14,
        width=CONTENT_W,
        height=sig_h,
        borderColor=FIELD_BORDER,
        fillColor=FIELD_BG,
        textColor=BLACK,
        fontSize=14,
        borderWidth=1,
    )
    c.setFont("Helvetica-Oblique", 7)
    c.setFillColor(GRAY)
    y -= sig_h
    c.drawString(MARGIN_L + 4, y + 4, "Type your full name as signature")
    y -= 14
    return y


def create_waiver():
    output_path = "/var/lib/freelancer/projects/40259121/Jets_Ski_Rentals_Waiver.pdf"
    c = canvas.Canvas(output_path, pagesize=letter)
    c.setTitle("Jet's Ski Rentals - Liability Waiver")
    c.setAuthor("Jet's Ski Rentals")
    c.setSubject("Rental Agreement, Waiver of Liability, and Assumption of Risk")

    y = PAGE_H - 0.6 * inch

    # ---- HEADER ----
    c.setFillColor(BRAND_DARK)
    c.rect(0, y - 10, PAGE_W, 50, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(PAGE_W / 2, y + 10, "JET'S SKI RENTALS")
    c.setFont("Helvetica", 10)
    c.drawCentredString(PAGE_W / 2, y - 5, "getwetwithjet.com")
    y -= 30

    # Subtitle
    y -= 16
    c.setFillColor(BRAND_DARK)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(PAGE_W / 2, y, "JET SKI / PERSONAL WATERCRAFT RENTAL AGREEMENT,")
    y -= 14
    c.drawCentredString(PAGE_W / 2, y, "WAIVER OF LIABILITY, AND ASSUMPTION OF RISK (FLORIDA)")
    y -= 20

    # ---- PARTICIPANT INFORMATION ----
    c.setFillColor(BRAND_LIGHT)
    c.rect(MARGIN_L - 4, y - 110, CONTENT_W + 8, 115, fill=1, stroke=0)
    c.setStrokeColor(BRAND_MED)
    c.setLineWidth(1)
    c.rect(MARGIN_L - 4, y - 110, CONTENT_W + 8, 115, fill=0, stroke=1)

    c.setFillColor(BRAND_DARK)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN_L + 4, y - 2, "PARTICIPANT INFORMATION")
    y -= 18

    form = c.acroForm
    field_w = (CONTENT_W - 20) / 2

    # Row 1: Full Name + Date of Birth
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(BRAND_MED)
    c.drawString(MARGIN_L + 4, y, "Full Name")
    c.drawString(MARGIN_L + field_w + 16, y, "Date of Birth")
    y -= 14
    form.textfield(name="participant_name", x=MARGIN_L + 4, y=y - 2, width=field_w, height=18,
                   borderColor=FIELD_BORDER, fillColor=WHITE, textColor=BLACK, fontSize=10, borderWidth=1)
    form.textfield(name="participant_dob", x=MARGIN_L + field_w + 16, y=y - 2, width=field_w, height=18,
                   borderColor=FIELD_BORDER, fillColor=WHITE, textColor=BLACK, fontSize=10, borderWidth=1)
    y -= 24

    # Row 2: Driver's License + Phone
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(BRAND_MED)
    c.drawString(MARGIN_L + 4, y, "Driver's License / State ID")
    c.drawString(MARGIN_L + field_w + 16, y, "Phone Number")
    y -= 14
    form.textfield(name="drivers_license", x=MARGIN_L + 4, y=y - 2, width=field_w, height=18,
                   borderColor=FIELD_BORDER, fillColor=WHITE, textColor=BLACK, fontSize=10, borderWidth=1)
    form.textfield(name="phone_number", x=MARGIN_L + field_w + 16, y=y - 2, width=field_w, height=18,
                   borderColor=FIELD_BORDER, fillColor=WHITE, textColor=BLACK, fontSize=10, borderWidth=1)
    y -= 24

    # Row 3: Address (full width)
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(BRAND_MED)
    c.drawString(MARGIN_L + 4, y, "Address (Street, City, State, ZIP)")
    y -= 14
    form.textfield(name="participant_address", x=MARGIN_L + 4, y=y - 2, width=CONTENT_W - 4, height=18,
                   borderColor=FIELD_BORDER, fillColor=WHITE, textColor=BLACK, fontSize=10, borderWidth=1)
    y -= 30

    # ---- SECTIONS ----
    # Section 1
    y = draw_section_title(c, y, 1, "ACKNOWLEDGMENT OF RISK")
    y = draw_paragraph(c, y, "I understand that operating or riding on a personal watercraft (PWC), commonly known as a jet ski, involves inherent and significant risks including but not limited to:")
    for item in ["Drowning", "Collisions with other vessels, docks, swimmers, or fixed objects", "Capsizing",
                 "Personal injury or death", "Exposure to water conditions, weather, waves, wakes, and currents",
                 "Equipment malfunction", "Negligence of other operators", "Slippery surfaces",
                 "Impact injuries", "Falling off the watercraft", "Sun exposure, dehydration, or fatigue"]:
        y = draw_bullet(c, y, item)
    y = draw_paragraph(c, y, "I voluntarily choose to participate in this activity with full knowledge of these risks.")
    y -= 4

    # Section 2
    y = draw_section_title(c, y, 2, "ASSUMPTION OF RISK")
    y = draw_paragraph(c, y, "I voluntarily assume all risks associated with the rental, operation, or use of the jet ski and related equipment, whether known or unknown, foreseeable or unforeseeable.")
    y = draw_paragraph(c, y, "I understand that these risks may result in:")
    for item in ["Serious injury", "Permanent disability", "Death", "Property damage"]:
        y = draw_bullet(c, y, item)
    y -= 4

    # Section 3
    y = draw_section_title(c, y, 3, "RELEASE OF LIABILITY")
    y = draw_paragraph(c, y, "To the fullest extent permitted by Florida law, I hereby release, waive, discharge, and hold harmless:")
    y = draw_paragraph(c, y, "The rental company, its owners, employees, agents, contractors, volunteers, affiliates, and property owners from any and all claims, demands, damages, causes of action, or liability arising out of or related to:")
    for item in ["Injury", "Death", "Property damage", "Loss of personal items", "Accidents", "Equipment failure", "Negligence"]:
        y = draw_bullet(c, y, item)
    y = draw_paragraph(c, y, "This release applies whether caused by negligence or otherwise.")
    y -= 4

    # Section 4
    y = draw_section_title(c, y, 4, "INDEMNIFICATION")
    y = draw_paragraph(c, y, "I agree to indemnify and defend the rental company against any claims, lawsuits, damages, or expenses arising from:")
    for item in ["My use of the jet ski", "My passengers' actions", "Violation of laws or rules",
                 "Negligent or reckless operation", "Damage to equipment or property", "Injury to others"]:
        y = draw_bullet(c, y, item)
    y -= 4

    # Section 5
    y = draw_section_title(c, y, 5, "OPERATOR REQUIREMENTS")
    y = draw_paragraph(c, y, "I certify that:")
    for item in ["I am legally allowed to operate a jet ski in the State of Florida.",
                 "If required, I possess a valid boating safety education identification card.",
                 "I am not under the influence of alcohol or drugs.",
                 "I will follow all state and federal boating laws.",
                 "I will follow all safety instructions given by staff."]:
        y = draw_bullet(c, y, item)
    y -= 4

    # Section 6
    y = draw_section_title(c, y, 6, "SAFETY BRIEFING CONFIRMATION")
    y = draw_paragraph(c, y, "I confirm that I have received and understand the safety briefing which included:")
    for item in ["Proper operation of the jet ski", "Safe riding zones", "Emergency procedures",
                 "What to do if the jet ski capsizes", "Speed and distance rules", "Navigation rules",
                 "Life jacket requirements", "Communication procedures"]:
        y = draw_bullet(c, y, item)
    y = draw_paragraph(c, y, "I had the opportunity to ask questions and understand the instructions.")
    y -= 4

    # Section 7
    y = draw_section_title(c, y, 7, "LIFE JACKET REQUIREMENT")
    y = draw_paragraph(c, y, "I understand that:")
    for item in ["A U.S. Coast Guard approved life jacket must be worn at all times while operating or riding the jet ski.",
                 "Failure to wear a life jacket may result in termination of the rental without refund."]:
        y = draw_bullet(c, y, item)
    y -= 4

    # Section 8
    y = draw_section_title(c, y, 8, "DAMAGE RESPONSIBILITY")
    y = draw_paragraph(c, y, "I agree to be financially responsible for:")
    for item in ["Damage to the jet ski", "Lost equipment", "Negligent operation", "Recovery costs",
                 "Towing fees", "Repairs", "Downtime caused by damage"]:
        y = draw_bullet(c, y, item)
    y = draw_paragraph(c, y, "Credit card authorization may be used to cover these costs.")
    y -= 4

    # Section 9
    y = draw_section_title(c, y, 9, "WEATHER & WATER CONDITIONS")
    y = draw_paragraph(c, y, "I understand that water and weather conditions can change rapidly and may create dangerous situations.")
    y = draw_paragraph(c, y, "The rental company reserves the right to:")
    for item in ["Cancel or terminate rides", "Require return to dock", "Modify riding areas", "End rental early for safety"]:
        y = draw_bullet(c, y, item)
    y -= 4

    # Section 10
    y = draw_section_title(c, y, 10, "PROHIBITED ACTIVITIES")
    y = draw_paragraph(c, y, "I agree NOT to:")
    for item in ["Operate under the influence", "Allow unauthorized drivers", "Operate outside designated areas",
                 "Tow objects or people", "Engage in reckless or high-risk behavior",
                 "Operate after sunset unless authorized", "Race or perform dangerous maneuvers",
                 "Operate near swimmers or wildlife"]:
        y = draw_bullet(c, y, item)
    y = draw_paragraph(c, y, "Violation may result in immediate termination with no refund.")
    y -= 4

    # Section 11
    y = draw_section_title(c, y, 11, "MINORS")
    y = draw_paragraph(c, y, "If signing for a minor, I certify that:")
    for item in ["I am the legal parent or guardian.",
                 "I accept full responsibility for the minor.",
                 "I agree to all terms on behalf of the minor."]:
        y = draw_bullet(c, y, item)
    y -= 4

    # Section 12
    y = draw_section_title(c, y, 12, "MEDICAL FITNESS")
    y = draw_paragraph(c, y, "I confirm that I am physically capable of participating and do not have any medical condition that would make participation unsafe, including but not limited to:")
    for item in ["Heart conditions", "Seizures", "Pregnancy", "Severe back or neck injuries", "Conditions affecting balance"]:
        y = draw_bullet(c, y, item)
    y = draw_paragraph(c, y, "I accept full responsibility for my health.")
    y -= 4

    # Section 13
    y = draw_section_title(c, y, 13, "EMERGENCY MEDICAL AUTHORIZATION")
    y = draw_paragraph(c, y, "In the event of an emergency, I authorize the rental company to obtain medical treatment on my behalf if necessary. I understand that I am responsible for any medical costs incurred.")
    y -= 4

    # Section 14
    y = draw_section_title(c, y, 14, "PROPERTY LOSS")
    y = draw_paragraph(c, y, "The rental company is not responsible for lost phones, jewelry, wallets, cameras, or personal items. I understand that water activities may result in loss or damage to personal property.")
    y -= 4

    # Section 15
    y = draw_section_title(c, y, 15, "VIDEO / PHOTO RELEASE")
    y = draw_paragraph(c, y, "I grant permission for the company to use photos or videos taken during the activity for marketing and promotional purposes unless I opt out below.")
    y = draw_checkbox(c, y, "I OPT OUT of photo/video use for marketing purposes", "photo_opt_out")
    y -= 4

    # Section 16
    y = draw_section_title(c, y, 16, "COMPLIANCE WITH FLORIDA LAW")
    y = draw_paragraph(c, y, "This agreement is governed by the laws of the State of Florida. Any disputes shall be resolved in the State of Florida. If any portion of this agreement is deemed invalid, the remaining provisions shall remain in full force and effect.")
    y -= 4

    # Section 17
    y = draw_section_title(c, y, 17, "ACKNOWLEDGMENT OF UNDERSTANDING")
    y = draw_paragraph(c, y, "I have carefully read this agreement and fully understand its contents. I understand that I am waiving certain legal rights, including the right to sue. I sign this agreement voluntarily.")
    y -= 10

    # ---- MINOR SECTION ----
    y = new_page(c, y)
    y -= 4
    c.setFillColor(HexColor("#fef3c7"))
    c.rect(MARGIN_L - 4, y - 95, CONTENT_W + 8, 100, fill=1, stroke=0)
    c.setStrokeColor(HexColor("#f59e0b"))
    c.setLineWidth(1)
    c.rect(MARGIN_L - 4, y - 95, CONTENT_W + 8, 100, fill=0, stroke=1)

    c.setFillColor(HexColor("#92400e"))
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN_L + 4, y - 2, "FOR MINORS ONLY (if applicable)")
    y -= 20

    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(HexColor("#b45309"))
    c.drawString(MARGIN_L + 4, y, "Minor's Full Name")
    c.drawString(MARGIN_L + field_w + 16, y, "Minor's Age")
    y -= 14
    form.textfield(name="minor_name", x=MARGIN_L + 4, y=y - 2, width=field_w, height=18,
                   borderColor=HexColor("#fbbf24"), fillColor=WHITE, textColor=BLACK, fontSize=10, borderWidth=1)
    form.textfield(name="minor_age", x=MARGIN_L + field_w + 16, y=y - 2, width=field_w, height=18,
                   borderColor=HexColor("#fbbf24"), fillColor=WHITE, textColor=BLACK, fontSize=10, borderWidth=1)
    y -= 24

    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(HexColor("#b45309"))
    c.drawString(MARGIN_L + 4, y, "Parent/Guardian Full Name")
    y -= 14
    form.textfield(name="guardian_name", x=MARGIN_L + 4, y=y - 2, width=CONTENT_W - 4, height=18,
                   borderColor=HexColor("#fbbf24"), fillColor=WHITE, textColor=BLACK, fontSize=10, borderWidth=1)
    y -= 35

    # ---- SIGNATURE SECTION ----
    y = new_page(c, y)
    y -= 6
    c.setFillColor(BRAND_DARK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MARGIN_L, y, "SIGNATURES")
    y -= 4
    c.setStrokeColor(BRAND_DARK)
    c.setLineWidth(1.5)
    c.line(MARGIN_L, y, PAGE_W - MARGIN_R, y)
    y -= 16

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(BLACK)
    c.drawString(MARGIN_L, y, "By signing below, I acknowledge that I have read and understood the entire waiver,")
    y -= 13
    c.drawString(MARGIN_L, y, "and I voluntarily agree to all terms.")
    y -= 20

    # Participant signature
    y = draw_signature_field(c, y, "Participant Signature", "participant_signature")
    y -= 4

    # Date field
    y = draw_text_field(c, y, "Date", "signature_date", width=200)
    y -= 8

    # Guardian signature
    y = draw_signature_field(c, y, "Parent/Guardian Signature (if minor)", "guardian_signature")
    y -= 4

    # Guardian date
    y = draw_text_field(c, y, "Date", "guardian_signature_date", width=200)

    # ---- FOOTER on last page ----
    c.setFont("Helvetica-Oblique", 7)
    c.setFillColor(GRAY)
    c.drawCentredString(PAGE_W / 2, 0.5 * inch, "Jet's Ski Rentals  |  Grady Brown Park, Freeport, FL 32439  |  getwetwithjet.com  |  jetsskirentalsllc@gmail.com")

    c.save()
    print(f"PDF created: {output_path}")

if __name__ == "__main__":
    create_waiver()
