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

class ProjectController {
    static async createProject(req: UserRequest, res: Response): Promise<void> {
        // Upload the images to Cloudinary
        upload.array("images", 20)(req, res, async (err: any) => {
          if (err) {
            return res.status(400).json({ message: "Error uploading files", error: err.message });
          }
    
          // Extract the fields from req.body after the upload
          const { title, description, category } = req.body;
    
          // Upload images to Cloudinary and collect the URLs
          try {
            const imageUploads = await Promise.all(
              (req.files as Express.Multer.File[]).map(async (file) => {
                const result = await cloudinary.uploader.upload(file.path, {
                  folder: "projects",
                });
                return result.secure_url;
              })
            );
    
            // Create the project in the database with Cloudinary image URLs
            const newProject = await prisma.project.create({
              data: {
                title,
                description,
                category,
                images: imageUploads,
              },
            });
    
            res.status(201).json(newProject);
          } catch (error) {
            console.error("Error uploading images to Cloudinary:", error);
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
        const { page = 1, pageSize = 10 } = req.query;
    
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
    
            res.status(200).json({ message: "Project deleted successfully", deletedProject });
        } catch (error) {
            console.error("Error deleting project:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
    
}

export default ProjectController;
