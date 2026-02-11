@echo off
echo Clearing Database...
docker exec tiny-project-management-server-1 node reset_db.js
docker restart tiny-project-management-server-1
echo Database cleared and Server restarted!
pause
