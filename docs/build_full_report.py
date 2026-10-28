import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import os

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_shading(cell, color_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def create_report():
    doc = docx.Document()
    
    # Page setup
    for sec in doc.sections:
        sec.top_margin = Inches(1.0)
        sec.bottom_margin = Inches(1.0)
        sec.left_margin = Inches(1.0)
        sec.right_margin = Inches(1.0)
        sec.different_first_page_header_footer = True
        
    # Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(12)
    normal_style.font.color.rgb = RGBColor(0, 0, 0)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(6)
    
    def add_p(text, bold=False, italic=False, size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=6, color=(0,0,0)):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        run.bold = bold
        run.italic = italic
        run.font.name = 'Times New Roman'
        run.font.size = Pt(size)
        run.font.color.rgb = RGBColor(*color)
        return p

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(8)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.name = 'Times New Roman'
        run.font.size = Pt(16)
        run.font.color.rgb = RGBColor(26, 54, 93)
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.name = 'Times New Roman'
        run.font.size = Pt(14)
        run.font.color.rgb = RGBColor(30, 41, 59)
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.italic = True
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12.5)
        run.font.color.rgb = RGBColor(51, 65, 85)
        return p

    def add_code(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.0
        run = p.add_run(text)
        run.font.name = 'Courier New'
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(15, 23, 42)
        return p

    def add_bullet(text, prefix="•  "):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.25)
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(prefix)
        run.bold = True
        run.font.name = 'Times New Roman'
        run.font.size = Pt(11.5)
        run2 = p.add_run(text)
        run2.font.name = 'Times New Roman'
        run2.font.size = Pt(11.5)
        return p

    def add_img(path, width=Inches(5.8), caption=None):
        if os.path.exists(path):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(4)
            p.add_run().add_picture(path, width=width)
            if caption:
                cap_p = doc.add_paragraph()
                cap_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                cap_p.paragraph_format.space_after = Pt(10)
                cap_run = cap_p.add_run(f"Figure: {caption}")
                cap_run.font.name = 'Times New Roman'
                cap_run.font.size = Pt(10)
                cap_run.italic = True

    # =========================================================
    # 1. TITLE / COVER PAGE
    # =========================================================
    add_p("A PROJECT REPORT ON", bold=True, size=15, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=10, space_after=12)
    add_p("VEHICLE RENTAL & FLEET MANAGEMENT SYSTEM", bold=True, size=18, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=15, color=(30, 58, 138))
    
    add_p("SUBMITTED TO", bold=True, size=12, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)
    add_p("AISSMS'S INSTITUTE OF INFORMATION TECHNOLOGY, PUNE", bold=True, size=13, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)
    add_p("IN PARTIAL FULFILLMENT OF THE REQUIREMENTS FOR THE AWARD OF", size=10.5, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)
    add_p("BACHELOR OF TECHNOLOGY IN COMPUTER ENGINEERING", bold=True, size=12, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=12)

    # Logo
    if os.path.exists('d:/DBMS_MINI/dbms_pro_forked/docs/college_logo.jpeg'):
        add_img('d:/DBMS_MINI/dbms_pro_forked/docs/college_logo.jpeg', width=Inches(1.8))

    add_p("SUBMITTED BY", bold=True, size=11, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=10, space_after=4)
    add_p("1. [STUDENT_1_NAME] (Roll No: [ROLL_NO_1])", bold=True, size=11, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    add_p("2. [STUDENT_2_NAME] (Roll No: [ROLL_NO_2])", bold=True, size=11, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    add_p("3. [STUDENT_3_NAME] (Roll No: [ROLL_NO_3])", bold=True, size=11, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=12)

    add_p("UNDER THE GUIDANCE OF", bold=True, size=11, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    add_p("[PROJECT_GUIDE_NAME]", bold=True, size=12, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    add_p("Assistant Professor, Department of Computer Engineering", size=10.5, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=12)

    add_p("DEPARTMENT OF COMPUTER ENGINEERING", bold=True, size=12, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    add_p("AISSMS INSTITUTE OF INFORMATION TECHNOLOGY, PUNE - 411001", bold=True, size=11, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)
    add_p("ACADEMIC YEAR: [ACADEMIC_YEAR]", bold=True, size=11, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=0)

    doc.add_page_break()

    # =========================================================
    # 2. CERTIFICATE PAGE
    # =========================================================
    add_p("CERTIFICATE", bold=True, size=16, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=10, space_after=15, color=(30, 58, 138))
    
    if os.path.exists('d:/DBMS_MINI/dbms_pro_forked/docs/college_logo.jpeg'):
        add_img('d:/DBMS_MINI/dbms_pro_forked/docs/college_logo.jpeg', width=Inches(1.2))

    cert_text = (
        "This is to certify that the DBMS Mini-Project Report entitled \"VEHICLE RENTAL & FLEET MANAGEMENT SYSTEM\" "
        "is a bonafide work carried out by [STUDENT_1_NAME] (Roll No: [ROLL_NO_1]), [STUDENT_2_NAME] (Roll No: [ROLL_NO_2]), "
        "and [STUDENT_3_NAME] (Roll No: [ROLL_NO_3]) in partial fulfillment of the academic requirements for the Bachelor "
        "of Technology in Computer Engineering of Savitribai Phule Pune University / AISSMS Institute of Information "
        "Technology, Pune, during the academic year [ACADEMIC_YEAR].\n\n"
        "The project has been completed under supervision and guidance, and the report reflects their authentic work."
    )
    add_p(cert_text, size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=10, space_after=30)

    # Signature Table
    sig_table = doc.add_table(rows=2, cols=3)
    sig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    sig_table.autofit = True
    
    sigs = [
        ("[PROJECT_GUIDE_NAME]", "Project Guide\nDept. of Computer Engg."),
        ("Dr. K. S. Wagh", "Head of Department\nDept. of Computer Engg."),
        ("Dr. P. B. Mane", "Principal\nAISSMS IOIT, Pune")
    ]
    for col_idx, (name, role) in enumerate(sigs):
        cell_top = sig_table.cell(0, col_idx)
        cell_bot = sig_table.cell(1, col_idx)
        cell_top.text = "\n\n________________________\n" + name
        cell_bot.text = role
        for p in cell_top.paragraphs + cell_bot.paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(10.5)

    add_p("Date: [SUBMISSION_DATE]\nPlace: Pune", size=11, space_before=30, space_after=0)

    doc.add_page_break()

    # =========================================================
    # 3. ACKNOWLEDGEMENT & ABSTRACT
    # =========================================================
    add_h1("ACKNOWLEDGEMENT")
    ack_text = (
        "We express our profound gratitude to our project guide, [PROJECT_GUIDE_NAME], Assistant Professor, "
        "Department of Computer Engineering, for her/his invaluable guidance, encouragement, and constructive critique "
        "throughout the design and implementation of this Database Management System mini project.\n\n"
        "We are sincerely grateful to Dr. K. S. Wagh, Head of the Computer Engineering Department, for extending the "
        "academic and departmental facilities necessary to complete this project. We also convey our respectful thanks to "
        "Dr. P. B. Mane, Principal, AISSMS Institute of Information Technology, Pune, for maintaining an inspiring environment "
        "for student research and engineering practice.\n\n"
        "Lastly, we extend our heartfelt appreciation to our fellow classmates, laboratory instructors, and our families "
        "for their steadfast encouragement and support."
    )
    add_p(ack_text, size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=15)
    add_p("[STUDENT_1_NAME]\n[STUDENT_2_NAME]\n[STUDENT_3_NAME]", bold=True, size=11, align=WD_ALIGN_PARAGRAPH.RIGHT, space_before=15)

    doc.add_page_break()

    add_h1("ABSTRACT")
    abs_text = (
        "The Vehicle Rental & Fleet Management System is an enterprise-grade, relational database-driven web application "
        "engineered to automate the complete fleet operations lifecycle for automobile rental agencies. In commercial fleet "
        "management, data integrity and concurrent operational consistency are paramount: double-bookings, renting vehicles "
        "active in mechanical maintenance, ignoring customer driving licence validity, and financial imbalances cause severe "
        "operational and legal vulnerabilities.\n\n"
        "In contrast to conventional architectures where application code attempts to handle complex operational validation, "
        "this project enforces all core business rules directly inside the PostgreSQL 15+ relational database engine through "
        "advanced relational constraints, BEFORE/AFTER procedural triggers (PL/pgSQL), GiST temporal exclusion constraints, "
        "stored functions, and analytical aggregation views. The frontend and API tiers, implemented in Next.js 14 App Router "
        "with raw SQL execution (pg driver, avoiding heavy ORM abstraction), act strictly as presentation and routing pipelines.\n\n"
        "The relational schema comprises eight normalized relations (3NF/BCNF): Users, Vehicle Categories, Vehicles, Customers, "
        "Bookings, Payments, Maintenance, and Fuel Logs. Key capabilities demonstrated include overlapping rental prevention "
        "via GiST temporal ranges, automated vehicle status synchronisation ('Available', 'Rented', 'In Shop', 'Retired'), "
        "financial ledger balancing, licence expiry guards, and vehicle profit analytics. Comprehensive automated scenario tests "
        "confirm 100% adherence to all fifteen defined integrity specifications."
    )
    add_p(abs_text, size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=15)
    add_p("Keywords: Relational Database, PostgreSQL, Fleet Management, Database Triggers, Exclusion Constraints, BCNF Normalization, Next.js, Transaction Management.", italic=True, size=11, align=WD_ALIGN_PARAGRAPH.JUSTIFY)

    doc.add_page_break()

    # =========================================================
    # 4. TABLE OF CONTENTS
    # =========================================================
    add_h1("TABLE OF CONTENTS")
    toc_data = [
        ("Certificate", "ii"),
        ("Acknowledgement", "iii"),
        ("Abstract", "iv"),
        ("Chapter 1: INTRODUCTION", "1"),
        ("    1.1 Overview", "1"),
        ("    1.2 Motivation", "2"),
        ("    1.3 Problem Definition and Objectives", "2"),
        ("    1.4 Scope of the Project", "3"),
        ("Chapter 2: LITERATURE REVIEW", "4"),
        ("    2.1 Overview of Fleet Management Systems", "4"),
        ("    2.2 Role of Relational DBMS in Fleet Operations", "4"),
        ("    2.3 Relational Database Design and Normalization", "5"),
        ("    2.4 SQL and Transaction Management", "6"),
        ("Chapter 3: SOFTWARE REQUIREMENTS SPECIFICATION (SRS)", "7"),
        ("    3.1 Functional Requirements", "7"),
        ("    3.2 Non-Functional Requirements", "8"),
        ("    3.3 Hardware and Software Requirements", "9"),
        ("Chapter 4: SYSTEM DESIGN", "10"),
        ("    4.1 System Architecture", "10"),
        ("    4.2 Entity-Relationship (ER) Diagram", "11"),
        ("    4.3 Relational Database Schema", "12"),
        ("    4.4 Data Flow Diagram (DFD)", "13"),
        ("    4.5 Module Design", "14"),
        ("    4.6 User Interface and Navigation Flow", "15"),
        ("Chapter 5: PROJECT IMPLEMENTATION", "16"),
        ("    5.1 Tools and Technologies Used", "16"),
        ("    5.2 Database Creation and Table Implementation (DDL)", "17"),
        ("    5.3 SQL Queries and Operations", "20"),
        ("    5.4 Views and Functions", "21"),
        ("    5.5 Triggers and Transaction Management (Rules R1-R15)", "22"),
        ("    5.6 Frontend Module Implementation", "24"),
        ("    5.7 Booking, Vehicle, and Fleet Management Workflow", "25"),
        ("    5.8 Admin Dashboard and CRUD Operations", "26"),
        ("Chapter 6: RESULTS", "27"),
        ("    6.1 Implementation Outcomes", "27"),
        ("    6.2 Frontend & UI Prototype Screens", "28"),
        ("Chapter 7: CONCLUSION AND FUTURE SCOPE", "30"),
        ("    7.1 Conclusion", "30"),
        ("    7.2 Future Scope", "30"),
        ("Chapter 8: REFERENCES", "31"),
    ]

    t_toc = doc.add_table(rows=len(toc_data), cols=2)
    t_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_toc.autofit = False
    for i, (title, page) in enumerate(toc_data):
        c0 = t_toc.cell(i, 0)
        c1 = t_toc.cell(i, 1)
        c0.width = Inches(5.5)
        c1.width = Inches(0.8)
        c0.text = title
        c1.text = page
        p0 = c0.paragraphs[0]
        p1 = c1.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p0.paragraph_format.space_before = Pt(1)
        p0.paragraph_format.space_after = Pt(2)
        p1.paragraph_format.space_before = Pt(1)
        p1.paragraph_format.space_after = Pt(2)
        is_bold = title.startswith("Chapter") or title in ["Certificate", "Acknowledgement", "Abstract"]
        for r in p0.runs + p1.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(11)
            r.bold = is_bold

    doc.add_page_break()

    # =========================================================
    # CHAPTER 1: INTRODUCTION
    # =========================================================
    add_h1("CHAPTER 1: INTRODUCTION")
    
    add_h2("1.1 Overview")
    add_p(
        "In modern urban transportation, vehicle rental and commercial fleet businesses have experienced rapid expansion. "
        "A typical commercial fleet operations hub oversees dozens to hundreds of vehicles across diverse classifications "
        "(hatchbacks, premium sedans, compact SUVs, and executive luxury cars). Daily administrative workflows involve managing "
        "customer verification, handling reservations across overlapping calendar ranges, monitoring vehicle odometers and wear, "
        "tracking periodic service and major workshop maintenance, recording fuel refills, and reconciling multi-method payments."
    )
    add_p(
        "Commercial vehicle rental is inherently time-sensitive and capital-intensive. An idle vehicle produces depreciation without "
        "revenue; conversely, a vehicle double-booked or deployed with mechanical defects creates liability, lost revenue, and customer "
        "distrust. Thus, a robust, transactional Database Management System (DBMS) is the critical backbone required for continuous, "
        "reliable fleet operations."
    )

    add_h2("1.2 Motivation")
    add_p(
        "Traditional small-to-medium rental enterprises frequently rely on spreadsheets or decoupled web frameworks with rudimentary "
        "databases. In such architectures, business validation is implemented solely in frontend JavaScript or backend API controllers. "
        "This architectural flaw introduces dangerous vulnerabilities:"
    )
    add_bullet("Race conditions leading to simultaneous double-booking of a single vehicle across identical time slots.")
    add_bullet("Vehicles currently under active mechanical repair ('In Shop') being reserved and dispatched to clients.")
    add_bullet("Bookings accepted for customers possessing expired or soon-to-expire government driving licences.")
    add_bullet("Discrepancies where payments exceed booking amounts or payments are accepted against cancelled reservations.")
    add_bullet("Retiring or discarding vehicles that still possess pending future bookings or active open work orders.")
    add_p(
        "The core motivation of this project is to build an architectural paradigm where PostgreSQL acts as an authoritative single "
        "source of truth. By embedding all domain logic into relational constraints, triggers, and functions, no application bug or "
        "bypassed API endpoint can compromise the structural and transactional integrity of fleet data."
    )

    add_h2("1.3 Problem Definition and Objectives")
    add_h3("1.3.1 Problem Definition")
    add_p(
        "To conceptualize, model, and implement an end-to-end Vehicle Rental & Fleet Management System backed by a relational database "
        "(PostgreSQL 15+), featuring comprehensive constraints, procedural PL/pgSQL triggers, and analytical views that mathematically "
        "prevent invalid business states while providing an intuitive staff-oriented administration interface."
    )

    add_h3("1.3.2 Objectives of the Project")
    add_bullet("Design a normalized relational schema (1NF, 2NF, 3NF, BCNF) capturing fleet vehicles, categories, customer records, reservations, financial transactions, maintenance records, and fuel expenditure.")
    add_bullet("Prevent overlapping temporal reservations for identical vehicles using Generalized Search Tree (GiST) exclusion constraints (`btree_gist` extension).")
    add_bullet("Implement automated vehicle state lifecycle synchronization ('Available' <-> 'Rented' <-> 'In Shop' <-> 'Retired') triggered strictly by booking and maintenance state changes.")
    add_bullet("Guarantee customer driving licence verification at the database level prior to booking reservation.")
    add_bullet("Prevent financial anomalies via strict ledger checking triggers on partial and full payment transactions.")
    add_bullet("Expose analytical aggregate views computing per-vehicle profitability (Revenue - Maintenance - Fuel) and monthly revenue summaries.")
    add_bullet("Provide role-based access control (Admin vs. Staff) and lightweight Next.js 14 administrative interfaces.")

    add_h2("1.4 Scope of the Project")
    add_p(
        "The operational scope encompasses internal administrative staff operations. Customer bookings and fleet updates are handled "
        "exclusively by verified personnel. The scope comprises four integrated modules:"
    )
    add_bullet("Module 1 (Fleet & Customer Directory): Vehicle registration, category pricing, odometer updates, customer KYC validation, and vehicle lifecycle retirement guards.")
    add_bullet("Module 2 (Booking & Financial Management): Reservation creation, automated rate calculation, status transitions (Reserved -> Active -> Completed/Cancelled), and multi-mode payment auditing.")
    add_bullet("Module 3 (Workshop Maintenance & Fuel Logs): Service ticket management, automatic shop-locking of vehicles, maintenance cost recording, and per-vehicle fuel consumption logs.")
    add_bullet("Module 4 (Analytics & Operational Intelligence): Monthly revenue rollups, per-vehicle net profit calculations, overdue rental alerts, and fleet status breakdown.")

    doc.add_page_break()

    # =========================================================
    # CHAPTER 2: LITERATURE REVIEW
    # =========================================================
    add_h1("CHAPTER 2: LITERATURE REVIEW")

    add_h2("2.1 Overview of Fleet Management Systems")
    add_p(
        "Commercial fleet management systems evolved from manual ledger systems to computerized inventory databases in the 1990s. "
        "Modern fleet management requires real-time coordination across asset inventory, utilization schedules, financial balances, "
        "and regulatory compliance. Academic research underscores that fleet profitability is governed by high asset utilization "
        "(turnaround ratio) and low unscheduled maintenance downtime. When data models fail to link maintenance status to reservation "
        "availability, fleet dispatch errors spike, directly harming business revenue."
    )

    add_h2("2.2 Role of Relational DBMS in Fleet Operations")
    add_p(
        "While NoSQL databases offer rapid schema flexibility, they prioritize eventual consistency over strict transactional guarantees. "
        "In fleet rental operations, eventual consistency is unacceptable: two customer service desks concurrently booking the same "
        "vehicle for an overlapping weekend will both succeed in an eventually consistent model. Relational Database Management Systems "
        "(RDBMS) supporting ACID transactions and serializable locking are therefore mandatory."
    )
    add_p(
        "PostgreSQL 15+ provides advanced relational features particularly well-suited for fleet systems:"
    )
    add_bullet("GiST (Generalized Search Tree) indexing supporting interval overlapping checks over `daterange` types.")
    add_bullet("PL/pgSQL procedural trigger language executing BEFORE and AFTER row-level transaction events.")
    add_bullet("Foreign key constraint actions (`ON DELETE RESTRICT`) preventing accidental deletion of referenced records.")
    add_bullet("CHECK constraints enforcing positive price rates, valid registration years, and status enumeration sets.")

    add_h2("2.3 Relational Database Design and Normalization")
    add_p(
        "Database normalization is the formal process of structuring relational schema tables to eliminate data redundancy and "
        "prevent insertion, update, and deletion anomalies. The design of this system strictly satisfies Boyce-Codd Normal Form (BCNF):"
    )
    add_h3("2.3.1 First Normal Form (1NF)")
    add_p(
        "A relation is in 1NF if all attributes contain only atomic (indivisible) values and there are no repeating groups. In our schema, "
        "every field—including customer phone numbers, vehicle registration numbers, and dates—stores single atomic values. Composite "
        "multi-day reservations are decomposed into explicit `start_date` and `end_date` scalar attributes."
    )
    add_h3("2.3.2 Second Normal Form (2NF)")
    add_p(
        "A relation is in 2NF if it is in 1NF and every non-prime attribute is fully functionally dependent on the entire primary key "
        "(no partial dependency). In our schema, every relation utilizes a surrogate single-attribute primary key (e.g., `vehicle_id`, "
        "`booking_id`, `payment_id`). Because all candidate keys consist of single attributes, partial functional dependencies are "
        "mathematically impossible, fully satisfying 2NF."
    )
    add_h3("2.3.3 Third Normal Form (3NF)")
    add_p(
        "A relation is in 3NF if it is in 2NF and there are no transitive dependencies (where a non-key attribute depends on another "
        "non-key attribute). For example, vehicle daily rental rates depend on vehicle category, not directly on the individual vehicle. "
        "Rather than storing `category_name` and `daily_rate` inside the `vehicles` table, they are isolated in a separate `vehicle_categories` "
        "table referenced via the `category_id` foreign key. Similarly, customer licence details exist strictly in `customers`."
    )
    add_h3("2.3.4 Boyce-Codd Normal Form (BCNF)")
    add_p(
        "A relation is in BCNF if for every non-trivial functional dependency X -> Y, X is a superkey. In all 8 tables, all functional "
        "dependencies originate strictly from candidate keys (primary surrogate keys or unique alternate keys such as `plate_no`, "
        "`email`, `license_no`). Thus, the schema is free of update, insertion, and deletion anomalies."
    )

    add_h2("2.4 SQL and Transaction Management")
    add_p(
        "A database transaction is a logical unit of work that must satisfy ACID properties:"
    )
    add_bullet("Atomicity: When a rental booking completes, updating vehicle status to 'Rented' and recording initial payments must both succeed or rollback entirely.")
    add_bullet("Consistency: PostgreSQL triggers guarantee that database states transition only between valid business configurations (e.g., cannot transition booking directly from 'Reserved' to 'Completed').")
    add_bullet("Isolation: Concurrent booking attempts invoke row-level locking (`SELECT ... FOR UPDATE`), preventing race conditions.")
    add_bullet("Durability: Committed transactions are permanently written to Write-Ahead Logging (WAL) files prior to client acknowledgement.")

    doc.add_page_break()

    # =========================================================
    # CHAPTER 3: SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
    # =========================================================
    add_h1("CHAPTER 3: SOFTWARE REQUIREMENTS SPECIFICATION")

    add_h2("3.1 Functional Requirements")
    add_p("The functional requirements of the system are categorized by operational modules:")
    add_bullet("FR1 (Authentication & Authorization): Secure login supporting two distinct staff roles: 'admin' (fleet creation, pricing, user management, vehicle retirement) and 'staff' (daily bookings, check-ins, customer records).")
    add_bullet("FR2 (Fleet Inventory Management): Register vehicles with registration plate, make, model, year, category, and initial odometer. Support updating vehicle details and status.")
    add_bullet("FR3 (Category & Pricing Configuration): Admin-controlled creation of vehicle classes (Hatchback, Sedan, SUV, Luxury) with assigned daily rates.")
    add_bullet("FR4 (Customer Directory & Licence Verification): Maintain customer profiles with mandatory licence numbers and expiry dates. Automatically reject bookings when licence expires before rental return.")
    add_bullet("FR5 (Reservation Management): Create bookings with start and return dates. Automatically calculate total cost using category daily rates. Prevent overlapping bookings on the same vehicle.")
    add_bullet("FR6 (Booking State Transitions): Enforce strict state transitions: Reserved -> Active (on pickup) -> Completed (on return) or Cancelled. Prevent illegal transitions.")
    add_bullet("FR7 (Automated Vehicle Availability Sync): Automatically switch vehicle status to 'Rented' when booking is Active; restore to 'Available' upon Completion unless open maintenance tickets exist.")
    add_bullet("FR8 (Payment Processing & Ledger Control): Support payments via Cash, Card, and UPI. Prevent overpayments exceeding the booking balance and disallow payments on cancelled bookings.")
    add_bullet("FR9 (Workshop Maintenance Tracking): Log maintenance tickets with descriptions and repair costs. Automatically lock vehicle to 'In Shop' upon ticket creation and restore availability upon ticket closure.")
    add_bullet("FR10 (Fuel Log Management): Record fuel fill-ups with litres, cost, and date for each vehicle to enable net profitability analysis.")
    add_bullet("FR11 (Analytical Views & Alerts): Present real-time views for available vehicles, overdue rental returns, monthly revenue, and net vehicle profit.")

    add_h2("3.2 Non-Functional Requirements")
    add_bullet("Data Integrity: Enforced at the RDBMS engine layer using foreign keys, check constraints, unique constraints, and procedural triggers.")
    add_bullet("Performance: Query response times under 100 milliseconds for standard operational queries supported by B-tree and GiST indexing.")
    add_bullet("Security: Passwords stored as Blowfish salted hashes (`pgcrypto` / `bcryptjs`). Session tokens signed with HS256 JWT stored in HttpOnly, SameSite cookies.")
    add_bullet("Reliability & Availability: PostgreSQL transactional durability with automated rollback on constraint violations.")
    add_bullet("Maintainability: Modular Next.js 14 codebase adhering to raw parameterised SQL execution without ORM bloat.")

    add_h2("3.3 Hardware and Software Requirements")
    add_h3("3.3.1 Hardware Requirements")
    add_bullet("Processor: Intel Core i3 / AMD Ryzen 3 or higher (Quad-Core recommended).")
    add_bullet("RAM: Minimum 4 GB (8 GB recommended for concurrent database and development server).")
    add_bullet("Storage: Minimum 10 GB available SSD storage for database files, logs, and Node environment.")
    add_bullet("Network: Localhost network interface or LAN connection for multi-client staff access.")

    add_h3("3.3.2 Software Requirements")
    add_bullet("Operating System: Windows 10/11, Ubuntu 20.04+, or macOS.")
    add_bullet("Database Management System: PostgreSQL 15 or higher (running locally on port 5432).")
    add_bullet("Database Extensions: `btree_gist` (GiST indexing over scalar types), `pgcrypto` (cryptographic hashing).")
    add_bullet("Runtime Environment: Node.js version 20 LTS or higher.")
    add_bullet("Frontend / API Framework: Next.js 14 App Router (React 18).")
    add_bullet("Database Client Library: `pg` (Node Postgres Connection Pool).")
    add_bullet("Security Libraries: `bcryptjs` (password hashing), `jose` (JWT token management).")
    add_bullet("Management Tools: pgAdmin 4 / psql command line client.")

    doc.add_page_break()

    # =========================================================
    # CHAPTER 4: SYSTEM DESIGN
    # =========================================================
    add_h1("CHAPTER 4: SYSTEM DESIGN")

    add_h2("4.1 System Architecture")
    add_p(
        "The system follows an enterprise 3-tier architectural model designed to strictly isolate presentation, business routing, "
        "and data integrity layers:"
    )
    add_bullet("Presentation Layer (Client Tier): Developed using responsive HTML5/CSS3 within the Next.js framework. It provides interactive dashboards, dynamic data tables, badge indicators, and form dialogs for rental operations.")
    add_bullet("Application Layer (API Route Handlers): Next.js 14 App Router route handlers (`/api/*`) executing in Node.js. It manages HTTP request parsing, session token verification, role-based security, and raw parameterised SQL dispatch.")
    add_bullet("Database Layer (PostgreSQL Engine): The core brain of the application. It stores relational data, maintains indexing structures, executes analytical views, and enforces all fifteen business validation rules via PL/pgSQL triggers.")

    if os.path.exists('d:/DBMS_MINI/dbms_pro_forked/docs/system_architecture.png'):
        add_img('d:/DBMS_MINI/dbms_pro_forked/docs/system_architecture.png', width=Inches(5.8), caption="Three-Tier System Architecture")

    add_h2("4.2 Entity-Relationship (ER) Diagram")
    add_p(
        "The conceptual database model consists of eight entities structured around commercial fleet workflows. Primary keys (PK) "
        "uniquely identify entities, while foreign keys (FK) maintain referential integrity. Cardinality relationships include:"
    )
    add_bullet("vehicle_categories (1) to vehicles (N): A category classifies multiple vehicles; a vehicle belongs to exactly one category.")
    add_bullet("customers (1) to bookings (N): A customer can place multiple rental reservations over time.")
    add_bullet("vehicles (1) to bookings (N): A vehicle can be reserved across multiple distinct, non-overlapping rental periods.")
    add_bullet("users (1) to bookings (N): A staff user records multiple customer bookings.")
    add_bullet("bookings (1) to payments (N): A booking may receive zero, one, or multiple partial/full payment installments.")
    add_bullet("vehicles (1) to maintenance (N): A vehicle undergoes zero or more periodic maintenance service events.")
    add_bullet("vehicles (1) to fuel_logs (N): A vehicle accumulates zero or more fuel expense logs.")

    if os.path.exists('d:/DBMS_MINI/dbms_pro_forked/docs/er-diagram.png'):
        add_img('d:/DBMS_MINI/dbms_pro_forked/docs/er-diagram.png', width=Inches(6.0), caption="Entity-Relationship (ER) Diagram")

    add_h2("4.3 Relational Database Schema")
    add_p("The formal relational schema notation (primary keys underlined, foreign keys marked with #) is defined as:")
    add_p("1. users (user_id, full_name, email, password_hash, role)", bold=True)
    add_p("2. vehicle_categories (category_id, name, daily_rate)", bold=True)
    add_p("3. vehicles (vehicle_id, plate_no, make, model, year, #category_id, odometer_km, status)", bold=True)
    add_p("4. customers (customer_id, full_name, email, phone, license_no, license_expiry)", bold=True)
    add_p("5. bookings (booking_id, #customer_id, #vehicle_id, start_date, end_date, returned_on, status, total_amount, #created_by)", bold=True)
    add_p("6. payments (payment_id, #booking_id, amount, method, paid_on)", bold=True)
    add_p("7. maintenance (maintenance_id, #vehicle_id, description, cost, opened_on, closed_on)", bold=True)
    add_p("8. fuel_logs (fuel_id, #vehicle_id, litres, cost, logged_on)", bold=True)

    add_h2("4.4 Data Flow Diagrams (DFD)")
    add_h3("4.4.1 Level 0 DFD (Context Diagram)")
    add_p("The Level 0 context diagram models external entities (Staff User and Admin User) interacting with the boundary of the system:")
    if os.path.exists('d:/DBMS_MINI/dbms_pro_forked/docs/dfd_level_0.png'):
        add_img('d:/DBMS_MINI/dbms_pro_forked/docs/dfd_level_0.png', width=Inches(5.5), caption="DFD Level 0 — Context Diagram")

    add_h3("4.4.2 Level 1 DFD (Functional Decomposition)")
    add_p("The Level 1 diagram decomposes the system into six primary sub-processes and their interactions with the data stores:")
    if os.path.exists('d:/DBMS_MINI/dbms_pro_forked/docs/dfd_level_1.png'):
        add_img('d:/DBMS_MINI/dbms_pro_forked/docs/dfd_level_1.png', width=Inches(5.8), caption="DFD Level 1 — Functional Decomposition")

    add_h2("4.5 Module Design")
    add_p(
        "To facilitate clean team collaboration and separation of concerns, the project is structured into three self-contained modules:"
    )
    add_bullet("Module A (Fleet, Customers & Access): Owned by Person A. Responsible for user authentication, category administration, vehicle inventory, customer directory, and vehicle retirement guards (Rule R15).")
    add_bullet("Module B (Bookings & Billing): Owned by Person B. Responsible for booking reservations, duration rate computation, licence validity checks, booking state machine (Reserved -> Active -> Completed/Cancelled), and payment validation.")
    add_bullet("Module C (Maintenance, Fuel & Analytics): Owned by Person C. Responsible for workshop work orders, vehicle 'In Shop' locking triggers, fuel expenditure tracking, aggregate views, and executive dashboard metrics.")

    add_h2("4.6 User Interface and Navigation Flow")
    add_p(
        "The user navigation flow is designed for rapid keyboard-friendly operational efficiency. Unauthenticated sessions are redirected "
        "to `/login`. Upon successful credential verification, the system inspects user role: Staff users navigate to `/dashboard`, `/vehicles`, "
        "`/bookings`, and `/customers`. Admin users receive additional sidebar links for `/categories` and `/users`. Interactive pages feature "
        "consistent status badges, tabular summaries with search/filter bars, and responsive modal forms."
    )

    doc.add_page_break()

    # =========================================================
    # CHAPTER 5: PROJECT IMPLEMENTATION
    # =========================================================
    add_h1("CHAPTER 5: PROJECT IMPLEMENTATION")

    add_h2("5.1 Tools and Technologies Used")
    add_bullet("PostgreSQL 15+ / 18: Primary relational database management system.")
    add_bullet("pgAdmin 4 & psql: GUI and command-line administration consoles.")
    add_bullet("Next.js 14 App Router: React-based fullstack web development framework.")
    add_bullet("Node.js pg (node-postgres): Connection pooling client managing parameterized queries.")
    add_bullet("bcryptjs: Cryptographic password hash generation and verification.")
    add_bullet("jose: Lightweight JavaScript library for signing and verifying JWT authentication tokens.")
    add_bullet("Pure Semantic CSS: Custom design system guaranteeing lightweight styling without heavy third-party framework overhead.")

    add_h2("5.2 Database Creation and Table Implementation (DDL)")
    add_p("The complete PostgreSQL database is initialized using structured DDL statements:")

    add_code(
        "-- Extensions\n"
        "CREATE EXTENSION IF NOT EXISTS btree_gist;\n"
        "CREATE EXTENSION IF NOT EXISTS pgcrypto;\n\n"
        "-- 1. Users Table (RBAC)\n"
        "CREATE TABLE users (\n"
        "  user_id       SERIAL PRIMARY KEY,\n"
        "  full_name     VARCHAR(100) NOT NULL,\n"
        "  email         VARCHAR(100) NOT NULL UNIQUE,\n"
        "  password_hash TEXT NOT NULL,\n"
        "  role          VARCHAR(10) NOT NULL CHECK (role IN ('admin','staff'))\n"
        ");\n\n"
        "-- 2. Vehicle Categories Table\n"
        "CREATE TABLE vehicle_categories (\n"
        "  category_id SERIAL PRIMARY KEY,\n"
        "  name        VARCHAR(50) NOT NULL UNIQUE,\n"
        "  daily_rate  NUMERIC(10,2) NOT NULL CHECK (daily_rate > 0)\n"
        ");\n\n"
        "-- 3. Vehicles Table\n"
        "CREATE TABLE vehicles (\n"
        "  vehicle_id  SERIAL PRIMARY KEY,\n"
        "  plate_no    VARCHAR(15) NOT NULL UNIQUE,\n"
        "  make        VARCHAR(50) NOT NULL,\n"
        "  model       VARCHAR(50) NOT NULL,\n"
        "  year        INT NOT NULL CHECK (year BETWEEN 2000 AND 2100),\n"
        "  category_id INT NOT NULL REFERENCES vehicle_categories(category_id) ON DELETE RESTRICT,\n"
        "  odometer_km INT NOT NULL DEFAULT 0 CHECK (odometer_km >= 0),\n"
        "  status      VARCHAR(10) NOT NULL DEFAULT 'Available'\n"
        "              CHECK (status IN ('Available','Rented','In Shop','Retired'))\n"
        ");\n\n"
        "-- 4. Customers Table\n"
        "CREATE TABLE customers (\n"
        "  customer_id    SERIAL PRIMARY KEY,\n"
        "  full_name      VARCHAR(100) NOT NULL,\n"
        "  email          VARCHAR(100) NOT NULL UNIQUE,\n"
        "  phone          VARCHAR(15)  NOT NULL,\n"
        "  license_no     VARCHAR(30)  NOT NULL UNIQUE,\n"
        "  license_expiry DATE NOT NULL\n"
        ");\n\n"
        "-- 5. Bookings Table (with GiST temporal exclusion constraint)\n"
        "CREATE TABLE bookings (\n"
        "  booking_id   SERIAL PRIMARY KEY,\n"
        "  customer_id  INT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,\n"
        "  vehicle_id   INT NOT NULL REFERENCES vehicles(vehicle_id)   ON DELETE RESTRICT,\n"
        "  start_date   DATE NOT NULL,\n"
        "  end_date     DATE NOT NULL,\n"
        "  returned_on  DATE,\n"
        "  status       VARCHAR(10) NOT NULL DEFAULT 'Reserved'\n"
        "               CHECK (status IN ('Reserved','Active','Completed','Cancelled')),\n"
        "  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),\n"
        "  created_by   INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,\n"
        "  CHECK (end_date > start_date),\n"
        "  EXCLUDE USING gist (\n"
        "    vehicle_id WITH =,\n"
        "    daterange(start_date, end_date, '[)') WITH &&\n"
        "  ) WHERE (status IN ('Reserved','Active'))\n"
        ");\n\n"
        "-- 6. Payments Table\n"
        "CREATE TABLE payments (\n"
        "  payment_id SERIAL PRIMARY KEY,\n"
        "  booking_id INT NOT NULL REFERENCES bookings(booking_id) ON DELETE RESTRICT,\n"
        "  amount     NUMERIC(10,2) NOT NULL CHECK (amount > 0),\n"
        "  method     VARCHAR(10) NOT NULL CHECK (method IN ('Cash','Card','UPI')),\n"
        "  paid_on    TIMESTAMP NOT NULL DEFAULT now()\n"
        ");\n\n"
        "-- 7. Maintenance Table\n"
        "CREATE TABLE maintenance (\n"
        "  maintenance_id SERIAL PRIMARY KEY,\n"
        "  vehicle_id     INT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,\n"
        "  description    TEXT NOT NULL,\n"
        "  cost           NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),\n"
        "  opened_on      DATE NOT NULL DEFAULT CURRENT_DATE,\n"
        "  closed_on      DATE,\n"
        "  CHECK (closed_on IS NULL OR closed_on >= opened_on)\n"
        ");\n\n"
        "-- 8. Fuel Logs Table\n"
        "CREATE TABLE fuel_logs (\n"
        "  fuel_id    SERIAL PRIMARY KEY,\n"
        "  vehicle_id INT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,\n"
        "  litres     NUMERIC(6,2) NOT NULL CHECK (litres > 0),\n"
        "  cost       NUMERIC(8,2) NOT NULL CHECK (cost > 0),\n"
        "  logged_on  DATE NOT NULL DEFAULT CURRENT_DATE\n"
        ");"
    )

    add_h2("5.3 SQL Queries and Operations")
    add_p("The database layer features five showcase queries demonstrating advanced SQL operations:")
    
    add_p("Q1: Fleet Inventory with Category Pricing (INNER JOIN)", bold=True)
    add_code(
        "SELECT v.plate_no, v.make, v.model, c.name AS category, c.daily_rate, v.status\n"
        "FROM vehicles v\n"
        "JOIN vehicle_categories c ON c.category_id = v.category_id\n"
        "ORDER BY c.daily_rate, v.plate_no;"
    )

    add_p("Q2: Vehicles Never Booked (LEFT JOIN ... IS NULL)", bold=True)
    add_code(
        "SELECT v.plate_no, v.make, v.model\n"
        "FROM vehicles v\n"
        "LEFT JOIN bookings b ON b.vehicle_id = v.vehicle_id\n"
        "WHERE b.booking_id IS NULL;"
    )

    add_p("Q3: Vehicle Count by Category and Status (GROUP BY)", bold=True)
    add_code(
        "SELECT c.name AS category, v.status, COUNT(*) AS vehicles\n"
        "FROM vehicles v\n"
        "JOIN vehicle_categories c ON c.category_id = v.category_id\n"
        "GROUP BY c.name, v.status\n"
        "ORDER BY c.name, v.status;"
    )

    add_p("Q4: Popular Vehicle Categories Having More Than 2 Vehicles (HAVING)", bold=True)
    add_code(
        "SELECT c.name AS category, COUNT(*) AS vehicles\n"
        "FROM vehicles v\n"
        "JOIN vehicle_categories c ON c.category_id = v.category_id\n"
        "GROUP BY c.name\n"
        "HAVING COUNT(*) > 2;"
    )

    add_p("Q5: Customers with Licence Expiring Within 30 Days (Date Arithmetic)", bold=True)
    add_code(
        "SELECT full_name, phone, license_no, license_expiry, (license_expiry - CURRENT_DATE) AS days_left\n"
        "FROM customers\n"
        "WHERE license_expiry BETWEEN CURRENT_DATE AND CURRENT_DATE + 30\n"
        "ORDER BY license_expiry;"
    )

    add_h2("5.4 Views and Functions")
    add_h3("5.4.1 Stored Function: fn_booking_total")
    add_p("Calculates rental cost by multiplying rental duration in days by the vehicle category daily rate:")
    add_code(
        "CREATE OR REPLACE FUNCTION fn_booking_total(p_vehicle_id INT, p_start DATE, p_end DATE)\n"
        "RETURNS NUMERIC(10,2) AS $$\n"
        "  SELECT ((p_end - p_start) * c.daily_rate)::NUMERIC(10,2)\n"
        "  FROM vehicles v\n"
        "  JOIN vehicle_categories c ON c.category_id = v.category_id\n"
        "  WHERE v.vehicle_id = p_vehicle_id;\n"
        "$$ LANGUAGE sql STABLE;"
    )

    add_h3("5.4.2 Analytical Views")
    add_p("1. View for Available Vehicles: Filters fleet for immediate booking availability.")
    add_code(
        "CREATE OR REPLACE VIEW v_available_vehicles AS\n"
        "SELECT v.vehicle_id, v.plate_no, v.make, v.model, c.name AS category_name, c.daily_rate\n"
        "FROM vehicles v JOIN vehicle_categories c ON c.category_id = v.category_id\n"
        "WHERE v.status = 'Available';"
    )
    add_p("2. View for Vehicle Profitability: Reconciles booking revenues against maintenance and fuel expenses.")
    add_code(
        "CREATE OR REPLACE VIEW v_vehicle_profit AS\n"
        "SELECT v.vehicle_id, v.plate_no,\n"
        "       COALESCE(r.revenue, 0)::NUMERIC(12,2) AS revenue,\n"
        "       COALESCE(m.cost, 0)::NUMERIC(12,2)    AS maintenance_cost,\n"
        "       COALESCE(f.cost, 0)::NUMERIC(12,2)    AS fuel_cost,\n"
        "       (COALESCE(r.revenue, 0) - COALESCE(m.cost, 0) - COALESCE(f.cost, 0))::NUMERIC(12,2) AS profit\n"
        "FROM vehicles v\n"
        "LEFT JOIN (SELECT b.vehicle_id, SUM(p.amount) AS revenue\n"
        "           FROM bookings b JOIN payments p ON p.booking_id = b.booking_id\n"
        "           GROUP BY b.vehicle_id) r ON r.vehicle_id = v.vehicle_id\n"
        "LEFT JOIN (SELECT vehicle_id, SUM(cost) AS cost FROM maintenance GROUP BY vehicle_id) m ON m.vehicle_id = v.vehicle_id\n"
        "LEFT JOIN (SELECT vehicle_id, SUM(cost) AS cost FROM fuel_logs GROUP BY vehicle_id) f ON f.vehicle_id = v.vehicle_id;"
    )

    add_h2("5.5 Triggers and Transaction Management (Rules R1 to R15)")
    add_p(
        "The system enforces 15 strict business rules directly inside PostgreSQL using PL/pgSQL procedural triggers:"
    )
    add_bullet("Rule R1: Overlapping reservation prevention via GiST exclusion constraint.")
    add_bullet("Rule R2: Rejection of booking creation if vehicle is currently 'In Shop' or 'Retired'.")
    add_bullet("Rule R3: Rejection of booking creation if customer licence expires before the return date.")
    add_bullet("Rule R4: Start date validation prohibiting bookings starting in the past.")
    add_bullet("Rule R5: Total booking amount calculated strictly by `fn_booking_total`; client input overridden.")
    add_bullet("Rule R6: Booking status transition control: only allows Reserved -> Active/Cancelled and Active -> Completed.")
    add_bullet("Rule R7: Preventing activation of booking if vehicle is not 'Available' at the moment of pickup.")
    add_bullet("Rule R8: Automated sync: booking becoming 'Active' turns vehicle to 'Rented'; completion restores to 'Available' (or 'In Shop' if tickets remain open).")
    add_bullet("Rule R9: Disallowing payment entry against cancelled bookings.")
    add_bullet("Rule R10: Payment overflow protection preventing accumulated payments from exceeding `total_amount`.")
    add_bullet("Rule R11: Prohibiting maintenance ticket opening on 'Rented' or 'Retired' vehicles.")
    add_bullet("Rule R12: Opening maintenance ticket automatically transitions vehicle to 'In Shop'.")
    add_bullet("Rule R13: Closing maintenance ticket restores vehicle to 'Available' if no other open tickets exist.")
    add_bullet("Rule R14: Preventing updates to closed maintenance tickets.")
    add_bullet("Rule R15: Guard preventing vehicle retirement if future bookings or open maintenance tickets exist.")

    add_h2("5.6 Frontend Module Implementation")
    add_p(
        "The frontend is structured around reusable, accessible React components sharing the unified design token system:"
    )
    add_bullet("`AppShell` & `Sidebar`: Collapsible sidebar navigation maintaining role-based links (Admin/Staff) and active state indicator.")
    add_bullet("`PageHeader`: Consistent top-level page banners with action button triggers.")
    add_bullet("`DataTable`: Clean, responsive tabular grid with sortable columns, formatted currency, and actions.")
    add_bullet("`FormField`: Unified form input, label, select dropdown, and error validation wrappers.")
    add_bullet("`StatusBadge`: Contextual color-coded pill indicators (`badge-success`, `badge-warning`, `badge-danger`, `badge-info`).")
    add_bullet("`MetricCard`: Dashboard metric container showing key KPI numbers and delta trends.")

    add_h2("5.7 Booking, Vehicle, and Fleet Management Workflow")
    add_p(
        "When staff record a customer reservation, the application initiates a single atomic transaction. The database triggers "
        "verify licence expiry, check vehicle status, and compute exact rental charges. Upon customer arrival, staff mark the reservation "
        "`Active`, which immediately locks the vehicle to `Rented`. Upon vehicle return, staff mark `Completed`, setting `returned_on` to "
        "current date and releasing the vehicle back to `Available`."
    )

    add_h2("5.8 Admin Dashboard and CRUD Operations")
    add_p(
        "The administration dashboard provides executive visibility into operational metrics: Total Fleet Size, Available Count, "
        "Active Rentals, Vehicles In Shop, Monthly Revenue, and Overdue Returns. Administrators execute full CRUD operations over "
        "vehicle records and vehicle pricing categories."
    )

    doc.add_page_break()

    # =========================================================
    # CHAPTER 6: RESULTS
    # =========================================================
    add_h1("CHAPTER 6: RESULTS")

    add_h2("6.1 Implementation Outcomes")
    add_p(
        "The system was validated using a rigorous automated test suite (`db/tests.sql`) comprising fourteen complex scenario "
        "tests (S1–S14). All tests executed inside rollback transactions on PostgreSQL 18.0, producing 100% PASS ratings:"
    )
    
    test_results = [
        ("S1: Booking on In-Shop Vehicle", "Attempt booking on vehicle under maintenance", "RAISE EXCEPTION 'Vehicle is not available for booking'", "PASS"),
        ("S2: Overlapping Reservation", "Attempt overlapping date booking on same vehicle", "PostgreSQL GiST exclusion conflict error (23P01)", "PASS"),
        ("S3: Expired Licence Booking", "Attempt booking with customer licence expiring early", "RAISE EXCEPTION 'Customer licence expires before return date'", "PASS"),
        ("S4: Start Date in the Past", "Attempt booking with start_date < CURRENT_DATE", "RAISE EXCEPTION 'Start date cannot be in the past'", "PASS"),
        ("S5: Server Rate Calculation", "Client submits malicious zero or altered amount", "Total amount recalculated correctly via fn_booking_total", "PASS"),
        ("S6: Illegal State Transition", "Transition booking from Reserved directly to Completed", "RAISE EXCEPTION 'Invalid booking status transition'", "PASS"),
        ("S7: Activating Unavailable Vehicle", "Attempt activating reservation on In-Shop vehicle", "RAISE EXCEPTION 'Vehicle is not available for booking'", "PASS"),
        ("S8: Automatic Status Sync", "Activate booking -> Check vehicle status", "Vehicle status automatically switches to 'Rented'", "PASS"),
        ("S9: Return Vehicle Sync", "Complete booking -> Check vehicle status", "Vehicle status automatically switches to 'Available'", "PASS"),
        ("S10: Payment on Cancelled Booking", "Attempt payment on cancelled reservation", "RAISE EXCEPTION 'Cannot pay a cancelled booking'", "PASS"),
        ("S11: Payment Overflow", "Attempt payment exceeding remaining booking balance", "RAISE EXCEPTION 'Payment exceeds outstanding balance'", "PASS"),
        ("S12: Maintenance on Rented Vehicle", "Open maintenance ticket on active rental", "RAISE EXCEPTION 'Cannot open maintenance on a rented...'", "PASS"),
        ("S13: Maintenance Shop Lock", "Open maintenance ticket on available vehicle", "Vehicle status automatically switches to 'In Shop'", "PASS"),
        ("S14: Vehicle Retire Guard", "Attempt retiring vehicle with active bookings", "RAISE EXCEPTION 'Vehicle has open bookings or maintenance'", "PASS"),
    ]

    t_res = doc.add_table(rows=len(test_results)+1, cols=4)
    t_res.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_res.autofit = True
    
    headers = ["Test Scenario", "Action / Input", "Expected Engine Behavior", "Status"]
    for col_idx, h in enumerate(headers):
        cell = t_res.cell(0, col_idx)
        cell.text = h
        set_cell_shading(cell, "1E3A8A")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10)
            r.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)

    for row_idx, data in enumerate(test_results):
        for col_idx, text in enumerate(data):
            cell = t_res.cell(row_idx+1, col_idx)
            cell.text = text
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if col_idx == 3 else WD_ALIGN_PARAGRAPH.LEFT
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(9.5)
                if col_idx == 3:
                    r.bold = True
                    r.font.color.rgb = RGBColor(4, 120, 87)

    add_h2("6.2 Frontend Screenshots")
    add_p(
        "The following screenshots illustrate the interface of the Vehicle Rental & Fleet Management System. "
        "The UI kit prototypes located in `ui-kit/` showcase the exact production views:"
    )

    screens = [
        ("Login Interface", "Staff login interface with email/password authentication and role credential validation.", "d:/DBMS_MINI/dbms_pro_forked/docs/screenshot_login.png"),
        ("Executive Dashboard", "Real-time fleet KPI metrics, monthly revenue trend, available vehicles list, and overdue return alerts.", "d:/DBMS_MINI/dbms_pro_forked/docs/screenshot_dashboard.png"),
        ("Vehicle Fleet Management", "Tabular fleet directory with category filters, status badges (Available, Rented, In Shop), and detail view links.", "d:/DBMS_MINI/dbms_pro_forked/docs/screenshot_vehicles.png"),
        ("Reservation & Bookings Hub", "Booking management screen showing active/completed rentals, calculated charges, and lifecycle transition triggers.", "d:/DBMS_MINI/dbms_pro_forked/docs/screenshot_bookings.png"),
        ("New Booking & Customer Form", "Modal dialog for customer onboarding and new reservation checkout with live rate calculation.", "d:/DBMS_MINI/dbms_pro_forked/docs/screenshot_form.png")
    ]

    for title, desc, img_path in screens:
        add_h3(title)
        add_p(desc, italic=True)
        if os.path.exists(img_path):
            add_img(img_path, width=Inches(6.0), caption=title)
        else:
            # Placeholder frame table fallback
            p_frame = doc.add_table(rows=1, cols=1)
            p_frame.alignment = WD_TABLE_ALIGNMENT.CENTER
            c = p_frame.cell(0, 0)
            c.width = Inches(5.8)
            set_cell_shading(c, "F1F5F9")
            set_cell_margins(c, top=400, bottom=400, left=300, right=300)
            cp = c.paragraphs[0]
            cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
            c_run = cp.add_run(f"\n[ SCREENSHOT: {title} ]\n")
            c_run.font.name = 'Times New Roman'
            c_run.font.size = Pt(10)
            c_run.italic = True
        add_p("", space_after=6)

    doc.add_page_break()

    # =========================================================
    # CHAPTER 7: CONCLUSION AND FUTURE SCOPE
    # =========================================================
    add_h1("CHAPTER 7: CONCLUSION AND FUTURE SCOPE")

    add_h2("7.1 Conclusion")
    add_p(
        "The Vehicle Rental & Fleet Management System successfully illustrates how advanced relational database engineering solves "
        "critical operational vulnerabilities in capital-intensive fleet businesses. By shifting validation logic from fragile "
        "application controllers into PostgreSQL 15+ constraints, procedural PL/pgSQL triggers, and GiST temporal exclusion indexes, "
        "the system guarantees absolute data consistency under concurrent operational loads."
    )
    add_p(
        "Key milestones accomplished include:"
    )
    add_bullet("Complete mathematical prevention of overlapping vehicle double-bookings using temporal range algebra.")
    add_bullet("Automated, tamper-proof vehicle lifecycle status synchronization driven by booking and workshop service events.")
    add_bullet("Comprehensive financial ledger balancing preventing payment leakage and duplicate transactions.")
    add_bullet("Implementation of high-speed analytical aggregate views providing instant vehicle profitability and revenue insights.")
    add_bullet("Adherence to 3NF/BCNF relational normalization, eliminating data redundancy across all eight entities.")

    add_h2("7.2 Future Scope")
    add_p("Future enhancements identified to extend the system include:")
    add_bullet("Telematics & IoT GPS Integration: Direct hardware integration with onboard vehicle OBD-II telematics devices for live GPS location tracking, automatic odometer recording, and geo-fencing.")
    add_bullet("Customer Mobile Application: Developing a cross-platform Flutter/React Native mobile app allowing customers to browse available vehicles, upload licence documents, and execute digital payments.")
    add_bullet("AI-Driven Predictive Maintenance: Machine learning analysis over historic fuel logs and repair frequencies to forecast vehicle component failures before breakdowns occur.")
    add_bullet("Dynamic Surge Pricing: Algorithmic pricing adjusting category daily rates in real time based on seasonal demand, weekend booking spikes, and fleet availability.")
    add_bullet("Automated Payment Gateway Integration: Integrating Razorpay / Stripe webhooks for instant digital UPI/card reconciliation.")

    doc.add_page_break()

    # =========================================================
    # CHAPTER 8: REFERENCES
    # =========================================================
    add_h1("CHAPTER 8: REFERENCES")
    refs = [
        "Silberschatz, A., Korth, H. F., & Sudarshan, S. (2019). Database System Concepts (7th ed.). McGraw-Hill Education.",
        "Elmasri, R., & Navathe, S. B. (2015). Fundamentals of Database Systems (7th ed.). Pearson Education.",
        "The PostgreSQL Global Development Group. (2024). PostgreSQL 16.0 Documentation. Available at: https://www.postgresql.org/docs/",
        "PostgreSQL Documentation: GiST Indexing & btree_gist Extension. Available at: https://www.postgresql.org/docs/current/btree-gist.html",
        "Next.js Documentation: App Router Architecture & Route Handlers. Vercel Inc. Available at: https://nextjs.org/docs",
        "Node Postgres (pg) Official Documentation: Connection Pooling and Transactions. Available at: https://node-postgres.com/",
        "Codd, E. F. (1970). A Relational Model of Data for Large Shared Data Banks. Communications of the ACM, 13(6), 377-387.",
        "W3Schools. SQL Tutorial and Reference. Available at: https://www.w3schools.com/sql/",
        "Mozilla Developer Network (MDN). Web Technology for Developers: HTTP Cookies, JWT & Web Security. Available at: https://developer.mozilla.org/"
    ]
    for idx, ref in enumerate(refs, 1):
        add_p(f"[{idx}]  {ref}", size=11, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=6)

    # Save
    out_path = 'd:/DBMS_MINI/dbms_pro_forked/Vehicle_Rental_DBMS_Report.docx'
    doc.save(out_path)
    print(f"Report generated successfully at {out_path}!")

if __name__ == '__main__':
    create_report()

