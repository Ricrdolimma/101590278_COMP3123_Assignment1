const express = require("express")
const Employee = require("../models/Employee")
const authenticate = require("../middleware/authenticate")

const router = express.Router()

router.use(authenticate)

router.post("/employees", async (request, response) => {
    const body = request.body

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return response.status(400).json({ error: "A JSON object is required" })
    }

    if (Object.prototype.hasOwnProperty.call(body, "user")) {
        return response.status(403).json({ error: "You cannot set the employee owner" })
    }

    const allowedFields = [
        "first_name",
        "last_name",
        "email",
        "position",
        "salary",
        "date_of_joining",
        "department"
    ]

    const errors = []

    if (Object.keys(body).some(field => !allowedFields.includes(field))) {
        errors.push("Unexpected fields are not allowed")
    }

    for (const field of ["first_name", "last_name", "position", "department"]) {
        if (typeof body[field] !== "string" ||
            body[field].trim().length === 0 ||
            body[field].trim().length > 100) {
            errors.push(`${field} is required and must be 1-100 characters`)
        }
    }

    if (typeof body.email !== "string" ||
        body.email.trim().length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
        errors.push("A valid email is required")
    }

    if (typeof body.salary !== "number" ||
        !Number.isFinite(body.salary) ||
        body.salary <= 0) {
        errors.push("Salary must be a positive number")
    }

    const dateText = body.date_of_joining
    const joiningDate = typeof dateText === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateText)
        ? new Date(`${dateText}T00:00:00.000Z`)
        : new Date("invalid")

    if (Number.isNaN(joiningDate.getTime()) ||
        joiningDate.toISOString().slice(0, 10) !== dateText) {
        errors.push("date_of_joining must be a valid YYYY-MM-DD date")
    }

    if (errors.length > 0) {
        return response.status(400).json({
            error: "Validation failed",
            details: errors
        })
    }

    try {
        const employee = await Employee.create({
            first_name: body.first_name.trim(),
            last_name: body.last_name.trim(),
            email: body.email.trim().toLowerCase(),
            position: body.position.trim(),
            salary: body.salary,
            date_of_joining: joiningDate,
            department: body.department.trim(),
            user: request.userId
        })

        return response.status(201).json({
            message: "Employee created",
            employee
        })
    } catch (error) {
        if (error.name === "ValidationError" || error.name === "CastError") {
            return response.status(400).json({ error: "Invalid employee data" })
        }

        console.error("Employee creation failed:", error.name)
        return response.status(500).json({ error: "Internal server error" })
    }
})

router.get("/employees", async (request, response) => {
    try {
        const employees = await Employee.find({
            user: request.userId
        }).sort({ created_at: -1 })

        return response.status(200).json({ employees })
    } catch (error) {
        console.error("Employee list failed:", error.name)
        return response.status(500).json({ error: "Internal server error" })
    }
})

router.get("/employees/:eid", async (request, response) => {
    const eid = request.params.eid

    if (!/^[0-9a-fA-F]{24}$/.test(eid)) {
        return response.status(400).json({ error: "Invalid employee ID" })
    }

    try {
        const employee = await Employee.findOne({
            _id: eid,
            user: request.userId
        })

        if (!employee) {
            return response.status(404).json({ error: "Employee not found" })
        }

        return response.status(200).json({ employee })
    } catch (error) {
        console.error("Employee lookup failed:", error.name)
        return response.status(500).json({ error: "Internal server error" })
    }
})

router.put("/employees/:eid", async (request, response) => {
    const eid = request.params.eid

    if (!/^[0-9a-fA-F]{24}$/.test(eid)) {
        return response.status(400).json({ error: "Invalid employee ID" })
    }

    const body = request.body

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return response.status(400).json({ error: "A JSON object is required" })
    }

    if (Object.prototype.hasOwnProperty.call(body, "user")) {
        return response.status(403).json({ error: "You cannot set the employee owner" })
    }

    const allowedFields = [
        "first_name",
        "last_name",
        "email",
        "position",
        "salary",
        "date_of_joining",
        "department"
    ]

    const errors = []

    if (Object.keys(body).some(field => !allowedFields.includes(field))) {
        errors.push("Unexpected fields are not allowed")
    }

    for (const field of ["first_name", "last_name", "position", "department"]) {
        if (typeof body[field] !== "string" ||
            body[field].trim().length === 0 ||
            body[field].trim().length > 100) {
            errors.push(`${field} is required and must be 1-100 characters`)
        }
    }

    if (typeof body.email !== "string" ||
        body.email.trim().length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
        errors.push("A valid email is required")
    }

    if (typeof body.salary !== "number" ||
        !Number.isFinite(body.salary) ||
        body.salary <= 0) {
        errors.push("Salary must be a positive number")
    }

    const dateText = body.date_of_joining
    const joiningDate = typeof dateText === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateText)
        ? new Date(`${dateText}T00:00:00.000Z`)
        : new Date("invalid")

    if (Number.isNaN(joiningDate.getTime()) ||
        joiningDate.toISOString().slice(0, 10) !== dateText) {
        errors.push("date_of_joining must be a valid YYYY-MM-DD date")
    }

    if (errors.length > 0) {
        return response.status(400).json({
            error: "Validation failed",
            details: errors
        })
    }

    try {
        const employee = await Employee.findOneAndUpdate(
            { _id: eid, user: request.userId },
            { $set: {
                first_name: body.first_name.trim(),
                last_name: body.last_name.trim(),
                email: body.email.trim().toLowerCase(),
                position: body.position.trim(),
                salary: body.salary,
                date_of_joining: joiningDate,
                department: body.department.trim()
            } },
            { new: true, runValidators: true }
        )

        if (!employee) {
            return response.status(404).json({ error: "Employee not found" })
        }

        return response.status(200).json({
            message: "Employee updated",
            employee
        })
    } catch (error) {
        if (error.name === "ValidationError" || error.name === "CastError") {
            return response.status(400).json({ error: "Invalid employee data" })
        }

        console.error("Employee update failed:", error.name)
        return response.status(500).json({ error: "Internal server error" })
    }
})

router.delete("/employees", async (request, response) => {
    const eid = request.query.eid

    if (typeof eid !== "string" || !/^[0-9a-fA-F]{24}$/.test(eid)) {
        return response.status(400).json({ error: "Invalid employee ID" })
    }

    try {
        const employee = await Employee.findOneAndDelete({
            _id: eid,
            user: request.userId
        })

        if (!employee) {
            return response.status(404).json({ error: "Employee not found" })
        }

        return response.status(204).send()
    } catch (error) {
        console.error("Employee deletion failed:", error.name)
        return response.status(500).json({ error: "Internal server error" })
    }
})

module.exports = router