import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') })

export default {
  port: process.env.PORT || 3030,
  host: process.env.HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'feathersjs',
    password: process.env.DB_PASSWORD || 'feathersjs',
    database: process.env.DB_DATABASE || 'feathersjs_db',
    
    // Connection string for PostgreSQL
    get connectionString() {
      return `postgresql://${this.user}:${this.password}@${this.host}:${this.port}/${this.database}`
    },
    
    // Connection object for pg library
    get connectionConfig() {
      return {
        host: this.host,
        port: this.port,
        user: this.user,
        password: this.password,
        database: this.database,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      }
    }
  }
}
