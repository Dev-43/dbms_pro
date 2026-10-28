import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle, PathPatch
from matplotlib.path import Path
import os

os.makedirs('d:/DBMS_MINI/dbms_pro_forked/docs', exist_ok=True)

# Set high-quality defaults
plt.rcParams['font.sans-serif'] = 'Arial'
plt.rcParams['font.family'] = 'sans-serif'

# ==============================================================================
# 1. TIGHT, MODERN SYSTEM ARCHITECTURE DIAGRAM
# ==============================================================================
def make_architecture_diagram():
    fig, ax = plt.subplots(figsize=(9.5, 5.2), dpi=300)
    ax.axis('off')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5.5)

    # Background subtle container
    bg = FancyBboxPatch((0.2, 0.2), 9.6, 5.1, boxstyle='round,pad=0.1', ec='#cbd5e1', fc='#f8fafc', lw=1)
    ax.add_patch(bg)
    ax.text(5.0, 5.05, 'THREE-TIER SYSTEM ARCHITECTURE', ha='center', va='center', fontsize=11, fontweight='bold', color='#0f172a')

    # Tier 1: Presentation Layer
    t1 = FancyBboxPatch((0.5, 3.4), 9.0, 1.25, boxstyle='round,pad=0.08', ec='#1d4ed8', fc='#eff6ff', lw=1.5)
    ax.add_patch(t1)
    # Header tag
    tag1 = FancyBboxPatch((0.7, 4.3), 3.2, 0.32, boxstyle='round,pad=0.04', ec='#1d4ed8', fc='#1d4ed8', lw=1)
    ax.add_patch(tag1)
    ax.text(2.3, 4.46, 'PRESENTATION TIER (CLIENT / UI)', ha='center', va='center', fontsize=8.5, fontweight='bold', color='white')
    
    # Inner modules
    boxes_t1 = [
        (0.7, 3.55, 2.5, 0.65, 'Executive Dashboard\n& KPI Summaries', '#dbeafe', '#1e40af'),
        (3.4, 3.55, 2.8, 0.65, 'Fleet & Category Manager\n(Vehicles, Status, Specs)', '#dbeafe', '#1e40af'),
        (6.4, 3.55, 2.9, 0.65, 'Booking Wizard & Billing\n(Lifecycle, Check-in/out)', '#dbeafe', '#1e40af'),
    ]
    for x, y, w, h, txt, fc, tc in boxes_t1:
        b = FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.04', ec='#93c5fd', fc=fc, lw=1)
        ax.add_patch(b)
        ax.text(x + w/2, y + h/2, txt, ha='center', va='center', fontsize=8, fontweight='bold', color=tc)

    # Connector 1 <-> 2
    ax.annotate('', xy=(5.0, 3.0), xytext=(5.0, 3.4), arrowprops=dict(arrowstyle='<->', color='#475569', lw=2, mutation_scale=12))
    ax.text(5.15, 3.2, 'HTTP REST API (JSON) / HttpOnly JWT Cookie Sessions', va='center', fontsize=7.5, fontweight='bold', color='#475569')

    # Tier 2: Application / API Layer
    t2 = FancyBboxPatch((0.5, 1.8), 9.0, 1.15, boxstyle='round,pad=0.08', ec='#047857', fc='#f0fdf4', lw=1.5)
    ax.add_patch(t2)
    tag2 = FancyBboxPatch((0.7, 2.65), 3.5, 0.32, boxstyle='round,pad=0.04', ec='#047857', fc='#047857', lw=1)
    ax.add_patch(tag2)
    ax.text(2.45, 2.81, 'APPLICATION TIER (NEXT.JS APP ROUTER)', ha='center', va='center', fontsize=8.5, fontweight='bold', color='white')

    boxes_t2 = [
        (0.7, 1.95, 2.6, 0.62, 'Route Handlers (/api/*)\nInput Validation & Roles', '#dcfce7', '#166534'),
        (3.5, 1.95, 2.7, 0.62, 'Auth & Security Layer\nbcryptjs + jose (HS256)', '#dcfce7', '#166534'),
        (6.4, 1.95, 2.9, 0.62, 'Postgres Pool (pg.Pool)\nRaw Parameterized SQL', '#dcfce7', '#166534'),
    ]
    for x, y, w, h, txt, fc, tc in boxes_t2:
        b = FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.04', ec='#86efac', fc=fc, lw=1)
        ax.add_patch(b)
        ax.text(x + w/2, y + h/2, txt, ha='center', va='center', fontsize=8, fontweight='bold', color=tc)

    # Connector 2 <-> 3
    ax.annotate('', xy=(5.0, 1.4), xytext=(5.0, 1.8), arrowprops=dict(arrowstyle='<->', color='#475569', lw=2, mutation_scale=12))
    ax.text(5.15, 1.6, 'TCP/IP Connection Pool (Port 5432) / ACID Transactions', va='center', fontsize=7.5, fontweight='bold', color='#475569')

    # Tier 3: Database Layer
    t3 = FancyBboxPatch((0.5, 0.35), 9.0, 1.05, boxstyle='round,pad=0.08', ec='#b45309', fc='#fffbeb', lw=1.5)
    ax.add_patch(t3)
    tag3 = FancyBboxPatch((0.7, 1.1), 3.6, 0.32, boxstyle='round,pad=0.04', ec='#b45309', fc='#b45309', lw=1)
    ax.add_patch(tag3)
    ax.text(2.5, 1.26, 'DATABASE TIER (POSTGRESQL 15+ / 18)', ha='center', va='center', fontsize=8.5, fontweight='bold', color='white')

    boxes_t3 = [
        (0.7, 0.45, 2.6, 0.6, '8 Normalized Tables\n3NF / BCNF Relations', '#fef3c7', '#92400e'),
        (3.5, 0.45, 2.7, 0.6, '15 Business Triggers\nPL/pgSQL Procedural Rules', '#fef3c7', '#92400e'),
        (6.4, 0.45, 2.9, 0.6, 'btree_gist & Views\nExclusion & Profit Analytics', '#fef3c7', '#92400e'),
    ]
    for x, y, w, h, txt, fc, tc in boxes_t3:
        b = FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.04', ec='#fde68a', fc=fc, lw=1)
        ax.add_patch(b)
        ax.text(x + w/2, y + h/2, txt, ha='center', va='center', fontsize=8, fontweight='bold', color=tc)

    plt.tight_layout()
    plt.savefig('d:/DBMS_MINI/dbms_pro_forked/docs/system_architecture.png', bbox_inches='tight', dpi=300)
    plt.close()
    print("Clean architecture diagram created!")

# ==============================================================================
# 2. TIGHT, BEAUTIFUL RELATIONAL ER DIAGRAM (CROW'S FOOT / TABLE NOTATION)
# ==============================================================================
def make_er_diagram():
    fig, ax = plt.subplots(figsize=(11.5, 7.8), dpi=300)
    ax.axis('off')
    ax.set_xlim(0, 11.5)
    ax.set_ylim(0, 7.8)

    # Helper to draw a crisp database table entity
    def draw_table(x, y, w, title, cols, header_color='#1e3a8a'):
        row_h = 0.22
        h_header = 0.36
        h_total = h_header + len(cols) * row_h
        
        # Outer box
        box = FancyBboxPatch((x, y - h_total), w, h_total, boxstyle='round,pad=0.02', ec='#334155', fc='#ffffff', lw=1.2)
        ax.add_patch(box)
        
        # Header box
        hdr = Rectangle((x, y - h_header), w, h_header, ec='#334155', fc=header_color, lw=1.2)
        ax.add_patch(hdr)
        ax.text(x + w/2, y - h_header/2, title, ha='center', va='center', fontsize=8.5, fontweight='bold', color='#ffffff')
        
        # Rows
        curr_y = y - h_header - row_h/2
        for key_type, col_name, data_type in cols:
            # Key indicator
            if key_type == 'PK':
                ax.text(x + 0.12, curr_y, 'PK', ha='left', va='center', fontsize=6.5, fontweight='bold', color='#b45309')
            elif key_type == 'FK':
                ax.text(x + 0.12, curr_y, 'FK', ha='left', va='center', fontsize=6.5, fontweight='bold', color='#0369a1')
            else:
                ax.text(x + 0.12, curr_y, ' •', ha='left', va='center', fontsize=6.5, color='#94a3b8')
                
            # Name
            fw = 'bold' if key_type == 'PK' else 'normal'
            ax.text(x + 0.45, curr_y, col_name, ha='left', va='center', fontsize=7.2, fontweight=fw, color='#0f172a')
            # Type
            ax.text(x + w - 0.12, curr_y, data_type, ha='right', va='center', fontsize=6.5, color='#64748b')
            
            # Row divider
            ax.plot([x, x + w], [curr_y - row_h/2, curr_y - row_h/2], color='#f1f5f9', lw=0.6)
            curr_y -= row_h
            
        return {
            'top': (x + w/2, y),
            'bottom': (x + w/2, y - h_total),
            'left': (x, y - h_total/2),
            'right': (x + w, y - h_total/2),
            'x': x, 'y': y, 'w': w, 'h': h_total
        }

    # Layout Coordinates in a tightly aligned 3-column grid
    # Column 1: Fleet Master (x = 0.5)
    # Column 2: Bookings & Operations Core (x = 4.2)
    # Column 3: Customers & Logs (x = 8.1)

    tables = {}
    
    # 1. vehicle_categories (Col 1, Top)
    tables['categories'] = draw_table(0.5, 7.4, 3.2, 'vehicle_categories', [
        ('PK', 'category_id', 'SERIAL'),
        ('  ', 'name', 'VARCHAR(50) [U]'),
        ('  ', 'daily_rate', 'NUMERIC(10,2)'),
    ], '#1e40af')

    # 2. vehicles (Col 1, Middle)
    tables['vehicles'] = draw_table(0.5, 5.8, 3.2, 'vehicles', [
        ('PK', 'vehicle_id', 'SERIAL'),
        ('  ', 'plate_no', 'VARCHAR(15) [U]'),
        ('  ', 'make', 'VARCHAR(50)'),
        ('  ', 'model', 'VARCHAR(50)'),
        ('  ', 'year', 'INT (2000-2100)'),
        ('FK', 'category_id', 'INT -> categories'),
        ('  ', 'odometer_km', 'INT >= 0'),
        ('  ', 'status', 'VARCHAR(10)'),
    ], '#1e40af')

    # 3. maintenance (Col 1, Bottom Left)
    tables['maintenance'] = draw_table(0.5, 2.7, 3.2, 'maintenance', [
        ('PK', 'maintenance_id', 'SERIAL'),
        ('FK', 'vehicle_id', 'INT -> vehicles'),
        ('  ', 'description', 'TEXT'),
        ('  ', 'cost', 'NUMERIC(10,2)'),
        ('  ', 'opened_on', 'DATE'),
        ('  ', 'closed_on', 'DATE (NULLABLE)'),
    ], '#b45309')

    # 4. users (Col 2, Top)
    tables['users'] = draw_table(4.3, 7.4, 3.3, 'users', [
        ('PK', 'user_id', 'SERIAL'),
        ('  ', 'full_name', 'VARCHAR(100)'),
        ('  ', 'email', 'VARCHAR(100) [U]'),
        ('  ', 'password_hash', 'TEXT'),
        ('  ', 'role', 'admin / staff'),
    ], '#0f766e')

    # 5. bookings (Col 2, Middle)
    tables['bookings'] = draw_table(4.3, 5.3, 3.3, 'bookings', [
        ('PK', 'booking_id', 'SERIAL'),
        ('FK', 'customer_id', 'INT -> customers'),
        ('FK', 'vehicle_id', 'INT -> vehicles'),
        ('  ', 'start_date', 'DATE'),
        ('  ', 'end_date', 'DATE (> start)'),
        ('  ', 'returned_on', 'DATE'),
        ('  ', 'status', 'VARCHAR(10)'),
        ('  ', 'total_amount', 'NUMERIC(10,2)'),
        ('FK', 'created_by', 'INT -> users'),
    ], '#4338ca')

    # 6. payments (Col 2, Bottom)
    tables['payments'] = draw_table(4.3, 2.2, 3.3, 'payments', [
        ('PK', 'payment_id', 'SERIAL'),
        ('FK', 'booking_id', 'INT -> bookings'),
        ('  ', 'amount', 'NUMERIC(10,2)'),
        ('  ', 'method', 'Cash/Card/UPI'),
        ('  ', 'paid_on', 'TIMESTAMP'),
    ], '#047857')

    # 7. customers (Col 3, Top)
    tables['customers'] = draw_table(8.0, 7.4, 3.0, 'customers', [
        ('PK', 'customer_id', 'SERIAL'),
        ('  ', 'full_name', 'VARCHAR(100)'),
        ('  ', 'email', 'VARCHAR(100) [U]'),
        ('  ', 'phone', 'VARCHAR(15)'),
        ('  ', 'license_no', 'VARCHAR(30) [U]'),
        ('  ', 'license_expiry', 'DATE'),
    ], '#0f766e')

    # 8. fuel_logs (Col 3, Middle)
    tables['fuel_logs'] = draw_table(8.0, 4.8, 3.0, 'fuel_logs', [
        ('PK', 'fuel_id', 'SERIAL'),
        ('FK', 'vehicle_id', 'INT -> vehicles'),
        ('  ', 'litres', 'NUMERIC(6,2)'),
        ('  ', 'cost', 'NUMERIC(8,2)'),
        ('  ', 'logged_on', 'DATE'),
    ], '#b45309')

    # Connectors with clear orthogonal paths and Crow's foot labels
    def draw_rel(p1, p2, label1, label2, name=''):
        ax.plot([p1[0], p2[0]], [p1[1], p2[1]], color='#334155', lw=1.2, linestyle='-')
        ax.text(p1[0], p1[1], f" {label1} ", fontsize=6.5, fontweight='bold', color='#1e293b', bbox=dict(boxstyle='round,pad=0.1', fc='white', ec='#cbd5e1', lw=0.6))
        ax.text(p2[0], p2[1], f" {label2} ", fontsize=6.5, fontweight='bold', color='#1e293b', bbox=dict(boxstyle='round,pad=0.1', fc='white', ec='#cbd5e1', lw=0.6))

    # 1. categories -> vehicles (Vertical)
    draw_rel(tables['categories']['bottom'], tables['vehicles']['top'], '1', 'N')

    # 2. vehicles -> bookings (Horizontal)
    draw_rel(tables['vehicles']['right'], tables['bookings']['left'], '1', 'N')

    # 3. customers -> bookings (Clean angled/curved)
    draw_rel(tables['customers']['bottom'], (tables['bookings']['right'][0], tables['bookings']['top'][1] - 0.2), '1', 'N')

    # 4. users -> bookings (Vertical)
    draw_rel(tables['users']['bottom'], tables['bookings']['top'], '1', 'N')

    # 5. bookings -> payments (Vertical)
    draw_rel(tables['bookings']['bottom'], tables['payments']['top'], '1', 'N')

    # 6. vehicles -> maintenance (Vertical)
    draw_rel(tables['vehicles']['bottom'], tables['maintenance']['top'], '1', 'N')

    # 7. vehicles -> fuel_logs (Horizontal across bottom)
    ax.plot([tables['vehicles']['right'][0], 4.0, 4.0, 7.8, tables['fuel_logs']['left'][0]], 
            [tables['vehicles']['bottom'][1] + 0.3, tables['vehicles']['bottom'][1] + 0.3, 3.8, 3.8, tables['fuel_logs']['left'][1]],
            color='#334155', lw=1.1, linestyle='--')
    ax.text(tables['fuel_logs']['left'][0] - 0.25, tables['fuel_logs']['left'][1], ' N ', fontsize=6.5, fontweight='bold', color='#1e293b', bbox=dict(boxstyle='round,pad=0.1', fc='white', ec='#cbd5e1', lw=0.6))

    # Legend at bottom right
    leg_x, leg_y = 8.0, 1.2
    leg_box = FancyBboxPatch((leg_x, leg_y), 3.0, 1.2, boxstyle='round,pad=0.05', ec='#cbd5e1', fc='#f8fafc', lw=0.8)
    ax.add_patch(leg_box)
    ax.text(leg_x + 1.5, leg_y + 0.98, 'RELATIONAL ER LEGEND', ha='center', va='center', fontsize=7.5, fontweight='bold', color='#0f172a')
    ax.text(leg_x + 0.2, leg_y + 0.72, 'PK : Primary Key (Unique Identifier)', fontsize=6.8, color='#b45309', fontweight='bold')
    ax.text(leg_x + 0.2, leg_y + 0.48, 'FK : Foreign Key (Referential Integrity)', fontsize=6.8, color='#0369a1', fontweight='bold')
    ax.text(leg_x + 0.2, leg_y + 0.24, '1 - N : One-to-Many Relationship', fontsize=6.8, color='#334155')

    plt.tight_layout()
    plt.savefig('d:/DBMS_MINI/dbms_pro_forked/docs/er-diagram.png', bbox_inches='tight', dpi=300)
    plt.close()
    print("Tight relational ER diagram created!")

# ==============================================================================
# 3. TIGHT, CLEAN DFD LEVEL 0 (CONTEXT DIAGRAM)
# ==============================================================================
def make_dfd_level_0():
    fig, ax = plt.subplots(figsize=(9.2, 4.4), dpi=300)
    ax.axis('off')
    ax.set_xlim(0, 9.2)
    ax.set_ylim(0, 4.4)

    # Center Process (Circle)
    p_center = (4.6, 2.2)
    radius = 1.15
    circ = Circle(p_center, radius, ec='#1e3a8a', fc='#eff6ff', lw=1.8)
    ax.add_patch(circ)
    # Divider line in circle
    ax.plot([p_center[0] - radius*0.88, p_center[0] + radius*0.88], [p_center[1] + 0.25, p_center[1] + 0.25], color='#1e3a8a', lw=1.2)
    ax.text(p_center[0], p_center[1] + 0.55, '0.0', ha='center', va='center', fontsize=10, fontweight='bold', color='#1e3a8a')
    ax.text(p_center[0], p_center[1] - 0.2, 'Vehicle Rental &\nFleet Management\nSystem', ha='center', va='center', fontsize=8.5, fontweight='bold', color='#0f172a')

    # External Entity: Staff User (Left)
    e_staff = FancyBboxPatch((0.5, 1.3), 1.6, 1.8, boxstyle='square,pad=0', ec='#334155', fc='#f8fafc', lw=1.5)
    ax.add_patch(e_staff)
    ax.plot([0.5, 2.1], [2.7, 2.7], color='#334155', lw=1.2)
    ax.text(1.3, 2.88, 'ENTITY', ha='center', va='center', fontsize=7, color='#64748b')
    ax.text(1.3, 2.0, 'STAFF\nUSER', ha='center', va='center', fontsize=9.5, fontweight='bold', color='#0f172a')

    # External Entity: Admin User (Right)
    e_admin = FancyBboxPatch((7.1, 1.3), 1.6, 1.8, boxstyle='square,pad=0', ec='#334155', fc='#f8fafc', lw=1.5)
    ax.add_patch(e_admin)
    ax.plot([7.1, 8.7], [2.7, 2.7], color='#334155', lw=1.2)
    ax.text(7.9, 2.88, 'ENTITY', ha='center', va='center', fontsize=7, color='#64748b')
    ax.text(7.9, 2.0, 'ADMIN\nUSER', ha='center', va='center', fontsize=9.5, fontweight='bold', color='#0f172a')

    # Data Flows (Staff <-> System)
    # Flow In: Bookings, Payments, Fuel
    ax.annotate('', xy=(3.45, 2.5), xytext=(2.1, 2.5), arrowprops=dict(arrowstyle='->', color='#0284c7', lw=1.4, mutation_scale=10))
    ax.text(2.77, 2.68, 'Bookings, Customers,\nPayments, Fuel Logs', ha='center', va='center', fontsize=7, fontweight='bold', color='#0369a1')

    # Flow Out: Confirmations, Vehicle Status
    ax.annotate('', xy=(2.1, 1.9), xytext=(3.45, 1.9), arrowprops=dict(arrowstyle='->', color='#0284c7', lw=1.4, mutation_scale=10))
    ax.text(2.77, 1.68, 'Rental Confirmations,\nAvailability Receipts', ha='center', va='center', fontsize=7, fontweight='bold', color='#0369a1')

    # Data Flows (Admin <-> System)
    # Flow In: Fleet Management, Categories, Retirement
    ax.annotate('', xy=(5.75, 2.5), xytext=(7.1, 2.5), arrowprops=dict(arrowstyle='->', color='#b45309', lw=1.4, mutation_scale=10))
    ax.text(6.42, 2.68, 'Fleet Config, Categories,\nVehicle Retirement', ha='center', va='center', fontsize=7, fontweight='bold', color='#b45309')

    # Flow Out: Analytical Reports, Overdue Returns
    ax.annotate('', xy=(7.1, 1.9), xytext=(5.75, 1.9), arrowprops=dict(arrowstyle='->', color='#b45309', lw=1.4, mutation_scale=10))
    ax.text(6.42, 1.68, 'Profitability & Revenue,\nOverdue Alerts, KPIs', ha='center', va='center', fontsize=7, fontweight='bold', color='#b45309')

    plt.tight_layout()
    plt.savefig('d:/DBMS_MINI/dbms_pro_forked/docs/dfd_level_0.png', bbox_inches='tight', dpi=300)
    plt.close()
    print("Clean DFD Level 0 created!")

# ==============================================================================
# 4. TIGHT, CLEAN DFD LEVEL 1 (DECOMPOSITION DIAGRAM)
# ==============================================================================
def make_dfd_level_1():
    fig, ax = plt.subplots(figsize=(10.5, 6.2), dpi=300)
    ax.axis('off')
    ax.set_xlim(0, 10.5)
    ax.set_ylim(0, 6.2)

    # Process Drawer
    def proc(x, y, num, name):
        r = 0.65
        c = Circle((x, y), r, ec='#1d4ed8', fc='#eff6ff', lw=1.4)
        ax.add_patch(c)
        ax.plot([x - r*0.85, x + r*0.85], [y + 0.15, y + 0.15], color='#1d4ed8', lw=1.0)
        ax.text(x, y + 0.32, num, ha='center', va='center', fontsize=7.5, fontweight='bold', color='#1d4ed8')
        ax.text(x, y - 0.15, name, ha='center', va='center', fontsize=7.2, fontweight='bold', color='#0f172a')
        return (x, y)

    # Data Store Drawer (Open-ended rectangle)
    def store(x, y, w, h, num, name):
        rect = Rectangle((x, y), w, h, ec='#475569', fc='#f8fafc', lw=1.1)
        ax.add_patch(rect)
        # Left bar
        ax.plot([x + 0.45, x + 0.45], [y, y + h], color='#475569', lw=1.1)
        ax.text(x + 0.22, y + h/2, num, ha='center', va='center', fontsize=7, fontweight='bold', color='#475569')
        ax.text(x + 0.55 + (w-0.55)/2, y + h/2, name, ha='center', va='center', fontsize=7.2, fontweight='bold', color='#0f172a')
        return (x + w/2, y + h/2)

    # Processes
    p1 = proc(1.8, 5.0, '1.0', 'Auth &\nAccess')
    p2 = proc(5.2, 5.0, '2.0', 'Fleet &\nCategories')
    p3 = proc(8.6, 5.0, '3.0', 'Customer\nDirectory')
    p4 = proc(1.8, 2.0, '4.0', 'Booking &\nRentals')
    p5 = proc(5.2, 2.0, '5.0', 'Payment\nLedger')
    p6 = proc(8.6, 2.0, '6.0', 'Maintenance\n& Fuel')

    # Data Stores
    s1 = store(0.8, 3.5, 2.0, 0.42, 'D1', 'users')
    s2 = store(4.0, 3.5, 2.4, 0.42, 'D2/3', 'vehicles / cat')
    s3 = store(7.5, 3.5, 2.2, 0.42, 'D4', 'customers')
    s4 = store(1.5, 0.5, 2.2, 0.42, 'D5', 'bookings')
    s5 = store(4.5, 0.5, 2.0, 0.42, 'D6', 'payments')
    s6 = store(7.5, 0.5, 2.5, 0.42, 'D7/8', 'maint / fuel')

    # Data Flow Connectors (Process <-> Stores)
    def flow(p_from, p_to, label=''):
        ax.annotate('', xy=p_to, xytext=p_from, arrowprops=dict(arrowstyle='->', color='#475569', lw=1.1, mutation_scale=9))
        if label:
            mx, my = (p_from[0] + p_to[0])/2, (p_from[1] + p_to[1])/2
            ax.text(mx + 0.1, my, label, fontsize=6.2, color='#334155')

    # 1.0 <-> D1
    flow((p1[0], p1[1]-0.65), (s1[0], s1[1]+0.21))
    # 2.0 <-> D2/3
    flow((p2[0], p2[1]-0.65), (s2[0], s2[1]+0.21))
    # 3.0 <-> D3
    flow((p3[0], p3[1]-0.65), (s3[0], s3[1]+0.21))
    
    # 4.0 <-> D5 & D2/3
    flow((p4[0], p4[1]-0.65), (s4[0], s4[1]+0.21))
    flow((p4[0]+0.65, p4[1]), (s2[0]-0.8, s2[1]-0.21), 'check avail')
    
    # 5.0 <-> D6 & D5
    flow((p5[0], p5[1]-0.65), (s5[0], s5[1]+0.21))
    flow((p5[0]-0.65, p5[1]), (s4[0]+0.8, s4[1]+0.21), 'sync bal')

    # 6.0 <-> D7/8 & D2/3
    flow((p6[0], p6[1]-0.65), (s6[0], s6[1]+0.21))
    flow((p6[0]-0.65, p6[1]), (s2[0]+0.8, s2[1]-0.21), 'shop lock')

    plt.tight_layout()
    plt.savefig('d:/DBMS_MINI/dbms_pro_forked/docs/dfd_level_1.png', bbox_inches='tight', dpi=300)
    plt.close()
    print("Clean DFD Level 1 created!")

if __name__ == '__main__':
    make_architecture_diagram()
    make_er_diagram()
    make_dfd_level_0()
    make_dfd_level_1()
    print("All tight diagrams completed!")

