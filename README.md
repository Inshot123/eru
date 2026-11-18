# ERU - Emergency Response Unit (PHP + MySQL, XAMPP)

## Run it
1. Start Apache + MySQL in XAMPP.  2. Copy this `eru` folder to C:\xampp\htdocs\eru
3. phpMyAdmin > Import > database.sql  (optional: sample_incidents.sql)
4. Citizen page: http://localhost/eru/   Admin: http://localhost/eru/admin.html  (Ak-47 / admin123)

## Where do I change things?
| I want to change...                          | Edit this file                          |
|----------------------------------------------|-----------------------------------------|
| Incident types, which units respond          | js/shared/config.js  (+ REQ in api/admin.php) |
| Colors / look of everything                  | css/style.css  (section 1 = colors)     |
| Citizen page text, form fields, hero banner  | index.html                              |
| Admin sidebar / login page layout            | admin.html                              |
| Form validation, what is sent                | js/citizen/form.js                      |
| Map, GPS, pin, map layers, Cebu view         | js/citizen/map.js                       |
| Chatbot answers (keywords + replies)         | js/citizen/chatbot.js                   |
| My Reports tab                               | js/citizen/myreports.js                 |
| Admin > Requests (assign / resolve)          | js/admin/requests.js                    |
| Admin > Responders cards                     | js/admin/responders.js                  |
| Monthly report / Yearly scale                | js/admin/reports.js                     |
| Admin startup, tabs, auto-refresh, clock     | js/admin/shell.js                       |
| Database name / password                     | api/config.php                          |
| Stations, units, admin account (SQL)         | database.sql                            |
| Server rules (validation, security, assign)  | api/report.php, api/admin.php           |
