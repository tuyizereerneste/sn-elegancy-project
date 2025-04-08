import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ContactController {
    static async contactMessage(req: Request, res: Response): Promise<void> {
        const { name, email, phone, message } = req.body;

        try {
            const newMessage = await prisma.contactMessage.create({
                data: {
                    name,
                    email,
                    phone,
                    message,
                },
            });

            res.status(201).json({ message: "Contact message sent successfully", contactMessage: newMessage });
        } catch (error) {
            console.error("Error sending contact message:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    static async getContactMessages(req: Request, res: Response): Promise<void> {
        try {

            const page = parseInt(req.query.page as string) || 1;
            const pageSize = parseInt(req.query.pageSize as string) || 10;
    
            const offset = (page - 1) * pageSize;
    
            const messages = await prisma.contactMessage.findMany({
                skip: offset,
                take: pageSize,
                orderBy: {
                    createdAt: 'desc',
                },
            });
    
            const totalMessages = await prisma.contactMessage.count();
    
            res.status(200).json({
                contactMessages: messages,
                totalMessages: totalMessages,
                currentPage: page,
                pageSize: pageSize,
            });
        } catch (error) {
            console.error("Error fetching contact messages:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    static async getContactMessageById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            const existingMessage = await prisma.contactMessage.findUnique({
                where: { id },
            });
            if (!existingMessage) {
                res.status(404).json({ message: "Contact message not found" });
                return;
            }
            const message = await prisma.contactMessage.findUnique({
                where: { id },
            });

            if (!message) {
                res.status(404).json({ message: "Contact message not found" });
                return;
            }

            res.status(200).json(message);
        } catch (error) {
            console.error("Error fetching contact message:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    static async deleteMessage(req: Request, res: Response): Promise<void>{
        const { id } = req.params;

        try {
            // Check if the blog exists
            const existingMessage = await prisma.contactMessage.findUnique({
                where: { id },
            });

            if (!existingMessage) {
                res.status(404).json({ message: "Message not found" });
                return;
            }
            const deletedMessage = await prisma.contactMessage.delete({
                where: { id },
            });

            res.status(200).json({ message: "Message deleted successfully", deletedMessage });
            console.log("Blog deleted successfully:");
        } catch (error) {
            console.error("Error deleting blog:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
    

}

export default ContactController;