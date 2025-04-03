import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import upload from "../Middleware/upload";

const prisma = new PrismaClient();

interface UserRequest extends Request {
    user?: {
        id: string;
    };
}

class BlogController {
    // 1. Create a Blog
    static async createBlog(req: UserRequest, res: Response): Promise<void> {
        upload.single("image")(req, res, async (err: any) => {
            if (err) {
                return res.status(400).json({ message: "Error uploading file", error: err.message });
            }
    
            // Extract the fields from req.body after the upload
            const { author, sector, title, content } = req.body;
    
            // Collect file path (relative to the uploads folder) for the single image
            const imagePath = (req.file as Express.Multer.File)?.path || null;
    
            try {
    
                // Create the new blog with the uploaded image
                const newBlog = await prisma.blog.create({
                    data: {
                        author,
                        sector,
                        title,
                        content,
                        image: imagePath, // Store the uploaded image path
                    },
                });
    
                res.status(201).json(newBlog);
                console.log("Blog created successfully:", newBlog);
            } catch (error) {
                console.error("Error creating blog:", error);
                res.status(500).json({ message: "Server error" });
            }
        });
    }
    

    // 2. Get all Blogs
    static async getAllBlogs(req: Request, res: Response): Promise<void> {
        try {
            // Get pagination parameters from query, default to page 1 and limit 10
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
    
            // Calculate the skip value (number of blogs to skip based on the page)
            const skip = (page - 1) * limit;
    
            // Fetch the blogs with pagination and sorting by creation date
            const blogs = await prisma.blog.findMany({
                orderBy: { createdAt: "desc" },
                skip,  // Skip the blogs based on the current page
                take: limit,  // Limit the number of blogs returned
            });
    
            // Get the total count of blogs (for pagination info)
            const totalBlogs = await prisma.blog.count();
    
            // Calculate total pages for pagination
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
            // Check if the blog title already exists for another blog (excluding the current blog)
            const existingBlog = await prisma.blog.findFirst({
                where: {
                    title,
                    NOT: { id }, // Exclude the current blog by ID
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
