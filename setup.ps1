# Portfolio Management System Setup

Write-Host "Setting up Portfolio Management System..." -ForegroundColor Green

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js is not installed. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if MySQL is installed
Write-Host "Checking MySQL installation..." -ForegroundColor Yellow
try {
    $mysqlVersion = mysql --version
    Write-Host "MySQL version: $mysqlVersion" -ForegroundColor Green
} catch {
    Write-Host "MySQL is not installed. Please install MySQL from https://dev.mysql.com/downloads/" -ForegroundColor Red
    Write-Host "After installing MySQL, create a database named 'portfolio_db'" -ForegroundColor Yellow
}

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Set-Location -Path "backend"
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "Backend dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location -Path "../frontend"
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "Frontend dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

Set-Location -Path ".."

Write-Host "`nSetup completed successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Create a MySQL database named 'portfolio_db'" -ForegroundColor White
Write-Host "2. Run the database schema: mysql -u root -p portfolio_db < database/schema.sql" -ForegroundColor White
Write-Host "3. Update backend/.env with your database credentials" -ForegroundColor White
Write-Host "4. Start the backend: cd backend && npm run dev" -ForegroundColor White
Write-Host "5. Start the frontend: cd frontend && npm start" -ForegroundColor White
Write-Host "`nThe application will be available at http://localhost:3000" -ForegroundColor Green
