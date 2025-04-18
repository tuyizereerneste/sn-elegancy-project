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
    };
}

class BlogController {
    // 1. Create a Blog
    static async createBlog(req: UserRequest, res: Response): Promise<void> {
        // Handle the image upload using Cloudinary for a single image
        upload.single("image")(req, res, async (err: any) => {
            if (err) {
                return res.status(400).json({ message: "Error uploading file", error: err.message });
            }
    
            const { author, sector, title, content } = req.body;
    
            try {
                // Upload the single image to Cloudinary
                const imageUpload = await cloudinary.uploader.upload((req.file as Express.Multer.File).path, {
                    folder: "blogs", // Optional: specify the folder name in Cloudinary
                });
    
                // Create the new blog with the uploaded image URL
                const newBlog = await prisma.blog.create({
                    data: {
                        author,
                        sector,
                        title,
                        content,
                        image: imageUpload.secure_url, // Store the Cloudinary image URL
                    },
                });
    
                res.status(201).json({ message: "Blog created successfully", blog: newBlog });
                console.log("Blog created successfully:");
            } catch (error) {
                console.error("Error creating blog:", error);
                res.status(500).json({ message: "Server error" });
            }
        });
    }
    

    // 2. Get all Blogs
    static async getAllBlogs(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;
    
            const blogs = await prisma.blog.findMany({
                orderBy: { createdAt: "desc" },
                skip, 
                take: limit,
            });
    
            const totalBlogs = await prisma.blog.count();
    
            const totalPages = Math.ceil(totalBlogs / limit);
    
            res.status(200).json({
                blogs,
                pagination: {
                    page,
                    limit,
                    totalBlogs,
                    totalPages,
                },
            });
    
            console.log("Fetched blogs successfully:", blogs);
        } catch (error) {
            console.error("Error fetching blogs:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
    

    // 3. Get a single Blog by ID
    static async getBlogById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            const blog = await prisma.blog.findUnique({
                where: { id },
            });

            if (!blog) {
                res.status(404).json({ message: "Blog not found" });
                return;
            }

            res.status(200).json(blog);
        } catch (error) {
            console.error("Error fetching blog:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    // 4. Update a Blog by ID
    static async updateBlog(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const { author, sector, title, content, image } = req.body;

        try {
            const existingBlog = await prisma.blog.findFirst({
                where: {
                    title,
                    NOT: { id },
                },
            });

            if (existingBlog) {
                res.status(400).json({ message: "Blog with this title already exists" });
            }

            const updateData: any = {};
            if (author !== undefined) updateData.author = author;
            if (sector !== undefined) updateData.sector = sector;
            if (title !== undefined) updateData.title = title;
            if (content !== undefined) updateData.content = content;
            if (image !== undefined) updateData.image = image;
            const updatedBlog = await prisma.blog.update({
                where: { id },
                data: updateData,
            });
            res.status(200).json(updatedBlog);
            console.log("Blog updated successfully:", updatedBlog);
        } catch (error) {
            console.error("Error updating blog:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    // 5. Delete a Blog by ID
    static async deleteBlog(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            // Check if the blog exists
            const existingBlog = await prisma.blog.findUnique({
                where: { id },
            });

            if (!existingBlog) {
                res.status(404).json({ message: "Blog not found" });
                return;
            }
            const deletedBlog = await prisma.blog.delete({
                where: { id },
            });

            res.status(200).json({ message: "Blog deleted successfully", deletedBlog });
            console.log("Blog deleted successfully:", deletedBlog);
        } catch (error) {
            console.error("Error deleting blog:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
}

export default BlogController;
