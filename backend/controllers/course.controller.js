import * as courseService from '../services/course.service.js';

export const createCourseController = async (req, res) => {
  try {
    const coachId = req.user.id; // From coach auth middleware
    const payload = { ...req.body };

    // Handle thumbnail upload
    if (req.file) {
      payload.thumbnail_url = `/upload/course-thumbnails/${req.file.filename}`;
    }

    const course = await courseService.createCourse(coachId, payload);
    return res.status(201).json(course);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const createCourseByAdminController = async (req, res) => {
  try {
    const payload = { ...req.body };
    const coachId = Number(payload.coach_id);

    if (!Number.isInteger(coachId) || coachId <= 0) {
      return res.status(400).json({ message: 'coach_id is required and must be a valid coach id.' });
    }

    if (req.file) {
      payload.thumbnail_url = `/upload/course-thumbnails/${req.file.filename}`;
    }

    const course = await courseService.createCourse(coachId, payload);
    return res.status(201).json(course);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const getAllCoursesController = async (req, res) => {
  try {
    const { include_inactive, coach_id, status, search, page, limit } = req.query;
    const courses = await courseService.getAllCourses({
      include_inactive: include_inactive === 'true',
      coach_id: coach_id ? parseInt(coach_id, 10) : undefined,
      status,
      search,
      page,
      limit,
    });
    return res.status(200).json(courses);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyCoursesController = async (req, res) => {
  try {
    const courses = await courseService.getMyCourses(req.user.id, {
      include_inactive: req.query.include_inactive !== 'false',
      status: req.query.status,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json(courses);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getCourseByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await courseService.getCourseById(id);
    return res.status(200).json(course);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

export const updateCourseController = async (req, res) => {
  try {
    const { id } = req.params;
    const coachId = req.user.id;
    const payload = { ...req.body };

    // Handle thumbnail upload
    if (req.file) {
      payload.thumbnail_url = `/upload/course-thumbnails/${req.file.filename}`;
    }

    const course = await courseService.updateCourse(id, coachId, payload);
    return res.status(200).json(course);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateCourseByAdminController = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };

    if (req.file) {
      payload.thumbnail_url = `/upload/course-thumbnails/${req.file.filename}`;
    }

    const course = await courseService.updateCourseByAdmin(id, payload);
    return res.status(200).json(course);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const deleteCourseController = async (req, res) => {
  try {
    const { id } = req.params;
    const coachId = req.user.id;
    const result = await courseService.deleteCourse(id, coachId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
