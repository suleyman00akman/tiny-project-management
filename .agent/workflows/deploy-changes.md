---
description: how to deploy and verify code changes in the Docker environment
---

To ensure that your changes are correctly reflected in the application (especially when viewing on port 8080), follow these steps:

1. **Verify Local Build**:
   Ensure the frontend and backend tests pass locally if applicable.

2. **Rebuild Docker Containers**:
   // turbo
   Run command: `docker-compose up -d --build`
   > [!NOTE]
   > This is CRITICAL for the frontend because it uses a multi-stage Dockerfile (Nginx) and does not automatically reflect source changes without a rebuild.

3. **Database Reset (Optional)**:
   If there are schema changes, run `.\reset_db.bat` or verify migrations.

4. **Sanity Check**:
   Navigate to `http://localhost:8080` and verify the changes visually.
