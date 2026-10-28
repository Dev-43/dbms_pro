import subprocess
import os

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
docs_dir = r'D:\DBMS_MINI\dbms_pro_forked\docs'
uikit_dir = r'D:\DBMS_MINI\dbms_pro_forked\ui-kit'

screens = [
    ('screenshot_login.png', os.path.join(uikit_dir, 'login.html')),
    ('screenshot_dashboard.png', os.path.join(uikit_dir, 'dashboard.html')),
    ('screenshot_vehicles.png', os.path.join(uikit_dir, 'vehicles.html')),
    ('screenshot_bookings.png', os.path.join(uikit_dir, 'bookings.html')),
    ('screenshot_form.png', os.path.join(uikit_dir, 'form.html')),
]

for filename, html_path in screens:
    out_path = os.path.join(docs_dir, filename)
    cmd = [
        chrome,
        '--headless=new',
        '--disable-gpu',
        f'--screenshot={out_path}',
        '--window-size=1280,820',
        f'file:///{html_path.replace(os.sep, "/")}'
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(out_path):
        print(f"Captured {filename} ({os.path.getsize(out_path)} bytes)")
    else:
        print(f"Failed to capture {filename}: {res.stderr}")

print("All screenshots captured!")
