# Online Library Management System – Build and DevOps Guide

## 1. Requirements
- macOS, Node.js 20+, Docker Desktop, Git and a GitHub account.
- Jenkins configured with a NodeJS tool named exactly `Node20`, and permission to run Docker.
- Optional: Kubernetes through Docker Desktop.

## 2. Run locally
1. Open Terminal and enter the extracted project folder.
2. Copy `.env.example` to `.env` if you want local environment settings.
3. Start MySQL locally and run `database/init.sql` in MySQL Workbench or with:
   `mysql -u root -p < database/init.sql`
4. Install dependencies: `npm install`
5. Start the server: `npm start`
6. Open `http://localhost:3000`.
7. Demo login: `admin` / `admin123`.

If using Docker Compose instead of locally installed MySQL, skip steps 2–4 and run:
`docker compose up --build -d`
Then open `http://localhost:3000`. Check `docker compose logs -f app` if it does not load.

## 3. Functional testing
- Login with the demo admin credentials.
- Add a book and verify it appears in the book list.
- Search by title, author or ISBN.
- Edit and delete a book (a book with loan records cannot be deleted).
- Register a student; use the displayed student ID.
- Issue a book using its book ID and the student ID.
- Return it from Issue / Return. The fine is ₹5 per overdue day by default.
- Test unavailable-book handling by trying to issue a book with zero available copies.
- Run automated tests: `npm test`.

## 4. Git and GitHub
Create an empty GitHub repository named `Online-Library-Management-DevOps`, then:
`git init`
`git add .`
`git commit -m "Initial Online Library Management System"`
`git branch -M main`
`git remote add origin YOUR_GITHUB_REPOSITORY_URL`
`git push -u origin main`

Do not commit `.env`, passwords, or production secrets.

## 5. Docker
`docker compose up --build -d`
`docker compose ps`
`docker compose logs -f app`
Open `http://localhost:3000`.
Stop with `docker compose down`. Keep database data with the named volume. To delete the database volume too, use `docker compose down -v` (this permanently deletes local database data).

## 6. Jenkins
1. Open Jenkins at `http://localhost:8080`.
2. Manage Jenkins → Tools → NodeJS installations. Add NodeJS named `Node20`, version 20.x.
3. Create a Pipeline job named `Online-Library-Pipeline`.
4. Configure Pipeline → Pipeline script from SCM → Git → enter repository URL → branch `*/main` → Script Path `Jenkinsfile`.
5. Save → Build Now → Console Output.
6. The pipeline installs dependencies, runs tests, builds the Docker image and validates Compose configuration.

If Jenkins reports `nodejs 'Node20'` not found, the NodeJS tool name in Jenkins must exactly match `Node20`. If Docker permission fails, configure the Jenkins agent/container to access the Docker daemon securely; avoid making the Docker socket world-writable on a shared or production machine.

## 7. Kubernetes (optional)
The provided manifests are a learning/demo setup. Build the image and make it available to the Kubernetes cluster:
`docker build -t online-library-management:latest .`
Enable Kubernetes in Docker Desktop, then create the SQL ConfigMap and apply the database:
`kubectl create configmap library-init-sql --from-file=init.sql=database/init.sql`
`kubectl apply -f k8s/mysql.yaml`
`kubectl apply -f k8s/app.yaml`
`kubectl get pods`
`kubectl get services`
Open `http://localhost:30080` when using Docker Desktop Kubernetes.

For a persistent or real deployment, replace the MySQL `emptyDir` with a PersistentVolumeClaim, use Kubernetes Secrets managed outside source control, add readiness/liveness probes, and use a managed database. The demo admin login and credentials must be changed before real use.

## 8. Test cases from the reference image
| Test ID | Test case | Expected result |
|---|---|---|
| TC01 | Admin login | Login successful |
| TC02 | Add a new book | Book added |
| TC03 | Search for a book | Matching book displayed |
| TC04 | Update book details | Details updated |
| TC05 | Issue a book | Book issued |
| TC06 | Return a book | Book returned |
| TC07 | Search unavailable book | Appropriate message |

Additional tests: student registration, delete book, overdue fine calculation, duplicate student email, and return-book validation.

## 9. Project structure
- `public/` – browser UI
- `server.js` – REST API and application logic
- `database/init.sql` – MySQL schema and sample books
- `tests/` – automated unit tests
- `Dockerfile`, `docker-compose.yml` – container setup
- `Jenkinsfile` – CI pipeline
- `k8s/` – Kubernetes manifests
- `docs/` – project guide
