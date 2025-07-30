# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a full-stack portfolio management system with the following architecture:

## Tech Stack
- **Backend**: Node.js with Express.js
- **Frontend**: React.js
- **Database**: MySQL
- **Authentication**: JWT-based authentication for single user

## Project Structure
- `/backend` - Express.js API server
- `/frontend` - React.js client application
- `/database` - MySQL schema and migration files

## Business Logic
This application manages a single user's financial portfolio including:
- **Stocks**: Track stock holdings, prices, and performance
- **Bonds**: Monitor bond investments and maturity dates  
- **Cash Flow**: Record income, expenses, and cash movements

## Development Guidelines
- Use ES6+ JavaScript features
- Follow RESTful API design principles
- Implement proper error handling and validation
- Use environment variables for configuration
- Write clean, documented code with JSDoc comments
