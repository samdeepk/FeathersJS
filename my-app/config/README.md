# Configuration

This directory contains configuration files for the application.

## Environment Variables

Create a `.env` file in the root of the `my-app` directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=feathersjs
DB_PASSWORD=feathersjs
DB_DATABASE=feathersjs_db

# Server Configuration
PORT=3030
NODE_ENV=development
```

## Database Connection

The `default.ts` file loads environment variables and provides:
- `config.database.connectionString` - PostgreSQL connection string
- `config.database.connectionConfig` - Connection object for pg library
- `config.port` - Server port
- `config.nodeEnv` - Environment (development/production)

## Usage

Import the config in your application:

```typescript
import config from './config/default.js'

// Use database connection
const connectionString = config.database.connectionString
const connectionConfig = config.database.connectionConfig

// Use server port
const port = config.port
```
