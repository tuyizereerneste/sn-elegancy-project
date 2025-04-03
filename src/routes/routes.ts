import e, { Router } from 'express';
import AuthController from '../controllers/AuthController';
import ProjectController from '../controllers/ProjectController';
import { verifyToken, authorizeRole } from '../Middleware/VerifyAuth';
import BlogController from '../controllers/BlogController';

const router = Router();

router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);

router.post('/project/create', verifyToken, authorizeRole('ADMIN'), ProjectController.createProject);
router.get('/project/:id', ProjectController.getProjectById);
router.get('/projects', ProjectController.getProjects);
router.put('/project/update-project/:id', verifyToken, authorizeRole('ADMIN'), ProjectController.updateProject);
router.delete('/project/delete-project/:id', verifyToken, authorizeRole('ADMIN'), ProjectController.deleteProject);

router.post('/blog/create', verifyToken, authorizeRole('ADMIN'), BlogController.createBlog);
router.get('/blog/:id', BlogController.getBlogById);
router.get('/blogs', BlogController.getAllBlogs);    
router.put('/blog/update-blog/:id', verifyToken, authorizeRole('ADMIN'),   BlogController.updateBlog);
router.delete('/blog/delete-blog/:id', verifyToken, authorizeRole('ADMIN'), BlogController.deleteBlog);

export default router;