import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

os.makedirs('d:/DBMS_MINI/dbms_pro_forked/docs', exist_ok=True)

# -------------------------------------------------------------
# 1. ER Diagram
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(14, 10), dpi=300)
ax.axis('off')
ax.set_xlim(0, 14)
ax.set_ylim(0, 10)

def draw_entity(x, y, title, attrs, pk, fks, color='#3b82f6'):
    # Box header
    h = 0.45 + len(attrs) * 0.28
    w = 2.5
    rect = patches.FancyBboxPatch((x, y - h), w, h, boxstyle='round,pad=0.05', ec='#1e293b', fc='#f8fafc', lw=1.5)
    ax.add_patch(rect)
    header = patches.Rectangle((x, y - 0.45), w, 0.45, ec='#1e293b', fc=color, lw=1.5)
    ax.add_patch(header)
    ax.text(x + w/2, y - 0.23, title.upper(), ha='center', va='center', fontsize=9.5, fontweight='bold', color='white')
    
    curr_y = y - 0.68
    for attr in attrs:
        is_pk = attr in pk
        is_fk = attr in fks
        prefix = '[PK] ' if is_pk else ('[FK] ' if is_fk else '  • ')
        txt = f"{prefix}{attr}"
        fontweight = 'bold' if is_pk else 'normal'
        text_color = '#0f172a' if not is_pk else '#1d4ed8'
        ax.text(x + 0.12, curr_y, txt, ha='left', va='center', fontsize=8, fontweight=fontweight, color=text_color)
        curr_y -= 0.28
    return (x + w/2, y - h/2)

# Entities
pos = {}
pos['users'] = draw_entity(0.6, 9.2, 'users', ['user_id', 'full_name', 'email', 'password_hash', 'role'], ['user_id'], [], '#0284c7')
pos['categories'] = draw_entity(0.6, 4.8, 'vehicle_categories', ['category_id', 'name', 'daily_rate'], ['category_id'], [], '#0284c7')
pos['vehicles'] = draw_entity(4.2, 5.8, 'vehicles', ['vehicle_id', 'plate_no', 'make', 'model', 'year', 'category_id', 'odometer_km', 'status'], ['vehicle_id'], ['category_id'], '#2563eb')
pos['customers'] = draw_entity(4.2, 9.5, 'customers', ['customer_id', 'full_name', 'email', 'phone', 'license_no', 'license_expiry'], ['customer_id'], [], '#0284c7')
pos['bookings'] = draw_entity(8.0, 9.5, 'bookings', ['booking_id', 'customer_id', 'vehicle_id', 'start_date', 'end_date', 'returned_on', 'status', 'total_amount', 'created_by'], ['booking_id'], ['customer_id', 'vehicle_id', 'created_by'], '#4f46e5')
pos['payments'] = draw_entity(11.2, 9.0, 'payments', ['payment_id', 'booking_id', 'amount', 'method', 'paid_on'], ['payment_id'], ['booking_id'], '#059669')
pos['maintenance'] = draw_entity(8.0, 4.6, 'maintenance', ['maintenance_id', 'vehicle_id', 'description', 'cost', 'opened_on', 'closed_on'], ['maintenance_id'], ['vehicle_id'], '#d97706')
pos['fuel_logs'] = draw_entity(11.2, 4.6, 'fuel_logs', ['fuel_id', 'vehicle_id', 'litres', 'cost', 'logged_on'], ['fuel_id'], ['vehicle_id'], '#d97706')

# Relationship Connectors
def connect(p1, p2, label1, label2, rel_name):
    ax.annotate('', xy=p2, xytext=p1, arrowprops=dict(arrowstyle='-', color='#475569', lw=1.3, linestyle='--'))
    mid_x = (p1[0] + p2[0]) / 2
    mid_y = (p1[1] + p2[1]) / 2
    ax.text(mid_x, mid_y + 0.15, rel_name, ha='center', va='center', fontsize=7.5, style='italic', color='#0f172a', bbox=dict(boxstyle='square,pad=0.15', fc='white', ec='#cbd5e1', lw=0.8))

connect(pos['categories'], pos['vehicles'], '1', 'N', 'categorizes')
connect(pos['vehicles'], pos['bookings'], '1', 'N', 'reserved in')
connect(pos['customers'], pos['bookings'], '1', 'N', 'places')
connect(pos['users'], pos['bookings'], '1', 'N', 'creates')
connect(pos['bookings'], pos['payments'], '1', 'N', 'settled by')
connect(pos['vehicles'], pos['maintenance'], '1', 'N', 'undergoes')
connect(pos['vehicles'], pos['fuel_logs'], '1', 'N', 'logs')

plt.title('ENTITY-RELATIONSHIP (ER) DIAGRAM — VEHICLE RENTAL & FLEET MANAGEMENT SYSTEM', fontsize=12, fontweight='bold', pad=15)
plt.savefig('d:/DBMS_MINI/dbms_pro_forked/docs/er-diagram.png', bbox_inches='tight')
plt.close()

# -------------------------------------------------------------
# 2. DFD Level 0 (Context Diagram)
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 5), dpi=300)
ax.axis('off')
ax.set_xlim(0, 10)
ax.set_ylim(0, 5)

# Process Circle (Vehicle Rental System)
circle = patches.Circle((5, 2.5), 1.3, ec='#1e3a8a', fc='#dbeafe', lw=2)
ax.add_patch(circle)
ax.text(5, 2.7, '0.0', ha='center', va='center', fontsize=11, fontweight='bold', color='#1e3a8a')
ax.text(5, 2.3, 'Vehicle Rental &\nFleet Management\nSystem', ha='center', va='center', fontsize=9.5, fontweight='bold', color='#1e3a8a')

# External Entities
# Staff User
rect1 = patches.Rectangle((0.6, 1.8), 1.8, 1.4, ec='#334155', fc='#f1f5f9', lw=1.5)
ax.add_patch(rect1)
ax.text(1.5, 2.5, 'STAFF\nUSER', ha='center', va='center', fontsize=9.5, fontweight='bold', color='#1e293b')

# Admin User
rect2 = patches.Rectangle((7.6, 1.8), 1.8, 1.4, ec='#334155', fc='#f1f5f9', lw=1.5)
ax.add_patch(rect2)
ax.text(8.5, 2.5, 'ADMIN\nUSER', ha='center', va='center', fontsize=9.5, fontweight='bold', color='#1e293b')

# Arrows Staff -> System
ax.annotate('', xy=(3.7, 2.8), xytext=(2.4, 2.8), arrowprops=dict(arrowstyle='->', color='#0284c7', lw=1.5))
ax.text(3.05, 3.05, 'Bookings, Customers,\nPayments, Fuel Logs', ha='center', va='center', fontsize=7.5, color='#0369a1')

ax.annotate('', xy=(2.4, 2.2), xytext=(3.7, 2.2), arrowprops=dict(arrowstyle='->', color='#0284c7', lw=1.5))
ax.text(3.05, 1.95, 'Booking Confirmations,\nVehicle Status Receipts', ha='center', va='center', fontsize=7.5, color='#0369a1')

# Arrows Admin -> System
ax.annotate('', xy=(6.3, 2.8), xytext=(7.6, 2.8), arrowprops=dict(arrowstyle='->', color='#b45309', lw=1.5))
ax.text(6.95, 3.05, 'Fleet Config, Categories,\nStaff Accounts, Retirement', ha='center', va='center', fontsize=7.5, color='#b45309')

ax.annotate('', xy=(7.6, 2.2), xytext=(6.3, 2.2), arrowprops=dict(arrowstyle='->', color='#b45309', lw=1.5))
ax.text(6.95, 1.95, 'Revenue, Fleet Profit,\nOverdue & Maint. Reports', ha='center', va='center', fontsize=7.5, color='#b45309')

plt.title('DATA FLOW DIAGRAM (LEVEL 0 — CONTEXT DIAGRAM)', fontsize=11, fontweight='bold', pad=15)
plt.savefig('d:/DBMS_MINI/dbms_pro_forked/docs/dfd_level_0.png', bbox_inches='tight')
plt.close()

# -------------------------------------------------------------
# 3. DFD Level 1
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(12, 7), dpi=300)
ax.axis('off')
ax.set_xlim(0, 12)
ax.set_ylim(0, 7)

def draw_proc(x, y, num, name):
    c = patches.Circle((x, y), 0.75, ec='#0284c7', fc='#e0f2fe', lw=1.5)
    ax.add_patch(c)
    ax.text(x, y + 0.2, num, ha='center', va='center', fontsize=8.5, fontweight='bold', color='#0369a1')
    ax.text(x, y - 0.15, name, ha='center', va='center', fontsize=7.5, fontweight='bold', color='#0f172a')

def draw_store(x, y, name):
    w, h = 1.8, 0.4
    rect = patches.Rectangle((x, y), w, h, ec='#475569', fc='#f8fafc', lw=1.2)
    ax.add_patch(rect)
    ax.plot([x, x], [y, y+h], color='#475569', lw=2)
    ax.plot([x+w, x+w], [y, y+h], color='#475569', lw=2)
    ax.text(x + w/2, y + h/2, f"D: {name}", ha='center', va='center', fontsize=7.5, fontweight='bold', color='#334155')

# Processes
draw_proc(2.2, 5.5, '1.0', 'Auth &\nAccess')
draw_proc(5.0, 5.5, '2.0', 'Fleet &\nCategories')
draw_proc(8.0, 5.5, '3.0', 'Customer\nMgmt')
draw_proc(3.5, 2.5, '4.0', 'Booking &\nRentals')
draw_proc(6.5, 2.5, '5.0', 'Payments &\nBilling')
draw_proc(9.5, 2.5, '6.0', 'Maintenance\n& Fuel')

# Data stores
draw_store(1.3, 4.0, 'users')
draw_store(4.1, 4.0, 'vehicles')
draw_store(7.1, 4.0, 'customers')
draw_store(3.5, 1.0, 'bookings')
draw_store(6.5, 1.0, 'payments')
draw_store(9.5, 1.0, 'maintenance / fuel')

plt.title('DATA FLOW DIAGRAM (LEVEL 1 — FUNCTIONAL DECOMPOSITION)', fontsize=11, fontweight='bold', pad=15)
plt.savefig('d:/DBMS_MINI/dbms_pro_forked/docs/dfd_level_1.png', bbox_inches='tight')
plt.close()

print('All diagrams generated successfully!')
