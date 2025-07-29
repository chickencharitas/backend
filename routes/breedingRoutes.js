import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import * as ctrl from '../controllers/breedingController.js';

const router = express.Router();

router.post('/groups', authenticateToken, ctrl.createGroup);
router.get('/groups', authenticateToken, ctrl.listGroups);
router.get('/groups/:groupId/members', authenticateToken, ctrl.groupMembers);
router.post('/groups/:groupId/members', authenticateToken, ctrl.addMember);
router.delete('/groups/:groupId/members', authenticateToken, ctrl.removeMember);

router.post('/breedings', authenticateToken, ctrl.createBreeding);
router.get('/breedings', authenticateToken, ctrl.listBreedings);

router.post('/eggs', authenticateToken, ctrl.addEgg);
router.get('/eggs', authenticateToken, ctrl.listEggs);

router.post('/goals', authenticateToken, ctrl.addGoal);
router.get('/goals/:groupId', authenticateToken, ctrl.listGoals);

router.post('/pedigree', authenticateToken, ctrl.setPedigree);
router.get('/pedigree/:chickenId', authenticateToken, ctrl.getPedigree);

// NEW: Full pedigree tree (recursive)
router.get('/pedigree-tree/:chickenId', authenticateToken, ctrl.getPedigreeTree);

// NEW: Inline breed creation
router.post('/breed', authenticateToken, ctrl.createBreed);

router.get('/inbreeding/:chickenId', authenticateToken, ctrl.inbreedingCoeff);

export default router;