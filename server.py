"""
FindNainital (NTL) - Backend REST API & Static Server
Author: Priyanshu Kumar (Uttarakhand Govt. Polytechnic, Nainital)
Powered by Python Flask & SQLite Database
"""

import os
import sys
import sqlite3
import json
import smtplib
import csv
import io
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS

# Reconfigure stdout/stderr for Windows console UTF-8 support
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database.db")

# ================= ADMIN CONFIGURATION ================= #
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "priyanshukumar9916@gmail.com")
ADMIN_PHONE = os.environ.get("ADMIN_PHONE", "9456168611")
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")

app = Flask(__name__, static_folder=BASE_DIR)
CORS(app)

# ================= EMAIL NOTIFICATION HELPER ================= #

def send_email_notification(subject, html_content, text_content=None, to_email=None):
    """
    Sends automated HTML email notification to the site administrator.
    If SMTP credentials are not configured in environment variables,
    cleanly logs the notification payload to server console without throwing errors.
    """
    if to_email is None:
        to_email = ADMIN_EMAIL
    if not text_content:
        text_content = html_content

    # Console notification logger
    try:
        print(f"\n================ [EMAIL NOTIFICATION DISPATCH] ================")
        print(f"TO: {to_email}")
        print(f"SUBJECT: {subject}")
        print(f"TIME: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"================================================================")
    except Exception as log_err:
        print(f">> Notification logger: {log_err}")

    if not SMTP_USER or not SMTP_PASS:
        print(">> Note: SMTP_USER or SMTP_PASS not set in environment. Notification logged cleanly.")
        return {"sent": False, "status": "logged_to_console"}

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"FindNainital Tourism <{SMTP_USER}>"
        msg["To"] = to_email

        part1 = MIMEText(text_content, "plain")
        part2 = MIMEText(html_content, "html")
        msg.attach(part1)
        msg.attach(part2)

        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, [to_email], msg.as_string())
        server.quit()

        print(f">> [EMAIL SUCCESS] Automated notification delivered to {to_email}")
        return {"sent": True, "status": "delivered"}
    except Exception as e:
        print(f">> [EMAIL WARNING] Could not deliver live SMTP email: {e}")
        return {"sent": False, "error": str(e)}

# ================= DATABASE INITIALIZATION ================= #

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # 1. Table for Vehicle & Tour Bookings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_email TEXT,
        vehicle_type TEXT NOT NULL,
        vehicle_model TEXT NOT NULL,
        pickup_location TEXT NOT NULL,
        drop_destination TEXT NOT NULL,
        pickup_date TEXT NOT NULL,
        pickup_time TEXT NOT NULL,
        tour_duration INTEGER DEFAULT 1,
        passengers INTEGER DEFAULT 1,
        estimated_fare REAL NOT NULL,
        status TEXT DEFAULT 'Confirmed',
        notes TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # 2. Table for Contact & Inquiries
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT NOT NULL,
        subject TEXT,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'New',
        created_at TEXT NOT NULL
    )
    """)

    # 3. Table for Hotel Inquiries & Reservations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS hotel_inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hotel_name TEXT NOT NULL,
        guest_name TEXT NOT NULL,
        guest_phone TEXT NOT NULL,
        guest_email TEXT,
        checkin_date TEXT,
        nights INTEGER DEFAULT 1,
        guests INTEGER DEFAULT 2,
        room_type TEXT DEFAULT 'Deluxe Lake View',
        estimated_amount REAL DEFAULT 0,
        notes TEXT,
        status TEXT DEFAULT 'Pending',
        created_at TEXT NOT NULL
    )
    """)

    # Auto-migrate hotel_inquiries if existing table lacked newer columns
    cursor.execute("PRAGMA table_info(hotel_inquiries)")
    existing_h_cols = [r["name"] for r in cursor.fetchall()]
    for col, col_def in [("guest_email", "TEXT"), ("room_type", "TEXT DEFAULT 'Deluxe Lake View'"), ("estimated_amount", "REAL DEFAULT 0"), ("notes", "TEXT")]:
        if col not in existing_h_cols:
            cursor.execute(f"ALTER TABLE hotel_inquiries ADD COLUMN {col} {col_def}")

    # 4. Table for Boating & Activity Bookings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS activity_bookings (
        id TEXT PRIMARY KEY,
        activity_name TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_email TEXT,
        booking_date TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        participants INTEGER DEFAULT 1,
        estimated_fare REAL NOT NULL,
        status TEXT DEFAULT 'Confirmed',
        notes TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # 5. Table for Custom Trip Planner Inquiries
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS planner_inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_email TEXT,
        duration_days INTEGER DEFAULT 2,
        travel_date TEXT,
        travelers INTEGER DEFAULT 2,
        budget_type TEXT DEFAULT 'Standard',
        selected_interests TEXT,
        custom_notes TEXT,
        status TEXT DEFAULT 'New',
        created_at TEXT NOT NULL
    )
    """)

    # 6. Table for Admin Dynamic Configuration Settings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS admin_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    # Seed demo bookings if empty
    cursor.execute("SELECT COUNT(*) as count FROM bookings")
    if cursor.fetchone()["count"] == 0:
        demo_bookings = [
            (
                "NTL-2026-9041", "Rahul Sharma", "9876543210", "rahul.sharma@example.com",
                "car", "Toyota Innova Crysta (Luxury)", "Tallital Bus Stand (Nainital)",
                "Kainchi Dham Darshan (Neem Karoli Ashram)", "2026-10-03", "09:00",
                1, 5, 3800, "Confirmed", "Family pilgrimage trip", datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            ),
            (
                "NTL-2026-8812", "Ananya Verma", "9811223344", "ananya.v@example.com",
                "bike", "Royal Enfield Classic 350", "Mallital (Nainital)",
                "Lake Tour (Bhimtal, Sattal, Naukuchiatal)", "2026-10-04", "10:30",
                2, 2, 2400, "In Progress", "Require 2 helmets", datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            ),
            (
                "NTL-2026-7649", "Vikram Rawat", "9412001122", "vikram.r@example.com",
                "car", "Maruti Dzire / Etios (Sedan)", "Kathgodam Railway Station",
                "Nainital Local Sightseeing (Full Day 8 Hrs)", "2026-10-05", "08:00",
                1, 3, 1800, "Completed", "Pickup from Kathgodam Shatabdi", datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            )
        ]
        cursor.executemany("""
        INSERT INTO bookings (id, customer_name, customer_phone, customer_email, vehicle_type, vehicle_model, pickup_location, drop_destination, pickup_date, pickup_time, tour_duration, passengers, estimated_fare, status, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, demo_bookings)

    # Seed demo hotel inquiries if empty
    cursor.execute("SELECT COUNT(*) as count FROM hotel_inquiries")
    if cursor.fetchone()["count"] == 0:
        demo_hotels = [
            ("The Manu Maharani Resort", "Amit Patel", "9820012345", "amit.p@gmail.com", "2026-11-05", 2, 2, "Luxury Lake Balcony", 13000, "Anniversary stay", "Confirmed", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
            ("Kumaon Heritage Homestay", "Sunita Joshi", "9411556677", "sunita.j@yahoo.com", "2026-11-12", 3, 4, "Family Pine Suite", 7500, "Traditional Kumaoni meals requested", "Pending", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        ]
        cursor.executemany("""
        INSERT INTO hotel_inquiries (hotel_name, guest_name, guest_phone, guest_email, checkin_date, nights, guests, room_type, estimated_amount, notes, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, demo_hotels)

    # Seed demo activity bookings if empty
    cursor.execute("SELECT COUNT(*) as count FROM activity_bookings")
    if cursor.fetchone()["count"] == 0:
        demo_activities = [
            ("ACT-2026-101", "Traditional Row Boating (Naini Lake)", "Rohit Mehta", "9898981234", "rohit.m@gmail.com", "2026-10-28", "16:00", 2, 420, "Confirmed", "Full Lake Round", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
            ("ACT-2026-102", "Aerial Ropeway to Snow View", "Priya Sen", "9711224455", "priya.s@gmail.com", "2026-10-29", "11:30", 4, 1200, "Confirmed", "Two adults two kids", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        ]
        cursor.executemany("""
        INSERT INTO activity_bookings (id, activity_name, customer_name, customer_phone, customer_email, booking_date, time_slot, participants, estimated_fare, status, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, demo_activities)

    # Initialize settings if empty
    cursor.execute("SELECT COUNT(*) as count FROM admin_settings")
    if cursor.fetchone()["count"] == 0:
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES ('admin_email', ?, ?)", (ADMIN_EMAIL, now_str))
        cursor.execute("INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES ('admin_phone', ?, ?)", (ADMIN_PHONE, now_str))

    conn.commit()
    conn.close()
    print("Database initialized successfully with all tables and seed records.")

# ================= STATIC FILE SERVING ================= #

@app.route("/")
def serve_home():
    return send_from_directory(BASE_DIR, "index.html")

@app.route("/<path:filename>")
def serve_static(filename):
    file_path = os.path.join(BASE_DIR, filename)
    if os.path.exists(file_path):
        return send_from_directory(BASE_DIR, filename)
    return send_from_directory(BASE_DIR, "index.html")

# ================= PLATFORM SYSTEM & STATS APIs ================= #

@app.route("/api/health", methods=["GET"])
def health_check():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM bookings")
    b_count = cursor.fetchone()["count"]
    cursor.execute("SELECT COUNT(*) as count FROM inquiries")
    i_count = cursor.fetchone()["count"]
    cursor.execute("SELECT COUNT(*) as count FROM hotel_inquiries")
    h_count = cursor.fetchone()["count"]
    cursor.execute("SELECT COUNT(*) as count FROM activity_bookings")
    a_count = cursor.fetchone()["count"]
    conn.close()

    return jsonify({
        "status": "online",
        "app": "FindNainital (NTL) Tourism & Ride Engine",
        "version": "2.6.0",
        "server_time": datetime.now().isoformat(),
        "database": "SQLite Connected",
        "database_records": {
            "bookings": b_count,
            "inquiries": i_count,
            "hotel_inquiries": h_count,
            "activity_bookings": a_count
        }
    })

@app.route("/api/weather", methods=["GET"])
def get_weather():
    return jsonify({
        "location": "Nainital, Uttarakhand (2,084m)",
        "temperature": "16°C",
        "condition": "Pleasant & Clear Mountain Breeze",
        "humidity": "64%",
        "visibility": "10 km",
        "air_quality": "Good (AQI 32)",
        "sunrise": "06:12 AM",
        "sunset": "06:05 PM",
        "best_season": "March to June & October to December",
        "live_status": "Ideal for Sightseeing & Boating"
    })

@app.route("/api/stats", methods=["GET"])
def get_stats():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as total_bookings, SUM(estimated_fare) as total_revenue FROM bookings")
    booking_stats = cursor.fetchone()

    cursor.execute("SELECT COUNT(*) as count FROM inquiries")
    inquiry_stats = cursor.fetchone()

    cursor.execute("SELECT COUNT(*) as count FROM hotel_inquiries")
    hotel_stats = cursor.fetchone()

    cursor.execute("SELECT COUNT(*) as count FROM activity_bookings")
    act_stats = cursor.fetchone()

    cursor.execute("SELECT status, COUNT(*) as count FROM bookings GROUP BY status")
    status_counts = {row["status"]: row["count"] for row in cursor.fetchall()}

    conn.close()

    return jsonify({
        "total_bookings": booking_stats["total_bookings"] or 0,
        "total_revenue": booking_stats["total_revenue"] or 0,
        "total_inquiries": inquiry_stats["count"] or 0,
        "total_hotel_inquiries": hotel_stats["count"] or 0,
        "total_activity_bookings": act_stats["count"] or 0,
        "status_breakdown": status_counts,
        "total_places": 15,
        "total_hidden_gems": 7,
        "total_temples": 6,
        "total_hotels": 8,
        "active_fleet": 50
    })

# ================= 1. VEHICLE & RIDE BOOKINGS API ================= #

@app.route("/api/bookings", methods=["GET"])
def list_bookings():
    status_filter = request.args.get("status")
    search_query = request.args.get("search")

    conn = get_db()
    cursor = conn.cursor()

    query = "SELECT * FROM bookings WHERE 1=1"
    params = []

    if status_filter and status_filter.lower() != "all":
        query += " AND status = ?"
        params.append(status_filter)

    if search_query:
        query += " AND (customer_name LIKE ? OR customer_phone LIKE ? OR id LIKE ? OR vehicle_model LIKE ?)"
        term = f"%{search_query}%"
        params.extend([term, term, term, term])

    query += " ORDER BY created_at DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    bookings = [dict(row) for row in rows]
    return jsonify({
        "success": True,
        "count": len(bookings),
        "data": bookings
    })

@app.route("/api/bookings", methods=["POST"])
def create_booking():
    data = request.get_json(silent=True) or request.form.to_dict() or {}
    
    customer_name = (data.get("customer_name") or data.get("name", "")).strip()
    customer_phone = (data.get("customer_phone") or data.get("phone", "")).strip()
    customer_email = (data.get("customer_email") or data.get("email", "")).strip()
    vehicle_type = data.get("vehicle_type", "car")
    vehicle_model = data.get("vehicle_model", "Maruti Dzire / Etios (Sedan)")
    pickup_location = data.get("pickup_location", "Mallital (Nainital)")
    drop_destination = data.get("drop_destination", "Nainital Local Sightseeing")
    pickup_date = data.get("pickup_date", datetime.now().strftime("%Y-%m-%d"))
    pickup_time = data.get("pickup_time", "09:30")
    tour_duration = int(data.get("tour_duration", 1))
    passengers = int(data.get("passengers", data.get("passenger_count", 1)))
    notes = data.get("notes", "")

    if not customer_name or not customer_phone:
        return jsonify({"success": False, "error": "Customer name and phone are required"}), 400

    estimated_fare = data.get("estimated_fare")
    if estimated_fare is None:
        base_rates = {
            "Maruti Dzire / Etios (Sedan)": 1800,
            "Maruti Ertiga (6 Seater)": 2600,
            "Toyota Innova Crysta (Luxury)": 3800,
            "Mahindra Thar 4x4 (Offroad)": 4500,
            "Honda Activa 6G (Scooter)": 600,
            "Bajaj Pulsar 150 / Apache": 800,
            "Royal Enfield Classic 350": 1200,
            "Royal Enfield Himalayan 411": 1600
        }
        base_rate = base_rates.get(vehicle_model, 1800 if vehicle_type == "car" else 800)
        estimated_fare = base_rate * max(1, tour_duration)

    booking_id = f"NTL-{datetime.now().year}-{int(datetime.now().timestamp() % 100000):05d}"
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO bookings (id, customer_name, customer_phone, customer_email, vehicle_type, vehicle_model, pickup_location, drop_destination, pickup_date, pickup_time, tour_duration, passengers, estimated_fare, status, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?, ?)
    """, (booking_id, customer_name, customer_phone, customer_email, vehicle_type, vehicle_model, pickup_location, drop_destination, pickup_date, pickup_time, tour_duration, passengers, estimated_fare, notes, created_at))
    conn.commit()
    conn.close()

    # Formulate Email Notification to Admin
    email_subject = f"🚗 [FindNainital Booking] {booking_id} - {customer_name} ({vehicle_model})"
    email_html = f"""
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #07251f 0%, #0d3b32 100%); color: #ffffff; padding: 24px 28px; text-align: center;">
            <span style="background: rgba(255,255,255,0.15); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; letter-spacing: 1px; color: #ffd1a8; text-transform: uppercase;">FindNainital Ride Dispatch</span>
            <h1 style="color: #ffffff; margin: 10px 0 4px; font-size: 22px;">🎉 New Ride Booking Confirmed!</h1>
            <p style="margin: 0; color: #cbd5e1; font-size: 14px;">Booking Reference ID: <strong style="color: #ffd1a8;">{booking_id}</strong></p>
        </div>
        
        <div style="padding: 26px 28px; color: #1e293b; font-size: 14px; line-height: 1.6;">
            <p><strong>Customer:</strong> {customer_name} (<a href="tel:+91{customer_phone}">+91 {customer_phone}</a> | <a href="https://wa.me/91{customer_phone}">WhatsApp</a>)</p>
            <p><strong>Vehicle:</strong> {vehicle_model} ({vehicle_type.upper()})</p>
            <p><strong>Pickup:</strong> 📍 {pickup_location} → 🏁 {drop_destination}</p>
            <p><strong>Date & Time:</strong> 📅 {pickup_date} at ⏰ {pickup_time} ({tour_duration} Day(s), {passengers} Pax)</p>
            <p><strong>Estimated Fare:</strong> <strong style="color: #15803d; font-size: 18px;">₹{estimated_fare:,.0f}</strong></p>
            {f'<p><strong>Notes:</strong> <em>{notes}</em></p>' if notes else ''}
        </div>
        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 20px; text-align: center; font-size: 12px; color: #64748b;">
            FindNainital Tourism Platform • Admin: Priyanshu Kumar (+91 9456168611)
        </div>
    </div>
    """
    email_result = send_email_notification(email_subject, email_html)

    return jsonify({
        "success": True,
        "message": "Booking received and confirmed successfully! Notification dispatched to WhatsApp and Gmail.",
        "booking_id": booking_id,
        "admin_phone": ADMIN_PHONE,
        "admin_email": ADMIN_EMAIL,
        "email_status": email_result.get("status", "processed"),
        "data": {
            "id": booking_id,
            "customer_name": customer_name,
            "customer_phone": customer_phone,
            "customer_email": customer_email,
            "vehicle_model": vehicle_model,
            "pickup_location": pickup_location,
            "drop_destination": drop_destination,
            "pickup_date": pickup_date,
            "pickup_time": pickup_time,
            "tour_duration": tour_duration,
            "passengers": passengers,
            "estimated_fare": estimated_fare,
            "status": "Confirmed",
            "created_at": created_at
        }
    }), 201

@app.route("/api/bookings/<booking_id>", methods=["GET"])
def get_booking(booking_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({"success": False, "error": "Booking not found"}), 404

    return jsonify({"success": True, "data": dict(row)})

@app.route("/api/bookings/<booking_id>/status", methods=["PATCH", "PUT"])
def update_booking_status(booking_id):
    data = request.get_json(silent=True) or request.form.to_dict() or {}
    new_status = data.get("status")

    valid_statuses = ["Pending", "Confirmed", "In Progress", "Completed", "Cancelled"]
    if new_status not in valid_statuses:
        return jsonify({"success": False, "error": f"Invalid status. Choose from: {', '.join(valid_statuses)}"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE bookings SET status = ? WHERE id = ?", (new_status, booking_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()

    if affected == 0:
        return jsonify({"success": False, "error": "Booking not found"}), 404

    return jsonify({"success": True, "message": f"Status updated to {new_status}", "id": booking_id, "status": new_status})

@app.route("/api/bookings/<booking_id>", methods=["DELETE"])
def delete_booking(booking_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM bookings WHERE id = ?", (booking_id,))
    affected = cursor.rowcount
    conn.commit()
    conn.close()

    if affected == 0:
        return jsonify({"success": False, "error": "Booking not found"}), 404

    return jsonify({"success": True, "message": f"Booking {booking_id} deleted successfully"})

# ================= 2. HOTEL INQUIRIES & RESERVATIONS API ================= #

@app.route("/api/hotels", methods=["GET"])
def get_hotels():
    category = request.args.get("category")
    hotels = [
        {
            "id": "hotel-manu",
            "name": "The Manu Maharani Resort",
            "category": "luxury",
            "badge": "★ 4.8 Lakeside Luxury",
            "location": "Mallital, Grassmere Estate, Nainital",
            "starting_price": 6500,
            "rating": 4.8,
            "amenities": ["Balcony Lake View", "Heated Rooms", "Fine Dining", "Spa & Sauna", "Free Shuttle"],
            "phone": "+91 5942 237341",
            "image": "images/hotel_lakeview_1789405137728.jpg"
        },
        {
            "id": "hotel-naini-retreat",
            "name": "The Naini Retreat Heritage Resort",
            "category": "heritage",
            "badge": "★ 4.7 Royal Heritage",
            "location": "Ayarpatta Slopes, Nainital",
            "starting_price": 7200,
            "rating": 4.7,
            "amenities": ["Historical Palace", "Pine Forest Setting", "Bonfire Nights", "Multi-Cuisine", "Spa"],
            "phone": "+91 5942 235105",
            "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
        },
        {
            "id": "hotel-swiss",
            "name": "Swiss Hotel & Spa",
            "category": "heritage",
            "badge": "★ 4.4 Colonial Charm",
            "location": "Mallital, Near High Court, Nainital",
            "starting_price": 3800,
            "rating": 4.4,
            "amenities": ["British Architecture", "Garden Lawns", "Antique Wood Fireplace", "Free Wi-Fi"],
            "phone": "+91 5942 236049",
            "image": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"
        },
        {
            "id": "hotel-lake-grand",
            "name": "Hotel Lake View Grand",
            "category": "budget",
            "badge": "★ 4.3 Lakeside Economy",
            "location": "The Mall, Tallital Promenade, Nainital",
            "starting_price": 2200,
            "rating": 4.3,
            "amenities": ["Direct Mall Road Access", "Lake Balconies", "Running Hot Water", "Room Service"],
            "phone": "+91 5942 236000",
            "image": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80"
        },
        {
            "id": "homestay-kumaon",
            "name": "Kumaon Heritage Mountain Homestay",
            "category": "homestay",
            "badge": "★ 4.9 Authentic Pahadi",
            "location": "Pangot & Sukhatal Valley, Nainital",
            "starting_price": 2500,
            "rating": 4.9,
            "amenities": ["Home Cooked Pahadi Food", "Apple Orchards", "Bird Watching", "Pet Friendly", "Bonfire"],
            "phone": "+91 9456168611",
            "image": "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80"
        },
        {
            "id": "hotel-alka",
            "name": "Alka The Lake Side Hotel",
            "category": "luxury",
            "badge": "★ 4.6 Prime Waterfront",
            "location": "Mall Road, Nainital",
            "starting_price": 4800,
            "rating": 4.6,
            "amenities": ["Lakeside Restaurant", "Floating Terrace", "Lift Available", "Heated Suites"],
            "phone": "+91 5942 235220",
            "image": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80"
        }
    ]

    if category and category != "all":
        hotels = [h for h in hotels if h["category"] == category]

    return jsonify({"success": True, "count": len(hotels), "data": hotels})

@app.route("/api/hotel-inquiries", methods=["POST"])
def submit_hotel_inquiry():
    data = request.get_json(silent=True) or request.form.to_dict() or {}
    hotel_name = data.get("hotel_name", "Nainital Lake Stay").strip()
    guest_name = (data.get("guest_name") or data.get("name", "")).strip()
    guest_phone = (data.get("guest_phone") or data.get("phone", "")).strip()
    guest_email = (data.get("guest_email") or data.get("email", "")).strip()
    checkin_date = data.get("checkin_date", datetime.now().strftime("%Y-%m-%d"))
    nights = int(data.get("nights", 1))
    guests = int(data.get("guests", 2))
    room_type = data.get("room_type", "Deluxe Lake View")
    estimated_amount = float(data.get("estimated_amount", 0))
    notes = data.get("notes", "")

    if not guest_name or not guest_phone:
        return jsonify({"success": False, "error": "Guest name and phone are required"}), 400

    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO hotel_inquiries (hotel_name, guest_name, guest_phone, guest_email, checkin_date, nights, guests, room_type, estimated_amount, notes, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
    """, (hotel_name, guest_name, guest_phone, guest_email, checkin_date, nights, guests, room_type, estimated_amount, notes, created_at))
    inquiry_id = cursor.lastrowid
    conn.commit()
    conn.close()

    # Formulate Email Alert to Owner
    email_sub = f"🏨 [Hotel Inquiry #{inquiry_id}] {hotel_name} - {guest_name}"
    email_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden;">
        <div style="background: #1e3a8a; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0; color: #bfdbfe;">🏨 New Hotel Booking Inquiry</h2>
            <p style="margin: 5px 0 0; font-size: 13px;">Reference ID: #{inquiry_id}</p>
        </div>
        <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
            <p><strong>Property:</strong> <span style="color: #1e3a8a; font-weight: bold;">{hotel_name}</span></p>
            <p><strong>Guest:</strong> {guest_name} (<a href="tel:+91{guest_phone}">+91 {guest_phone}</a> | <a href="https://wa.me/91{guest_phone}">WhatsApp</a>)</p>
            <p><strong>Email:</strong> {guest_email or 'Not provided'}</p>
            <p><strong>Check-in:</strong> 📅 {checkin_date} ({nights} Night(s), {guests} Guest(s))</p>
            <p><strong>Room Category:</strong> {room_type}</p>
            {f'<p><strong>Estimated Total:</strong> ₹{estimated_amount:,.0f}</p>' if estimated_amount > 0 else ''}
            {f'<p><strong>Special Notes:</strong> <em>{notes}</em></p>' if notes else ''}
        </div>
    </div>
    """
    send_email_notification(email_sub, email_html)

    return jsonify({
        "success": True,
        "message": f"Inquiry for {hotel_name} registered successfully! Front desk and driver desk notified.",
        "inquiry_id": inquiry_id
    }), 201

@app.route("/api/hotel-inquiries", methods=["GET"])
def list_hotel_inquiries():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM hotel_inquiries ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return jsonify({"success": True, "count": len(rows), "data": [dict(r) for r in rows]})

# ================= 3. BOATING & ACTIVITIES BOOKING API ================= #

@app.route("/api/activities", methods=["GET"])
def get_activities():
    activities = [
        {
            "id": "act-row-boat",
            "name": "Traditional Row Boating (Naini Lake)",
            "location": "Mallital & Tallital Boat Docks",
            "timings": "06:00 AM - 06:00 PM",
            "rate": "₹210 (Half Round) / ₹420 (Full Round)",
            "price_num": 420,
            "duration": "45 Mins",
            "safety": "Municipal life jackets mandatory",
            "features": ["Local Gondola Style Boatman", "Lakeside Photo Stops", "Tranquil Lake Breeze"]
        },
        {
            "id": "act-pedal-boat",
            "name": "Self-Pedal Boating (Naini Lake)",
            "location": "Tallital Docks, Nainital",
            "timings": "06:00 AM - 06:00 PM",
            "rate": "₹150 - ₹250 / hour",
            "price_num": 250,
            "duration": "60 Mins",
            "safety": "Life vests provided",
            "features": ["Self-Drive Fun", "Family Friendly (2-4 Seater)", "Romantic & Relaxing"]
        },
        {
            "id": "act-ropeway",
            "name": "Aerial Cable Car Ropeway",
            "location": "Mallital Cable Car Station",
            "timings": "10:00 AM - 05:00 PM",
            "rate": "₹300 Adults / ₹200 Kids (Round Trip)",
            "price_num": 300,
            "duration": "3 Mins each way (1 Hr at top)",
            "safety": "Swiss cabin technology certified",
            "features": ["Panoramic Lake Bird View", "Ascends to 2,270m Snow View", "Views of Nanda Devi Peak"]
        },
        {
            "id": "act-paragliding",
            "name": "Tandem Mountain Paragliding",
            "location": "Naukuchiatal & Bhimtal Ridges (25 km from town)",
            "timings": "07:00 AM - 05:00 PM (Subject to wind)",
            "rate": "₹1,500 - ₹3,500 / flight",
            "price_num": 1800,
            "duration": "10 - 20 Mins in air",
            "safety": "Govt. certified tandem pilots & GoPro recording",
            "features": ["Soar Over Lake Valleys", "High Altitude Thermals", "HD Video Included"]
        },
        {
            "id": "act-yacht",
            "name": "Historic Nainital Yacht Club Sailing",
            "location": "Nainital Boat Club, Mallital",
            "timings": "11:00 AM - 04:30 PM",
            "rate": "₹500 / person",
            "price_num": 500,
            "duration": "30 Mins",
            "safety": "Member club certified captain",
            "features": ["Highest Sailing Club in the World", "Classic Canvas Sailboats", "Historic Experience"]
        }
    ]
    return jsonify({"success": True, "count": len(activities), "data": activities})

@app.route("/api/activities/book", methods=["POST"])
def book_activity():
    data = request.get_json(silent=True) or request.form.to_dict() or {}
    activity_name = data.get("activity_name", "Naini Lake Boating").strip()
    customer_name = (data.get("customer_name") or data.get("name", "")).strip()
    customer_phone = (data.get("customer_phone") or data.get("phone", "")).strip()
    customer_email = (data.get("customer_email") or data.get("email", "")).strip()
    booking_date = data.get("booking_date", datetime.now().strftime("%Y-%m-%d"))
    time_slot = data.get("time_slot", "10:00 AM")
    participants = int(data.get("participants", 2))
    estimated_fare = float(data.get("estimated_fare", 420))
    notes = data.get("notes", "")

    if not customer_name or not customer_phone:
        return jsonify({"success": False, "error": "Customer name and phone are required"}), 400

    booking_id = f"ACT-{datetime.now().year}-{int(datetime.now().timestamp() % 100000):05d}"
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO activity_bookings (id, activity_name, customer_name, customer_phone, customer_email, booking_date, time_slot, participants, estimated_fare, status, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?, ?)
    """, (booking_id, activity_name, customer_name, customer_phone, customer_email, booking_date, time_slot, participants, estimated_fare, notes, created_at))
    conn.commit()
    conn.close()

    # Formulate Email Alert to Owner
    email_sub = f"🚣 [Activity Confirmed] {booking_id} - {customer_name} ({activity_name})"
    email_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #0891b2; border-radius: 12px; overflow: hidden;">
        <div style="background: #0891b2; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0; color: #cffafe;">🚣 Activity Booking Registered!</h2>
            <p style="margin: 5px 0 0; font-size: 13px;">ID: {booking_id}</p>
        </div>
        <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
            <p><strong>Activity:</strong> <span style="color: #0891b2; font-weight: bold;">{activity_name}</span></p>
            <p><strong>Customer:</strong> {customer_name} (<a href="tel:+91{customer_phone}">+91 {customer_phone}</a> | <a href="https://wa.me/91{customer_phone}">WhatsApp</a>)</p>
            <p><strong>Date & Slot:</strong> 📅 {booking_date} at ⏰ {time_slot} ({participants} Pax)</p>
            <p><strong>Estimated Fare:</strong> ₹{estimated_fare:,.0f}</p>
        </div>
    </div>
    """
    send_email_notification(email_sub, email_html)

    return jsonify({
        "success": True,
        "message": f"Activity '{activity_name}' reserved successfully! Voucher ID: {booking_id}",
        "booking_id": booking_id,
        "data": {
            "id": booking_id,
            "activity_name": activity_name,
            "customer_name": customer_name,
            "customer_phone": customer_phone,
            "booking_date": booking_date,
            "time_slot": time_slot,
            "participants": participants,
            "estimated_fare": estimated_fare,
            "status": "Confirmed"
        }
    }), 201

@app.route("/api/activities/bookings", methods=["GET"])
def list_activity_bookings():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM activity_bookings ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return jsonify({"success": True, "count": len(rows), "data": [dict(r) for r in rows]})

# ================= 4. SMART TRIP PLANNER API ================= #

@app.route("/api/planner/itineraries", methods=["GET"])
def get_itineraries():
    duration = request.args.get("days", "all")
    itineraries = {
        "1": {
            "title": "1-Day Express Nainital Highlights",
            "tag": "Day-trippers & Weekend Escapes",
            "timeline": [
                {"time": "08:30 AM", "title": "Maa Naina Devi Temple Darshan", "desc": "Morning prayers at 51 Shakti Peeth on north shore of Naini Lake."},
                {"time": "10:30 AM", "title": "Snow View Point via Ropeway", "desc": "Panoramic Himalayan view of Nanda Devi and Trishul peaks."},
                {"time": "01:00 PM", "title": "Mall Road Lunch & Kumaoni Thali", "desc": "Bhatt ki Churkani and Aloo ke Gutke at Machan or Sakley's."},
                {"time": "02:30 PM", "title": "Eco Cave Gardens Crawl", "desc": "Natural animal-shaped rocky caves in Sukhatal."},
                {"time": "04:30 PM", "title": "Sunset Row Boating on Naini Lake", "desc": "Emerald lake gondola row boat as sunset lights turn on."},
                {"time": "06:30 PM", "title": "Tibetan Market Souvenirs & Momos", "desc": "Shop carved candles, shawls, and eat hot steamed momos."}
            ]
        },
        "2": {
            "title": "2-Days Classic Nainital & Lake Tour",
            "tag": "Most Popular for Families & Couples",
            "timeline": [
                {"time": "DAY 1 - 09:00 AM", "title": "Nainital Local Exploration", "desc": "Naina Devi, High Altitude Zoo & Ropeway to Snow View."},
                {"time": "DAY 1 - 03:30 PM", "title": "Tiffin Top Forest Hike", "desc": "Dorothy's Seat 360-degree valley view on Ayarpatta hill."},
                {"time": "DAY 1 - 07:00 PM", "title": "Mall Road Evening Promenade", "desc": "Stroll along lakeside, cafe desserts & live music."},
                {"time": "DAY 2 - 08:30 AM", "title": "Spiritual Journey to Kainchi Dham", "desc": "Neem Karoli Baba Ashram morning meditation."},
                {"time": "DAY 2 - 12:30 PM", "title": "Bhimtal Lake & Island Aquarium", "desc": "Boating, lake aquarium cafe, and water zorbing."},
                {"time": "DAY 2 - 03:30 PM", "title": "Sattal Kayaking & Oak Forest Walk", "desc": "Pristine cluster of 7 interconnected natural lakes."}
            ]
        },
        "3": {
            "title": "3-Days Complete Kumaon Explorer",
            "tag": "Deep Himalayan Nature & Offbeat Trail",
            "timeline": [
                {"time": "DAY 1", "title": "Nainital Town Core & Boating", "desc": "Naini Lake, Naina Devi, Zoo, Cave Gardens & Tibetan Market."},
                {"time": "DAY 2", "title": "Lake Circuit & Kainchi Dham", "desc": "Kainchi Dham, Bhimtal Island, Sattal, Naukuchiatal paragliding."},
                {"time": "DAY 3", "title": "Mukteshwar & Chauli Ki Jali", "desc": "Apple orchards, 350-yr Shiva temple, and rocky canyon cliff drop."}
            ]
        }
    }

    if duration in itineraries:
        return jsonify({"success": True, "duration": duration, "data": itineraries[duration]})

    return jsonify({"success": True, "data": itineraries})

@app.route("/api/planner/inquire", methods=["POST"])
def submit_planner_inquiry():
    data = request.get_json(silent=True) or request.form.to_dict() or {}
    customer_name = (data.get("customer_name") or data.get("name", "")).strip()
    customer_phone = (data.get("customer_phone") or data.get("phone", "")).strip()
    customer_email = (data.get("customer_email") or data.get("email", "")).strip()
    duration_days = int(data.get("duration_days", 2))
    travel_date = data.get("travel_date", datetime.now().strftime("%Y-%m-%d"))
    travelers = int(data.get("travelers", 2))
    budget_type = data.get("budget_type", "Standard")
    selected_interests = data.get("selected_interests", "Lakes, Pilgrimage, Scenery")
    custom_notes = data.get("custom_notes", "")

    if not customer_name or not customer_phone:
        return jsonify({"success": False, "error": "Name and phone are required"}), 400

    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO planner_inquiries (customer_name, customer_phone, customer_email, duration_days, travel_date, travelers, budget_type, selected_interests, custom_notes, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'New', ?)
    """, (customer_name, customer_phone, customer_email, duration_days, travel_date, travelers, budget_type, selected_interests, custom_notes, created_at))
    plan_id = cursor.lastrowid
    conn.commit()
    conn.close()

    # Formulate Email Alert to Owner
    email_sub = f"🗺️ [Custom Itinerary Request #{plan_id}] {customer_name} ({duration_days} Days)"
    email_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #0d3b32; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0; color: #ffd1a8;">🗺️ New Custom Itinerary Request</h2>
            <p style="margin: 5px 0 0; font-size: 13px;">Plan Request #{plan_id}</p>
        </div>
        <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
            <p><strong>Tourist:</strong> {customer_name} (<a href="tel:+91{customer_phone}">+91 {customer_phone}</a> | <a href="https://wa.me/91{customer_phone}">WhatsApp</a>)</p>
            <p><strong>Duration:</strong> {duration_days} Day(s) starting 📅 {travel_date} ({travelers} Travelers)</p>
            <p><strong>Budget Tier:</strong> {budget_type}</p>
            <p><strong>Interests:</strong> {selected_interests}</p>
            {f'<p><strong>Notes:</strong> <em>{custom_notes}</em></p>' if custom_notes else ''}
        </div>
    </div>
    """
    send_email_notification(email_sub, email_html)

    return jsonify({
        "success": True,
        "message": f"Custom {duration_days}-Day holiday itinerary request received! Our tour expert will connect on WhatsApp.",
        "plan_id": plan_id
    }), 201

# ================= 5. FOOD & RESTAURANTS API ================= #

@app.route("/api/food", methods=["GET"])
def get_food():
    food_spots = [
        {
            "id": "rest-sakleys",
            "name": "Sakley's Restaurant & Pastry Shop",
            "badge": "Est. 1944 European Cafe",
            "category": "cafe",
            "location": "Off Mall Road, Near High Court, Mallital",
            "timings": "11:00 AM - 10:00 PM",
            "famous_for": "Wood-fired Thin Crust Pizzas, Sizzlers, Blueberry Cheesecake, Mountain Brew Coffee",
            "price_level": "₹₹ - ₹800 for two",
            "image": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80"
        },
        {
            "id": "rest-machan",
            "name": "Machan Restaurant",
            "badge": "Pahadi & North Indian",
            "category": "traditional",
            "location": "The Mall, Nainital",
            "timings": "12:00 PM - 10:30 PM",
            "famous_for": "Authentic Kumaoni Thali, Bhatt ki Churkani, Mandua ki Roti, Dal Makhani",
            "price_level": "₹₹ - ₹700 for two",
            "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"
        },
        {
            "id": "rest-sonam",
            "name": "Sonam's Tibetan Momos & Thukpa",
            "badge": "Cult Street Delicacy",
            "category": "street",
            "location": "Tibetan Market, Mallital Flats",
            "timings": "11:00 AM - 09:30 PM",
            "famous_for": "Steamed Mutton & Veg Momos, Spicy Pahadi Garlic Red Chutney, Hot Thukpa Soup",
            "price_level": "₹ - ₹150 for two",
            "image": "https://images.unsplash.com/photo-1496412705862-e0088f16f791?auto=format&fit=crop&w=800&q=80"
        },
        {
            "id": "rest-zoobys",
            "name": "Zooby's Kitchen",
            "badge": "Mughlai & Kashmiri",
            "category": "dining",
            "location": "Boat House Club Road, Mallital",
            "timings": "12:00 PM - 10:30 PM",
            "famous_for": "Mutton Rogan Josh, Butter Chicken, Paneer Tikka, Lake Balcony Seating",
            "price_level": "₹₹ - ₹900 for two",
            "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
        }
    ]
    return jsonify({"success": True, "count": len(food_spots), "data": food_spots})

# ================= 6. NEARBY DESTINATIONS API ================= #

@app.route("/api/nearby", methods=["GET"])
def get_nearby():
    destinations = [
        {
            "id": "nearby-bhimtal",
            "name": "Bhimtal Lake & Island",
            "distance": "22 km from Nainital",
            "travel_time": "45 Mins drive",
            "altitude": "1,370 m",
            "highlights": "Island aquarium cafe in lake center, water zorbing, boating, quiet lakeside walks",
            "taxi_fare": "₹1,200 round trip",
            "lat": 29.3460,
            "lng": 79.5530
        },
        {
            "id": "nearby-sattal",
            "name": "Sattal (Seven Lakes Circuit)",
            "distance": "23 km from Nainital",
            "travel_time": "50 Mins drive",
            "altitude": "1,370 m",
            "highlights": "Interconnected natural freshwater lakes, kayaking, dense oak woods, butterfly paradise",
            "taxi_fare": "₹1,400 round trip",
            "lat": 29.3560,
            "lng": 79.5330
        },
        {
            "id": "nearby-naukuchiatal",
            "name": "Naukuchiatal (Nine-Cornered Lake)",
            "distance": "26 km from Nainital",
            "travel_time": "55 Mins drive",
            "altitude": "1,220 m",
            "highlights": "Deepest lake in Kumaon, tandem paragliding center, lotus ponds, pedal boats",
            "taxi_fare": "₹1,500 round trip",
            "lat": 29.3190,
            "lng": 79.5850
        },
        {
            "id": "nearby-mukteshwar",
            "name": "Mukteshwar & Chauli Ki Jali",
            "distance": "50 km from Nainital",
            "travel_time": "1 Hr 45 Mins drive",
            "altitude": "2,286 m",
            "highlights": "Breathtaking 180° Himalayan snow peak panorama, 350-year Shiva temple, rocky canyon cliff drop",
            "taxi_fare": "₹2,600 round trip",
            "lat": 29.4722,
            "lng": 79.6480
        }
    ]
    return jsonify({"success": True, "count": len(destinations), "data": destinations})

# ================= 7. LIVE GPS TRACKING & ROUTE TELEMETRY API ================= #

@app.route("/api/tracking/status", methods=["GET"])
def get_tracking_status():
    place_id = request.args.get("place", "naini-lake")
    routes_data = {
        "naini-lake": {"lat": 29.3803, "lng": 79.4636, "altitude": "2,084 m", "road": "Clear & Smooth", "distance_from_bus_stand": "0.5 km"},
        "snow-view": {"lat": 29.3970, "lng": 79.4580, "altitude": "2,270 m", "road": "Steep Hill Road - Ropeway Recommended", "distance_from_bus_stand": "3.2 km"},
        "kainchi-dham": {"lat": 29.4237, "lng": 79.5167, "altitude": "1,400 m", "road": "Highway NH-109 Open - Moderate Traffic", "distance_from_bus_stand": "17.5 km"},
        "bhimtal": {"lat": 29.3460, "lng": 79.5530, "altitude": "1,370 m", "road": "Bhowali Highway Clear", "distance_from_bus_stand": "22.0 km"}
    }
    route_info = routes_data.get(place_id, routes_data["naini-lake"])
    
    return jsonify({
        "success": True,
        "location": place_id,
        "telemetry": route_info,
        "weather": "16°C • Clear Mountain Sky",
        "emergency_cabs": "+91 9456168611",
        "tourist_helpline": "1364",
        "google_maps_direct": f"https://www.google.com/maps/dir/?api=1&destination={route_info['lat']},{route_info['lng']}"
    })

# ================= 8. CONTACT & HELPDESK API ================= #

@app.route("/api/contact", methods=["POST"])
def submit_contact():
    data = request.get_json(silent=True) or request.form.to_dict() or {}
    name = data.get("name", "").strip()
    phone = data.get("phone", "").strip()
    email = data.get("email", "").strip()
    subject = data.get("subject", "General Inquiry").strip()
    message = data.get("message", "").strip()

    if not name or not phone or not message:
        return jsonify({"success": False, "error": "Name, phone, and message are required"}), 400

    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO inquiries (name, email, phone, subject, message, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'New', ?)
    """, (name, email, phone, subject, message, created_at))
    inquiry_id = cursor.lastrowid
    conn.commit()
    conn.close()

    inquiry_email_subject = f"📩 [FindNainital Inquiry #{inquiry_id}] From {name} ({subject})"
    inquiry_email_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #0f172a; color: white; padding: 20px; text-align: center;">
            <h2 style="color: #ffd1a8; margin: 0;">📩 New Tourist Help Desk Inquiry</h2>
            <p style="margin: 4px 0 0; font-size: 13px;">Ref #{inquiry_id}</p>
        </div>
        <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
            <p><strong>Name:</strong> {name}</p>
            <p><strong>Phone:</strong> <a href="tel:+91{phone}">+91 {phone}</a> | <a href="https://wa.me/91{phone}">WhatsApp</a></p>
            <p><strong>Email:</strong> {email or 'Not provided'}</p>
            <p><strong>Subject:</strong> {subject}</p>
            <blockquote style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 10px 14px; margin: 12px 0;">{message}</blockquote>
        </div>
    </div>
    """
    send_email_notification(inquiry_email_subject, inquiry_email_html)

    return jsonify({
        "success": True,
        "message": "Thank you! Your message has been sent to the Nainital tourist assistance desk.",
        "inquiry_id": inquiry_id
    }), 201

@app.route("/api/contact", methods=["GET"])
def list_contacts():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM inquiries ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return jsonify({"success": True, "count": len(rows), "data": [dict(r) for r in rows]})

# ================= 9. SIGHTSEEING, TEMPLES & VEHICLES CATALOG APIs ================= #

@app.route("/api/places", methods=["GET"])
def get_places():
    category = request.args.get("category")
    places = [
        {
            "id": "naini-lake",
            "name": "Naini Lake (Nainital Jheel)",
            "category": "lakes",
            "badge": "Top Attraction",
            "timings": "06:00 AM - 06:00 PM",
            "entry_fee": "Free Entry (Boating extra)",
            "description": "The iconic eye-shaped natural freshwater lake nestled in the heart of town. Famous for scenic boating, yachting, and tranquil evening walks along the promenade.",
            "features": ["🚣 Boating Available", "📸 Photography", "🚶 Walking Promenade"],
            "lat": 29.3803,
            "lng": 79.4636,
            "address": "Mallital/Tallital, Nainital, Uttarakhand 263002",
            "image": "images/nainital_hero_1789405015484.jpg"
        },
        {
            "id": "snow-view-point",
            "name": "Snow View Point",
            "category": "viewpoints",
            "badge": "Himalayan View",
            "timings": "10:30 AM - 05:00 PM",
            "entry_fee": "₹50 Entry",
            "description": "Perched at 2,270m altitude, offering breathtaking panoramic vistas of snow-capped Himalayan peaks including Nanda Devi, Trishul, and Nanda Kot.",
            "features": ["🚠 Cable Car / Ropeway", "🔭 Telescopes", "☕ Mountain Cafes"],
            "lat": 29.3970,
            "lng": 79.4580,
            "address": "Snow View Point, Nainital, Uttarakhand 263001",
            "image": "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80"
        },
        {
            "id": "eco-cave-gardens",
            "name": "Eco Cave Gardens",
            "category": "nature",
            "badge": "Adventure & Caves",
            "timings": "09:30 AM - 05:30 PM",
            "entry_fee": "₹60 Adults, ₹25 Kids",
            "description": "A cluster of 6 interconnected natural animal-shaped rocky caves with hanging gardens and musical fountain.",
            "features": ["🧗 Rock Crawling", "⛲ Musical Fountain", "🌺 Botanical Gardens"],
            "lat": 29.3900,
            "lng": 79.4480,
            "address": "Sukhatal, Mallital, Nainital, Uttarakhand 263001",
            "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
        },
        {
            "id": "tiffin-top",
            "name": "Tiffin Top (Dorothy's Seat)",
            "category": "viewpoints",
            "badge": "Trek & Sunset",
            "timings": "08:00 AM - 06:00 PM",
            "entry_fee": "Free",
            "description": "Located on Ayarpatta hill at 2,292m. Known for 360-degree views of Nainital town and surrounding green Kumaon hills.",
            "features": ["🥾 4 km Forest Trek", "🐎 Horse Riding", "🌅 Sunset Point"],
            "lat": 29.3800,
            "lng": 79.4440,
            "address": "Ayarpatta, Nainital, Uttarakhand 263002",
            "image": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80"
        },
        {
            "id": "high-altitude-zoo",
            "name": "Pt. G.B. Pant High Altitude Zoo",
            "category": "nature",
            "badge": "Wildlife Sanctuary",
            "timings": "10:00 AM - 04:30 PM (Closed Mon)",
            "entry_fee": "₹50 Adults",
            "description": "One of only three high altitude zoos in India at 2,100m. Home to endangered Himalayan wildlife including the Royal Bengal Tiger and Snow Leopard.",
            "features": ["🐾 Snow Leopard", "🦅 Himalayan Monal", "🛺 Shuttle Service"],
            "lat": 29.3880,
            "lng": 79.4710,
            "address": "Tallital, Nainital, Uttarakhand 263002",
            "image": "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=800&q=80"
        }
    ]

    if category and category != "all":
        places = [p for p in places if p["category"] == category]

    return jsonify({"success": True, "count": len(places), "data": places})

@app.route("/api/hidden-places", methods=["GET"])
def get_hidden_places():
    hidden = [
        {
            "name": "Pangot & Kilbury Bird Sanctuary",
            "altitude": "2,150 m",
            "distance": "15 km from Nainital",
            "highlight": "580+ bird species, serene oak & rhododendron forest, zero tourist rush",
            "best_for": "Birdwatching, Forest walks, Peaceful photography",
            "lat": 29.4280,
            "lng": 79.4210
        },
        {
            "name": "Land's End Viewpoint",
            "altitude": "2,118 m",
            "distance": "4 km from Nainital",
            "highlight": "Sudden cliff drop overlooking Khurpatal emerald lake and terraced farms",
            "best_for": "Sunset watching, Horse riding, Untamed cliff views",
            "lat": 29.3750,
            "lng": 79.4350
        },
        {
            "name": "Guano Hills & Sukhatal Forest Trail",
            "altitude": "2,200 m",
            "distance": "3 km from Mallital",
            "highlight": "Enchanting walking trails through dense deodar, bamboo & oak groves",
            "best_for": "Morning jogging, Nature therapy, Butterfly watching",
            "lat": 29.3950,
            "lng": 79.4420
        }
    ]
    return jsonify({"success": True, "count": len(hidden), "data": hidden})

@app.route("/api/temples", methods=["GET"])
def get_temples():
    temples = [
        {
            "name": "Maa Naina Devi Temple",
            "significance": "51 Shakti Peeth (Where Goddess Sati's eyes fell)",
            "location": "North shore of Naini Lake (Mallital Flatts)",
            "timings": "05:00 AM - 09:00 PM (Aarti at 07:00 AM & 07:30 PM)",
            "lat": 29.3948,
            "lng": 79.4587,
            "image": "images/naina_devi_1789405033629.jpg"
        },
        {
            "name": "Kainchi Dham (Neem Karoli Baba Ashram)",
            "significance": "World-famous spiritual ashram visited by Steve Jobs, Mark Zuckerberg & Virat Kohli",
            "location": "Bhowali-Almora Road (17 km from Nainital)",
            "timings": "06:30 AM - 07:00 PM (Bhandara on 15th June)",
            "lat": 29.4237,
            "lng": 79.5167,
            "image": "images/kainchi_dham_1789405052626.jpg"
        },
        {
            "name": "Hanuman Garhi Temple",
            "significance": "Renowned for 70-foot Lord Hanuman idol and breathtaking sunset views",
            "location": "3.5 km from Tallital Bus Stand (1,951m)",
            "timings": "05:00 AM - 08:30 PM",
            "lat": 29.3667,
            "lng": 79.4667,
            "image": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80"
        },
        {
            "name": "Mukteshwar Dham (350-Yr Shiva Temple)",
            "significance": "Ancient hilltop temple at 2,312m with Chauli Ki Jali rocky cliff",
            "location": "Mukteshwar (50 km scenic drive from Nainital)",
            "timings": "06:00 AM - 07:30 PM",
            "lat": 29.4722,
            "lng": 79.6480,
            "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
        }
    ]
    return jsonify({"success": True, "count": len(temples), "data": temples})

@app.route("/api/vehicles", methods=["GET"])
def get_vehicles():
    return jsonify({
        "success": True,
        "cars": [
            {"model": "Maruti Dzire / Etios (Sedan)", "type": "Sedan", "seats": 4, "rate_per_day": 1800, "ac": True, "img": "images/taxi_service_1789405107846.jpg"},
            {"model": "Maruti Ertiga (6 Seater)", "type": "MUV", "seats": 6, "rate_per_day": 2600, "ac": True, "img": "images/taxi_service_1789405107846.jpg"},
            {"model": "Toyota Innova Crysta (Luxury)", "type": "Luxury SUV", "seats": 7, "rate_per_day": 3800, "ac": True, "img": "images/taxi_service_1789405107846.jpg"},
            {"model": "Mahindra Thar 4x4 (Offroad)", "type": "4x4 SUV", "seats": 4, "rate_per_day": 4500, "ac": True, "img": "images/taxi_service_1789405107846.jpg"}
        ],
        "bikes": [
            {"model": "Honda Activa 6G (Scooter)", "type": "Automatic Scooty", "rate_per_day": 600, "helmets": 2, "img": "images/bike_rental_1789405078146.jpg"},
            {"model": "Bajaj Pulsar 150 / Apache", "type": "Standard Bike", "rate_per_day": 800, "helmets": 2, "img": "images/bike_rental_1789405078146.jpg"},
            {"model": "Royal Enfield Classic 350", "type": "Hill Cruiser", "rate_per_day": 1200, "helmets": 2, "img": "images/bike_rental_1789405078146.jpg"},
            {"model": "Royal Enfield Himalayan 411", "type": "Adventure Offroad", "rate_per_day": 1600, "helmets": 2, "img": "images/bike_rental_1789405078146.jpg"}
        ]
    })

# ================= 10. ADMIN DASHBOARD & SETTINGS APIs ================= #

@app.route("/api/admin/summary", methods=["GET"])
def get_admin_summary():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as c, SUM(estimated_fare) as rev FROM bookings")
    b_row = cursor.fetchone()

    cursor.execute("SELECT COUNT(*) as c FROM hotel_inquiries")
    h_row = cursor.fetchone()

    cursor.execute("SELECT COUNT(*) as c, SUM(estimated_fare) as rev FROM activity_bookings")
    a_row = cursor.fetchone()

    cursor.execute("SELECT COUNT(*) as c FROM inquiries")
    i_row = cursor.fetchone()

    cursor.execute("SELECT COUNT(*) as c FROM planner_inquiries")
    p_row = cursor.fetchone()

    cursor.execute("SELECT status, COUNT(*) as c FROM bookings GROUP BY status")
    b_status = {r["status"]: r["c"] for r in cursor.fetchall()}

    conn.close()

    total_rev = (b_row["rev"] or 0) + (a_row["rev"] or 0)

    return jsonify({
        "success": True,
        "summary": {
            "total_ride_bookings": b_row["c"] or 0,
            "total_hotel_inquiries": h_row["c"] or 0,
            "total_activity_bookings": a_row["c"] or 0,
            "total_contact_messages": i_row["c"] or 0,
            "total_planner_requests": p_row["c"] or 0,
            "gross_revenue": total_rev,
            "ride_status_breakdown": b_status
        }
    })

@app.route("/api/admin/settings", methods=["GET"])
def get_admin_settings():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM admin_settings")
    rows = cursor.fetchall()
    conn.close()
    settings = {r["key"]: r["value"] for r in rows}
    return jsonify({
        "success": True,
        "admin_email": settings.get("admin_email", ADMIN_EMAIL),
        "admin_phone": settings.get("admin_phone", ADMIN_PHONE)
    })

@app.route("/api/admin/settings", methods=["POST"])
def update_admin_settings():
    global ADMIN_EMAIL, ADMIN_PHONE
    data = request.get_json(silent=True) or request.form.to_dict() or {}
    new_email = data.get("admin_email", "").strip()
    new_phone = data.get("admin_phone", "").strip()

    conn = get_db()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if new_email:
        ADMIN_EMAIL = new_email
        cursor.execute("INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES ('admin_email', ?, ?)", (new_email, now_str))
    if new_phone:
        ADMIN_PHONE = new_phone
        cursor.execute("INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES ('admin_phone', ?, ?)", (new_phone, now_str))

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Admin dispatch settings updated successfully!",
        "admin_email": ADMIN_EMAIL,
        "admin_phone": ADMIN_PHONE
    })

@app.route("/api/admin/export", methods=["GET"])
def export_bookings_csv():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, customer_name, customer_phone, customer_email, vehicle_type, vehicle_model, pickup_location, drop_destination, pickup_date, pickup_time, tour_duration, passengers, estimated_fare, status, created_at FROM bookings ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Booking ID", "Customer Name", "Phone", "Email", "Type", "Vehicle Model", "Pickup Location", "Drop Destination", "Date", "Time", "Duration (Days)", "Pax", "Fare (INR)", "Status", "Created At"])
    
    for r in rows:
        writer.writerow(list(r))

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=FindNainital_Bookings.csv"}
    )

# ================= RUNNER ================= #

if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 5000))
    print(f">> FindNainital Backend Server running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
