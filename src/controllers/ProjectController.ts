import { Request, Response } from "express";
import upload from "../Middleware/upload";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface UserRequest extends Request {
    user?: {
        id: string;
    };
}

class ProjectController {
    static async createProject(req: UserRequest, res: Response): Promise<void> {
        // Handle image uploads first
        upload.array("images", 10)(req, res, async (err: any) => {
            if (err) {
                return res.status(400).json({ message: "Error uploading files", error: err.message });
            }

            // Extract the fields from req.body after the upload
            const { title, description, category } = req.body;

            // Collect file paths (relative to the uploads folder)
            const imagePaths = (req.files as Express.Multer.File[]).map(file => file.path);

            try {
                // Create the project in the database
                const newProject = await prisma.project.create({
                    data: {
                        title,
                        description,
                        category,
                        images: imagePaths,
                    },
                });

                res.status(201).json(newProject);
            } catch (error) {
                console.error("Error creating project:", error);
                res.status(500).json({ message: "Server error" });
            }
        });
    }

    static async getProjectById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        try {
            const project = await prisma.project.findUnique({ where: { id } });
            if (!project) {
                res.status(404).json({ message: "Project not found" });
                return;
            }
            res.status(200).json(project);
        } catch (error) {
            console.error("Error fetching project:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    static async getProjects(req: Request, res: Response): Promise<void> {
        const { page = 1, pageSize = 10 } = req.query; // Default to page 1 and pageSize 10
    
        try {
            const totalProjects = await prisma.project.count();
            const projects = await prisma.project.findMany({
                skip: (Number(page) - 1) * Number(pageSize),
                take: Number(pageSize),
            });
    
            res.status(200).json({
                projects,
                totalProjects,
                currentPage: Number(page),
                totalPages: Math.ceil(totalProjects / Number(pageSize)),
            });
        } catch (error) {
            console.error("Error fetching projects:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    static async updateProject(req: UserRequest, res: Response): Promise<void> {
        const { id } = req.params;
        const { title, description, category, images } = req.body;
    
        const userId = req.user?.id;
    
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
    
        try {
            // Check if the project exists and belongs to the user
            const existingProject = await prisma.project.findUnique({
                where: { id },
            });
    
            if (!existingProject) {
                res.status(404).json({ message: "Project not found" });
                return;
            }
    
            const updateData: any = {};
            if (title !== undefined) updateData.title = title;
            if (description !== undefined) updateData.description = description;
            if (category !== undefined) updateData.category = category;
            if (images !== undefined) updateData.images = images;
    
            const updatedProject = await prisma.project.update({
                where: { id },
                data: updateData,
            });
    
            res.status(200).json(updatedProject);
        } catch (error) {
            console.error("Error updating project:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
    

    static async deleteProject(req: UserRequest, res: Response): Promise<void> {
        const { id } = req.params;
    
        const userId = req.user?.id;
    
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
    
        try {
            // Check if the project exists and belongs to the user
            const existingProject = await prisma.project.findUnique({
                where: { id },
            });
    
            if (!existingProject) {
                res.status(404).json({ message: "Project not found" });
                return;
            }
    
            const deletedProject = await prisma.project.delete({
                where: { id },
            });
    
            res.status(200).json(deletedProject);
        } catch (error) {
            console.error("Error deleting project:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
    
}

export default ProjectController;
