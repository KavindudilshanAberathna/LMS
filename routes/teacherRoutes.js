router.post('/assign-subject', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
    const { teacherId, subject, className, section } = req.body;
    await SubjectAllocation.create({ teacher: teacherId, subject, className, section });
    res.redirect('/dashboard/admin'); // or wherever appropriate
  });

