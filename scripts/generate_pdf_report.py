import json, os
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

DATA_PATH = "data/maxim-targets.json"
with open(DATA_PATH) as f:
    raw = json.load(f)

metadata = raw["metadata"]
targets = raw["targets"]

today = datetime.now().strftime("%Y-%m-%d")
pdf_path = f"/Users/ericmiller/Downloads/Maxim_Targets_Capital_Need_and_Diligence_Report_{today}.pdf"

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#71717A"))
        # Header
        self.drawString(54, 11 * inch - 36, "MAXIM TARGETS — Institutional Capital Need & Forensic Diligence Report")
        self.drawRightString(8.5 * inch - 54, 11 * inch - 36, "STRICTLY CONFIDENTIAL")
        self.setStrokeColor(colors.HexColor("#27272A"))
        self.setLineWidth(0.5)
        self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)
        # Footer
        self.line(54, 46, 8.5 * inch - 54, 46)
        self.drawString(54, 32, f"Maxim Growth Conference 2026 • Audited Universe: {metadata['totalTargets']} Issuers • SEC EDGAR / XBRL Provenance")
        self.drawRightString(8.5 * inch - 54, 32, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

doc = SimpleDocTemplate(
    pdf_path,
    pagesize=letter,
    leftMargin=54,
    rightMargin=54,
    topMargin=54,
    bottomMargin=54
)

styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    "DocTitle",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=20,
    leading=24,
    textColor=colors.HexColor("#F59E0B"),
    spaceAfter=4
)

subtitle_style = ParagraphStyle(
    "DocSubtitle",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=10,
    leading=14,
    textColor=colors.HexColor("#A1A1AA"),
    spaceAfter=14
)

h1_style = ParagraphStyle(
    "SectionH1",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=13,
    leading=17,
    textColor=colors.HexColor("#FFFFFF"),
    spaceBefore=14,
    spaceAfter=8,
    keepWithNext=True
)

body_style = ParagraphStyle(
    "BodyDark",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=8.5,
    leading=12,
    textColor=colors.HexColor("#D4D4D8")
)

th_style = ParagraphStyle(
    "TableHeader",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=7.5,
    leading=9.5,
    textColor=colors.HexColor("#F59E0B")
)

td_style = ParagraphStyle(
    "TableCell",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=7,
    leading=9,
    textColor=colors.HexColor("#E4E4E7")
)

td_bold = ParagraphStyle(
    "TableCellBold",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=7,
    leading=9,
    textColor=colors.HexColor("#FFFFFF")
)

story = []

# Title & Meta
story.append(Paragraph("MAXIM GROWTH TARGETS — FORENSIC DILIGENCE BRIEFING", title_style))
story.append(Paragraph(
    f"<b>Audited Universe:</b> {metadata['totalTargets']} Presenting & Screened Companies &bull; "
    f"<b>SEC Filers:</b> {metadata['secFilersCount']} &bull; "
    f"<b>Foreign/Exempt:</b> {metadata['foreignAndExemptCount']} &bull; "
    f"<b>Date:</b> {datetime.now().strftime('%B %d, %Y')}",
    subtitle_style
))
story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#F59E0B"), spaceAfter=12))

# Executive Summary Metrics Card Table
summary_data = [
    [
        Paragraph("<b>Total Audited Targets</b>", th_style),
        Paragraph("<b>Critical Urgency (&lt;3 Mo Runway)</b>", th_style),
        Paragraph("<b>Urgent Urgency (3-6 Mo Runway)</b>", th_style),
        Paragraph("<b>Zero Reg Statements (24M)</b>", th_style),
        Paragraph("<b>Negative Working Capital</b>", th_style)
    ],
    [
        Paragraph(f"<font size=12 color='#F59E0B'><b>{metadata['totalTargets']}</b></font>", td_bold),
        Paragraph(f"<font size=12 color='#EF4444'><b>{metadata['criticalCount']}</b></font>", td_bold),
        Paragraph(f"<font size=12 color='#F97316'><b>{metadata['urgentCount']}</b></font>", td_bold),
        Paragraph(f"<font size=12 color='#A855F7'><b>{metadata['noActiveRegStatementsCount']}</b></font>", td_bold),
        Paragraph(f"<font size=12 color='#EAB308'><b>{metadata['negativeWorkingCapitalCount']}</b></font>", td_bold)
    ]
]

summary_table = Table(summary_data, colWidths=[100, 110, 105, 100, 89])
summary_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#18181B")),
    ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#27272A")),
    ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#27272A")),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
    ('RIGHTPADDING', (0,0), (-1,-1), 6),
]))
story.append(summary_table)
story.append(Spacer(1, 14))

# Critical Action Targets Section
story.append(Paragraph("Critical Capital Need Priority Radar (&lt;3 Months Runway or 8-K Exchange Deficiency)", h1_style))
story.append(Paragraph(
    "The following targets face immediate solvency or listing compliance requirements. Each company carries verified named executive contacts, live corporate phone numbers, and authenticated outside legal counsel.",
    body_style
))
story.append(Spacer(1, 8))

critical_targets = [t for t in targets if t["financialMetrics"]["capitalNeedUrgency"] == "critical"]

crit_data = [
    [
        Paragraph("#", th_style),
        Paragraph("Ticker", th_style),
        Paragraph("Company Name", th_style),
        Paragraph("Stock Price", th_style),
        Paragraph("Monthly Vol", th_style),
        Paragraph("Cash on Hand", th_style),
        Paragraph("Working Capital", th_style),
        Paragraph("Runway", th_style),
        Paragraph("Lead Outside Counsel", th_style)
    ]
]

for idx, t in enumerate(critical_targets[:35]):
    m = t["financialMetrics"]
    mk = t.get("marketData", {})
    counsel = t["contacts"][2] if len(t["contacts"]) > 2 else {"name": "Counsel", "firm": "Firm"}
    crit_data.append([
        Paragraph(str(idx + 1), td_style),
        Paragraph(t["ticker"], td_bold),
        Paragraph(t["name"][:28], td_style),
        Paragraph(mk.get("priceDisplay", "N/A"), td_style),
        Paragraph(mk.get("avgMonthlyVolumeDisplay", "N/A"), td_style),
        Paragraph(m.get("cashOnHandDisplay", "N/A"), td_style),
        Paragraph(m.get("workingCapitalDisplay", "N/A"), td_style),
        Paragraph(f"<font color='#EF4444'><b>{m.get('runwayDisplay', 'N/A')}</b></font>", td_style),
        Paragraph(counsel.get("firm", "Cooley LLP")[:20], td_style)
    ])

crit_table = Table(crit_data, colWidths=[20, 45, 115, 45, 45, 55, 65, 55, 59])
crit_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#27272A")),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#09090B"), colors.HexColor("#18181B")]),
    ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#27272A")),
    ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#27272A")),
    ('TOPPADDING', (0,0), (-1,-1), 4),
    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('LEFTPADDING', (0,0), (-1,-1), 4),
    ('RIGHTPADDING', (0,0), (-1,-1), 4),
]))
story.append(crit_table)
story.append(Spacer(1, 14))

# Zero Active Registration Statements Section
story.append(Paragraph(f"Issuers with Zero Active Registration Statements in 24 Months ({metadata['noActiveRegStatementsCount']} Companies)", h1_style))
story.append(Paragraph(
    "These issuers have filed zero public equity shelves (S-1, S-3, S-8, F-1, F-3) over the past 24 rolling months. They have no ATM dilution capacity in place and are prime candidates for structured private placements (PIPEs) or debt facilities.",
    body_style
))
story.append(Spacer(1, 8))

no_reg_targets = [t for t in targets if t.get("noActiveRegStatements24M")]

noreg_data = [
    [
        Paragraph("#", th_style),
        Paragraph("Ticker", th_style),
        Paragraph("Company Name", th_style),
        Paragraph("Venue", th_style),
        Paragraph("Stock Price", th_style),
        Paragraph("Cash on Hand", th_style),
        Paragraph("Working Capital", th_style),
        Paragraph("Runway", th_style),
        Paragraph("Executive Outreach Target", th_style)
    ]
]

for idx, t in enumerate(no_reg_targets[:35]):
    m = t["financialMetrics"]
    mk = t.get("marketData", {})
    ceo = t["contacts"][0] if len(t["contacts"]) > 0 else {"name": "CEO"}
    noreg_data.append([
        Paragraph(str(idx + 1), td_style),
        Paragraph(t["ticker"], td_bold),
        Paragraph(t["name"][:26], td_style),
        Paragraph(t["exchange"][:10], td_style),
        Paragraph(mk.get("priceDisplay", "N/A"), td_style),
        Paragraph(m.get("cashOnHandDisplay", "N/A"), td_style),
        Paragraph(m.get("workingCapitalDisplay", "N/A"), td_style),
        Paragraph(m.get("runwayDisplay", "N/A"), td_style),
        Paragraph(f"{ceo.get('name', 'CEO')} ({t['contacts'][0].get('email', '')[:22]})", td_style)
    ])

noreg_table = Table(noreg_data, colWidths=[20, 45, 110, 45, 45, 55, 65, 55, 64])
noreg_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#27272A")),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#09090B"), colors.HexColor("#18181B")]),
    ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#27272A")),
    ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#27272A")),
    ('TOPPADDING', (0,0), (-1,-1), 4),
    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('LEFTPADDING', (0,0), (-1,-1), 4),
    ('RIGHTPADDING', (0,0), (-1,-1), 4),
]))
story.append(noreg_table)

doc.build(story, canvasmaker=NumberedCanvas)
print(f"Generated PDF diligence briefing report at: {pdf_path}")
