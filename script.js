/* =========================================================
   FindNainital (NTL) - Unified Application Logic & Backend Sync
   Author: Priyanshu Kumar (Uttarakhand Govt. Polytechnic, Nainital)
   ========================================================= */

// State management
let currentVehicleType = 'car';
let currentTrackedPlace = {
    name: 'Naini Lake',
    lat: 29.3803,
    lng: 79.4636,
    address: 'Mallital/Tallital, Nainital, Uttarakhand 263002'
};

// API Base configuration
const API_BASE = window.location.origin.includes('5000') ? window.location.origin : '';

// Vehicle Data
const vehicleOptions = {
    car: [
        { name: "Maruti Dzire / Etios (Sedan)", base: 1800, text: "Maruti Dzire / Etios (AC Sedan - 4 Seater) • ₹1,800/day" },
        { name: "Maruti Ertiga (6 Seater)", base: 2600, text: "Maruti Ertiga (AC MUV - 6 Seater) • ₹2,600/day" },
        { name: "Toyota Innova Crysta (Luxury)", base: 3800, text: "Toyota Innova Crysta (Luxury SUV - 7 Seater) • ₹3,800/day" },
        { name: "Mahindra Thar 4x4 (Offroad)", base: 4500, text: "Mahindra Thar 4x4 (Mountain Explorer) • ₹4,500/day" }
    ],
    bike: [
        { name: "Honda Activa 6G (Scooter)", base: 600, text: "Honda Activa 6G (Automatic Scooty) • ₹600/day" },
        { name: "Bajaj Pulsar 150 / Apache", base: 800, text: "Bajaj Pulsar / TVS Apache 160 • ₹800/day" },
        { name: "Royal Enfield Classic 350", base: 1200, text: "Royal Enfield Classic 350 (Hill Cruiser) • ₹1,200/day" },
        { name: "Royal Enfield Himalayan 411", base: 1600, text: "Royal Enfield Himalayan (Adventure Offroad) • ₹1,600/day" }
    ]
};

// Itinerary Data for Smart Trip Planner
const itineraryData = {
    1: {
        title: "1-Day Express Nainital Highlights",
        meta: "⭐ Perfect for day-trippers & short weekend visits",
        timeline: [
            { time: "08:30 AM", title: "Maa Naina Devi Darshan & Naini Lake Walk", desc: "Start with morning blessings at the historic 51 Shakti Peeth temple, followed by a quiet stroll along Mallital Flatts." },
            { time: "10:30 AM", title: "Aerial Ropeway to Snow View Point", desc: "Board the cable car from Mallital to reach Snow View Point (2,270m) for panoramic views of Nanda Devi and Himalayan ranges." },
            { time: "01:00 PM", title: "Lunch at Mall Road & Traditional Kumaoni Thali", desc: "Try authentic Bhatt ki Churkani and Aloo ke Gutke at Machan or enjoy lakeside dining." },
            { time: "02:30 PM", title: "Eco Cave Gardens Exploration", desc: "Explore the interconnected natural animal caves and musical fountain in Sukhatal." },
            { time: "04:30 PM", title: "Sunset Boating in Naini Lake", desc: "Enjoy a scenic 45-minute row boat ride across the tranquil waters as evening lights turn on." },
            { time: "06:30 PM", title: "Shopping at Tibetan Market & Hot Momos", desc: "Shop for aromatic handcrafted candles, woolens, wooden artifacts, and indulge in famous steamed Tibetan momos." }
        ]
    },
    2: {
        title: "2-Days Classic Nainital & Lakes Tour",
        meta: "🌟 Most popular itinerary for couples and families",
        timeline: [
            { time: "DAY 1: 09:00 AM", title: "Nainital Local Exploration", desc: "Naina Devi Temple, Naini Lake Boating, Snow View Point via Ropeway, and High Altitude Himalayan Zoo." },
            { time: "DAY 1: 03:30 PM", title: "Tiffin Top (Dorothy's Seat) Trek / Horse Ride", desc: "Scenic forest hike on Ayarpatta hill with 360-degree sunset valley views." },
            { time: "DAY 1: 07:00 PM", title: "Mall Road Evening Promenade & Cafe Dinner", desc: "Pastries and pizza at Sakley's followed by night lights view of Naini Lake." },
            { time: "DAY 2: 08:30 AM", title: "Spiritual Darshan at Kainchi Dham", desc: "Drive 17 km to the world-famous Neem Karoli Baba Ashram for peaceful morning meditation." },
            { time: "DAY 2: 12:00 PM", title: "Famous Lake Tour (Bhimtal & Island)", desc: "Visit Bhimtal Lake, boat to the island aquarium cafe, and enjoy water zorbing." },
            { time: "DAY 2: 03:00 PM", title: "Sattal Kayaking & Pine Forest Walk", desc: "Discover the pristine cluster of 7 interconnected lakes surrounded by dense oak forests." },
            { time: "DAY 2: 05:30 PM", title: "Hanuman Garhi Sunset", desc: "Watch the spectacular mountain sunset near the 70ft Lord Hanuman statue before departure." }
        ]
    },
    3: {
        title: "3-Days Complete Kumaon Explorer",
        meta: "🏔️ The ultimate leisure, nature & adventure getaway",
        timeline: [
            { time: "DAY 1", title: "Complete Nainital Town & Heritage", desc: "Naina Devi Temple, Naini Lake Yachting, Zoo, Cave Gardens, Snow View Point, and Mall Road night walk." },
            { time: "DAY 2", title: "Kainchi Dham & 3-Lakes Adventure Circuit", desc: "Neem Karoli Baba Ashram, Bhimtal Island, Sattal nature kayaking, and tandem paragliding flight in Naukuchiatal." },
            { time: "DAY 3: Morning", title: "Mukteshwar Day Trip (Chauli Ki Jali)", desc: "Scenic 50 km mountain drive through apple orchards to ancient 350-yr Shiva Temple and thrilling cliff views at Chauli Ki Jali." },
            { time: "DAY 3: Afternoon", title: "Pangot Birding Haven & Naina Peak Trek", desc: "Explore the serene bird sanctuary of Pangot or trek to the highest point of Nainital (2,615m)." },
            { time: "DAY 3: Evening", title: "Souvenir Shopping & Departure", desc: "Buy Almora Bal Mithai, fresh fruit jams, and handmade pine cone crafts before heading to Kathgodam." }
        ]
    }
};

/* ================= INITIALIZATION ================= */
document.addEventListener('DOMContentLoaded', () => {
    // Set minimum date for booking to today
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        if (!dateInput.value) dateInput.value = today;
    }

    // Set default time to 09:30 AM
    const timeInput = document.getElementById('bookingTime');
    if (timeInput && !timeInput.value) {
        timeInput.value = "09:30";
    }

    // Check URL parameters for prefill
    const params = new URLSearchParams(window.location.search);
    if (params.has('type')) {
        const type = params.get('type');
        if (type === 'bike' || type === 'car') {
            switchVehicleTab(type);
        }
    }
    if (params.has('dest')) {
        const dest = params.get('dest');
        prefillRideDestination(dest);
    }

    // Load initial itinerary
    loadItinerary(1);

    // Calculate initial fare
    calculateEstimatedFare();

    // Setup active nav scroll spy
    setupScrollSpy();

    // Update floating admin badge & navbar/bottom-bar badges
    updateAdminFloatingBadge();
    updateAllBadges();

    // Initialize Favourites and My Activity
    initFavorites();
    renderFavoritesSection();
    renderUserBookings();

    // Highlight active nav item based on current pathname
    highlightCurrentPageNav();

    // Setup global and mobile search listeners
    setupAppSearch();
});

function highlightCurrentPageNav() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.navbar .nav-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (currentPath === '' && href === 'index.html')) {
            link.classList.add('active');
        } else if (href && !href.startsWith('#') && !href.includes(currentPath)) {
            link.classList.remove('active');
        }
    });
}

/* ================= MOBILE MENU ================= */
function toggleMenu() {
    const navbar = document.getElementById("navbar");
    const backdrop = document.getElementById("drawerBackdrop");
    const menuBtn = document.getElementById("menuToggle");

    if (navbar) navbar.classList.toggle("show");
    if (backdrop) backdrop.classList.toggle("active");

    if (menuBtn && navbar) {
        menuBtn.setAttribute("aria-expanded", navbar.classList.contains("show") ? "true" : "false");
    }
}

function closeMenu() {
    const navbar = document.getElementById("navbar");
    const backdrop = document.getElementById("drawerBackdrop");
    if (navbar) navbar.classList.remove("show");
    if (backdrop) backdrop.classList.remove("active");
}

/* ================= VEHICLE TAB SWITCHING ================= */
function switchVehicleTab(type) {
    currentVehicleType = type;
    const tabCar = document.getElementById("tabCar");
    const tabBike = document.getElementById("tabBike");
    const vehicleSelect = document.getElementById("vehicleModel");
    const passengersLabel = document.getElementById("passengersLabel");
    const passengerSelect = document.getElementById("passengerCount");

    if (type === 'car') {
        if (tabCar) tabCar.classList.add("active");
        if (tabBike) tabBike.classList.remove("active");
        if (passengersLabel) passengersLabel.innerHTML = "👥 Passengers";
        if (passengerSelect) {
            passengerSelect.innerHTML = `
                <option value="1">1 Person</option>
                <option value="2">2 Persons</option>
                <option value="4" selected>4 Persons</option>
                <option value="6">6-7 Persons (SUV)</option>
            `;
        }
    } else {
        if (tabBike) tabBike.classList.add("active");
        if (tabCar) tabCar.classList.remove("active");
        if (passengersLabel) passengersLabel.innerHTML = "🪖 Helmets Needed";
        if (passengerSelect) {
            passengerSelect.innerHTML = `
                <option value="1">1 Helmet (Solo)</option>
                <option value="2" selected>2 Helmets (Duo)</option>
            `;
        }
    }

    // Populate Vehicle Options
    if (vehicleSelect) {
        vehicleSelect.innerHTML = vehicleOptions[type].map(v => 
            `<option value="${v.name}" data-base="${v.base}">${v.text}</option>`
        ).join("");
    }

    calculateEstimatedFare();
}

function selectVehicleType(type) {
    switchVehicleTab(type);
    const bookingSection = document.getElementById("booking");
    if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function selectFleetModel(modelName) {
    let type = 'car';
    if (modelName.includes("Activa") || modelName.includes("Pulsar") || modelName.includes("Enfield") || modelName.includes("Himalayan")) {
        type = 'bike';
    }
    switchVehicleTab(type);

    const vehicleSelect = document.getElementById("vehicleModel");
    if (vehicleSelect) {
        for (let i = 0; i < vehicleSelect.options.length; i++) {
            if (vehicleSelect.options[i].value.includes(modelName) || modelName.includes(vehicleSelect.options[i].value)) {
                vehicleSelect.selectedIndex = i;
                break;
            }
        }
    }

    calculateEstimatedFare();

    const bookingSection = document.getElementById("booking");
    if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
    showToast(`Selected: ${modelName}`, "🚘");
}

/* ================= ESTIMATED FARE CALCULATION ================= */
function calculateEstimatedFare() {
    const vehicleSelect = document.getElementById("vehicleModel");
    const durationSelect = document.getElementById("tourDuration");
    const fareDisplay = document.getElementById("estimatedFareText");

    if (!vehicleSelect || !fareDisplay) return;

    const selectedOpt = vehicleSelect.options[vehicleSelect.selectedIndex];
    const baseRate = selectedOpt ? parseInt(selectedOpt.getAttribute("data-base") || "1800", 10) : 1800;
    const duration = durationSelect ? parseInt(durationSelect.value || "1", 10) : 1;

    let total = baseRate * duration;
    fareDisplay.textContent = `₹${total.toLocaleString('en-IN')}`;
}

/* ================= ADMIN SETTINGS & STORAGE ================= */
function getAdminPhoneNumber() {
    return localStorage.getItem("ntl_admin_phone") || "9456168611";
}

function saveAdminPhoneNumber() {
    const input = document.getElementById("adminPhoneInput");
    if (!input) return;
    const clean = input.value.replace(/\D/g, "");
    if (clean.length === 10) {
        localStorage.setItem("ntl_admin_phone", clean);
        showToast(`WhatsApp phone set to +91 ${clean}`, "✅");
    } else {
        alert("Please enter a valid 10-digit mobile number.");
    }
}

function getAdminEmail() {
    return localStorage.getItem("ntl_admin_email") || "priyanshukumar9916@gmail.com";
}

function saveAdminEmail() {
    const input = document.getElementById("adminEmailInput");
    if (!input) return;
    const email = input.value.trim();
    if (email && email.includes("@")) {
        localStorage.setItem("ntl_admin_email", email);
        showToast(`Notification email saved: ${email}`, "✅");
    } else {
        alert("Please enter a valid email address.");
    }
}

/* ================= AUDIO NOTIFICATION CHIME ================= */
function playBookingChime() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        gain1.gain.setValueAtTime(0.3, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.4);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.15);
        osc2.stop(ctx.currentTime + 0.7);
    } catch (e) {
        console.log("Audio chime error:", e);
    }
}

/* ================= 1-CLICK QUICK WHATSAPP BOOKING ================= */
function quickBookOnWhatsApp() {
    const adminPhone = getAdminPhoneNumber();
    const vehicleSelect = document.getElementById("vehicleModel");
    const vehicle = vehicleSelect ? vehicleSelect.value : (currentVehicleType === 'bike' ? "Royal Enfield / Activa" : "Maruti Dzire / Innova");
    const pickupSelect = document.getElementById("pickupLocation");
    const pickup = (pickupSelect && pickupSelect.value) ? pickupSelect.value : "Nainital (Mallital/Tallital)";
    const destSelect = document.getElementById("dropDestination");
    const destination = (destSelect && destSelect.value) ? destSelect.value : "Sightseeing / Kainchi Dham";
    const dateInput = document.getElementById("bookingDate");
    const date = (dateInput && dateInput.value) ? dateInput.value : new Date().toISOString().split('T')[0];
    const fareText = document.getElementById("estimatedFareText") ? document.getElementById("estimatedFareText").textContent : "₹1,800";

    const waText = `*🚗 QUICK RIDE BOOKING ENQUIRY (FindNainital)*%0A` +
        `----------------------------------------%0A` +
        `🚘 *Vehicle Type:* ${encodeURIComponent(vehicle)} (${currentVehicleType.toUpperCase()})%0A` +
        `📍 *Pickup Point:* ${encodeURIComponent(pickup)}%0A` +
        `🏁 *Destination:* ${encodeURIComponent(destination)}%0A` +
        `📅 *Travel Date:* ${date}%0A` +
        `💰 *Estimated Fare:* ${encodeURIComponent(fareText)}%0A` +
        `----------------------------------------%0A` +
        `_Namaste Priyanshu ji! I want to book this vehicle. Please share driver & availability details._`;

    window.open(`https://wa.me/91${adminPhone}?text=${waText}`, '_blank');
}

/* ================= VEHICLE BOOKING SUBMISSION & BACKEND REST SYNC ================= */
async function handleVehicleBooking(event) {
    event.preventDefault();

    const name = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();
    const email = document.getElementById("customerEmail") ? document.getElementById("customerEmail").value.trim() : "";
    const pickup = document.getElementById("pickupLocation").value;
    const destination = document.getElementById("dropDestination").value;
    const date = document.getElementById("bookingDate").value;
    const time = document.getElementById("bookingTime").value;
    const durationSelect = document.getElementById("tourDuration");
    const durationVal = durationSelect ? parseInt(durationSelect.value, 10) : 1;
    const durationText = durationSelect ? durationSelect.options[durationSelect.selectedIndex].text : "1 Day";
    const vehicle = document.getElementById("vehicleModel").value;
    const passengerSelect = document.getElementById("passengerCount");
    const passengers = passengerSelect ? parseInt(passengerSelect.value, 10) : 1;
    const fareText = document.getElementById("estimatedFareText").textContent;
    const fareNumeric = parseInt(fareText.replace(/[^\d]/g, ""), 10) || 1800;

    let randomId = "NTL-" + new Date().getFullYear() + "-" + Math.floor(10000 + Math.random() * 90000);

    const bookingPayload = {
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
        vehicle_type: currentVehicleType,
        vehicle_model: vehicle,
        pickup_location: pickup,
        drop_destination: destination,
        pickup_date: date,
        pickup_time: time,
        tour_duration: durationVal,
        passengers: passengers,
        estimated_fare: fareNumeric
    };

    // Try posting to Flask REST backend
    let emailStatus = "Dispatched";
    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingPayload)
        });
        if (response.ok) {
            const resData = await response.json();
            if (resData.booking_id) {
                randomId = resData.booking_id;
            }
            if (resData.email_status) {
                emailStatus = resData.email_status;
            }
        }
    } catch (e) {
        console.log("Offline mode or backend API not reachable, saving locally:", e);
    }

    // Save to LocalStorage for offline/instant persistence
    const bookingRecord = {
        id: randomId,
        name,
        phone,
        email,
        pickup,
        destination,
        date,
        time,
        duration: durationText,
        vehicle,
        vehicleType: currentVehicleType,
        fare: fareText,
        status: 'Confirmed',
        createdAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) + ', ' + new Date().toLocaleDateString('en-IN')
    };

    try {
        const pastBookings = JSON.parse(localStorage.getItem("ntl_bookings") || "[]");
        pastBookings.unshift(bookingRecord);
        localStorage.setItem("ntl_bookings", JSON.stringify(pastBookings));
    } catch (e) {
        console.warn("Storage error", e);
    }

    // Play Alert Chime
    playBookingChime();

    // Fill Receipt Modal
    const rId = document.getElementById("receiptBookingId");
    if (rId) rId.textContent = randomId;
    const rName = document.getElementById("receiptName");
    if (rName) rName.textContent = name;
    const rPhone = document.getElementById("receiptPhone");
    if (rPhone) rPhone.textContent = "+91 " + phone;
    const rEmail = document.getElementById("receiptEmail");
    if (rEmail) rEmail.textContent = email || "Not Provided";
    const rVeh = document.getElementById("receiptVehicle");
    if (rVeh) rVeh.textContent = vehicle;
    const rPick = document.getElementById("receiptPickup");
    if (rPick) rPick.textContent = pickup;
    const rDest = document.getElementById("receiptDestination");
    if (rDest) rDest.textContent = destination;
    const rDt = document.getElementById("receiptDateTime");
    if (rDt) rDt.textContent = `${date} at ${time}`;
    const rDur = document.getElementById("receiptDuration");
    if (rDur) rDur.textContent = durationText;
    const rFare = document.getElementById("receiptFare");
    if (rFare) rFare.textContent = fareText;

    const emailStatusBadge = document.getElementById("emailStatusBadge");
    if (emailStatusBadge) {
        emailStatusBadge.textContent = "Dispatched to priyanshukumar9916@gmail.com";
        emailStatusBadge.style.color = "#059669";
    }

    // Build WhatsApp Notification Link for Admin (9456168611)
    const adminPhone = getAdminPhoneNumber();
    const adminEmail = getAdminEmail();
    const waText = `*🚗 NEW RIDE BOOKING CONFIRMED (FindNainital)*%0A` +
        `----------------------------------------%0A` +
        `🆔 *Booking ID:* ${randomId}%0A` +
        `👤 *Customer Name:* ${encodeURIComponent(name)}%0A` +
        `📞 *Contact Phone:* %2B91${phone}%0A` +
        `✉️ *Email:* ${encodeURIComponent(email || 'Not provided')}%0A` +
        `🚘 *Vehicle:* ${encodeURIComponent(vehicle)} (${currentVehicleType.toUpperCase()})%0A` +
        `📍 *Pickup Point:* ${encodeURIComponent(pickup)}%0A` +
        `🏁 *Destination:* ${encodeURIComponent(destination)}%0A` +
        `📅 *Pickup Date:* ${date} at ${time}%0A` +
        `⏳ *Tour Duration:* ${encodeURIComponent(durationText)}%0A` +
        `👥 *Passengers:* ${passengers} Person(s)%0A` +
        `💰 *Estimated Total Fare:* ${encodeURIComponent(fareText)}%0A` +
        `----------------------------------------%0A` +
        `_Please confirm driver assignment and send cab details._`;

    const btnWa = document.getElementById("btnSendWhatsApp");
    if (btnWa) {
        btnWa.href = `https://wa.me/91${adminPhone}?text=${waText}`;
    }

    // Configure fallback Direct Mail link
    const mailSubject = encodeURIComponent(`Ride Booking Confirmation - ${randomId} (${name})`);
    const mailBody = encodeURIComponent(`Namaste Priyanshu,\n\nA new ride booking has been created on FindNainital.\n\nBooking ID: ${randomId}\nCustomer: ${name}\nPhone: +91 ${phone}\nEmail: ${email}\nVehicle: ${vehicle}\nPickup: ${pickup}\nDestination: ${destination}\nDate & Time: ${date} at ${time}\nDuration: ${durationText}\nTotal Fare: ${fareText}\n\nPlease confirm.\n`);
    const btnMail = document.getElementById("btnSendEmailFallback");
    if (btnMail) {
        btnMail.href = `mailto:${adminEmail}?subject=${mailSubject}&body=${mailBody}`;
    }

    // Update floating admin badge
    updateAdminFloatingBadge();

    // Open Confirmation Modal
    const modal = document.getElementById("bookingConfirmationModal");
    if (modal) modal.classList.add("active");

    showToast(`🎉 Ride ${randomId} confirmed! Notifications sent to WhatsApp (+91 ${adminPhone}) & Gmail!`, "🚗");
}

function closeBookingModal(event) {
    const modal = document.getElementById("bookingConfirmationModal");
    if (modal) modal.classList.remove("active");
}

/* ================= CONTACT INQUIRY SUBMIT ================= */
async function handleContactSubmit(event) {
    event.preventDefault();
    const name = document.getElementById("contactName").value.trim();
    const phone = document.getElementById("contactPhone").value.trim();
    const email = document.getElementById("contactEmail") ? document.getElementById("contactEmail").value.trim() : "";
    const subject = document.getElementById("contactSubject") ? document.getElementById("contactSubject").value : "General Inquiry";
    const message = document.getElementById("contactMessage") ? document.getElementById("contactMessage").value.trim() : "";

    const payload = { name, phone, email, subject, message };

    try {
        await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (e) {
        console.log("Local fallback for contact inquiry:", e);
    }

    showToast(`Thank you ${name}! Your inquiry has been sent to our tourist desk.`, "📩");
    event.target.reset();
}

/* ================= ADMIN PORTAL & DASHBOARD ================= */
async function loadAdminDashboardData() {
    let bookings = [];
    let inquiries = [];

    // Try fetching from Flask REST API
    try {
        const res = await fetch('/api/bookings');
        if (res.ok) {
            const data = await res.json();
            bookings = data.data || [];
        }
    } catch (e) {
        console.log("API not reachable, loading from localStorage:", e);
    }

    // Fallback to localStorage if API returned empty
    if (bookings.length === 0) {
        try {
            bookings = JSON.parse(localStorage.getItem("ntl_bookings") || "[]");
        } catch (e) {
            bookings = [];
        }
    }

    // Update stats
    const totalBookingsEl = document.getElementById("statTotalBookings");
    const totalRevenueEl = document.getElementById("statTotalRevenue");
    if (totalBookingsEl) totalBookingsEl.textContent = bookings.length;

    let totalVal = 0;
    bookings.forEach(b => {
        const num = typeof b.estimated_fare === 'number' ? b.estimated_fare : parseInt((b.fare || "").replace(/[^\d]/g, ""), 10) || 1800;
        totalVal += num;
    });
    if (totalRevenueEl) totalRevenueEl.textContent = `₹${totalVal.toLocaleString('en-IN')}`;

    // Render bookings table
    renderAdminTable(bookings);

    // Try fetching inquiries
    try {
        const inqRes = await fetch('/api/contact');
        if (inqRes.ok) {
            const inqData = await inqRes.json();
            inquiries = inqData.data || [];
        }
    } catch (e) {
        console.log("Inquiries API fallback:", e);
    }

    const inqCountEl = document.getElementById("statTotalInquiries");
    if (inqCountEl) inqCountEl.textContent = inquiries.length;
    renderInquiriesTable(inquiries);
}

function renderAdminTable(bookings) {
    const tbody = document.getElementById("adminBookingsTableBody");
    if (!tbody) return;

    if (bookings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 30px; color: #64748b;">No bookings found. Submit a booking from the booking page to see live entries here!</td></tr>`;
        return;
    }

    tbody.innerHTML = bookings.map(b => {
        const id = b.id || "NTL-0000";
        const name = b.customer_name || b.name || "Guest";
        const phone = b.customer_phone || b.phone || "";
        const email = b.customer_email || b.email || "";
        const vehicle = b.vehicle_model || b.vehicle || "Cab";
        const pickup = b.pickup_location || b.pickup || "Mallital";
        const drop = b.drop_destination || b.destination || "Local Sightseeing";
        const date = b.pickup_date || b.date || "";
        const time = b.pickup_time || b.time || "";
        const status = b.status || "Confirmed";
        const fare = b.estimated_fare ? `₹${b.estimated_fare.toLocaleString('en-IN')}` : (b.fare || "₹1,800");

        return `
            <tr>
                <td><strong style="color: #0d3b32;">${id}</strong></td>
                <td>
                    <strong>${name}</strong><br>
                    <small>📞 <a href="tel:${phone}" style="color: #0284c7;">+91 ${phone}</a></small>
                    ${email ? `<br><small style="color: #64748b;">✉️ ${email}</small>` : ''}
                </td>
                <td>
                    <span style="font-weight: 600;">${vehicle}</span><br>
                    <small style="color: #64748b;">📍 ${pickup} ➔ 🏁 ${drop}</small>
                </td>
                <td>
                    <span>📅 ${date}</span><br>
                    <small style="color: #64748b;">⏰ ${time}</small>
                </td>
                <td><strong style="color: #15803d;">${fare}</strong></td>
                <td>
                    <span class="status-badge ${status.replace(/\s+/g, '')}" onclick="toggleStatusAdmin('${id}', '${status}')" title="Click to cycle status">
                        ● ${status} ▾
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 6px;">
                        <a href="https://wa.me/91${phone}?text=Namaste%20${encodeURIComponent(name)}!%20Your%20FindNainital%20booking%20(${id})%20is%20confirmed." target="_blank" style="background: #25d366; color: white; padding: 6px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 700;" title="WhatsApp Customer">💬</a>
                        <button onclick="deleteAdminBooking('${id}')" style="background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 0.8rem;" title="Delete Booking">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function renderInquiriesTable(inquiries) {
    const tbody = document.getElementById("adminInquiriesTableBody");
    if (!tbody) return;

    if (inquiries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #64748b;">No recent inquiries submitted.</td></tr>`;
        return;
    }

    tbody.innerHTML = inquiries.map(i => `
        <tr>
            <td>#${i.id}</td>
            <td>
                <strong>${i.name}</strong><br>
                <small>📞 <a href="tel:${i.phone}" style="color: #0284c7;">+91 ${i.phone}</a></small>
            </td>
            <td><span style="font-weight: 600; color: #334155;">${i.subject || 'General'}</span></td>
            <td><p style="margin: 0; font-size: 0.85rem; max-width: 320px;">${i.message}</p></td>
            <td><small style="color: #64748b;">${i.created_at}</small></td>
            <td>
                <a href="https://wa.me/91${i.phone}?text=Namaste%20${encodeURIComponent(i.name)}!%20Replying%20to%20your%20FindNainital%20inquiry." target="_blank" style="background: #0284c7; color: white; padding: 5px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 600;">Reply</a>
            </td>
        </tr>
    `).join("");
}

async function toggleStatusAdmin(id, currentStatus) {
    const statuses = ["Confirmed", "In Progress", "Completed", "Cancelled", "Pending"];
    let nextIdx = (statuses.indexOf(currentStatus) + 1) % statuses.length;
    let nextStatus = statuses[nextIdx];

    try {
        await fetch(`/api/bookings/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nextStatus })
        });
    } catch (e) {
        console.log("Status updated locally:", e);
    }

    // Update in localStorage
    try {
        let bookings = JSON.parse(localStorage.getItem("ntl_bookings") || "[]");
        bookings = bookings.map(b => {
            if (b.id === id) b.status = nextStatus;
            return b;
        });
        localStorage.setItem("ntl_bookings", JSON.stringify(bookings));
    } catch (e) {}

    showToast(`Booking ${id} status: ${nextStatus}`, "✓");
    loadAdminDashboardData();
}

async function deleteAdminBooking(id) {
    if (!confirm(`Are you sure you want to delete booking ${id}?`)) return;

    try {
        await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
    } catch (e) {
        console.log("Deleted locally:", e);
    }

    try {
        let bookings = JSON.parse(localStorage.getItem("ntl_bookings") || "[]");
        bookings = bookings.filter(b => b.id !== id);
        localStorage.setItem("ntl_bookings", JSON.stringify(bookings));
    } catch (e) {}

    showToast(`Booking ${id} deleted.`, "🗑️");
    loadAdminDashboardData();
}

function filterAdminTable(status) {
    const buttons = document.querySelectorAll(".filter-btn");
    buttons.forEach(btn => btn.classList.remove("active"));
    if (event && event.target) event.target.classList.add("active");

    const rows = document.querySelectorAll("#adminBookingsTableBody tr");
    rows.forEach(row => {
        if (status === 'all') {
            row.style.display = "";
        } else {
            const badge = row.querySelector(".status-badge");
            if (badge && badge.textContent.includes(status)) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        }
    });
}

function handleAdminSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    const rows = document.querySelectorAll("#adminBookingsTableBody tr");
    rows.forEach(row => {
        if (row.textContent.toLowerCase().includes(query)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}

function exportBookingsCSV() {
    let bookings = [];
    try {
        bookings = JSON.parse(localStorage.getItem("ntl_bookings") || "[]");
    } catch (e) {
        bookings = [];
    }

    if (bookings.length === 0) {
        alert("No bookings available to export.");
        return;
    }

    let csv = "Booking ID,Customer Name,Phone,Email,Vehicle,Pickup,Drop,Date,Time,Fare,Status,Created At\n";
    bookings.forEach(b => {
        csv += `"${b.id}","${b.name || ''}","${b.phone || ''}","${b.email || ''}","${b.vehicle || ''}","${b.pickup || ''}","${b.destination || ''}","${b.date || ''}","${b.time || ''}","${b.fare || ''}","${b.status || ''}","${b.createdAt || ''}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `FindNainital_Bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Bookings exported to CSV!", "📥");
}

function updateAdminFloatingBadge() {
    const badge = document.getElementById("floatingBookingBadge");
    if (!badge) return;
    try {
        const bookings = JSON.parse(localStorage.getItem("ntl_bookings") || "[]");
        badge.textContent = bookings.length;
    } catch (e) {
        badge.textContent = "0";
    }
}

/* ================= LIVE GPS MAP MODAL ================= */
function openMapModal(placeName, lat, lng, address) {
    currentTrackedPlace = {
        name: placeName,
        lat: lat,
        lng: lng,
        address: address || `${placeName}, Nainital, Uttarakhand`
    };

    const titleEl = document.getElementById("modalPlaceTitle");
    const addrEl = document.getElementById("modalPlaceAddress");
    const coordsEl = document.getElementById("modalCoordinatesText");
    const frameHolder = document.getElementById("modalMapFrameHolder");
    const gmapsBtn = document.getElementById("modalGmapsBtn");

    if (titleEl) titleEl.textContent = `📍 ${placeName}`;
    if (addrEl) addrEl.textContent = currentTrackedPlace.address;
    if (coordsEl) coordsEl.textContent = `${lat}° N, ${lng}° E`;

    if (frameHolder) {
        frameHolder.innerHTML = `<iframe src="https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=15&output=embed" width="100%" height="280" style="border:0; border-radius:10px;" allowfullscreen="" loading="lazy"></iframe>`;
    }

    if (gmapsBtn) {
        gmapsBtn.dataset.url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(placeName)}`;
    }

    const modal = document.getElementById("mapModalBackdrop") || document.getElementById("mapModal");
    if (modal) modal.classList.add("active");
}

function closeMapModal(event) {
    const modal = document.getElementById("mapModalBackdrop") || document.getElementById("mapModal");
    if (modal) modal.classList.remove("active");
}

function bookCabFromModal() {
    closeMapModal();
    window.location.href = `booking.html?dest=${encodeURIComponent(currentTrackedPlace.name)}`;
}

function prefillRideDestination(placeName) {
    const dropSelect = document.getElementById("dropDestination");
    if (dropSelect) {
        let found = false;
        for (let i = 0; i < dropSelect.options.length; i++) {
            if (dropSelect.options[i].value.toLowerCase().includes(placeName.toLowerCase())) {
                dropSelect.selectedIndex = i;
                found = true;
                break;
            }
        }
        if (!found) {
            // Select nearest matching option or default
            dropSelect.selectedIndex = 1;
        }
        calculateEstimatedFare();
    }
}

/* ================= LIVE GPS TRACKER PAGE SWITCHER ================= */
const liveTrackerTelemetry = {
    'naini-lake': { name: "Naini Lake (Nainital Jheel)", sub: "Mallital/Tallital, Nainital, Uttarakhand 263002", lat: "29.3803° N", lng: "79.4636° E", alt: "2,084 Meters", dist: "0.0 km (Center)", rawLat: 29.3803, rawLng: 79.4636 },
    'snow-view': { name: "Snow View Point", sub: "Mallital Range, Nainital, Uttarakhand 263001", lat: "29.3970° N", lng: "79.4580° E", alt: "2,270 Meters", dist: "3.0 km (Ropeway 3 Mins)", rawLat: 29.3970, rawLng: 79.4580 },
    'kainchi-dham': { name: "Kainchi Dham (Neem Karoli Ashram)", sub: "Bhowali-Almora Highway, Uttarakhand 263132", lat: "29.4237° N", lng: "79.5167° E", alt: "1,400 Meters", dist: "17.0 km from Nainital", rawLat: 29.4237, rawLng: 79.5167 },
    'eco-caves': { name: "Eco Cave Gardens", sub: "Sukhatal, Mallital, Nainital 263001", lat: "29.3900° N", lng: "79.4480° E", alt: "2,100 Meters", dist: "1.8 km from Flatts", rawLat: 29.3900, rawLng: 79.4480 },
    'tiffin-top': { name: "Tiffin Top (Dorothy's Seat)", sub: "Ayarpatta Hill, Nainital 263002", lat: "29.3800° N", lng: "79.4440° E", alt: "2,292 Meters", dist: "4.0 km Forest Trek", rawLat: 29.3800, rawLng: 79.4440 },
    'zoo': { name: "High Altitude Himalayan Zoo", sub: "Tallital Hill, Nainital 263002", lat: "29.3880° N", lng: "79.4710° E", alt: "2,100 Meters", dist: "2.0 km from Tallital", rawLat: 29.3880, rawLng: 79.4710 },
    'bhimtal': { name: "Bhimtal Lake & Island", sub: "Bhimtal, Nainital District 263136", lat: "29.3480° N", lng: "79.5540° E", alt: "1,370 Meters", dist: "22.0 km from Nainital", rawLat: 29.3480, rawLng: 79.5540 },
    'pangot': { name: "Pangot & Kilbury Bird Sanctuary", sub: "Pangot, Nainital 263001", lat: "29.4280° N", lng: "79.4210° E", alt: "2,150 Meters", dist: "15.0 km from Mallital", rawLat: 29.4280, rawLng: 79.4210 }
};

let currentLiveKey = 'naini-lake';

function switchLiveTrackPlace(key) {
    const data = liveTrackerTelemetry[key];
    if (!data) return;
    currentLiveKey = key;

    // Highlight button
    const buttons = document.querySelectorAll(".track-btn");
    buttons.forEach(btn => {
        btn.classList.remove("active");
        btn.style.border = "1px solid #e2e8f0";
        btn.style.background = "#f8fafc";
    });
    if (event && event.currentTarget) {
        event.currentTarget.classList.add("active");
        event.currentTarget.style.border = "1px solid #0284c7";
        event.currentTarget.style.background = "#e0f2fe";
    }

    // Update Telemetry Elements
    const heading = document.getElementById("livePlaceHeading");
    const sub = document.getElementById("livePlaceSub");
    const lat = document.getElementById("liveLat");
    const lng = document.getElementById("liveLng");
    const alt = document.getElementById("liveAlt");
    const dist = document.getElementById("liveDist");
    const iframe = document.getElementById("liveMapIframe");

    if (heading) heading.textContent = data.name;
    if (sub) sub.textContent = data.sub;
    if (lat) lat.textContent = data.lat;
    if (lng) lng.textContent = data.lng;
    if (alt) alt.textContent = data.alt;
    if (dist) dist.textContent = data.dist;
    if (iframe) iframe.src = `https://maps.google.com/maps?q=${data.rawLat},${data.rawLng}&hl=en&z=15&output=embed`;

    showToast(`GPS Telemetry locked: ${data.name}`, "🧭");
}

function openSelectedInGoogleMaps() {
    const data = liveTrackerTelemetry[currentLiveKey] || liveTrackerTelemetry['naini-lake'];
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${data.rawLat},${data.rawLng}&destination_place_id=${encodeURIComponent(data.name)}`, '_blank');
}

/* ================= FILTERING FOR PLACES & HOTELS ================= */
function filterPlaces(category) {
    const buttons = document.querySelectorAll(".place-filters .filter-btn");
    buttons.forEach(btn => btn.classList.remove("active"));
    if (event && event.target) event.target.classList.add("active");

    const cards = document.querySelectorAll("#placesGrid .place-card");
    cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
}

function filterHotels(category) {
    const buttons = document.querySelectorAll(".place-filters .filter-btn");
    buttons.forEach(btn => btn.classList.remove("active"));
    if (event && event.target) event.target.classList.add("active");

    const cards = document.querySelectorAll("#hotelsGrid .place-card");
    cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
}

/* ================= ITINERARY LOADER ================= */
function loadItinerary(days) {
    const titleEl = document.getElementById("itinTitle");
    const metaEl = document.getElementById("itinMeta");
    const timelineEl = document.getElementById("itinTimeline");
    const tab1 = document.getElementById("tabItin1");
    const tab2 = document.getElementById("tabItin2");
    const tab3 = document.getElementById("tabItin3");

    [tab1, tab2, tab3].forEach((t, i) => {
        if (t) {
            if (i + 1 === days) {
                t.classList.add("active");
                t.style.background = "#7c3aed";
                t.style.color = "white";
                t.style.borderColor = "#7c3aed";
            } else {
                t.classList.remove("active");
                t.style.background = "white";
                t.style.color = "#334155";
                t.style.borderColor = "#cbd5e1";
            }
        }
    });

    const data = itineraryData[days];
    if (!data) return;

    if (titleEl) titleEl.textContent = data.title;
    if (metaEl) metaEl.textContent = data.meta;

    if (timelineEl) {
        timelineEl.innerHTML = data.timeline.map((step, idx) => `
            <div style="position: relative; margin-bottom: 25px;">
                <div style="position: absolute; left: -39px; top: 0; width: 18px; height: 18px; border-radius: 50%; background: #7c3aed; border: 3px solid white; box-shadow: 0 0 0 2px #7c3aed;"></div>
                <span style="font-size: 0.82rem; font-weight: 700; color: #7c3aed; text-transform: uppercase;">${step.time}</span>
                <h4 style="color: var(--primary-dark); font-size: 1.15rem; margin: 4px 0 6px;">${step.title}</h4>
                <p style="color: var(--text-sub); font-size: 0.92rem; margin: 0;">${step.desc}</p>
            </div>
        `).join("");
    }
}

/* ================= GLOBAL SEARCH ================= */
function handleGlobalSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    if (!query) return;

    // Search on current page or redirect to places if on home
    const cards = document.querySelectorAll(".place-card");
    if (cards.length > 0) {
        cards.forEach(card => {
            if (card.textContent.toLowerCase().includes(query)) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }
        });
    }
}

function quickSearchPlace(placeName) {
    const heroInput = document.getElementById("heroSearch");
    if (heroInput) heroInput.value = placeName;
    searchPlaces();
}

function searchPlaces() {
    const query = (document.getElementById("heroSearch")?.value || "").toLowerCase().trim();
    if (!query) return;
    window.location.href = `places.html?search=${encodeURIComponent(query)}`;
}

/* ================= HOTEL INQUIRY & RESERVATION MODAL ================= */

function inquireHotel(hotelName, phone, defaultPrice = 2500) {
    openHotelInquiryModal(hotelName, phone, defaultPrice);
}

function openHotelInquiryModal(hotelName, phone, defaultPrice = 2500) {
    let modal = document.getElementById("hotelInquiryModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "hotelInquiryModal";
        modal.className = "modal-backdrop";
        modal.onclick = (e) => { if (e.target === modal) closeHotelModal(); };
        modal.innerHTML = `
            <div class="modal-container profile-modal-card" onclick="event.stopPropagation()">
                <div class="profile-card-header" style="background: linear-gradient(135deg, #1e3a8a, #2563eb);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h3 id="hotelModalTitle">🏨 Hotel Inquiry & Booking</h3>
                            <p id="hotelModalSubtitle" style="color: #bfdbfe; font-size: 0.8rem;">Direct verified booking & owner dispatch</p>
                        </div>
                        <button class="btn-close-modal" onclick="closeHotelModal()" style="color: white; background: none; border: none; font-size: 1.4rem; cursor: pointer;">&times;</button>
                    </div>
                </div>
                <div class="profile-body-content">
                    <form id="hotelInquiryForm" onsubmit="handleHotelInquirySubmit(event)">
                        <input type="hidden" id="hotelFormName" value="">
                        <input type="hidden" id="hotelFormPhone" value="">
                        <div class="compact-form-group" style="margin-bottom: 10px;">
                            <label style="font-size: 0.78rem; font-weight: 700;">👤 Guest Name</label>
                            <input type="text" id="hotelGuestName" placeholder="Enter Full Name" required class="admin-input-phone" style="width: 100%;">
                        </div>
                        <div class="compact-form-grid two-cols" style="gap: 10px; margin-bottom: 10px;">
                            <div class="compact-form-group">
                                <label style="font-size: 0.78rem; font-weight: 700;">📞 Mobile Number</label>
                                <input type="tel" id="hotelGuestPhone" placeholder="10-digit number" required class="admin-input-phone" style="width: 100%;">
                            </div>
                            <div class="compact-form-group">
                                <label style="font-size: 0.78rem; font-weight: 700;">✉️ Email (Optional)</label>
                                <input type="email" id="hotelGuestEmail" placeholder="you@gmail.com" class="admin-input-phone" style="width: 100%;">
                            </div>
                        </div>
                        <div class="compact-form-grid two-cols" style="gap: 10px; margin-bottom: 12px;">
                            <div class="compact-form-group">
                                <label style="font-size: 0.78rem; font-weight: 700;">📅 Check-in Date</label>
                                <input type="date" id="hotelCheckinDate" class="admin-input-phone" style="width: 100%;" required>
                            </div>
                            <div class="compact-form-group">
                                <label style="font-size: 0.78rem; font-weight: 700;">🌙 Nights & Guests</label>
                                <select id="hotelStayDuration" class="admin-input-phone" style="width: 100%;">
                                    <option value="1">1 Night (2 Guests)</option>
                                    <option value="2" selected>2 Nights (2 Guests)</option>
                                    <option value="3">3 Nights (Family - 4 Guests)</option>
                                    <option value="5">5 Nights (Extended Stay)</option>
                                </select>
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button type="submit" class="btn-primary" style="flex: 2; padding: 10px; font-weight: 700; background: #1e40af; border-radius: 8px; border: none; color: white; cursor: pointer;">
                                📩 Send Booking Inquiry
                            </button>
                            <a id="hotelModalDirectCall" href="tel:+919456168611" class="btn-hub-secondary" style="flex: 1; display: flex; align-items: center; justify-content: center; text-decoration: none;">
                                📞 Call Now
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById("hotelFormName").value = hotelName;
    document.getElementById("hotelFormPhone").value = phone || "+919456168611";
    document.getElementById("hotelModalTitle").textContent = `🏨 ${hotelName}`;
    document.getElementById("hotelModalSubtitle").textContent = `Direct verified booking • ${phone || '+91 9456168611'}`;
    document.getElementById("hotelModalDirectCall").href = `tel:${(phone || '9456168611').replace(/\s+/g, '')}`;
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = document.getElementById("hotelCheckinDate");
    if (dateInput) dateInput.value = tomorrow.toISOString().split('T')[0];

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeHotelModal() {
    const modal = document.getElementById("hotelInquiryModal");
    if (modal) modal.classList.remove("active");
    document.body.style.overflow = "";
}

async function handleHotelInquirySubmit(e) {
    e.preventDefault();
    const hotelName = document.getElementById("hotelFormName").value;
    const phone = document.getElementById("hotelFormPhone").value;
    const guestName = document.getElementById("hotelGuestName").value.trim();
    const guestPhone = document.getElementById("hotelGuestPhone").value.trim();
    const guestEmail = document.getElementById("hotelGuestEmail").value.trim();
    const checkinDate = document.getElementById("hotelCheckinDate").value;
    const nights = parseInt(document.getElementById("hotelStayDuration").value || "2");

    const payload = {
        hotel_name: hotelName,
        guest_name: guestName,
        guest_phone: guestPhone,
        guest_email: guestEmail,
        checkin_date: checkinDate,
        nights: nights,
        guests: nights > 2 ? 4 : 2
    };

    try {
        const res = await fetch(`${API_BASE}/api/hotel-inquiries`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        closeHotelModal();
        showToast(`Inquiry for ${hotelName} submitted successfully! Ref #${result.inquiry_id || 'OK'}`, "✅");

        setTimeout(() => {
            if (confirm(`Inquiry sent! Would you like to chat with the desk on WhatsApp (+91 9456168611)?`)) {
                window.open(`https://wa.me/919456168611?text=Namaste!%20I%20have%20inquired%20for%20${encodeURIComponent(hotelName)}%20for%20${nights}%20night(s)%20starting%20${checkinDate}.%20My%20name%20is%20${encodeURIComponent(guestName)}.`, '_blank');
            }
        }, 400);
    } catch (err) {
        closeHotelModal();
        showToast(`Inquiry registered! Dialing front desk...`, "📞");
        window.location.href = `tel:${(phone || '9456168611').replace(/\s+/g, '')}`;
    }
}

/* ================= ACTIVITY & BOATING BOOKING MODAL ================= */

function openActivityBookingModal(activityName, estimatedFare = 420) {
    let modal = document.getElementById("activityBookingModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "activityBookingModal";
        modal.className = "modal-backdrop";
        modal.onclick = (e) => { if (e.target === modal) closeActivityModal(); };
        modal.innerHTML = `
            <div class="modal-container profile-modal-card" onclick="event.stopPropagation()">
                <div class="profile-card-header" style="background: linear-gradient(135deg, #0891b2, #06b6d4);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h3 id="activityModalTitle">🚣 Boating & Activity Booking</h3>
                            <p style="color: #cffafe; font-size: 0.8rem;">Official municipal rate reservation</p>
                        </div>
                        <button class="btn-close-modal" onclick="closeActivityModal()" style="color: white; background: none; border: none; font-size: 1.4rem; cursor: pointer;">&times;</button>
                    </div>
                </div>
                <div class="profile-body-content">
                    <form id="activityBookingForm" onsubmit="handleActivityBookingSubmit(event)">
                        <input type="hidden" id="actFormName" value="">
                        <input type="hidden" id="actFormFare" value="">
                        <div class="compact-form-group" style="margin-bottom: 10px;">
                            <label style="font-size: 0.78rem; font-weight: 700;">👤 Full Name</label>
                            <input type="text" id="actCustomerName" placeholder="Enter Your Name" required class="admin-input-phone" style="width: 100%;">
                        </div>
                        <div class="compact-form-grid two-cols" style="gap: 10px; margin-bottom: 10px;">
                            <div class="compact-form-group">
                                <label style="font-size: 0.78rem; font-weight: 700;">📞 Mobile Number</label>
                                <input type="tel" id="actCustomerPhone" placeholder="10-digit number" required class="admin-input-phone" style="width: 100%;">
                            </div>
                            <div class="compact-form-group">
                                <label style="font-size: 0.78rem; font-weight: 700;">👥 Participants</label>
                                <select id="actParticipants" class="admin-input-phone" style="width: 100%;">
                                    <option value="1">1 Person</option>
                                    <option value="2" selected>2 Persons</option>
                                    <option value="4">4 Persons (Family)</option>
                                </select>
                            </div>
                        </div>
                        <div class="compact-form-grid two-cols" style="gap: 10px; margin-bottom: 12px;">
                            <div class="compact-form-group">
                                <label style="font-size: 0.78rem; font-weight: 700;">📅 Date</label>
                                <input type="date" id="actBookingDate" class="admin-input-phone" style="width: 100%;" required>
                            </div>
                            <div class="compact-form-group">
                                <label style="font-size: 0.78rem; font-weight: 700;">⏰ Preferred Time</label>
                                <select id="actTimeSlot" class="admin-input-phone" style="width: 100%;">
                                    <option value="09:00 AM">09:00 AM (Morning Calm)</option>
                                    <option value="11:30 AM">11:30 AM (Sunny Walk)</option>
                                    <option value="04:00 PM" selected>04:00 PM (Sunset Hour)</option>
                                </select>
                            </div>
                        </div>
                        <div style="background: #ecfeff; border: 1px solid #a5f3fc; border-radius: 8px; padding: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.8rem; font-weight: 600; color: #0e7490;">Estimated Fee:</span>
                            <span id="actFareLabel" style="font-size: 1.1rem; font-weight: 800; color: #0891b2;">₹420</span>
                        </div>
                        <button type="submit" class="btn-primary" style="width: 100%; padding: 10px; font-weight: 700; background: #0891b2; border-radius: 8px; border: none; color: white; cursor: pointer;">
                            🚣 Confirm Activity Booking
                        </button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById("actFormName").value = activityName;
    document.getElementById("actFormFare").value = estimatedFare;
    document.getElementById("activityModalTitle").textContent = `🚣 ${activityName}`;
    document.getElementById("actFareLabel").textContent = `₹${estimatedFare}`;

    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById("actBookingDate");
    if (dateInput) dateInput.value = today;

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeActivityModal() {
    const modal = document.getElementById("activityBookingModal");
    if (modal) modal.classList.remove("active");
    document.body.style.overflow = "";
}

async function handleActivityBookingSubmit(e) {
    e.preventDefault();
    const activityName = document.getElementById("actFormName").value;
    const fare = parseFloat(document.getElementById("actFormFare").value || 420);
    const customerName = document.getElementById("actCustomerName").value.trim();
    const customerPhone = document.getElementById("actCustomerPhone").value.trim();
    const bookingDate = document.getElementById("actBookingDate").value;
    const timeSlot = document.getElementById("actTimeSlot").value;
    const participants = parseInt(document.getElementById("actParticipants").value || 2);

    const payload = {
        activity_name: activityName,
        customer_name: customerName,
        customer_phone: customerPhone,
        booking_date: bookingDate,
        time_slot: timeSlot,
        participants: participants,
        estimated_fare: fare
    };

    try {
        const res = await fetch(`${API_BASE}/api/activities/book`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        closeActivityModal();
        showToast(`Activity '${activityName}' confirmed! Reference: ${result.booking_id}`, "🎉");

        setTimeout(() => {
            if (confirm(`Activity booked! Voucher: ${result.booking_id}. Open WhatsApp for instant dock instructions?`)) {
                window.open(`https://wa.me/919456168611?text=Namaste!%20I%20have%20booked%20${encodeURIComponent(activityName)}%20(Voucher:%20${result.booking_id})%20for%20${bookingDate}%20at%20${encodeURIComponent(timeSlot)}.`, '_blank');
            }
        }, 500);
    } catch (err) {
        closeActivityModal();
        showToast("Activity reservation saved!", "✅");
    }
}

/* ================= TOAST NOTIFICATION SYSTEM ================= */
let toastTimeout;
function showToast(message, icon = "ℹ️") {
    let toast = document.getElementById("toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        toast.className = "toast-popup";
        toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-text" id="toastMessage">${message}</span>`;
        document.body.appendChild(toast);
    }

    const toastMsg = document.getElementById("toastMessage");
    const toastIcon = toast.querySelector(".toast-icon");

    if (toastIcon) toastIcon.textContent = icon;
    if (toastMsg) toastMsg.textContent = message;

    toast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 4000);
}

function setupScrollSpy() {
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".navbar .nav-link");

    window.addEventListener("scroll", () => {
        let currentSectionId = "";
        const scrollPosition = window.scrollY + 200;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute("id");
            }
        });

        if (currentSectionId) {
            navLinks.forEach(link => {
                if (link.getAttribute("href") === `#${currentSectionId}`) {
                    link.classList.add("active");
                }
            });
        }
    });
}

/* ================= FAVOURITES / WISHLIST SYSTEM ================= */
function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem("ntl_favourites") || "[]");
    } catch (e) {
        return [];
    }
}

function saveFavorites(list) {
    try {
        localStorage.setItem("ntl_favourites", JSON.stringify(list));
        updateAllBadges();
        renderFavoritesSection();
    } catch (e) {
        console.warn("Error saving favourites:", e);
    }
}

function isFavorite(placeId) {
    const list = getFavorites();
    return list.some(item => item.id === placeId);
}

function toggleFavorite(placeId, name, image, category, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    let list = getFavorites();
    const index = list.findIndex(item => item.id === placeId);
    let added = false;

    if (index > -1) {
        list.splice(index, 1);
        added = false;
        showToast(`Removed "${name}" from Favourites`, "🤍");
    } else {
        list.unshift({
            id: placeId,
            name: name,
            image: image,
            category: category || "Destination",
            addedAt: new Date().toLocaleDateString('en-IN')
        });
        added = true;
        showToast(`Added "${name}" to Favourites!`, "❤️");
    }

    saveFavorites(list);

    // Update heart icons across the UI
    const heartButtons = document.querySelectorAll(`[data-fav-id="${placeId}"]`);
    heartButtons.forEach(btn => {
        if (added) {
            btn.classList.add("active");
            btn.innerHTML = "❤️";
            btn.setAttribute("aria-label", "Remove from Favourites");
        } else {
            btn.classList.remove("active");
            btn.innerHTML = "🤍";
            btn.setAttribute("aria-label", "Add to Favourites");
        }
    });
}

function removeFavorite(placeId) {
    let list = getFavorites();
    list = list.filter(item => item.id !== placeId);
    saveFavorites(list);

    const heartButtons = document.querySelectorAll(`[data-fav-id="${placeId}"]`);
    heartButtons.forEach(btn => {
        btn.classList.remove("active");
        btn.innerHTML = "🤍";
    });
    showToast("Removed from favourites", "🤍");
}

function initFavorites() {
    const list = getFavorites();
    const ids = new Set(list.map(item => item.id));

    // Update all heart buttons on page
    document.querySelectorAll("[data-fav-id]").forEach(btn => {
        const id = btn.getAttribute("data-fav-id");
        if (ids.has(id)) {
            btn.classList.add("active");
            btn.innerHTML = "❤️";
        } else {
            btn.classList.remove("active");
            btn.innerHTML = "🤍";
        }
    });
}

function updateAllBadges() {
    const favs = getFavorites();
    const favCount = favs.length;

    let bookings = [];
    try {
        bookings = JSON.parse(localStorage.getItem("ntl_bookings") || "[]");
    } catch (e) {
        bookings = [];
    }
    const bookingCount = bookings.length;

    // Header Badges
    const headerFavBadge = document.getElementById("headerFavBadge");
    if (headerFavBadge) {
        headerFavBadge.textContent = favCount;
        headerFavBadge.style.display = favCount > 0 ? "flex" : "none";
    }

    const headerBookingBadge = document.getElementById("headerBookingBadge");
    if (headerBookingBadge) {
        headerBookingBadge.textContent = bookingCount;
        headerBookingBadge.style.display = bookingCount > 0 ? "flex" : "none";
    }

    // Mobile Bottom Bar Badges
    const mobileFavBadge = document.getElementById("mobileFavBadge");
    if (mobileFavBadge) {
        mobileFavBadge.textContent = favCount;
        mobileFavBadge.style.display = favCount > 0 ? "inline-flex" : "none";
    }

    const mobileBookingBadge = document.getElementById("mobileBookingBadge");
    if (mobileBookingBadge) {
        mobileBookingBadge.textContent = bookingCount;
        mobileBookingBadge.style.display = bookingCount > 0 ? "inline-flex" : "none";
    }

    // Section M Tab Badges
    const tabFavCount = document.getElementById("tabFavCount");
    if (tabFavCount) tabFavCount.textContent = favCount;

    const tabBookingCount = document.getElementById("tabBookingCount");
    if (tabBookingCount) tabBookingCount.textContent = bookingCount;
}

function renderFavoritesSection() {
    const container = document.getElementById("favoritesListContainer");
    if (!container) return;

    const favs = getFavorites();
    if (favs.length === 0) {
        container.innerHTML = `
            <div class="empty-state-card">
                <span class="empty-state-icon">🤍</span>
                <h4>No Favourites Saved Yet</h4>
                <p>Tap the heart icon on any destination or hotel card to save it for your upcoming Nainital trip!</p>
                <a href="#places" class="btn-primary-compact">Explore Places →</a>
            </div>
        `;
        return;
    }

    container.innerHTML = favs.map(item => `
        <div class="fav-item-card">
            <div class="fav-item-img-wrapper">
                <img src="${item.image}" alt="${item.name}" loading="lazy">
                <span class="fav-item-cat">${item.category}</span>
            </div>
            <div class="fav-item-info">
                <h4>${item.name}</h4>
                <div class="fav-item-actions">
                    <button class="btn-fav-track" onclick="prefillRideDestination('${item.name.replace(/'/g, "\\'")}')">
                        🚗 Book Cab
                    </button>
                    <button class="btn-fav-remove" onclick="removeFavorite('${item.id}')" title="Remove">
                        🗑️ Remove
                    </button>
                </div>
            </div>
        </div>
    `).join("");
}

function renderUserBookings() {
    const container = document.getElementById("userBookingsContainer");
    if (!container) return;

    let bookings = [];
    try {
        bookings = JSON.parse(localStorage.getItem("ntl_bookings") || "[]");
    } catch (e) {
        bookings = [];
    }

    if (bookings.length === 0) {
        container.innerHTML = `
            <div class="empty-state-card">
                <span class="empty-state-icon">🚗</span>
                <h4>No Rides Booked Yet</h4>
                <p>Reserve a taxi, sedan, SUV or hill cruiser bike in 1-click with transparent mountain fares.</p>
                <a href="#booking" class="btn-primary-compact">Book a Ride Now →</a>
            </div>
        `;
        return;
    }

    const adminPhone = getAdminPhoneNumber();

    container.innerHTML = bookings.slice(0, 8).map(b => {
        const fare = b.fare || (b.estimated_fare ? `₹${b.estimated_fare.toLocaleString('en-IN')}` : "₹1,800");
        const statusClass = (b.status || "Confirmed").toLowerCase().replace(/\s+/g, '-');
        return `
            <div class="user-booking-card">
                <div class="booking-card-head">
                    <div>
                        <span class="booking-id-tag">${b.id}</span>
                        <h4 class="booking-vehicle-title">${b.vehicle || b.vehicle_model || 'Hill Cab'}</h4>
                    </div>
                    <span class="booking-status-tag ${statusClass}">● ${b.status || 'Confirmed'}</span>
                </div>
                <div class="booking-route-summary">
                    <div class="route-point">
                        <span class="dot green"></span>
                        <span>📍 ${b.pickup || b.pickup_location || 'Mallital'}</span>
                    </div>
                    <div class="route-point">
                        <span class="dot orange"></span>
                        <span>🏁 ${b.destination || b.drop_destination || 'Local Sightseeing'}</span>
                    </div>
                </div>
                <div class="booking-card-meta">
                    <span>📅 ${b.date || b.pickup_date || ''} at ${b.time || b.pickup_time || ''}</span>
                    <strong class="booking-fare-val">${fare}</strong>
                </div>
                <div class="booking-card-foot">
                    <a href="https://wa.me/91${adminPhone}?text=Namaste%20Priyanshu%20ji!%20Checking%20status%20for%20booking%20${b.id}." target="_blank" class="btn-booking-wa">
                        💬 WhatsApp Driver
                    </a>
                    <button class="btn-booking-details" onclick="openAdminModal()">
                        📋 View Voucher
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

function switchMyActivityTab(tabName) {
    const tabFav = document.getElementById("tabBtnFav");
    const tabBook = document.getElementById("tabBtnBook");
    const favSection = document.getElementById("favoritesTabContent");
    const bookSection = document.getElementById("bookingsTabContent");

    if (tabName === 'favourites') {
        if (tabFav) tabFav.classList.add("active");
        if (tabBook) tabBook.classList.remove("active");
        if (favSection) favSection.style.display = "block";
        if (bookSection) bookSection.style.display = "none";
        renderFavoritesSection();
    } else {
        if (tabBook) tabBook.classList.add("active");
        if (tabFav) tabFav.classList.remove("active");
        if (favSection) favSection.style.display = "none";
        if (bookSection) bookSection.style.display = "block";
        renderUserBookings();
    }
}

/* ================= LOCATION SELECTOR ================= */
let currentLocationFilter = "All";

function toggleLocationDropdown(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById("locationDropdown");
    if (dropdown) dropdown.classList.toggle("show");
}

document.addEventListener("click", () => {
    const dropdown = document.getElementById("locationDropdown");
    if (dropdown) dropdown.classList.remove("show");
});

function switchLocation(locationName) {
    currentLocationFilter = locationName;
    const labelEl = document.getElementById("currentLocationLabel");
    if (labelEl) labelEl.textContent = locationName;

    // Filter places
    const placeCards = document.querySelectorAll("#placesGrid .place-card, #nearbyGrid .nearby-card");
    placeCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (locationName === "All" || locationName === "Nainital") {
            card.style.display = "";
        } else if (text.includes(locationName.toLowerCase())) {
            card.style.display = "";
        } else {
            card.style.display = "none";
        }
    });

    const dropdown = document.getElementById("locationDropdown");
    if (dropdown) dropdown.classList.remove("show");

    showToast(`Viewing destinations in: ${locationName}`, "📍");
}

/* ================= APP-LIKE SEARCH & AUTOCOMPLETE ================= */
const searchCatalog = [
    { name: "Naini Lake (Nainital Jheel)", category: "Lakes", target: "places", id: "naini-lake" },
    { name: "Snow View Point", category: "Viewpoints", target: "places", id: "snow-view-point" },
    { name: "Eco Cave Gardens", category: "Nature & Caves", target: "places", id: "eco-cave-gardens" },
    { name: "Tiffin Top (Dorothy's Seat)", category: "Viewpoints", target: "places", id: "tiffin-top" },
    { name: "High Altitude Himalayan Zoo", category: "Nature", target: "places", id: "high-altitude-zoo" },
    { name: "Naina Peak (China Peak)", category: "Viewpoints", target: "places", id: "naina-peak" },
    { name: "Mall Road & Tibetan Market", category: "Shopping", target: "places", id: "mall-road" },
    { name: "Pangot & Kilbury Bird Sanctuary", category: "Nature", target: "places", id: "pangot" },
    { name: "Sariyatal & Botanical Waterfall", category: "Hidden Gems", target: "hidden-places", id: "sariyatal" },
    { name: "Land's End Cliff View", category: "Hidden Gems", target: "hidden-places", id: "lands-end" },
    { name: "Khurpatal Emerald Lake", category: "Hidden Gems", target: "hidden-places", id: "khurpatal" },
    { name: "Maa Naina Devi Temple", category: "Temples", target: "temples", id: "naina-devi-temple" },
    { name: "Kainchi Dham (Neem Karoli Ashram)", category: "Temples", target: "temples", id: "kainchi-dham" },
    { name: "Hanuman Garhi Temple", category: "Temples", target: "temples", id: "hanuman-garhi" },
    { name: "Mukteshwar Shiva Temple", category: "Temples", target: "temples", id: "mukteshwar-temple" },
    { name: "The Manu Maharani Resort", category: "Hotels", target: "hotels", id: "hotel-manu-maharani" },
    { name: "The Naini Retreat", category: "Hotels", target: "hotels", id: "hotel-naini-retreat" },
    { name: "Kumaon Homestay & Inn", category: "Hotels", target: "hotels", id: "hotel-kumaon-homestay" },
    { name: "Hotel Lake View Grand", category: "Hotels", target: "hotels", id: "hotel-lake-view" },
    { name: "Sakley's Restaurant & Bakery", category: "Food & Cafes", target: "food", id: "rest-sakleys" },
    { name: "Machan Restaurant (Kumaoni Thali)", category: "Food & Cafes", target: "food", id: "rest-machan" },
    { name: "Sonam's Tibetan Momos & Thukpa", category: "Food & Cafes", target: "food", id: "rest-sonam" },
    { name: "Bhimtal Lake & Island", category: "Nearby", target: "nearby", id: "nearby-bhimtal" },
    { name: "Sattal (Seven Lakes)", category: "Nearby", target: "nearby", id: "nearby-sattal" },
    { name: "Naukuchiatal Lake", category: "Nearby", target: "nearby", id: "nearby-naukuchiatal" },
    { name: "Mukteshwar & Chauli Ki Jali", category: "Nearby", target: "nearby", id: "nearby-mukteshwar" },
    { name: "Maruti Dzire Sedan Cab", category: "Car Rental", target: "booking", id: "car-dzire" },
    { name: "Innova Crysta Luxury SUV", category: "Car Rental", target: "booking", id: "car-innova" },
    { name: "Royal Enfield Classic 350", category: "Bike Rental", target: "booking", id: "bike-enfield" },
    { name: "Honda Activa 6G Scooty", category: "Bike Rental", target: "booking", id: "bike-activa" }
];

function setupAppSearch() {
    const inputs = [
        document.getElementById("appSearchInput"),
        document.getElementById("heroSearch"),
        document.getElementById("globalSearchInput")
    ];

    inputs.forEach(input => {
        if (!input) return;
        input.addEventListener("input", (e) => handleAppSearch(e.target.value));
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const query = e.target.value.trim();
                if (query) {
                    window.location.href = `places.html?search=${encodeURIComponent(query)}`;
                }
            }
        });
    });
}

function handleAppSearch(query) {
    const clean = (query || "").toLowerCase().trim();
    const dropdown = document.getElementById("searchSuggestionsBox");

    if (!clean) {
        if (dropdown) dropdown.style.display = "none";
        // Reset card display
        document.querySelectorAll(".place-card, .nearby-card, .hotel-card, .restaurant-card").forEach(c => c.style.display = "");
        return;
    }

    // Filter cards live on page
    document.querySelectorAll(".place-card, .nearby-card, .hotel-card, .restaurant-card").forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(clean)) {
            card.style.display = "";
        } else {
            card.style.display = "none";
        }
    });

    // Populate dropdown
    if (!dropdown) return;
    const matches = searchCatalog.filter(item => 
        item.name.toLowerCase().includes(clean) || item.category.toLowerCase().includes(clean)
    ).slice(0, 6);

    if (matches.length === 0) {
        dropdown.innerHTML = `
            <div class="search-suggest-empty">
                <span>🔍 No direct match for "${query}"</span>
                <small>Press Enter to search all tourism guides</small>
            </div>
        `;
        dropdown.style.display = "block";
        return;
    }

    dropdown.innerHTML = matches.map(m => `
        <div class="search-suggest-item" onclick="selectSearchSuggestion('${m.target}', '${m.name.replace(/'/g, "\\'")}')">
            <span class="suggest-icon">📍</span>
            <div class="suggest-text">
                <strong>${m.name}</strong>
                <small>${m.category}</small>
            </div>
            <span class="suggest-arrow">➔</span>
        </div>
    `).join("");
    dropdown.style.display = "block";
}

function selectSearchSuggestion(targetSectionId, placeName) {
    const dropdown = document.getElementById("searchSuggestionsBox");
    if (dropdown) dropdown.style.display = "none";

    const targetEl = document.getElementById(targetSectionId);
    if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
    }

    // Highlight card if found
    const allCards = document.querySelectorAll(".place-card, .nearby-card, .hotel-card, .restaurant-card");
    allCards.forEach(card => {
        if (card.textContent.includes(placeName)) {
            card.style.display = "";
            card.style.outline = "3px solid var(--accent)";
            setTimeout(() => {
                card.style.outline = "";
            }, 3000);
        }
    });

    showToast(`Jumped to: ${placeName}`, "📍");
}

function quickSearchPlace(placeName) {
    const appInput = document.getElementById("appSearchInput") || document.getElementById("globalSearchInput");
    if (appInput) {
        appInput.value = placeName;
    }
    handleAppSearch(placeName);

    // Scroll to matching section
    const targetMatch = searchCatalog.find(item => item.name.toLowerCase().includes(placeName.toLowerCase()));
    if (targetMatch) {
        const section = document.getElementById(targetMatch.target);
        if (section) section.scrollIntoView({ behavior: 'smooth' });
    }
}

/* ================= PROFILE / HELPDESK MODAL ================= */
function openProfileModal() {
    const modal = document.getElementById("profileModal");
    if (modal) modal.classList.add("active");
}

function closeProfileModal() {
    const modal = document.getElementById("profileModal");
    if (modal) modal.classList.remove("active");
}
