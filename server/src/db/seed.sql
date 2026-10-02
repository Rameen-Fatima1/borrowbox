-- All demo users have password: Password123
INSERT INTO users(name,email,password_hash,role,area) VALUES
('Admin','admin@borrowbox.app','$2b$10$EUSlN7RZEIPs5XEppIW1duDrjOk4JSe4a4I4CUJguNeY6BG1O6qxi','admin','HQ'),
('Ali','ali@borrowbox.app','$2b$10$EUSlN7RZEIPs5XEppIW1duDrjOk4JSe4a4I4CUJguNeY6BG1O6qxi','member','Block B'),
('Sara','sara@borrowbox.app','$2b$10$EUSlN7RZEIPs5XEppIW1duDrjOk4JSe4a4I4CUJguNeY6BG1O6qxi','member','Block C');
INSERT INTO categories(name) VALUES ('Power Tools'),('Home & Garden'),('Electronics'),('Kitchen'),('Sports & Outdoor');
INSERT INTO items(owner_id,category_id,title,description,condition,max_days,pickup_area) VALUES
(2,1,'Cordless Drill 18V','Two batteries, charger and bits.','good',5,'Block B'),
(2,2,'Extension Ladder','3m aluminium ladder.','good',3,'Block B'),
(2,3,'HD Projector','Includes HDMI cable.','new',7,'Block B'),
(3,3,'DSLR Camera Kit','Body, lens and tripod.','good',4,'Block C'),
(3,5,'Camping Tent (4P)','Easy pitch tent.','fair',6,'Block C');
