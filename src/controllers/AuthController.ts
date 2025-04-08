import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db";


class AuthController {
    static async register(req: Request, res: Response): Promise<void> {
        const { name, email, password, role="USER" } = req.body;
        try {
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                res.status(400).json({ message: "User already exists" });
                return;
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newUser = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role
                }
            });
            const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET as string, { expiresIn: "1h" });
            res.status(201).json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
            console.log("User registered successfully:");
        } catch (error) {
            console.error("Error registering user:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    static async login(req: Request, res: Response): Promise<void> {
        const { email, password } = req.body;
        try {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                res.status(400).json({ message: "Invalid credentials" });
                return;
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                res.status(400).json({ message: "Invalid credentials" });
                return;
            }

            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: "23h" });
            res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
            console.log("User logged in successfully:");
        }
        catch (error) {
            console.error("Error logging in user:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
}

export default AuthController;