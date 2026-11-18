-- OPTIONAL: sample incidents so the reports have data. Import after database.sql
USE eru_db;
INSERT INTO incidents(ref,name,phone,type,description,address,lat,lng,city,status,created_at) VALUES
('SMP-00','Sample Reporter 0','09123450000','fire','Sample incident','Sample street, Mandaue City',10.323600,123.922300,'Mandaue City','pending',DATE_ADD(DATE_SUB(CURDATE(),INTERVAL 0 DAY),INTERVAL 360 MINUTE)),
('SMP-01','Sample Reporter 1','09123450001','medical','Sample incident','Sample street, Liloan',10.401200,124.000300,'Liloan','resolved',DATE_ADD(DATE_SUB(CURDATE(),INTERVAL 9 DAY),INTERVAL 671 MINUTE)),
('SMP-02','Sample Reporter 2','09123450002','disaster','Sample incident','Sample street, Consolacion',10.380700,123.960400,'Consolacion','resolved',DATE_ADD(DATE_SUB(CURDATE(),INTERVAL 18 DAY),INTERVAL 982 MINUTE)),
('SMP-03','Sample Reporter 3','09123450003','crime','Sample incident','Sample street, Mandaue City',10.329600,123.928300,'Mandaue City','resolved',DATE_ADD(DATE_SUB(CURDATE(),INTERVAL 27 DAY),INTERVAL 1293 MINUTE)),
('SMP-04','Sample Reporter 4','09123450004','traffic','Sample incident','Sample street, Liloan',10.407200,123.998300,'Liloan','resolved',DATE_ADD(DATE_SUB(CURDATE(),INTERVAL 36 DAY),INTERVAL 644 MINUTE)),
('SMP-05','Sample Reporter 5','09123450005','fire','Sample incident','Sample street, Consolacion',10.376700,123.958400,'Consolacion','pending',DATE_ADD(DATE_SUB(CURDATE(),INTERVAL 45 DAY),INTERVAL 955 MINUTE)),
('SMP-06','Sample Reporter 6','09123450006','medical','Sample incident','Sample street, Mandaue City',10.325600,123.926300,'Mandaue City','resolved',DATE_ADD(DATE_SUB(CURDATE(),INTERVAL 54 DAY),INTERVAL 1206 MINUTE)),
('SMP-07','Sample Reporter 7','09123450007','disaster','Sample incident','Sample street, Liloan',10.403200,124.004300,'Liloan','resolved',DATE_ADD(DATE_SUB(CURDATE(),INTERVAL 63 DAY),INTERVAL 557 MINUTE)),
('SMP-08','Sample Reporter 8','09123450008','crime','Sample incident','Sample street, Consolacion',10.382700,123.956400,'Consolacion','resolved',DATE_ADD(DATE_SUB(CURDATE(),INTERVAL 72 DAY),INTERVAL 868 MINUTE)),
('SMP-09','Sample Reporter 9','09123450009','traffic','Sample incident','Sample street, Mandaue City',10.331600,123.924300,'Mandaue City','resolved',DATE_ADD(DATE_SUB(CURDATE(),INTERVAL 81 DAY),INTERVAL 1179 MINUTE)),
('SMP-10','Sample Reporter 10','09123450010','fire','Sample incident','Sample street, Liloan',10.399200,124.002300,'Liloan','pending',DATE_ADD(DATE_SUB(CURDATE(),INTERVAL 90 DAY),INTERVAL 530 MINUTE)),
('SMP-11','Sample Reporter 11','09123450011','medical','Sample incident','Sample street, Consolacion',10.378700,123.962400,'Consolacion','resolved',DATE_ADD(DATE_SUB(CURDATE(),INTERVAL 99 DAY),INTERVAL 781 MINUTE)),
('SMP-12','Sample Reporter 12','09123450012','disaster','Sample incident','Sample street, Mandaue City',10.327600,123.922300,'Mandaue City','resolved',DATE_ADD(DATE_SUB(CURDATE(),INTERVAL 8 DAY),INTERVAL 1092 MINUTE)),
('SMP-13','Sample Reporter 13','09123450013','crime','Sample incident','Sample street, Liloan',10.405200,124.000300,'Liloan','resolved',DATE_ADD(DATE_SUB(CURDATE(),INTERVAL 17 DAY),INTERVAL 443 MINUTE)),
('SMP-14','Sample Reporter 14','09123450014','traffic','Sample incident','Sample street, Consolacion',10.384700,123.960400,'Consolacion','resolved',DATE_ADD(DATE_SUB(CURDATE(),INTERVAL 26 DAY),INTERVAL 754 MINUTE)),
('SMP-15','Sample Reporter 15','09123450015','fire','Sample incident','Sample street, Mandaue City',10.323600,123.928300,'Mandaue City','pending',DATE_ADD(DATE_SUB(CURDATE(),INTERVAL 35 DAY),INTERVAL 1065 MINUTE)),
('SMP-16','Sample Reporter 16','09123450016','medical','Sample incident','Sample street, Liloan',10.401200,123.998300,'Liloan','resolved',DATE_ADD(DATE_SUB(CURDATE(),INTERVAL 44 DAY),INTERVAL 416 MINUTE)),
('SMP-17','Sample Reporter 17','09123450017','disaster','Sample incident','Sample street, Consolacion',10.380700,123.958400,'Consolacion','resolved',DATE_ADD(DATE_SUB(CURDATE(),INTERVAL 53 DAY),INTERVAL 667 MINUTE)),
('SMP-18','Sample Reporter 18','09123450018','crime','Sample incident','Sample street, Mandaue City',10.329600,123.926300,'Mandaue City','resolved',DATE_ADD(DATE_SUB(CURDATE(),INTERVAL 62 DAY),INTERVAL 978 MINUTE)),
('SMP-19','Sample Reporter 19','09123450019','traffic','Sample incident','Sample street, Liloan',10.407200,124.004300,'Liloan','resolved',DATE_ADD(DATE_SUB(CURDATE(),INTERVAL 71 DAY),INTERVAL 1289 MINUTE));
