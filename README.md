# FeathersJS
trying FeathersJS

## Local Development with Docker PostgreSQL

This project uses Docker Compose to run a PostgreSQL database for local development.

### Starting the Database

To start the PostgreSQL database:

```bash
docker-compose up -d
```

This will start a PostgreSQL 15 container with the following default configuration:
- **Host**: localhost
- **Port**: 5432
- **User**: feathersjs
- **Password**: feathersjs
- **Database**: feathersjs_db

### Stopping the Database

To stop the database:

```bash
docker-compose down
```

To stop and remove all data (volumes):

```bash
docker-compose down -v
```

### Database Connection

Use the following connection string in your FeathersJS application:

```
postgresql://feathersjs:feathersjs@localhost:5432/feathersjs_db
```

Or set these environment variables:
- `DB_HOST=localhost`
- `DB_PORT=5432`
- `DB_USER=feathersjs`
- `DB_PASSWORD=feathersjs`
- `DB_DATABASE=feathersjs_db`

### Checking Database Status

To check if the database is running:

```bash
docker-compose ps
```

To view database logs:

```bash
docker-compose logs postgres
```
