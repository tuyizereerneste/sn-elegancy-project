import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import upload from "../Middleware/upload";
import { v2 as cloudinary } from 'cloudinary';
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
    cloud_url: process.env.CLOUDINARY_URL,
});

const prisma = new PrismaClient();

interface UserRequest extends Request {
    user?: {
        id: string;
        name: string;
    };
}

class TestimonyController {
    // 1. Create a Blog
    static async createTestimony(req: UserRequest, res: Response): Promise<void> {
        // Handle the image upload using Cloudinary for a single image
        upload.single("image")(req, res, async (err: any) => {
            if (err) {
                return res.status(400).json({ message: "Error uploading file", error: err.message });
            }
    
            const { name, role, message, work } = req.body;
    
            try {
                // Upload the single image to Cloudinary
                const imageUpload = await cloudinary.uploader.upload((req.file as Express.Multer.File).path, {
                    folder: "testimonials", // Optional: specify the folder name in Cloudinary
                });
    
                // Create the new testimony with the uploaded image URL
                const newTestimony = await prisma.testimonial.create({
                    data: {
                        name,
                        role,
                        message,
                        work,
                        image: imageUpload.secure_url, // Store the Cloudinary image URL
                    },
                });
    
                res.status(201).json({ message: "Testimony created successfully", testimony: newTestimony });
                console.log("Testimony created successfully:");
            } catch (error) {
                console.error("Error creating testimony:", error);
                res.status(500).json({ message: "Server error" });
            }
        });
    }
    

    // 2. Get all Blogs
    static async getAllTestimonies(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;
    
            const testimony = await prisma.testimonial.findMany({
                orderBy: { createdAt: "desc" },
                skip, 
                take: limit,
            });
    
            const totalTestimony = await prisma.testimonial.count();
    
            const totalPages = Math.ceil(totalTestimony / limit);
    
            res.status(200).json({
                testimony,
                pagination: {
                    page,
                    limit,
                    totalTestimony,
                    totalPages,
                },
            });
    
            console.log("Fetched Testmonials successfully:");
        } catch (error) {
            console.error("Error fetching testimonials:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
    

    static async getTestimonyById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            const testimony = await prisma.testimonial.findUnique({
                where: { id },
            });

            if (!testimony) {
                res.status(404).json({ message: "Testimony not found" });
                return;
            }

            res.status(200).json({ message: "Testimony Fetched successfully:", testimony });
        } catch (error) {
            console.error("Error fetching blog:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    // 4. Update a Blog by ID
    static async updateTestimony(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const { author, sector, title, content, image } = req.body;

        try {
            const existingTestimony = await prisma.testimonial.findFirst({
                where:{ id },
            });

            if (existingTestimony) {
                res.status(400).json({ message: "Testimony with this title already exists" });
            }

            const updateData: any = {};
            if (author !== undefined) updateData.author = author;
            if (sector !== undefined) updateData.sector = sector;
            if (title !== undefined) updateData.title = title;
            if (content !== undefined) updateData.content = content;
            if (image !== undefined) updateData.image = image;
            const updatedTestimony = await prisma.blog.update({
                where: { id },
                data: updateData,
            });
            res.status(200).json(updatedTestimony);
        } catch (error) {
            console.error("Error updating testimony:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    // 5. Delete a Blog by ID
    static async deleteTestimony(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            // Check if the blog exists
            const existingTestimony = await prisma.testimonial.findUnique({
                where: { id },
            });

            if (!existingTestimony) {
                res.status(404).json({ message: "Testimony not found" });
                return;
            }
            const deletedBlog = await prisma.testimonial.delete({
                where: { id },
            });

            res.status(200).json({ message: "Testimonial deleted successfully", deletedBlog });
        } catch (error) {
            console.error("Error deleting testimonial:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
}

export default TestimonyController;
