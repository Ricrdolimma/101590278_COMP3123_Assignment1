# COMP 3123 Assignment 1 Backend

This is my backend API for users and employees. Users can sign up, log in, and manage the employees they created. The data is stored in MongoDB Atlas.

## What I used

I used Node.js, Express, MongoDB Atlas, Mongoose, bcryptjs, JWT, Helmet, and express-rate-limit. I used Postman to test the API.

`server.js` starts the server, connects to Atlas, and sets up the middleware. The `routes` folder has the user and employee endpoints. The `models` folder has the User and Employee schemas. The `middleware` folder has the JWT check and local logger.

## Running the project

1. Clone the repository: `git clone https://github.com/Ricrdolimma/101590278_COMP3123_Assignment1.git`
2. Open the project folder: `cd 101590278_COMP3123_Assignment1`
3. Install the packages: `npm install`
4. Copy `.env.example` to `.env` and fill in the values below.
5. Make sure the MongoDB Atlas cluster is running. You also need a database user and your IP address allowed in Atlas Network Access.
6. Start the server: `npm start`
7. Use Postman to test the routes. Log in first, then use the returned token for employee requests.

The server uses port 8081 by default. The database name is `comp3123_assignment1`.

The environment variables are `MONGODB_URI` for the Atlas connection string, `JWT_SECRET` for signing tokens (at least 32 bytes), and optional `PORT` for the server port. The real `.env` file is ignored by Git and should not be uploaded.

## Routes

- `POST /api/v1/user/signup` - register a user (201)
- `POST /api/v1/user/login` - log in with username or email and password (200)
- `GET /api/v1/emp/employees` - list your employees (200)
- `POST /api/v1/emp/employees` - create an employee (201)
- `GET /api/v1/emp/employees/:eid` - get one of your employees (200)
- `PUT /api/v1/emp/employees/:eid` - update one of your employees (200)
- `DELETE /api/v1/emp/employees?eid=xxx` - delete one of your employees (204)

## Login and employee access

Signup creates the user account. Login returns a JWT that expires after one hour. All employee routes need `Authorization: Bearer <jwt>` in the request header. In Postman, I put the token in the Bearer Token field.

The middleware verifies the token and gets the logged-in user's ID. Each employee has a `user` ObjectId that refers to the user who created it. Employee queries include that user ID, so a user cannot see or change another user's employees. The API returns 404 if the employee does not exist or does not belong to that user.

## Security

Passwords are hashed with bcryptjs before they are saved, and the API does not return the password hash. Helmet adds security headers. Signup and login are protected by a rate limit of 10 requests per IP address per minute. If someone goes over that limit, the API returns 429 with a JSON error.

The API validates user and employee input, including required fields, email format, password rules, salary, dates, and employee IDs. The Atlas connection string and JWT secret stay in `.env`, not in the source code.

## Logs

Logs are saved locally in `logs/app.log`. They include the time, request method, route, response status, startup and database events, authentication attempts, validation or authorization failures, and errors. The logger does not save request bodies, passwords, JWTs, or database credentials. The generated log file is ignored by Git.

## Health check

`GET http://localhost:8081/health` returns status 200 with `{"status":"ok","message":"API is running"}` when the API is running.
