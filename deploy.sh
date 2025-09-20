#!/bin/bash

# 🚀 AI HR Platform Deployment Script
# Automates deployment to Vercel (Frontend) + Railway (Backend)

set -e  # Exit on any error

echo "🚀 AI HR Management Platform v9.0.0 - Deployment Script"
echo "========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking deployment requirements..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "Node.js and npm are installed"
}

# Install CLI tools
install_cli_tools() {
    print_status "Installing deployment CLI tools..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_status "Installing Vercel CLI..."
        npm install -g vercel
    else
        print_success "Vercel CLI already installed"
    fi
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        print_status "Installing Railway CLI..."
        npm install -g @railway/cli
    else
        print_success "Railway CLI already installed"
    fi
}

# Deploy Frontend to Vercel
deploy_frontend() {
    print_status "Deploying frontend to Vercel..."
    
    cd client
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Build the project
    print_status "Building React application..."
    npm run build
    
    # Deploy to Vercel
    print_status "Deploying to Vercel..."
    if vercel --prod --confirm; then
        print_success "Frontend deployed successfully to Vercel!"
    else
        print_error "Frontend deployment failed"
        exit 1
    fi
    
    cd ..
}

# Deploy Backend to Railway
deploy_backend() {
    print_status "Deploying backend to Railway..."
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Initialize Railway project if needed
    if [ ! -f ".railway" ]; then
        print_status "Initializing Railway project..."
        railway init
    fi
    
    # Deploy to Railway
    print_status "Deploying to Railway..."
    if railway up; then
        print_success "Backend deployed successfully to Railway!"
    else
        print_error "Backend deployment failed"
        exit 1
    fi
}

# Configure environment variables
configure_environment() {
    print_status "Environment configuration instructions:"
    print_warning "Please configure the following environment variables:"
    
    echo ""
    echo "📱 VERCEL (Frontend):"
    echo "   1. Go to vercel.com/dashboard"
    echo "   2. Select your project"
    echo "   3. Go to Settings > Environment Variables"
    echo "   4. Add: REACT_APP_API_URL = https://your-backend.railway.app"
    echo ""
    
    echo "🚂 RAILWAY (Backend):"
    echo "   1. Go to railway.app/dashboard"
    echo "   2. Select your project"
    echo "   3. Go to Variables tab"
    echo "   4. Add required environment variables (see .env.example)"
    echo ""
    
    print_warning "Don't forget to update the API URL in your frontend after backend deployment!"
}

# Get deployment URLs
get_deployment_info() {
    print_status "Getting deployment information..."
    
    echo ""
    echo "🌐 Deployment URLs:"
    echo "   Frontend: Check Vercel dashboard for your URL"
    echo "   Backend: Check Railway dashboard for your URL"
    echo ""
    echo "🔍 Health Check:"
    echo "   Test your backend: https://your-backend.railway.app/api/health"
    echo "   Test your frontend: https://your-frontend.vercel.app"
    echo ""
}

# Main deployment function
main() {
    echo ""
    print_status "Starting deployment process..."
    
    # Check if user wants to proceed
    read -p "$(echo -e ${BLUE}[INPUT]${NC} Do you want to proceed with deployment? [y/N]: )" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled by user"
        exit 1
    fi
    
    check_requirements
    install_cli_tools
    
    # Ask which deployment to perform
    echo ""
    echo "Deployment Options:"
    echo "1) Deploy both frontend and backend"
    echo "2) Deploy frontend only (Vercel)"
    echo "3) Deploy backend only (Railway)"
    echo ""
    read -p "$(echo -e ${BLUE}[INPUT]${NC} Choose deployment option [1-3]: )" -n 1 -r
    echo
    
    case $REPLY in
        1)
            print_status "Deploying both frontend and backend..."
            deploy_frontend
            deploy_backend
            ;;
        2)
            print_status "Deploying frontend only..."
            deploy_frontend
            ;;
        3)
            print_status "Deploying backend only..."
            deploy_backend
            ;;
        *)
            print_error "Invalid option selected"
            exit 1
            ;;
    esac
    
    configure_environment
    get_deployment_info
    
    print_success "Deployment process completed!"
    print_status "Your AI HR Management Platform is now live! 🎉"
}

# Run the deployment
main "$@"
